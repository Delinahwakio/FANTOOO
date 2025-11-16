-- Test Script for Database Triggers and Constraints
-- This file contains test cases to verify all triggers are working correctly
-- Run this after applying the main migration: 20241116000004_create_triggers_and_constraints.sql

-- ============================================================================
-- TEST SETUP: Create test data
-- ============================================================================

-- Create test admin (super_admin)
INSERT INTO admins (id, auth_id, name, email, role, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::UUID, '11111111-1111-1111-1111-111111111111'::UUID, 'Test Super Admin', 'superadmin@test.com', 'super_admin', true),
  ('22222222-2222-2222-2222-222222222222'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 'Test Admin', 'admin@test.com', 'admin', true);

-- Create test real user
INSERT INTO real_users (id, auth_id, username, display_name, email, age, gender, looking_for, location, credits)
VALUES 
  ('33333333-3333-3333-3333-333333333333'::UUID, '33333333-3333-3333-3333-333333333333'::UUID, 'testuser', 'Test User', 'testuser@fantooo.com', 25, 'male', 'female', 'Nairobi, Kenya', 100);

-- Create test fictional user
INSERT INTO fictional_users (id, name, age, gender, location, bio, profile_pictures, is_featured, created_by)
VALUES 
  ('44444444-4444-4444-4444-444444444444'::UUID, 'Test Fictional', 24, 'female', 'Nairobi, Kenya', 'Test bio', ARRAY['pic1.jpg', 'pic2.jpg', 'pic3.jpg'], false, '11111111-1111-1111-1111-111111111111'::UUID),
  ('55555555-5555-5555-5555-555555555555'::UUID, 'Featured Fictional', 26, 'female', 'Mombasa, Kenya', 'Featured bio', ARRAY['pic1.jpg', 'pic2.jpg', 'pic3.jpg'], true, '11111111-1111-1111-1111-111111111111'::UUID);

-- Create test operator
INSERT INTO operators (id, auth_id, name, email, is_active, is_available, quality_score, quality_threshold, created_by)
VALUES 
  ('66666666-6666-6666-6666-666666666666'::UUID, '66666666-6666-6666-6666-666666666666'::UUID, 'Test Operator', 'operator@test.com', true, true, 100, 60, '11111111-1111-1111-1111-111111111111'::UUID),
  ('77777777-7777-7777-7777-777777777777'::UUID, '77777777-7777-7777-7777-777777777777'::UUID, 'Low Quality Operator', 'lowquality@test.com', true, true, 80, 60, '11111111-1111-1111-1111-111111111111'::UUID);

-- Create test chat
INSERT INTO chats (id, real_user_id, fictional_user_id, assigned_operator_id, status)
VALUES 
  ('88888888-8888-8888-8888-888888888888'::UUID, '33333333-3333-3333-3333-333333333333'::UUID, '44444444-4444-4444-4444-444444444444'::UUID, '66666666-6666-6666-6666-666666666666'::UUID, 'active');

-- ============================================================================
-- TEST 1: Prevent Last Super Admin Deletion
-- ============================================================================
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 1: Prevent Last Super Admin Deletion';
  RAISE NOTICE '========================================';
  
  -- Test 1a: Try to delete non-last super_admin (should succeed)
  BEGIN
    UPDATE admins 
    SET deleted_at = NOW() 
    WHERE id = '22222222-2222-2222-2222-222222222222'::UUID;
    
    RAISE NOTICE '✓ Test 1a PASSED: Non-super_admin deleted successfully';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Test 1a FAILED: %', SQLERRM;
  END;
  
  -- Rollback the deletion
  UPDATE admins SET deleted_at = NULL WHERE id = '22222222-2222-2222-2222-222222222222'::UUID;
  
  -- Test 1b: Try to delete last super_admin (should fail)
  BEGIN
    UPDATE admins 
    SET deleted_at = NOW() 
    WHERE id = '11111111-1111-1111-1111-111111111111'::UUID;
    
    RAISE NOTICE '✗ Test 1b FAILED: Last super_admin was deleted (should have been prevented)';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%Cannot delete the last super_admin%' THEN
        RAISE NOTICE '✓ Test 1b PASSED: Last super_admin deletion prevented';
      ELSE
        RAISE NOTICE '✗ Test 1b FAILED: Wrong error: %', SQLERRM;
      END IF;
  END;
END $;

