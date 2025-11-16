-- Migration: Create Database Triggers and Constraints
-- Description: Implements business logic triggers and constraints for data integrity
-- Requirements: 1.1-1.5 (Admin Bootstrap), 3.1-3.5 (Fictional Profiles), 
--               11.1-11.5 (Operator Availability), 12.1-12.5 (Operator Performance), 
--               15.1-15.5 (Operator Deletion), 7.1-7.5 (Race Condition Prevention)

-- ============================================================================
-- TRIGGER 1: Prevent Last Super Admin Deletion
-- ============================================================================
-- Requirement 1.1-1.5: Admin Bootstrap System
-- Prevents deletion of the last super_admin to ensure platform always has an admin

CREATE OR REPLACE FUNCTION prevent_last_super_admin_deletion()
RETURNS TRIGGER AS $
DECLARE
  super_admin_count INTEGER;
BEGIN
  -- Only check if deleting a super_admin
  IF OLD.role = 'super_admin' THEN
    -- Count remaining active super_admins (excluding the one being deleted)
    SELECT COUNT(*) INTO super_admin_count
    FROM admins
    WHERE role = 'super_admin'
      AND deleted_at IS NULL
      AND id != OLD.id;
    
    -- Prevent deletion if this is the last super_admin
    IF super_admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot delete the last super_admin. At least one super_admin must exist.';
    END IF;
  END IF;
  
  RETURN OLD;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_last_super_admin_deletion
  BEFORE UPDATE OF deleted_at ON admins
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
  EXECUTE FUNCTION prevent_last_super_admin_deletion();

COMMENT ON FUNCTION prevent_last_super_admin_deletion() IS 'Prevents deletion of the last super_admin';

-- ============================================================================
-- TRIGGER 2: Handle Fictional User Deletion
-- ============================================================================
-- Requirement 3.1-3.5: Fictional Profile Management
-- When a fictional user is deleted, close all active chats and notify affected users

CREATE OR REPLACE FUNCTION handle_fictional_user_deletion()
RETURNS TRIGGER AS $
DECLARE
  affected_chat_count INTEGER;
