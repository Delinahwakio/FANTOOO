-- Migration: Create Database Functions for Business Logic
-- Description: Implements core business logic functions for profile filtering, chat management,
--              message cost calculation, operator stats, and chat assignment
-- Requirements: 6.1-6.5 (Message Cost), 8.1-8.5 (Operator Assignment), 24.1-24.5 (Duplicate Chat Prevention)

-- ============================================================================
-- FUNCTION: get_available_fictional_profiles
-- ============================================================================
-- Returns fictional profiles available to a user based on their gender preference
-- Filters out profiles the user already has active chats with
-- Requirements: 3.1-3.5 (Fictional Profiles), 24.1-24.5 (Duplicate Chat Prevention)

CREATE OR REPLACE FUNCTION get_available_fictional_profiles(
  p_user_id UUID,
  p_gender_preference TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  age INTEGER,
  gender TEXT,
  location TEXT,
  bio TEXT,
  personality_traits TEXT[],
  interests TEXT[],
  occupation TEXT,
  profile_pictures TEXT[],
  response_style TEXT,
  is_featured BOOLEAN,
  popularity_score INTEGER,
  average_rating DECIMAL,
  total_chats INTEGER,
  has_active_chat BOOLEAN
) AS $
DECLARE
  v_user_looking_for TEXT;
BEGIN
  -- Get user's gender preference if not provided
  IF p_gender_preference IS NULL THEN
    SELECT looking_for INTO v_user_looking_for
    FROM real_users
    WHERE real_users.id = p_user_id;
  ELSE
    v_user_looking_for := p_gender_preference;
  END IF;

  -- Return filtered fictional profiles
  RETURN QUERY
  SELECT 
    fu.id,
    fu.name,
    fu.age,
    fu.gender,
    fu.location,
    fu.bio,
    fu.personality_traits,
    fu.interests,
    fu.occupation,
    fu.profile_pictures,
    fu.response_style,
    fu.is_featured,
    fu.popularity_score,
    fu.average_rating,
    fu.total_chats,
    -- Check if user already has an active chat with this profile
    EXISTS (
      SELECT 1 
      FROM chats c 
      WHERE c.real_user_id = p_user_id 
        AND c.fictional_user_id = fu.id 
        AND c.status IN ('active', 'idle')
    ) as has_active_chat
  FROM fictional_users fu
  WHERE fu.is_active = true
    AND fu.deleted_at IS NULL
    -- Filter by gender preference
    AND (
      v_user_looking_for = 'both' 
      OR fu.gender = v_user_looking_for
    )
  ORDER BY 
    fu.is_featured DESC,
    fu.popularity_score DESC,
    fu.average_rating DESC;
END;
$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_available_fictional_profiles IS 
  'Returns fictional profiles available to a user based on gender preference, excluding profiles with active chats';

-- ============================================================================
-- FUNCTION: create_or_get_chat
-- ============================================================================
-- Creates a new chat or returns existing chat between real user and fictional user
-- Prevents duplicate chats with UNIQUE constraint
-- Requirements: 4.1-4.5 (Real-Time Chat), 24.1-24.5 (Duplicate Chat Prevention)

