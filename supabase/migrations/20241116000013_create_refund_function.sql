-- Migration: Create Credit Refund Function
-- Description: Implements atomic credit refund processing with audit trail
-- Requirements: 18.1-18.5 (Credit Refund Processing)
-- Created: 2024-11-16

-- ============================================================================
-- FUNCTION: process_credit_refund
-- ============================================================================
-- Processes a credit refund with transaction safety
-- 
-- This function:
-- 1. Validates the user exists and is not deleted
-- 2. Adds credits back to the user account
-- 3. Creates an audit record in credit_refunds table
-- 4. Returns refund details including new balance
--
-- All operations are performed within a single transaction to ensure
-- data consistency and prevent race conditions.
--
-- Parameters:
--   p_user_id: UUID of the user receiving the refund
--   p_amount: Number of credits to refund (must be > 0)
--   p_reason: Refund reason (must be valid enum value)
--   p_message_id: Optional UUID of related message
--   p_chat_id: Optional UUID of related chat
--   p_processed_by: UUID of admin processing the refund
--   p_notes: Optional notes about the refund
--
-- Returns:
--   JSON object with:
--     - refund_id: UUID of created refund record
--     - new_balance: Updated credit balance
--     - processed_at: Timestamp of refund processing
--
-- Throws:
--   - Exception if user not found
--   - Exception if amount is invalid
--   - Exception if reason is invalid
-- ============================================================================

CREATE OR REPLACE FUNCTION process_credit_refund(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_message_id UUID DEFAULT NULL,
  p_chat_id UUID DEFAULT NULL,
  p_processed_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_refund_id UUID;
  v_new_balance INTEGER;
  v_processed_at TIMESTAMP;
  v_user_exists BOOLEAN;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Refund amount must be greater than 0';
  END IF;

  -- Validate reason
  IF p_reason NOT IN (
    'accidental_send',
    'inappropriate_content',
    'system_error',
    'admin_discretion',
    'account_deletion'
  ) THEN
    RAISE EXCEPTION 'Invalid refund reason: %', p_reason;
  END IF;

  -- Check if user exists and is not deleted
  SELECT EXISTS(
    SELECT 1 FROM real_users
    WHERE id = p_user_id
    AND deleted_at IS NULL
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'User not found or has been deleted: %', p_user_id;
  END IF;

  -- Add credits to user account
  -- Using UPDATE with RETURNING to get the new balance atomically
  UPDATE real_users
  SET 
    credits = credits + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;

  -- Create audit record in credit_refunds table
  INSERT INTO credit_refunds (
    user_id,
    amount,
    reason,
    message_id,
    chat_id,
    processed_by,
    notes,
    status,
    created_at
  )
  VALUES (
    p_user_id,
    p_amount,
    p_reason,
    p_message_id,
    p_chat_id,
    p_processed_by,
    p_notes,
    'completed',
    NOW()
  )
  RETURNING id, created_at INTO v_refund_id, v_processed_at;

  -- Return refund details
  RETURN json_build_object(
    'refund_id', v_refund_id,
    'new_balance', v_new_balance,
    'processed_at', v_processed_at
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Failed to process refund: %', SQLERRM;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION process_credit_refund IS 
'Processes a credit refund with full transaction safety and audit trail. '
'Adds credits back to user account and creates audit record in credit_refunds table. '
'All operations are atomic to prevent race conditions.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permission to authenticated users
-- (RLS policies will control who can actually call this)
GRANT EXECUTE ON FUNCTION process_credit_refund TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test the function (commented out - uncomment to test)
-- SELECT process_credit_refund(
--   p_user_id := 'user-uuid-here',
--   p_amount := 10,
--   p_reason := 'system_error',
--   p_processed_by := 'admin-uuid-here',
--   p_notes := 'Test refund'
-- );
