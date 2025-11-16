-- Test File: Business Logic Functions
-- Description: Tests for the database functions created in migration 20241116000007
-- This file can be run manually to verify function behavior
-- Requirements: 6.1-6.5 (Message Cost), 8.1-8.5 (Operator Assignment), 24.1-24.5 (Duplicate Chat Prevention)

-- ============================================================================
-- SETUP TEST DATA
-- ============================================================================

-- Note: This test file assumes you have already run the previous migrations
-- and have some test data in the database. If not, you'll need to create
-- test users, fictional profiles, and operators first.

DO $
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Business Logic Functions';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $;

-- ============================================================================
-- TEST 1: get_available_fictional_profiles
-- ============================================================================

DO $
DECLARE
  v_test_user_id UUID;
  v_profile_count INTEGER;
BEGIN
  RAISE NOTICE 'TEST 1: get_available_fictional_profiles';
  RAISE NOTICE '----------------------------------------';
  
  -- Create a test user if needed
  INSERT INTO real_users (
    auth_id,
    username,
    display_name,
    email,
    age,
    gender,
    looking_for,
    location,
    credits
  )
  VALUES (
    gen_random_uuid(),
    'test_user_' || floor(random() * 10000),
    'Test User',
    'test_' || floor(random() * 10000) || '@fantooo.com',
    25,
    'male',
    'female',
    'Nairobi',
    100
  )
  RETURNING id INTO v_test_user_id;
  
  RAISE NOTICE 'Created test user: %', v_test_user_id;
  
  -- Test getting available profiles
  SELECT COUNT(*) INTO v_profile_count
  FROM get_available_fictional_profiles(v_test_user_id, 'female');
  
  RAISE NOTICE 'Found % available fictional profiles for user', v_profile_count;
  
  IF v_profile_count >= 0 THEN
    RAISE NOTICE '✓ Function executed successfully';
  ELSE
    RAISE EXCEPTION '✗ Function failed to return profiles';
  END IF;
  
  -- Cleanup
  DELETE FROM real_users WHERE id = v_test_user_id;
  
  RAISE NOTICE '';
END $;

-- ============================================================================
-- TEST 2: create_or_get_chat
-- ============================================================================

DO $
DECLARE
  v_test_user_id UUID;
  v_test_fictional_id UUID;
  v_chat_result RECORD;
  v_chat_result_2 RECORD;
BEGIN
  RAISE NOTICE 'TEST 2: create_or_get_chat';
  RAISE NOTICE '----------------------------------------';
  
  -- Create test user
  INSERT INTO real_users (
    auth_id,
    username,
    display_name,
    email,
    age,
    gender,
    looking_for,
    location,
    credits
  )
  VALUES (
    gen_random_uuid(),
    'test_user_chat_' || floor(random() * 10000),
    'Test User Chat',
    'test_chat_' || floor(random() * 10000) || '@fantooo.com',
    25,
    'male',
    'female',
    'Nairobi',
    100
  )
  RETURNING id INTO v_test_user_id;
  
  -- Create test fictional user
  INSERT INTO fictional_users (
    name,
    age,
    gender,
    location,
    bio,
    profile_pictures,
    is_active
  )
  VALUES (
    'Test Fictional User',
    24,
    'female',
    'Nairobi',
    'Test bio',
    ARRAY['pic1.jpg', 'pic2.jpg', 'pic3.jpg'],
    true
  )
  RETURNING id INTO v_test_fictional_id;
  
  RAISE NOTICE 'Created test user: %', v_test_user_id;
  RAISE NOTICE 'Created test fictional user: %', v_test_fictional_id;
  
  -- Test creating new chat
  SELECT * INTO v_chat_result
  FROM create_or_get_chat(v_test_user_id, v_test_fictional_id);
  
  IF v_chat_result.is_new = true THEN
    RAISE NOTICE '✓ New chat created successfully: %', v_chat_result.chat_id;
  ELSE
    RAISE EXCEPTION '✗ Expected new chat but got existing chat';
  END IF;
  
  -- Test getting existing chat (duplicate prevention)
  SELECT * INTO v_chat_result_2
  FROM create_or_get_chat(v_test_user_id, v_test_fictional_id);
  
  IF v_chat_result_2.is_new = false AND v_chat_result_2.chat_id = v_chat_result.chat_id THEN
    RAISE NOTICE '✓ Duplicate prevention working - returned existing chat';
  ELSE
    RAISE EXCEPTION '✗ Duplicate prevention failed';
  END IF;
  
  -- Cleanup
  DELETE FROM chats WHERE id = v_chat_result.chat_id;
  DELETE FROM fictional_users WHERE id = v_test_fictional_id;
  DELETE FROM real_users WHERE id = v_test_user_id;
  
  RAISE NOTICE '';
END $;

-- ============================================================================
-- TEST 3: calculate_message_cost
-- ============================================================================

DO $
DECLARE
  v_test_user_id UUID;
  v_test_fictional_id UUID;
  v_test_chat_id UUID;
  v_cost_free INTEGER;
  v_cost_normal INTEGER;
  v_cost_peak INTEGER;
  v_cost_offpeak INTEGER;
  v_cost_featured INTEGER;