-- ============================================================================
-- TEST 2: Handle Fictional User Deletion
-- ============================================================================
DO $
DECLARE
  chat_status TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 2: Handle Fictional User Deletion';
  RAISE NOTICE '========================================';
  
  -- Test 2a: Delete fictional user and check if chat is closed
  BEGIN
    UPDATE fictional_users 
    SET deleted_at = NOW() 
    WHERE id = '44444444-4444-4444-4444-444444444444'::UUID;
    
    -- Check if chat was closed
    SELECT status INTO chat_status
    FROM chats
    WHERE id = '88888888-8888-8888-8888-888888888888'::UUID;
    
    IF chat_status = 'closed' THEN
      RAISE NOTICE '✓ Test 2a PASSED: Chat closed when fictional user deleted';
    ELSE
      RAISE NOTICE '✗ Test 2a FAILED: Chat status is % (expected: closed)', chat_status;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Test 2a FAILED: %', SQLERRM;
  END;
  
  -- Rollback
  UPDATE fictional_users SET deleted_at = NULL WHERE id = '44444444-4444-4444-4444-444444444444'::UUID;
  UPDATE chats SET status = 'active', close_reason = NULL, closed_at = NULL WHERE id = '88888888-8888-8888-8888-888888888888'::UUID;
END $;

-- ============================================================================
-- TEST 3: Prevent Operator Going Offline With Active Chats
-- ============================================================================
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 3: Prevent Operator Offline With Active Chats';
  RAISE NOTICE '========================================';
  
  -- Test 3a: Try to set operator offline with active chat (should fail)
  BEGIN
    UPDATE operators 
    SET is_available = false 
    WHERE id = '66666666-6666-6666-6666-666666666666'::UUID;
    
    RAISE NOTICE '✗ Test 3a FAILED: Operator went offline with active chats (should have been prevented)';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%Cannot go offline with%active chat%' THEN
        RAISE NOTICE '✓ Test 3a PASSED: Operator prevented from going offline with active chats';
      ELSE
        RAISE NOTICE '✗ Test 3a FAILED: Wrong error: %', SQLERRM;
      END IF;
  END;
  
  -- Test 3b: Close chat and try again (should succeed)
  BEGIN
    UPDATE chats SET status = 'closed', closed_at = NOW() WHERE id = '88888888-8888-8888-8888-888888888888'::UUID;
    
    UPDATE operators 
    SET is_available = false 
    WHERE id = '66666666-6666-6666-6666-666666666666'::UUID;
    
    RAISE NOTICE '✓ Test 3b PASSED: Operator went offline after closing chats';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Test 3b FAILED: %', SQLERRM;
  END;
  
  -- Rollback
  UPDATE operators SET is_available = true WHERE id = '66666666-6666-6666-6666-666666666666'::UUID;
  UPDATE chats SET status = 'active', closed_at = NULL WHERE id = '88888888-8888-8888-8888-888888888888'::UUID;
END $;

-- ============================================================================
-- TEST 4: Handle Operator Deletion
-- ============================================================================
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 4: Handle Operator Deletion';
  RAISE NOTICE '========================================';
  
  -- Test 4a: Try to delete operator with active chat (should fail)
  BEGIN
    UPDATE operators 
    SET deleted_at = NOW() 
    WHERE id = '66666666-6666-6666-6666-666666666666'::UUID;
    
    RAISE NOTICE '✗ Test 4a FAILED: Operator deleted with active chats (should have been prevented)';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%Cannot delete operator with%active chat%' THEN
        RAISE NOTICE '✓ Test 4a PASSED: Operator deletion prevented with active chats';
      ELSE
        RAISE NOTICE '✗ Test 4a FAILED: Wrong error: %', SQLERRM;
      END IF;
  END;
  
  -- Test 4b: Close chat and delete operator (should succeed)
  BEGIN
    UPDATE chats SET status = 'closed', closed_at = NOW() WHERE id = '88888888-8888-8888-8888-888888888888'::UUID;
    
    UPDATE operators 
    SET deleted_at = NOW() 
    WHERE id = '66666666-6666-6666-6666-666666666666'::UUID;
    
    RAISE NOTICE '✓ Test 4b PASSED: Operator deleted after closing chats';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Test 4b FAILED: %', SQLERRM;
  END;
  
  -- Rollback
  UPDATE operators SET deleted_at = NULL, is_available = true WHERE id = '66666666-6666-6666-6666-666666666666'::UUID;
  UPDATE chats SET status = 'active', closed_at = NULL WHERE id = '88888888-8888-8888-8888-888888888888'::UUID;