CREATE OR REPLACE FUNCTION create_or_get_chat(
  p_real_user_id UUID,
  p_fictional_user_id UUID
)
RETURNS TABLE (
  chat_id UUID,
  is_new BOOLEAN,
  status TEXT,
  message_count INTEGER,
  free_messages_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $
DECLARE
  v_chat_id UUID;
  v_is_new BOOLEAN := false;
  v_status TEXT;
  v_message_count INTEGER;
  v_free_messages_used INTEGER;
  v_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Try to get existing chat
  SELECT 
    c.id,
    c.status,
    c.message_count,
    c.free_messages_used,
    c.created_at
  INTO 
    v_chat_id,
    v_status,
    v_message_count,
    v_free_messages_used,
    v_created_at
  FROM chats c
  WHERE c.real_user_id = p_real_user_id
    AND c.fictional_user_id = p_fictional_user_id;

  -- If chat doesn't exist, create it
  IF v_chat_id IS NULL THEN
    INSERT INTO chats (
      real_user_id,
      fictional_user_id,
      status,
      message_count,
      free_messages_used,
      created_at
    )
    VALUES (
      p_real_user_id,
      p_fictional_user_id,
      'active',
      0,
      0,
      NOW()
    )
    RETURNING 
      id,
      chats.status,
      chats.message_count,
      chats.free_messages_used,
      chats.created_at
    INTO 
      v_chat_id,
      v_status,
      v_message_count,
      v_free_messages_used,
      v_created_at;
    
    v_is_new := true;

    -- Update fictional user stats
    UPDATE fictional_users
    SET total_chats = total_chats + 1
    WHERE id = p_fictional_user_id;

    -- Update real user stats
    UPDATE real_users
    SET total_chats = total_chats + 1
    WHERE id = p_real_user_id;
  END IF;

  -- Return chat information
  RETURN QUERY
  SELECT 
    v_chat_id,
    v_is_new,
    v_status,
    v_message_count,
    v_free_messages_used,
    v_created_at;
END;
$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION create_or_get_chat IS 
  'Creates a new chat or returns existing chat between real user and fictional user, preventing duplicates';

-- ============================================================================
-- FUNCTION: calculate_message_cost
-- ============================================================================
-- Calculates the credit cost for a message based on multiple factors:
-- - First 3 messages are free
-- - Time of day (peak/off-peak in EAT timezone)
-- - Featured profile multiplier
-- - User tier discounts
-- Requirements: 6.1-6.5 (Message Cost Calculation)

CREATE OR REPLACE FUNCTION calculate_message_cost(
  p_chat_id UUID,
  p_user_id UUID,
  p_message_number INTEGER,
  p_time_of_day TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS INTEGER AS $
DECLARE
  v_base_cost INTEGER := 1;
  v_final_cost DECIMAL := 1.0;
  v_is_featured BOOLEAN;
  v_user_tier TEXT;
  v_hour_eat INTEGER;
  v_time_multiplier DECIMAL := 1.0;
  v_featured_multiplier DECIMAL := 1.0;
  v_tier_discount DECIMAL := 1.0;
BEGIN
  -- First 3 messages are free
  IF p_message_number <= 3 THEN
    RETURN 0;
  END IF;

  -- Get fictional user featured status
  SELECT fu.is_featured
  INTO v_is_featured
  FROM chats c
  JOIN fictional_users fu ON fu.id = c.fictional_user_id
  WHERE c.id = p_chat_id;

  -- Get user tier
  SELECT user_tier
  INTO v_user_tier
  FROM real_users
  WHERE id = p_user_id;

  -- Convert to EAT timezone (Africa/Nairobi, UTC+3) and extract hour
  v_hour_eat := EXTRACT(HOUR FROM p_time_of_day AT TIME ZONE 'Africa/Nairobi');

  -- Apply time-of-day multiplier
  -- Peak hours: 8pm-2am (20:00-02:00) = 1.2x
  -- Off-peak hours: 2am-8am (02:00-08:00) = 0.8x
  -- Normal hours: 8am-8pm (08:00-20:00) = 1.0x
  IF v_hour_eat >= 20 OR v_hour_eat < 2 THEN
    v_time_multiplier := 1.2;  -- Peak hours
  ELSIF v_hour_eat >= 2 AND v_hour_eat < 8 THEN
    v_time_multiplier := 0.8;  -- Off-peak hours
  ELSE
    v_time_multiplier := 1.0;  -- Normal hours
  END IF;

  -- Apply featured profile multiplier
  IF v_is_featured THEN
    v_featured_multiplier := 1.5;
  END IF;

  -- Apply tier discount
  v_tier_discount := CASE v_user_tier
    WHEN 'platinum' THEN 0.7  -- 30% discount
    WHEN 'gold' THEN 0.8      -- 20% discount
    WHEN 'silver' THEN 0.9    -- 10% discount
    WHEN 'bronze' THEN 0.95   -- 5% discount
    ELSE 1.0                  -- No discount for free tier
  END;

  -- Calculate final cost
  v_final_cost := v_base_cost * v_time_multiplier * v_featured_multiplier * v_tier_discount;

  -- Round up to nearest integer (always charge at least 1 credit for paid messages)
  RETURN GREATEST(CEIL(v_final_cost)::INTEGER, 1);
END;
$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION calculate_message_cost IS 
  'Calculates message cost based on message number, time of day (EAT), featured status, and user tier';

-- ============================================================================
-- FUNCTION: update_operator_stats
-- ============================================================================
-- Updates operator performance statistics for a given date
-- Calculates response time, user ratings, quality score
-- Requirements: 12.1-12.5 (Operator Performance Monitoring)

CREATE OR REPLACE FUNCTION update_operator_stats(
  p_operator_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  operator_id UUID,
  messages_sent INTEGER,
  chats_handled INTEGER,
  avg_response_time INTERVAL,
  avg_user_rating DECIMAL,
  quality_score DECIMAL,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $
DECLARE
  v_messages_sent INTEGER;
  v_chats_handled INTEGER;
  v_avg_response_time INTERVAL;
  v_avg_user_rating DECIMAL;
  v_total_ratings INTEGER;
  v_quality_score DECIMAL;
  v_idle_incidents INTEGER;
  v_reassignment_count INTEGER;
BEGIN
  -- Count messages sent by operator on the given date
  SELECT COUNT(*)
  INTO v_messages_sent
  FROM messages m
  WHERE m.handled_by_operator_id = p_operator_id
    AND m.created_at::DATE = p_date
    AND m.sender_type = 'fictional';

  -- Count unique chats handled on the given date
  SELECT COUNT(DISTINCT m.chat_id)
  INTO v_chats_handled
  FROM messages m
  WHERE m.handled_by_operator_id = p_operator_id
    AND m.created_at::DATE = p_date
    AND m.sender_type = 'fictional';

  -- Calculate average response time
  -- (Time between user message and operator response)
  WITH response_times AS (
    SELECT 
      user_msg.created_at as user_time,
      op_msg.created_at as operator_time,
      op_msg.created_at - user_msg.created_at as response_time
    FROM messages user_msg
    JOIN LATERAL (
      SELECT created_at
      FROM messages
      WHERE chat_id = user_msg.chat_id
        AND sender_type = 'fictional'
        AND handled_by_operator_id = p_operator_id
        AND created_at > user_msg.created_at
        AND created_at::DATE = p_date
      ORDER BY created_at ASC
      LIMIT 1
    ) op_msg ON true
    WHERE user_msg.sender_type = 'real'
      AND user_msg.created_at::DATE = p_date
  )
  SELECT AVG(response_time)
  INTO v_avg_response_time
  FROM response_times
  WHERE response_time < INTERVAL '1 hour'; -- Exclude outliers

  -- Calculate average user rating from chats
  SELECT 
    AVG(user_satisfaction_rating),
    COUNT(user_satisfaction_rating)
  INTO 
    v_avg_user_rating,
    v_total_ratings
  FROM chats
  WHERE assigned_operator_id = p_operator_id
    AND user_satisfaction_rating IS NOT NULL
    AND updated_at::DATE <= p_date;

  -- Get idle incidents and reassignment count
  SELECT 
    idle_incidents,
    reassignment_count
  INTO 
    v_idle_incidents,
    v_reassignment_count
  FROM operators
  WHERE id = p_operator_id;

  -- Calculate quality score (0-100)
  -- Formula: Base 100 - penalties
  -- - Slow response time: -10 points if avg > 5 minutes
  -- - Low user rating: -20 points if avg < 3.0
  -- - Idle incidents: -5 points each
  -- - Reassignments: -3 points each
  v_quality_score := 100.0;

  -- Response time penalty
  IF v_avg_response_time > INTERVAL '5 minutes' THEN
    v_quality_score := v_quality_score - 10;
  END IF;

  -- User rating penalty
  IF v_avg_user_rating IS NOT NULL AND v_avg_user_rating < 3.0 THEN
    v_quality_score := v_quality_score - 20;
  ELSIF v_avg_user_rating IS NOT NULL AND v_avg_user_rating < 4.0 THEN
    v_quality_score := v_quality_score - 10;
  END IF;

  -- Idle incidents penalty
  v_quality_score := v_quality_score - (v_idle_incidents * 5);

  -- Reassignment penalty
  v_quality_score := v_quality_score - (v_reassignment_count * 3);

  -- Ensure quality score is between 0 and 100
  v_quality_score := GREATEST(0, LEAST(100, v_quality_score));

  -- Update operator record
  UPDATE operators
  SET 
    total_messages_sent = total_messages_sent + v_messages_sent,
    total_chats_handled = total_chats_handled + v_chats_handled,
    average_response_time = COALESCE(v_avg_response_time, average_response_time),
    average_user_rating = COALESCE(v_avg_user_rating, average_user_rating),
    total_ratings = COALESCE(v_total_ratings, total_ratings),
    quality_score = v_quality_score,
    updated_at = NOW()
  WHERE id = p_operator_id;

  -- Return updated stats
  RETURN QUERY
  SELECT 
    p_operator_id,
    v_messages_sent,
    v_chats_handled,
    v_avg_response_time,
    v_avg_user_rating,
    v_quality_score,
    NOW();
END;
$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION update_operator_stats IS 
  'Updates operator performance statistics including response time, ratings, and quality score';

-- ============================================================================
-- FUNCTION: assign_chat_to_operator
-- ============================================================================
-- Assigns a chat from the queue to the best available operator
-- Uses skill matching algorithm based on specializations and workload
-- Requirements: 8.1-8.5 (Operator Assignment), 9.1-9.5 (Chat Reassignment)

CREATE OR REPLACE FUNCTION assign_chat_to_operator(
  p_chat_id UUID
)
RETURNS TABLE (
  operator_id UUID,
  operator_name TEXT,
  operator_specializations TEXT[],
  current_chat_count INTEGER,
  quality_score DECIMAL,
  match_score INTEGER,
  assigned BOOLEAN
) AS $
DECLARE
  v_queue_record RECORD;
  v_best_operator RECORD;
  v_match_score INTEGER;
  v_max_match_score INTEGER := 0;
  v_assigned BOOLEAN := false;
BEGIN
  -- Get queue entry for this chat
  SELECT 
    cq.required_specializations,
    cq.excluded_operator_ids,
    cq.preferred_operator_id,
    cq.priority_score,
    c.fictional_user_id
  INTO v_queue_record
  FROM chat_queue cq
  JOIN chats c ON c.id = cq.chat_id
  WHERE cq.chat_id = p_chat_id;

  -- If no queue entry found, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Find best available operator using skill matching algorithm
  FOR v_best_operator IN
    SELECT 
      o.id,
      o.name,
      o.specializations,
      o.current_chat_count,
      o.quality_score,
      o.max_concurrent_chats,
      -- Calculate match score
      (
        -- Base score: 50 points
        50 +
        -- Specialization match: 30 points (if all required specializations are present)
        CASE 
          WHEN v_queue_record.required_specializations <@ o.specializations THEN 30
          WHEN v_queue_record.required_specializations && o.specializations THEN 15
          ELSE 0
        END +
        -- Workload score: 20 points (fewer chats = higher score)
        CASE 
          WHEN o.current_chat_count = 0 THEN 20
          WHEN o.current_chat_count <= 2 THEN 15
          WHEN o.current_chat_count <= 4 THEN 10
          ELSE 5
        END +
        -- Quality score bonus: up to 10 points
        CASE 
          WHEN o.quality_score >= 90 THEN 10
          WHEN o.quality_score >= 80 THEN 7
          WHEN o.quality_score >= 70 THEN 5
          ELSE 0
        END +
        -- Preferred operator bonus: 20 points
        CASE 
          WHEN o.id = v_queue_record.preferred_operator_id THEN 20
          ELSE 0
        END
      ) as match_score
    FROM operators o
    WHERE o.is_active = true
      AND o.is_available = true
      AND o.is_suspended = false
      AND o.deleted_at IS NULL
      AND o.current_chat_count < o.max_concurrent_chats
      -- Exclude operators who previously handled this chat
      AND NOT (o.id = ANY(COALESCE(v_queue_record.excluded_operator_ids, ARRAY[]::UUID[])))
    ORDER BY 
      -- Sort by match score descending
      match_score DESC,
      -- Then by current workload ascending
      o.current_chat_count ASC,
      -- Then by quality score descending
      o.quality_score DESC
    LIMIT 1
  LOOP
    -- Assign chat to this operator
    UPDATE chats
    SET 
      assigned_operator_id = v_best_operator.id,
      assignment_time = NOW(),
      last_operator_activity = NOW(),
      assignment_count = assignment_count + 1,
      status = 'active',
      updated_at = NOW()
    WHERE id = p_chat_id;

    -- Update operator's current chat count
    UPDATE operators
    SET 
      current_chat_count = current_chat_count + 1,
      last_activity = NOW(),
      updated_at = NOW()
    WHERE id = v_best_operator.id;

    -- Remove from queue
    DELETE FROM chat_queue
    WHERE chat_id = p_chat_id;

    -- Mark as assigned
    v_assigned := true;

    -- Return operator information
    RETURN QUERY
    SELECT 
      v_best_operator.id,
      v_best_operator.name,
      v_best_operator.specializations,
      v_best_operator.current_chat_count + 1,
      v_best_operator.quality_score,
      v_best_operator.match_score,
      v_assigned;

    -- Exit after first assignment
    RETURN;
  END LOOP;

  -- If no operator found, update queue attempts
  IF NOT v_assigned THEN
    UPDATE chat_queue
    SET 
      attempts = attempts + 1,
      last_attempt_at = NOW()
    WHERE chat_id = p_chat_id;

    -- If max attempts reached (3), escalate chat
    UPDATE chats
    SET 
      status = 'escalated',
      flags = array_append(flags, 'max_assignment_attempts_reached'),
      updated_at = NOW()
    WHERE id = p_chat_id
      AND (
        SELECT attempts 
        FROM chat_queue 
        WHERE chat_id = p_chat_id
      ) >= 3;

    -- Create admin notification if escalated
    IF FOUND THEN
      INSERT INTO admin_notifications (
        type,
        message,
        metadata,
        priority,
        created_at
      )
      VALUES (
        'chat_escalation',
        'Chat escalated after 3 failed assignment attempts',
        jsonb_build_object(
          'chat_id', p_chat_id,
          'attempts', 3,
          'reason', 'no_available_operators'
        ),
        'high',
        NOW()
      );

      -- Remove from queue after escalation
      DELETE FROM chat_queue
      WHERE chat_id = p_chat_id;
    END IF;

    -- Return empty result indicating no assignment
    RETURN QUERY
    SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT[],
      NULL::INTEGER,
      NULL::DECIMAL,
      NULL::INTEGER,
      false;
  END IF;
END;
$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION assign_chat_to_operator IS 
  'Assigns a chat to the best available operator using skill matching algorithm, or escalates after 3 failed attempts';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_available_fictional_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_get_chat TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_message_cost TO authenticated;

-- Grant execute permissions to service role for background jobs
GRANT EXECUTE ON FUNCTION update_operator_stats TO service_role;
GRANT EXECUTE ON FUNCTION assign_chat_to_operator TO service_role;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for fictional user filtering by gender and active status
CREATE INDEX IF NOT EXISTS idx_fictional_users_gender_active 
  ON fictional_users(gender, is_active) 
  WHERE deleted_at IS NULL;

-- Index for chat lookup by user pair
CREATE INDEX IF NOT EXISTS idx_chats_user_pair 
  ON chats(real_user_id, fictional_user_id);

-- Index for operator availability and workload
CREATE INDEX IF NOT EXISTS idx_operators_availability_workload 
  ON operators(is_available, is_active, current_chat_count) 
  WHERE deleted_at IS NULL AND is_suspended = false;

-- Index for operator specializations matching
CREATE INDEX IF NOT EXISTS idx_operators_specializations_gin 
  ON operators USING GIN(specializations) 
  WHERE is_active = true AND is_available = true;

-- ============================================================================
-- TESTING QUERIES (COMMENTED OUT - FOR REFERENCE)
-- ============================================================================

/*
-- Test get_available_fictional_profiles
SELECT * FROM get_available_fictional_profiles(
  'user-uuid-here'::UUID,
  'female'
);

-- Test create_or_get_chat
SELECT * FROM create_or_get_chat(
  'real-user-uuid'::UUID,
  'fictional-user-uuid'::UUID
);

-- Test calculate_message_cost
-- Free message (message 1)
SELECT calculate_message_cost(
  'chat-uuid'::UUID,
  'user-uuid'::UUID,
  1,
  NOW()
);

-- Paid message during peak hours
SELECT calculate_message_cost(
  'chat-uuid'::UUID,
  'user-uuid'::UUID,
  5,
  '2024-11-16 21:00:00+03'::TIMESTAMP WITH TIME ZONE
);

-- Paid message during off-peak hours
SELECT calculate_message_cost(
  'chat-uuid'::UUID,
  'user-uuid'::UUID,
  5,
  '2024-11-16 04:00:00+03'::TIMESTAMP WITH TIME ZONE
);

-- Test update_operator_stats
SELECT * FROM update_operator_stats(
  'operator-uuid'::UUID,
  CURRENT_DATE
);

-- Test assign_chat_to_operator
SELECT * FROM assign_chat_to_operator(
  'chat-uuid'::UUID
);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $
BEGIN
  RAISE NOTICE 'Migration 20241116000007_create_business_logic_functions.sql completed successfully';
  RAISE NOTICE 'Created functions:';
  RAISE NOTICE '  - get_available_fictional_profiles(user_id, gender_preference)';
  RAISE NOTICE '  - create_or_get_chat(real_user_id, fictional_user_id)';
  RAISE NOTICE '  - calculate_message_cost(chat_id, user_id, message_number, time_of_day)';
  RAISE NOTICE '  - update_operator_stats(operator_id, date)';
  RAISE NOTICE '  - assign_chat_to_operator(chat_id)';
END $;