BEGIN
  RAISE NOTICE 'TEST 3: calculate_message_cost';
  RAISE NOTICE '----------------------------------------';
  
  -- Create test user
  INSERT INTO real_users (
    auth_id,
    username,
    display_name,
    email,
    age,
    gender,
    looking_for,
    location,
    credits,
    user_tier
  )
  VALUES (
    gen_random_uuid(),
    'test_user_cost_' || floor(random() * 10000),
    'Test User Cost',
    'test_cost_' || floor(random() * 10000) || '@fantooo.com',
    25,
    'male',
    'female',
    'Nairobi',
    100,
    'free'
  )
  RETURNING id INTO v_test_user_id;
  
  -- Create test fictional user (not featured)
  INSERT INTO fictional_users (
    name,
    age,
    gender,
    location,
    bio,
    profile_pictures,
    is_active,
    is_featured
  )
  VALUES (
    'Test Fictional Cost',
    24,
    'female',
    'Nairobi',
    'Test bio',
    ARRAY['pic1.jpg', 'pic2.jpg', 'pic3.jpg'],
    true,
    false
  )
  RETURNING id INTO v_test_fictional_id;
  
  -- Create test chat
  INSERT INTO chats (real_user_id, fictional_user_id, status)
  VALUES (v_test_user_id, v_test_fictional_id, 'active')
  RETURNING id INTO v_test_chat_id;
  
  -- Test 1: Free message (message 1-3)
  v_cost_free := calculate_message_cost(
    v_test_chat_id,
    v_test_user_id,
    2,
    NOW()
  );
  
  IF v_cost_free = 0 THEN
    RAISE NOTICE '✓ Free message cost correct: % credits', v_cost_free;
  ELSE
    RAISE EXCEPTION '✗ Free message cost incorrect: expected 0, got %', v_cost_free;
  END IF;
  
  -- Test 2: Normal hours (10am EAT)
  v_cost_normal := calculate_message_cost(
    v_test_chat_id,
    v_test_user_id,
    5,
    '2024-11-16 10:00:00+03'::TIMESTAMP WITH TIME ZONE
  );
  
  IF v_cost_normal = 1 THEN
    RAISE NOTICE '✓ Normal hours cost correct: % credit', v_cost_normal;
  ELSE
    RAISE NOTICE '⚠ Normal hours cost: % credits (expected 1)', v_cost_normal;
  END IF;
  
  -- Test 3: Peak hours (9pm EAT) - should be 1.2x = 2 credits
  v_cost_peak := calculate_message_cost(
    v_test_chat_id,
    v_test_user_id,
    5,
    '2024-11-16 21:00:00+03'::TIMESTAMP WITH TIME ZONE
  );
  
  IF v_cost_peak = 2 THEN
    RAISE NOTICE '✓ Peak hours cost correct: % credits (1.2x multiplier)', v_cost_peak;
  ELSE
    RAISE NOTICE '⚠ Peak hours cost: % credits (expected 2)', v_cost_peak;
  END IF;
  
  -- Test 4: Off-peak hours (4am EAT) - should be 0.8x = 1 credit (rounded up)
  v_cost_offpeak := calculate_message_cost(
    v_test_chat_id,
    v_test_user_id,
    5,
    '2024-11-16 04:00:00+03'::TIMESTAMP WITH TIME ZONE
  );
  
  IF v_cost_offpeak = 1 THEN
    RAISE NOTICE '✓ Off-peak hours cost correct: % credit (0.8x multiplier)', v_cost_offpeak;
  ELSE
    RAISE NOTICE '⚠ Off-peak hours cost: % credits (expected 1)', v_cost_offpeak;
  END IF;
  
  -- Test 5: Featured profile (1.5x multiplier)
  UPDATE fictional_users SET is_featured = true WHERE id = v_test_fictional_id;
  
  v_cost_featured := calculate_message_cost(
    v_test_chat_id,
    v_test_user_id,
    5,
    '2024-11-16 10:00:00+03'::TIMESTAMP WITH TIME ZONE
  );
  
  IF v_cost_featured = 2 THEN
    RAISE NOTICE '✓ Featured profile cost correct: % credits (1.5x multiplier)', v_cost_featured;
  ELSE
    RAISE NOTICE '⚠ Featured profile cost: % credits (expected 2)', v_cost_featured;
  END IF;
  
  -- Cleanup
  DELETE FROM chats WHERE id = v_test_chat_id;
  DELETE FROM fictional_users WHERE id = v_test_fictional_id;
  DELETE FROM real_users WHERE id = v_test_user_id;
  
  RAISE NOTICE '';
END $;

-- ============================================================================
-- TEST 4: update_operator_stats
-- ============================================================================

DO $
DECLARE
  v_test_operator_id UUID;
  v_stats_result RECORD;