END $;

-- ============================================================================
-- TEST 5: Auto-Suspend Operators With Low Quality Scores
-- ============================================================================
DO $
DECLARE
  is_suspended BOOLEAN;
  suspension_reason TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 5: Auto-Suspend Low Quality Operators';
  RAISE NOTICE '========================================';
  
  -- Test 5a: Lower quality score below threshold (should auto-suspend)
  BEGIN
    UPDATE operators 
    SET quality_score = 50 
    WHERE id = '77777777-7777-7777-7777-777777777777'::UUID;
    
    -- Check if operator was suspended
    SELECT is_suspended, suspension_reason INTO is_suspended, suspension_reason
    FROM operators
    WHERE id = '77777777-7777-7777-7777-777777777777'::UUID;
    
    IF is_suspended = true THEN
      RAISE NOTICE '✓ Test 5a PASSED: Operator auto-suspended with low quality score';
      RAISE NOTICE '  Reason: %', suspension_reason;
    ELSE
      RAISE NOTICE '✗ Test 5a FAILED: Operator not suspended (is_suspended: %)', is_suspended;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Test 5a FAILED: %', SQLERRM;
  END;
  
  -- Test 5b: Raise quality score above threshold (should auto-reactivate)
  BEGIN
    -- First set suspended_until to past date
    UPDATE operators 
    SET suspended_until = NOW() - INTERVAL '1 day'
    WHERE id = '77777777-7777-7777-7777-777777777777'::UUID;
    
    -- Then raise quality score
    UPDATE operators 
    SET quality_score = 70 
    WHERE id = '77777777-7777-7777-7777-777777777777'::UUID;
    
    -- Check if operator was reactivated
    SELECT is_suspended INTO is_suspended
    FROM operators
    WHERE id = '77777777-7777-7777-7777-777777777777'::UUID;
    
    IF is_suspended = false THEN
      RAISE NOTICE '✓ Test 5b PASSED: Operator auto-reactivated with improved quality score';
    ELSE
      RAISE NOTICE '✗ Test 5b FAILED: Operator still suspended';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Test 5b FAILED: %', SQLERRM;
  END;
  
  -- Rollback
  UPDATE operators SET quality_score = 80, is_suspended = false, suspension_reason = NULL, suspended_until = NULL 
  WHERE id = '77777777-7777-7777-7777-777777777777'::UUID;
END $;

-- ============================================================================
-- TEST 6: Prevent Duplicate Transaction Processing
-- ============================================================================
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 6: Prevent Duplicate Transaction Processing';
  RAISE NOTICE '========================================';
  
  -- Test 6a: Create first transaction (should succeed)
  BEGIN
    INSERT INTO transactions (real_user_id, type, amount, credits_amount, provider_reference, status)
    VALUES ('33333333-3333-3333-3333-333333333333'::UUID, 'purchase', 100.00, 10, 'TEST_REF_001', 'success');
    
    RAISE NOTICE '✓ Test 6a PASSED: First transaction created successfully';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Test 6a FAILED: %', SQLERRM;
  END;
  
  -- Test 6b: Try to create duplicate transaction with same provider_reference (should fail)
  BEGIN
    INSERT INTO transactions (real_user_id, type, amount, credits_amount, provider_reference, status)
    VALUES ('33333333-3333-3333-3333-333333333333'::UUID, 'purchase', 100.00, 10, 'TEST_REF_001', 'success');
    
    RAISE NOTICE '✗ Test 6b FAILED: Duplicate transaction created (should have been prevented)';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%Duplicate transaction detected%' THEN
        RAISE NOTICE '✓ Test 6b PASSED: Duplicate transaction prevented';
      ELSE
        RAISE NOTICE '✗ Test 6b FAILED: Wrong error: %', SQLERRM;
      END IF;
  END;
  
  -- Cleanup
  DELETE FROM transactions WHERE provider_reference = 'TEST_REF_001';
END $;