BEGIN
  -- Only process if this is a soft delete (deleted_at is being set)
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    
    -- Close all active chats associated with this fictional user
    UPDATE chats
    SET 
      status = 'closed',
      close_reason = 'fictional_profile_deleted',
      closed_at = NOW(),
      updated_at = NOW()
    WHERE fictional_user_id = NEW.id
      AND status IN ('active', 'idle')
      AND closed_at IS NULL;
    
    GET DIAGNOSTICS affected_chat_count = ROW_COUNT;
    
    -- Log the action
    RAISE NOTICE 'Fictional user % deleted. Closed % active chats.', NEW.id, affected_chat_count;
    
    -- Create admin notification if chats were affected
    IF affected_chat_count > 0 THEN
      INSERT INTO admin_notifications (type, message, metadata, priority)
      VALUES (
        'system_error',
        format('Fictional profile "%s" was deleted. %s active chats were closed.', NEW.name, affected_chat_count),
        jsonb_build_object(
          'fictional_user_id', NEW.id,
          'fictional_user_name', NEW.name,
          'affected_chats', affected_chat_count
        ),
        'normal'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_fictional_user_deletion
  BEFORE UPDATE OF deleted_at ON fictional_users
  FOR EACH ROW
  EXECUTE FUNCTION handle_fictional_user_deletion();

COMMENT ON FUNCTION handle_fictional_user_deletion() IS 'Closes active chats when fictional user is deleted';

-- ============================================================================
-- TRIGGER 3: Prevent Operator Going Offline With Active Chats
-- ============================================================================
-- Requirement 11.1-11.5: Operator Availability Management
-- Prevents operators from going offline when they have active chats

CREATE OR REPLACE FUNCTION prevent_operator_offline_with_active_chats()
RETURNS TRIGGER AS $
DECLARE
  active_chat_count INTEGER;
BEGIN
  -- Only check if operator is trying to go offline (is_available changing from true to false)
  IF OLD.is_available = true AND NEW.is_available = false THEN
    
    -- Count active chats assigned to this operator
    SELECT COUNT(*) INTO active_chat_count
    FROM chats
    WHERE assigned_operator_id = NEW.id
      AND status = 'active'
      AND closed_at IS NULL;
    
    -- Prevent going offline if there are active chats
    IF active_chat_count > 0 THEN
      RAISE EXCEPTION 'Cannot go offline with % active chat(s). Please close or reassign all active chats first.', active_chat_count;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_operator_offline_with_active_chats
  BEFORE UPDATE OF is_available ON operators
  FOR EACH ROW
  EXECUTE FUNCTION prevent_operator_offline_with_active_chats();

COMMENT ON FUNCTION prevent_operator_offline_with_active_chats() IS 'Prevents operators from going offline with active chats';

-- ============================================================================
-- TRIGGER 4: Handle Operator Deletion
-- ============================================================================
-- Requirement 15.1-15.5: Operator Account Deletion
-- When an operator is deleted, check for active chats and prevent deletion if any exist

CREATE OR REPLACE FUNCTION handle_operator_deletion()
RETURNS TRIGGER AS $
DECLARE
  active_chat_count INTEGER;
BEGIN
  -- Only process if this is a soft delete (deleted_at is being set)
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    
    -- Count active chats assigned to this operator
    SELECT COUNT(*) INTO active_chat_count
    FROM chats
    WHERE assigned_operator_id = NEW.id
      AND status = 'active'
      AND closed_at IS NULL;
    
    -- Prevent deletion if there are active chats
    IF active_chat_count > 0 THEN
      RAISE EXCEPTION 'Cannot delete operator with % active chat(s). Please reassign or close all active chats first.', active_chat_count;
    END IF;
    
    -- Force operator offline
    NEW.is_available := false;
    
    -- Log the deletion
    RAISE NOTICE 'Operator % deleted successfully. No active chats found.', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_operator_deletion
  BEFORE UPDATE OF deleted_at ON operators
  FOR EACH ROW
  EXECUTE FUNCTION handle_operator_deletion();

COMMENT ON FUNCTION handle_operator_deletion() IS 'Validates operator deletion and ensures no active chats exist';

-- ============================================================================
-- TRIGGER 5: Auto-Suspend Operators With Low Quality Scores
-- ============================================================================
-- Requirement 12.1-12.5: Operator Performance Monitoring
-- Automatically suspends operators when quality score drops below threshold

CREATE OR REPLACE FUNCTION auto_suspend_low_quality_operators()
RETURNS TRIGGER AS $
BEGIN
  -- Check if quality score has dropped below threshold
  IF NEW.quality_score < NEW.quality_threshold AND 
     (OLD.quality_score >= OLD.quality_threshold OR OLD.is_suspended = false) THEN
    
    -- Suspend the operator
    NEW.is_suspended := true;
    NEW.suspension_reason := format('Automatic suspension: Quality score (%.2f) dropped below threshold (%.2f)', 
                                    NEW.quality_score, NEW.quality_threshold);
    NEW.suspended_until := NOW() + INTERVAL '7 days';
    NEW.is_available := false;
    
    -- Create admin notification
    INSERT INTO admin_notifications (type, message, metadata, priority)
    VALUES (
      'operator_suspended',
      format('Operator "%s" has been automatically suspended due to low quality score (%.2f < %.2f)', 
             NEW.name, NEW.quality_score, NEW.quality_threshold),
      jsonb_build_object(
        'operator_id', NEW.id,
        'operator_name', NEW.name,
        'quality_score', NEW.quality_score,
        'quality_threshold', NEW.quality_threshold,
        'suspended_until', NEW.suspended_until
      ),
      'high'
    );
    
    RAISE NOTICE 'Operator % auto-suspended due to low quality score: %.2f < %.2f', 
                 NEW.id, NEW.quality_score, NEW.quality_threshold;
  END IF;
  
  -- Auto-reactivate if quality score improves and suspension period has ended
  IF NEW.is_suspended = true AND 
     NEW.quality_score >= NEW.quality_threshold AND
     (NEW.suspended_until IS NULL OR NEW.suspended_until <= NOW()) THEN
    
    NEW.is_suspended := false;
    NEW.suspension_reason := NULL;
    NEW.suspended_until := NULL;
    
    -- Create admin notification
    INSERT INTO admin_notifications (type, message, metadata, priority)
    VALUES (
      'operator_suspended',
      format('Operator "%s" has been automatically reactivated. Quality score improved to %.2f', 
             NEW.name, NEW.quality_score),
      jsonb_build_object(
        'operator_id', NEW.id,
        'operator_name', NEW.name,
        'quality_score', NEW.quality_score,
        'action', 'reactivated'
      ),
      'normal'
    );
    
    RAISE NOTICE 'Operator % auto-reactivated. Quality score improved to %.2f', 
                 NEW.id, NEW.quality_score;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_suspend_low_quality_operators
  BEFORE UPDATE OF quality_score ON operators
  FOR EACH ROW
  EXECUTE FUNCTION auto_suspend_low_quality_operators();

COMMENT ON FUNCTION auto_suspend_low_quality_operators() IS 'Automatically suspends operators with quality score below threshold';

-- ============================================================================
-- TRIGGER 6: Prevent Duplicate Transaction Processing
-- ============================================================================
-- Requirement 16.1-16.5: Payment Webhook Idempotency
-- Prevents duplicate transaction processing by checking provider_reference

CREATE OR REPLACE FUNCTION prevent_duplicate_transaction_processing()
RETURNS TRIGGER AS $
DECLARE
  existing_transaction_id UUID;
  existing_status TEXT;
BEGIN
  -- Check if a transaction with this provider_reference already exists
  SELECT id, status INTO existing_transaction_id, existing_status
  FROM transactions
  WHERE provider_reference = NEW.provider_reference
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
  LIMIT 1;
  
  -- If transaction exists
  IF existing_transaction_id IS NOT NULL THEN
    -- If existing transaction is successful, prevent duplicate
    IF existing_status = 'success' THEN
      RAISE EXCEPTION 'Duplicate transaction detected. Transaction with provider_reference "%" already exists with status "success" (ID: %)', 
                      NEW.provider_reference, existing_transaction_id;
    END IF;
    
    -- If existing transaction is pending or processing, log warning but allow
    IF existing_status IN ('pending', 'processing') THEN
      RAISE WARNING 'Transaction with provider_reference "%" already exists with status "%" (ID: %)', 
                    NEW.provider_reference, existing_status, existing_transaction_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_duplicate_transaction_processing
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_transaction_processing();

COMMENT ON FUNCTION prevent_duplicate_transaction_processing() IS 'Prevents duplicate transaction processing via provider_reference';

-- ============================================================================
-- FUNCTION: Check Message Credits With Row Locking
-- ============================================================================
-- Requirement 7.1-7.5: Concurrent Message Race Condition Prevention
-- Checks and deducts credits with row locking to prevent race conditions

CREATE OR REPLACE FUNCTION check_and_deduct_message_credits(
  p_user_id UUID,
  p_credits_required INTEGER,
  p_chat_id UUID,
  p_message_content TEXT
) RETURNS JSONB AS $
DECLARE
  v_current_credits INTEGER;
  v_result JSONB;
BEGIN
  -- Lock the user row to prevent concurrent modifications (SELECT FOR UPDATE)
  SELECT credits INTO v_current_credits
  FROM real_users
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check if user exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'User not found'
    );
  END IF;
  
  -- Check if user has sufficient credits
  IF v_current_credits < p_credits_required THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'message', format('Insufficient credits. Required: %s, Available: %s', p_credits_required, v_current_credits),
      'required', p_credits_required,
      'available', v_current_credits,
      'shortfall', p_credits_required - v_current_credits
    );
  END IF;
  
  -- Deduct credits from user account
  UPDATE real_users
  SET 
    credits = credits - p_credits_required,
    total_spent = total_spent + (p_credits_required * 10), -- 1 credit = 10 KES
    total_messages_sent = total_messages_sent + 1,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Update chat statistics
  UPDATE chats
  SET
    total_credits_spent = total_credits_spent + p_credits_required,
    message_count = message_count + 1,
    paid_messages_count = CASE 
      WHEN p_credits_required > 0 THEN paid_messages_count + 1 
      ELSE paid_messages_count 
    END,
    free_messages_used = CASE 
      WHEN p_credits_required = 0 THEN free_messages_used + 1 
      ELSE free_messages_used 
    END,
    last_message_at = NOW(),
    last_user_message_at = NOW(),
    updated_at = NOW()
  WHERE id = p_chat_id;
  
  -- Return success with updated balance
  RETURN jsonb_build_object(
    'success', true,
    'credits_deducted', p_credits_required,
    'previous_balance', v_current_credits,
    'new_balance', v_current_credits - p_credits_required,
    'message', 'Credits deducted successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return failure
    RAISE WARNING 'Error in check_and_deduct_message_credits: % %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'TRANSACTION_FAILED',
      'message', format('Transaction failed: %s', SQLERRM),
      'sql_state', SQLSTATE
    );