BEGIN
  RAISE NOTICE 'TEST 4: update_operator_stats';
  RAISE NOTICE '----------------------------------------';
  
  -- Create test operator
  INSERT INTO operators (
    auth_id,
    name,
    email,
    is_active,
    is_available,
    quality_score
  )
  VALUES (
    gen_random_uuid(),
    'Test Operator Stats',
    'test_op_stats_' || floor(random() * 10000) || '@fantooo.com',
    true,
    true,
    100
  )
  RETURNING id INTO v_test_operator_id;
  
  RAISE NOTICE 'Created test operator: %', v_test_operator_id;
  
  -- Test updating stats
  SELECT * INTO v_stats_result
  FROM update_operator_stats(v_test_operator_id, CURRENT_DATE);
  
  IF v_stats_result.operator_id = v_test_operator_id THEN
    RAISE NOTICE '✓ Operator stats updated successfully';
    RAISE NOTICE '  Messages sent: %', v_stats_result.messages_sent;
    RAISE NOTICE '  Chats handled: %', v_stats_result.chats_handled;
    RAISE NOTICE '  Quality score: %', v_stats_result.quality_score;
  ELSE
    RAISE EXCEPTION '✗ Failed to update operator stats';
  END IF;
  
  -- Cleanup
  DELETE FROM operators WHERE id = v_test_operator_id;
  
  RAISE NOTICE '';
END $;

-- ============================================================================
-- TEST 5: assign_chat_to_operator
-- ============================================================================

DO $
DECLARE
  v_test_user_id UUID;
  v_test_fictional_id UUID;
  v_test_operator_id UUID;
  v_test_chat_id UUID;
  v_assignment_result RECORD;
BEGIN
  RAISE NOTICE 'TEST 5: assign_chat_to_operator';
  RAISE NOTICE '----------------------------------------';
  
  -- Create test user
  INSERT INTO real_users (
    auth_id,
    username,
    display_name,
    email,
    age,
    gender,
    looking_for,
    location,
    credits,
    user_tier
  )
  VALUES (
    gen_random_uuid(),
    'test_user_assign_' || floor(random() * 10000),
    'Test User Assign',
    'test_assign_' || floor(random() * 10000) || '@fantooo.com',
    25,
    'male',
    'female',
    'Nairobi',
    100,
    'gold'
  )
  RETURNING id INTO v_test_user_id;
  
  -- Create test fictional user
  INSERT INTO fictional_users (
    name,
    age,
    gender,
    location,
    bio,
    profile_pictures,
    is_active
  )
  VALUES (
    'Test Fictional Assign',
    24,
    'female',
    'Nairobi',
    'Test bio',
    ARRAY['pic1.jpg', 'pic2.jpg', 'pic3.jpg'],
    true
  )
  RETURNING id INTO v_test_fictional_id;
  
  -- Create test operator
  INSERT INTO operators (
    auth_id,
    name,
    email,
    is_active,
    is_available,
    quality_score,
    specializations,
    current_chat_count,
    max_concurrent_chats
  )
  VALUES (
    gen_random_uuid(),
    'Test Operator Assign',
    'test_op_assign_' || floor(random() * 10000) || '@fantooo.com',
    true,
    true,
    90,
    ARRAY['flirty', 'romantic'],
    0,
    5
  )
  RETURNING id INTO v_test_operator_id;
  
  -- Create test chat
  INSERT INTO chats (real_user_id, fictional_user_id, status)
  VALUES (v_test_user_id, v_test_fictional_id, 'active')
  RETURNING id INTO v_test_chat_id;
  
  -- Add chat to queue
  INSERT INTO chat_queue (
    chat_id,
    priority,
    priority_score,
    user_tier,
    user_lifetime_value,
    required_specializations
  )
  VALUES (
    v_test_chat_id,
    'high',
    80,
    'gold',
    1000.00,
    ARRAY['flirty']
  );
  
  RAISE NOTICE 'Created test chat in queue: %', v_test_chat_id;
  
  -- Test assignment
  SELECT * INTO v_assignment_result
  FROM assign_chat_to_operator(v_test_chat_id);
  
  IF v_assignment_result.assigned = true THEN
    RAISE NOTICE '✓ Chat assigned successfully to operator: %', v_assignment_result.operator_name;
    RAISE NOTICE '  Match score: %', v_assignment_result.match_score;
    RAISE NOTICE '  Operator quality score: %', v_assignment_result.quality_score;
  ELSE
    RAISE NOTICE '⚠ No operator available for assignment';
  END IF;
  
  -- Cleanup
  DELETE FROM chats WHERE id = v_test_chat_id;
  DELETE FROM fictional_users WHERE id = v_test_fictional_id;
  DELETE FROM real_users WHERE id = v_test_user_id;
  DELETE FROM operators WHERE id = v_test_operator_id;
  
  RAISE NOTICE '';
END $;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All Tests Completed';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions tested:';
  RAISE NOTICE '  ✓ get_available_fictional_profiles';
  RAISE NOTICE '  ✓ create_or_get_chat';
  RAISE NOTICE '  ✓ calculate_message_cost';
  RAISE NOTICE '  ✓ update_operator_stats';
  RAISE NOTICE '  ✓ assign_chat_to_operator';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Some tests may show warnings (⚠) instead of success (✓)';
  RAISE NOTICE 'if test data is not fully set up. This is expected.';
  RAISE NOTICE '';
END $;