-- ============================================================================
-- TEST 7: Check and Deduct Message Credits Function
-- ============================================================================
DO $
DECLARE
  result JSONB;
  initial_credits INTEGER;
  final_credits INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 7: Check and Deduct Message Credits';
  RAISE NOTICE '========================================';
  
  -- Get initial credits
  SELECT credits INTO initial_credits FROM real_users WHERE id = '33333333-3333-3333-3333-333333333333'::UUID;
  
  -- Test 7a: Deduct credits with sufficient balance (should succeed)
  BEGIN
    result := check_and_deduct_message_credits(
      '33333333-3333-3333-3333-333333333333'::UUID,
      10,
      '88888888-8888-8888-8888-888888888888'::UUID,
      'Test message'
    );
    
    IF result->>'success' = 'true' THEN
      RAISE NOTICE '✓ Test 7a PASSED: Credits deducted successfully';
      RAISE NOTICE '  Result: %', result;
    ELSE
      RAISE NOTICE '✗ Test 7a FAILED: %', result->>'message';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Test 7a FAILED: %', SQLERRM;
  END;
  
  -- Test 7b: Try to deduct more credits than available (should fail)
  BEGIN
    result := check_and_deduct_message_credits(
      '33333333-3333-3333-3333-333333333333'::UUID,
      1000,
      '88888888-8888-8888-8888-888888888888'::UUID,
      'Test message'
    );
    
    IF result->>'success' = 'false' AND result->>'error' = 'INSUFFICIENT_CREDITS' THEN
      RAISE NOTICE '✓ Test 7b PASSED: Insufficient credits detected';
      RAISE NOTICE '  Result: %', result;
    ELSE
      RAISE NOTICE '✗ Test 7b FAILED: Expected insufficient credits error';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Test 7b FAILED: %', SQLERRM;
  END;
  
  -- Rollback credits
  UPDATE real_users SET credits = initial_credits WHERE id = '33333333-3333-3333-3333-333333333333'::UUID;
END $;

-- ============================================================================
-- TEST 8: Calculate Message Cost Function
-- ============================================================================
DO $
DECLARE
  cost_free INTEGER;
  cost_normal INTEGER;
  cost_featured INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 8: Calculate Message Cost';
  RAISE NOTICE '========================================';
  
  -- Test 8a: First 3 messages are free
  cost_free := calculate_message_cost('88888888-8888-8888-8888-888888888888'::UUID, '44444444-4444-4444-4444-444444444444'::UUID, 1);
  
  IF cost_free = 0 THEN
    RAISE NOTICE '✓ Test 8a PASSED: First message is free (cost: %)', cost_free;
  ELSE
    RAISE NOTICE '✗ Test 8a FAILED: First message cost is % (expected: 0)', cost_free;
  END IF;
  
  -- Test 8b: 4th message costs credits (non-featured)
  cost_normal := calculate_message_cost('88888888-8888-8888-8888-888888888888'::UUID, '44444444-4444-4444-4444-444444444444'::UUID, 4);
  
  IF cost_normal > 0 THEN
    RAISE NOTICE '✓ Test 8b PASSED: 4th message costs credits (cost: %)', cost_normal;
  ELSE
    RAISE NOTICE '✗ Test 8b FAILED: 4th message cost is % (expected: > 0)', cost_normal;
  END IF;
  
  -- Test 8c: Featured profile has higher cost
  cost_featured := calculate_message_cost('88888888-8888-8888-8888-888888888888'::UUID, '55555555-5555-5555-5555-555555555555'::UUID, 4);
  
  IF cost_featured > cost_normal THEN
    RAISE NOTICE '✓ Test 8c PASSED: Featured profile costs more (normal: %, featured: %)', cost_normal, cost_featured;
  ELSE
    RAISE NOTICE '✗ Test 8c FAILED: Featured cost (%) not greater than normal cost (%)', cost_featured, cost_normal;
  END IF;
END $;

-- ============================================================================
-- CLEANUP TEST DATA
-- ============================================================================
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CLEANUP: Removing test data';
  RAISE NOTICE '========================================';
  
  DELETE FROM chats WHERE id = '88888888-8888-8888-8888-888888888888'::UUID;
  DELETE FROM operators WHERE id IN ('66666666-6666-6666-6666-666666666666'::UUID, '77777777-7777-7777-7777-777777777777'::UUID);
  DELETE FROM fictional_users WHERE id IN ('44444444-4444-4444-4444-444444444444'::UUID, '55555555-5555-5555-5555-555555555555'::UUID);
  DELETE FROM real_users WHERE id = '33333333-3333-3333-3333-333333333333'::UUID;
  DELETE FROM admins WHERE id IN ('11111111-1111-1111-1111-111111111111'::UUID, '22222222-2222-2222-2222-222222222222'::UUID);
  
  RAISE NOTICE '✓ Test data cleaned up';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL TESTS COMPLETED';
  RAISE NOTICE '========================================';
END $;
