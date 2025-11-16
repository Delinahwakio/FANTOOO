-- Migration: Create payment helper functions for Edge Functions
-- Description: Functions to support payment processing and credit management

-- Function to add credits to user account
-- Used by process-payment and reconcile-payments Edge Functions
CREATE OR REPLACE FUNCTION add_credits_to_user(
  p_user_id UUID,
  p_credits INTEGER,
  p_transaction_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user credits
  UPDATE real_users
  SET 
    credits = credits + p_credits,
    total_spent = total_spent + (p_credits * 10), -- 1 credit = 10 KES
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Log the credit addition
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_user_id,
    'credits_added',
    'transaction',
    p_transaction_id,
    jsonb_build_object(
      'credits', p_credits,
      'transaction_id', p_transaction_id,
      'timestamp', NOW()
    )
  );
END;
$$;

-- Function to check and deduct credits for message sending
-- Used by message sending operations
CREATE OR REPLACE FUNCTION check_and_deduct_credits(
  p_user_id UUID,
  p_credits_required INTEGER,
  p_chat_id UUID,
  p_message_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Lock the user row and get current credits
  SELECT credits INTO v_current_credits
  FROM real_users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user has enough credits
  IF v_current_credits < p_credits_required THEN
    RETURN FALSE;
  END IF;

  -- Deduct credits
  UPDATE real_users
  SET 
    credits = credits - p_credits_required,
    total_messages_sent = total_messages_sent + 1,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Update chat metrics
  UPDATE chats
  SET 
    total_credits_spent = total_credits_spent + p_credits_required,
    paid_messages_count = paid_messages_count + 1,
    message_count = message_count + 1,
    last_message_at = NOW(),
    last_user_message_at = NOW(),
    updated_at = NOW()
  WHERE id = p_chat_id;

  RETURN TRUE;
END;
$$;

-- Function to refund credits to user
-- Used by admin refund operations
CREATE OR REPLACE FUNCTION refund_credits_to_user(
  p_user_id UUID,
  p_credits INTEGER,
  p_reason TEXT,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_refund_id UUID;
BEGIN
  -- Add credits back to user
  UPDATE real_users
  SET 
    credits = credits + p_credits,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Create refund record
  INSERT INTO credit_refunds (
    user_id,
    amount,
    reason,
    processed_by,
    notes,
    status
  ) VALUES (
    p_user_id,
    p_credits,
    p_reason,
    p_admin_id,
    p_notes,
    'completed'
  )
  RETURNING id INTO v_refund_id;

  -- Log the refund
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_user_id,
    'credits_refunded',
    'refund',
    v_refund_id,
    jsonb_build_object(
      'credits', p_credits,
      'reason', p_reason,
      'admin_id', p_admin_id,
      'timestamp', NOW()
    )
  );

  RETURN v_refund_id;
END;
$$;

-- Function to calculate refund amount for deleted user
-- Used by delete-user-account Edge Function
CREATE OR REPLACE FUNCTION calculate_user_refund(
  p_user_id UUID
)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unused_credits INTEGER;
  v_refund_amount DECIMAL(10, 2);
BEGIN
  -- Get unused credits
  SELECT credits INTO v_unused_credits
  FROM real_users
  WHERE id = p_user_id;

  -- Calculate refund (1 credit = 10 KES)
  v_refund_amount := v_unused_credits * 10;

  RETURN v_refund_amount;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION add_credits_to_user IS 'Adds credits to user account after successful payment';
COMMENT ON FUNCTION check_and_deduct_credits IS 'Checks if user has enough credits and deducts them for message sending';
COMMENT ON FUNCTION refund_credits_to_user IS 'Refunds credits to user account with audit trail';
COMMENT ON FUNCTION calculate_user_refund IS 'Calculates refund amount for user account deletion';
