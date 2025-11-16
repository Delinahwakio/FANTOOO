-- Migration: Create send_message_with_transaction function
-- Description: Implements message sending with transaction safety, row locking, and credit deduction
-- Requirements: 7.1-7.5 (Race Condition Prevention), 4.1-4.5 (Real-Time Chat)

-- Create failed_transaction_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS failed_transaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  attempted_at TIMESTAMP NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_transaction_log_user ON failed_transaction_log(user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_transaction_log_chat ON failed_transaction_log(chat_id, attempted_at DESC);

-- Function to send a message with full transaction safety
CREATE OR REPLACE FUNCTION send_message_with_transaction(
  p_chat_id UUID,
  p_user_id UUID,
  p_content TEXT,
  p_content_type TEXT DEFAULT 'text',
  p_media_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_credits INTEGER;
  v_user_tier TEXT;
  v_message_count INTEGER;
  v_is_featured BOOLEAN;
  v_message_cost INTEGER;
  v_is_free_message BOOLEAN;
  v_message_id UUID;
  v_message JSONB;
  v_remaining_credits INTEGER;
  v_fictional_user_id UUID;
  v_operator_id UUID;
BEGIN
  -- Step 1: Lock the user row and get user data (SELECT FOR UPDATE prevents race conditions)
  SELECT credits, user_tier
  INTO v_user_credits, v_user_tier
  FROM real_users
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found: %', p_user_id;
  END IF;
  
  -- Step 2: Get chat data and lock it
  SELECT 
    c.message_count, 
    c.fictional_user_id,
    c.assigned_operator_id,
    f.is_featured
  INTO 
    v_message_count, 
    v_fictional_user_id,
    v_operator_id,
    v_is_featured
  FROM chats c
  JOIN fictional_users f ON f.id = c.fictional_user_id
  WHERE c.id = p_chat_id
    AND c.real_user_id = p_user_id
    AND c.status = 'active'
  FOR UPDATE;
  
  -- Check if chat exists and is active
  IF NOT FOUND THEN
    RAISE EXCEPTION 'chat not found or not active: %', p_chat_id;
  END IF;
  
  -- Step 3: Calculate message cost
  -- Messages 1-3 are free
  IF v_message_count < 3 THEN
    v_message_cost := 0;
    v_is_free_message := TRUE;
  ELSE
    -- Calculate cost based on time, tier, and featured status
    -- This is a simplified version - the full calculation is done in the application
    -- For now, we'll use a base cost and apply multipliers
    DECLARE
      v_base_cost INTEGER := 1;
      v_time_multiplier DECIMAL := 1.0;
      v_featured_multiplier DECIMAL := 1.0;
      v_tier_discount DECIMAL := 0.0;
      v_current_hour INTEGER;
    BEGIN
      -- Get current hour in EAT (UTC+3)
      v_current_hour := EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Africa/Nairobi'));
      
      -- Apply time-based multiplier
      IF v_current_hour >= 20 OR v_current_hour < 2 THEN
        -- Peak hours (8pm-2am): 1.2x multiplier
        v_time_multiplier := 1.2;
      ELSIF v_current_hour >= 2 AND v_current_hour < 8 THEN
        -- Off-peak hours (2am-8am): 0.8x multiplier
        v_time_multiplier := 0.8;
      ELSE
        -- Normal hours (8am-8pm): 1.0x multiplier
        v_time_multiplier := 1.0;
      END IF;
      
      -- Apply featured profile multiplier
      IF v_is_featured THEN
        v_featured_multiplier := 1.5;
      END IF;
      
      -- Apply tier discount
      CASE v_user_tier
        WHEN 'bronze' THEN v_tier_discount := 0.05;
        WHEN 'silver' THEN v_tier_discount := 0.10;
        WHEN 'gold' THEN v_tier_discount := 0.15;
        WHEN 'platinum' THEN v_tier_discount := 0.20;
        ELSE v_tier_discount := 0.0;
      END CASE;
      
      -- Calculate final cost
      v_message_cost := ROUND(
        v_base_cost * v_time_multiplier * v_featured_multiplier * (1 - v_tier_discount)
      );
      
      -- Ensure minimum cost of 1 for paid messages
      IF v_message_cost < 1 THEN
        v_message_cost := 1;
      END IF;
      
      v_is_free_message := FALSE;
    END;
  END IF;
  
  -- Step 4: Check if user has sufficient credits
  IF NOT v_is_free_message AND v_user_credits < v_message_cost THEN
    RAISE EXCEPTION 'insufficient credits: need %, have %', v_message_cost, v_user_credits;
  END IF;
  
  -- Step 5: Deduct credits if not a free message
  IF NOT v_is_free_message THEN
    UPDATE real_users
    SET 
      credits = credits - v_message_cost,
      total_spent = total_spent + (v_message_cost * 10), -- 1 credit = 10 KES
      total_messages_sent = total_messages_sent + 1,
      last_active_at = NOW()
    WHERE id = p_user_id;
  ELSE
    UPDATE real_users
    SET 
      total_messages_sent = total_messages_sent + 1,
      last_active_at = NOW()
    WHERE id = p_user_id;
  END IF;
  
  -- Step 6: Create the message
  INSERT INTO messages (
    chat_id,
    sender_type,
    content,
    content_type,
    media_url,
    is_free_message,
    credits_charged,
    status,
    handled_by_operator_id
  ) VALUES (
    p_chat_id,
    'real',
    p_content,
    p_content_type,
    p_media_url,
    v_is_free_message,
    v_message_cost,
    'sent',
    v_operator_id
  )
  RETURNING id INTO v_message_id;
  
  -- Step 7: Update chat metadata
  UPDATE chats
  SET 
    message_count = message_count + 1,
    last_message_at = NOW(),
    last_user_message_at = NOW(),
    total_credits_spent = total_credits_spent + v_message_cost,
    paid_messages_count = CASE 
      WHEN v_is_free_message THEN paid_messages_count 
      ELSE paid_messages_count + 1 
    END,
    free_messages_used = CASE 
      WHEN v_is_free_message THEN free_messages_used + 1 
      ELSE free_messages_used 
    END,
    first_message_at = COALESCE(first_message_at, NOW()),
    updated_at = NOW()
  WHERE id = p_chat_id;
  
  -- Step 8: Get the created message with all details
  SELECT jsonb_build_object(
    'id', m.id,
    'chat_id', m.chat_id,
    'sender_type', m.sender_type,
    'content', m.content,
    'content_type', m.content_type,
    'media_url', m.media_url,
    'is_free_message', m.is_free_message,
    'credits_charged', m.credits_charged,
    'is_edited', m.is_edited,
    'edit_count', m.edit_count,
    'status', m.status,
    'created_at', m.created_at
  )
  INTO v_message
  FROM messages m
  WHERE m.id = v_message_id;
  
  -- Calculate remaining credits
  v_remaining_credits := v_user_credits - v_message_cost;
  
  -- Return the result
  RETURN jsonb_build_object(
    'message', v_message,
    'creditsCharged', v_message_cost,
    'remainingCredits', v_remaining_credits
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (best effort, don't fail if logging fails)
    BEGIN
      INSERT INTO failed_transaction_log (
        user_id,
        chat_id,
        error_type,
        error_message,
        attempted_at,
        metadata
      ) VALUES (
        p_user_id,
        p_chat_id,
        SQLSTATE,
        SQLERRM,
        NOW(),
        jsonb_build_object(
          'content_type', p_content_type,
          'content_length', LENGTH(p_content)
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Silently fail logging
        NULL;
    END;
    
    -- Re-raise the original error
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION send_message_with_transaction TO authenticated;

-- Add comment
COMMENT ON FUNCTION send_message_with_transaction IS 
'Sends a message with full transaction safety including row locking, credit validation, and atomic credit deduction. Requirements: 7.1-7.5 (Race Condition Prevention), 4.1-4.5 (Real-Time Chat)';