END;
$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_and_deduct_message_credits IS 'Checks and deducts credits with row locking to prevent race conditions';

-- ============================================================================
-- ADDITIONAL HELPER FUNCTION: Calculate Message Cost
-- ============================================================================
-- Requirement 6.1-6.5: Message Cost Calculation
-- Calculates message cost based on time of day, profile type, and message number

CREATE OR REPLACE FUNCTION calculate_message_cost(
  p_chat_id UUID,
  p_fictional_user_id UUID,
  p_message_number INTEGER,
  p_timezone TEXT DEFAULT 'Africa/Nairobi'
) RETURNS INTEGER AS $
DECLARE
  v_base_cost INTEGER := 1; -- Base cost is 1 credit
  v_final_cost INTEGER;
  v_hour_eat INTEGER;
  v_time_multiplier DECIMAL(3, 2) := 1.0;
  v_is_featured BOOLEAN;
  v_featured_multiplier DECIMAL(3, 2) := 1.0;
BEGIN
  -- First 3 messages are free
  IF p_message_number <= 3 THEN
    RETURN 0;
  END IF;
  
  -- Get current hour in EAT timezone
  v_hour_eat := EXTRACT(HOUR FROM (NOW() AT TIME ZONE p_timezone));
  
  -- Apply time-based multiplier
  -- Peak hours (8pm-2am EAT = 20:00-02:00): 1.2x multiplier
  -- Off-peak hours (2am-8am EAT = 02:00-08:00): 0.8x multiplier
  -- Normal hours (8am-8pm EAT = 08:00-20:00): 1.0x multiplier
  IF v_hour_eat >= 20 OR v_hour_eat < 2 THEN
    v_time_multiplier := 1.2; -- Peak hours
  ELSIF v_hour_eat >= 2 AND v_hour_eat < 8 THEN
    v_time_multiplier := 0.8; -- Off-peak hours
  ELSE
    v_time_multiplier := 1.0; -- Normal hours
  END IF;
  
  -- Check if fictional profile is featured
  SELECT is_featured INTO v_is_featured
  FROM fictional_users
  WHERE id = p_fictional_user_id;
  
  -- Apply featured multiplier (1.5x)
  IF v_is_featured = true THEN
    v_featured_multiplier := 1.5;
  END IF;
  
  -- Calculate final cost
  v_final_cost := CEIL(v_base_cost * v_time_multiplier * v_featured_multiplier);
  
  -- Ensure minimum cost of 1 credit for paid messages
  IF v_final_cost < 1 THEN
    v_final_cost := 1;
  END IF;
  
  RETURN v_final_cost;
END;
$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_message_cost IS 'Calculates message cost based on time, profile type, and message number';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- These queries can be used to verify the triggers are working correctly

-- Verify all triggers are created
DO $
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname IN (
    'trigger_prevent_last_super_admin_deletion',
    'trigger_handle_fictional_user_deletion',
    'trigger_prevent_operator_offline_with_active_chats',
    'trigger_handle_operator_deletion',
    'trigger_auto_suspend_low_quality_operators',
    'trigger_prevent_duplicate_transaction_processing'
  );
  
  RAISE NOTICE 'Created % triggers successfully', trigger_count;
END $;

-- Verify all functions are created
DO $
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname IN (
    'prevent_last_super_admin_deletion',
    'handle_fictional_user_deletion',
    'prevent_operator_offline_with_active_chats',
    'handle_operator_deletion',
    'auto_suspend_low_quality_operators',
    'prevent_duplicate_transaction_processing',
    'check_and_deduct_message_credits',
    'calculate_message_cost'
  );
  
  RAISE NOTICE 'Created % functions successfully', function_count;
END $;
