-- Migration: Implement Row Level Security (RLS) Policies
-- Description: Creates comprehensive RLS policies for all tables to enforce data access control
-- Requirements: 30.1-30.5 (Security and RLS Policies)

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE real_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fictional_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $
DECLARE
  user_role TEXT;
BEGIN
  -- Check if user is an admin
  SELECT role INTO user_role
  FROM admins
  WHERE auth_id = auth.uid()
  AND deleted_at IS NULL
  AND is_active = true;
  
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;
  
  -- Check if user is an operator
  IF EXISTS (
    SELECT 1 FROM operators
    WHERE auth_id = auth.uid()
    AND deleted_at IS NULL
    AND is_active = true
  ) THEN
    RETURN 'operator';
  END IF;
  
  -- Check if user is a real user
  IF EXISTS (
    SELECT 1 FROM real_users
    WHERE auth_id = auth.uid()
    AND deleted_at IS NULL
  ) THEN
    RETURN 'real_user';
  END IF;
  
  RETURN NULL;
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE auth_id = auth.uid()
    AND deleted_at IS NULL
    AND is_active = true
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE auth_id = auth.uid()
    AND role = 'super_admin'
    AND deleted_at IS NULL
    AND is_active = true
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is operator
CREATE OR REPLACE FUNCTION is_operator()
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM operators
    WHERE auth_id = auth.uid()
    AND deleted_at IS NULL
    AND is_active = true
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current real user ID
CREATE OR REPLACE FUNCTION get_real_user_id()
RETURNS UUID AS $
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM real_users
  WHERE auth_id = auth.uid()
  AND deleted_at IS NULL;
  
  RETURN user_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current operator ID
CREATE OR REPLACE FUNCTION get_operator_id()
RETURNS UUID AS $
DECLARE
  operator_id UUID;
BEGIN
  SELECT id INTO operator_id
  FROM operators
  WHERE auth_id = auth.uid()
  AND deleted_at IS NULL;
  
  RETURN operator_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current admin ID
CREATE OR REPLACE FUNCTION get_admin_id()
RETURNS UUID AS $
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id
  FROM admins
  WHERE auth_id = auth.uid()
  AND deleted_at IS NULL;
  
  RETURN admin_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- REAL_USERS TABLE RLS POLICIES
-- ============================================================================
-- Requirement 30.1: Real users can only access their own data, admins see all

-- Policy: Real users can view their own profile
CREATE POLICY "real_users_select_own"
  ON real_users
  FOR SELECT
  USING (
    auth_id = auth.uid()
    OR is_admin()
  );

-- Policy: Real users can update their own profile
CREATE POLICY "real_users_update_own"
  ON real_users
  FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Policy: Real users can insert their own profile (during registration)
CREATE POLICY "real_users_insert_own"
  ON real_users
  FOR INSERT
  WITH CHECK (auth_id = auth.uid());

-- Policy: Only admins can delete real users
CREATE POLICY "real_users_delete_admin"
  ON real_users
  FOR DELETE
  USING (is_admin());

-- Policy: Admins can update any real user
CREATE POLICY "real_users_update_admin"
  ON real_users
  FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- FICTIONAL_USERS TABLE RLS POLICIES
-- ============================================================================
-- Requirement 30.2: Public limited view, operators full view, admins manage

-- Policy: Public can view active fictional profiles (limited fields)
CREATE POLICY "fictional_users_select_public"
  ON fictional_users
  FOR SELECT
  USING (
    is_active = true
    AND deleted_at IS NULL
  );

-- Policy: Operators can view all fictional profiles
CREATE POLICY "fictional_users_select_operator"
  ON fictional_users
  FOR SELECT
  USING (is_operator());

-- Policy: Admins can view all fictional profiles
CREATE POLICY "fictional_users_select_admin"
  ON fictional_users
  FOR SELECT
  USING (is_admin());

-- Policy: Only admins can insert fictional profiles
CREATE POLICY "fictional_users_insert_admin"
  ON fictional_users
  FOR INSERT
  WITH CHECK (is_admin());

-- Policy: Only admins can update fictional profiles
CREATE POLICY "fictional_users_update_admin"
  ON fictional_users
  FOR UPDATE
  USING (is_admin());

-- Policy: Only admins can delete fictional profiles
CREATE POLICY "fictional_users_delete_admin"
  ON fictional_users
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- CHATS TABLE RLS POLICIES
-- ============================================================================
-- Requirement 30.3: Users see own, operators see assigned, admins see all

-- Policy: Real users can view their own chats
CREATE POLICY "chats_select_real_user"
  ON chats
  FOR SELECT
  USING (real_user_id = get_real_user_id());

-- Policy: Operators can view chats assigned to them
CREATE POLICY "chats_select_operator"
  ON chats
  FOR SELECT
  USING (assigned_operator_id = get_operator_id());

-- Policy: Admins can view all chats
CREATE POLICY "chats_select_admin"
  ON chats
  FOR SELECT
  USING (is_admin());

-- Policy: Real users can create chats
CREATE POLICY "chats_insert_real_user"
  ON chats
  FOR INSERT
  WITH CHECK (real_user_id = get_real_user_id());

-- Policy: Real users can update their own chats (e.g., close chat, rate)
CREATE POLICY "chats_update_real_user"
  ON chats
  FOR UPDATE
  USING (real_user_id = get_real_user_id())
  WITH CHECK (real_user_id = get_real_user_id());

-- Policy: Operators can update chats assigned to them
CREATE POLICY "chats_update_operator"
  ON chats
  FOR UPDATE
  USING (assigned_operator_id = get_operator_id())
  WITH CHECK (assigned_operator_id = get_operator_id());

-- Policy: Admins can update any chat
CREATE POLICY "chats_update_admin"
  ON chats
  FOR UPDATE
  USING (is_admin());

-- Policy: Admins can delete chats
CREATE POLICY "chats_delete_admin"
  ON chats
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- MESSAGES TABLE RLS POLICIES
-- ============================================================================
-- Requirement 30.4: Users see own chat messages, operators see assigned

-- Policy: Real users can view messages from their chats
CREATE POLICY "messages_select_real_user"
  ON messages
  FOR SELECT
  USING (
    chat_id IN (
      SELECT id FROM chats
      WHERE real_user_id = get_real_user_id()
    )
  );

-- Policy: Operators can view messages from chats assigned to them
CREATE POLICY "messages_select_operator"
  ON messages
  FOR SELECT
  USING (
    chat_id IN (
      SELECT id FROM chats
      WHERE assigned_operator_id = get_operator_id()
    )
  );

-- Policy: Admins can view all messages
CREATE POLICY "messages_select_admin"
  ON messages
  FOR SELECT
  USING (is_admin());

-- Policy: Real users can insert messages in their chats (sender_type = 'real')
CREATE POLICY "messages_insert_real_user"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'real'
    AND chat_id IN (
      SELECT id FROM chats
      WHERE real_user_id = get_real_user_id()
    )
  );

-- Policy: Operators can insert messages in assigned chats (sender_type = 'fictional')
CREATE POLICY "messages_insert_operator"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'fictional'
    AND chat_id IN (
      SELECT id FROM chats
      WHERE assigned_operator_id = get_operator_id()
    )
  );

-- Policy: Operators can update messages in assigned chats
CREATE POLICY "messages_update_operator"
  ON messages
  FOR UPDATE
  USING (
    chat_id IN (
      SELECT id FROM chats
      WHERE assigned_operator_id = get_operator_id()
    )
  );

-- Policy: Admins can update any message (for editing)
CREATE POLICY "messages_update_admin"
  ON messages
  FOR UPDATE
  USING (is_admin());

-- Policy: Admins can delete messages
CREATE POLICY "messages_delete_admin"
  ON messages
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- OPERATORS TABLE RLS POLICIES
-- ============================================================================
-- Requirement 30.5: Operators see own data, admins manage

-- Policy: Operators can view their own profile
CREATE POLICY "operators_select_own"
  ON operators
  FOR SELECT
  USING (auth_id = auth.uid());

-- Policy: Admins can view all operators
CREATE POLICY "operators_select_admin"
  ON operators
  FOR SELECT
  USING (is_admin());

-- Policy: Operators can update their own profile (limited fields)
CREATE POLICY "operators_update_own"
  ON operators
  FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Policy: Admins can insert operators
CREATE POLICY "operators_insert_admin"
  ON operators
  FOR INSERT
  WITH CHECK (is_admin());

-- Policy: Admins can update any operator
CREATE POLICY "operators_update_admin"
  ON operators
  FOR UPDATE
  USING (is_admin());

-- Policy: Admins can delete operators
CREATE POLICY "operators_delete_admin"
  ON operators
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- ADMINS TABLE RLS POLICIES
-- ============================================================================
-- Requirement 30.6: Admins see own data, super_admins manage

-- Policy: Admins can view their own profile
CREATE POLICY "admins_select_own"
  ON admins
  FOR SELECT
  USING (auth_id = auth.uid());

-- Policy: Super admins can view all admins
CREATE POLICY "admins_select_super_admin"
  ON admins
  FOR SELECT
  USING (is_super_admin());

-- Policy: Admins can update their own profile (limited fields)
CREATE POLICY "admins_update_own"
  ON admins
  FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Policy: Only super admins can insert new admins
CREATE POLICY "admins_insert_super_admin"
  ON admins
  FOR INSERT
  WITH CHECK (is_super_admin());

-- Policy: Super admins can update any admin
CREATE POLICY "admins_update_super_admin"
  ON admins
  FOR UPDATE
  USING (is_super_admin());

-- Policy: Super admins can delete admins (with trigger protection for last super admin)
CREATE POLICY "admins_delete_super_admin"
  ON admins
  FOR DELETE
  USING (is_super_admin());

-- ============================================================================
-- TRANSACTIONS TABLE RLS POLICIES
-- ============================================================================
-- Requirement 30.7: Users see own, admins see all

-- Policy: Real users can view their own transactions
CREATE POLICY "transactions_select_real_user"
  ON transactions
  FOR SELECT
  USING (real_user_id = get_real_user_id());

-- Policy: Admins can view all transactions
CREATE POLICY "transactions_select_admin"
  ON transactions
  FOR SELECT
  USING (is_admin());

-- Policy: System can insert transactions (via Edge Functions)
CREATE POLICY "transactions_insert_system"
  ON transactions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can update transactions (for reconciliation)
CREATE POLICY "transactions_update_admin"
  ON transactions
  FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- CREDIT_PACKAGES TABLE RLS POLICIES
-- ============================================================================

-- Policy: Everyone can view active credit packages
CREATE POLICY "credit_packages_select_all"
  ON credit_packages
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can view all credit packages
CREATE POLICY "credit_packages_select_admin"
  ON credit_packages
  FOR SELECT
  USING (is_admin());

-- Policy: Admins can insert credit packages
CREATE POLICY "credit_packages_insert_admin"
  ON credit_packages
  FOR INSERT
  WITH CHECK (is_admin());

-- Policy: Admins can update credit packages
CREATE POLICY "credit_packages_update_admin"
  ON credit_packages
  FOR UPDATE
  USING (is_admin());

-- Policy: Admins can delete credit packages
CREATE POLICY "credit_packages_delete_admin"
  ON credit_packages
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- CREDIT_REFUNDS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Real users can view their own refunds
CREATE POLICY "credit_refunds_select_real_user"
  ON credit_refunds
  FOR SELECT
  USING (user_id = get_real_user_id());

-- Policy: Admins can view all refunds
CREATE POLICY "credit_refunds_select_admin"
  ON credit_refunds
  FOR SELECT
  USING (is_admin());

-- Policy: Admins can insert refunds
CREATE POLICY "credit_refunds_insert_admin"
  ON credit_refunds
  FOR INSERT
  WITH CHECK (is_admin());

-- Policy: Admins can update refunds
CREATE POLICY "credit_refunds_update_admin"
  ON credit_refunds
  FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- MESSAGE_EDIT_HISTORY TABLE RLS POLICIES
-- ============================================================================

-- Policy: Admins can view all edit history
CREATE POLICY "message_edit_history_select_admin"
  ON message_edit_history
  FOR SELECT
  USING (is_admin());

-- Policy: Operators can view edit history for their messages
CREATE POLICY "message_edit_history_select_operator"
  ON message_edit_history
  FOR SELECT
  USING (
    editor_type = 'operator'
    AND edited_by = get_operator_id()
  );

-- Policy: Admins and operators can insert edit history
CREATE POLICY "message_edit_history_insert"
  ON message_edit_history
  FOR INSERT
  WITH CHECK (
    (editor_type = 'admin' AND is_admin())
    OR (editor_type = 'operator' AND is_operator())
  );

-- ============================================================================
-- DELETED_USERS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Only admins can view deleted users
CREATE POLICY "deleted_users_select_admin"
  ON deleted_users
  FOR SELECT
  USING (is_admin());

-- Policy: System can insert deleted users (via Edge Functions)
CREATE POLICY "deleted_users_insert_system"
  ON deleted_users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can update deleted users (for refund processing)
CREATE POLICY "deleted_users_update_admin"
  ON deleted_users
  FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- BANNED_USERS_TRACKING TABLE RLS POLICIES
-- ============================================================================

-- Policy: Only admins can view banned users tracking
CREATE POLICY "banned_users_tracking_select_admin"
  ON banned_users_tracking
  FOR SELECT
  USING (is_admin());

-- Policy: Admins can insert banned users tracking
CREATE POLICY "banned_users_tracking_insert_admin"
  ON banned_users_tracking
  FOR INSERT
  WITH CHECK (is_admin());

-- Policy: Admins can update banned users tracking
CREATE POLICY "banned_users_tracking_update_admin"
  ON banned_users_tracking
  FOR UPDATE
  USING (is_admin());

-- Policy: System can update circumvention attempts
CREATE POLICY "banned_users_tracking_update_system"
  ON banned_users_tracking
  FOR UPDATE
  USING (true);

-- ============================================================================
-- USER_ACTIVITY_LOG TABLE RLS POLICIES
-- ============================================================================

-- Policy: Real users can view their own activity log
CREATE POLICY "user_activity_log_select_real_user"
  ON user_activity_log
  FOR SELECT
  USING (user_id = get_real_user_id());

-- Policy: Admins can view all activity logs
CREATE POLICY "user_activity_log_select_admin"
  ON user_activity_log
  FOR SELECT
  USING (is_admin());

-- Policy: System can insert activity logs
CREATE POLICY "user_activity_log_insert_system"
  ON user_activity_log
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- ADMIN_NOTIFICATIONS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Admins can view all notifications
CREATE POLICY "admin_notifications_select_admin"
  ON admin_notifications
  FOR SELECT
  USING (is_admin());

-- Policy: System can insert notifications
CREATE POLICY "admin_notifications_insert_system"
  ON admin_notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can update notifications (mark as read)
CREATE POLICY "admin_notifications_update_admin"
  ON admin_notifications
  FOR UPDATE
  USING (is_admin());

-- Policy: Admins can delete notifications
CREATE POLICY "admin_notifications_delete_admin"
  ON admin_notifications
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- CHAT_QUEUE TABLE RLS POLICIES
-- ============================================================================

-- Policy: Operators can view the chat queue
CREATE POLICY "chat_queue_select_operator"
  ON chat_queue
  FOR SELECT
  USING (is_operator());

-- Policy: Admins can view the chat queue
CREATE POLICY "chat_queue_select_admin"
  ON chat_queue
  FOR SELECT
  USING (is_admin());

-- Policy: System can insert into chat queue
CREATE POLICY "chat_queue_insert_system"
  ON chat_queue
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can update chat queue
CREATE POLICY "chat_queue_update_system"
  ON chat_queue
  FOR UPDATE
  USING (true);

-- Policy: System can delete from chat queue
CREATE POLICY "chat_queue_delete_system"
  ON chat_queue
  FOR DELETE
  USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the current authenticated user';
COMMENT ON FUNCTION is_admin() IS 'Returns true if current user is an admin';
COMMENT ON FUNCTION is_super_admin() IS 'Returns true if current user is a super admin';
COMMENT ON FUNCTION is_operator() IS 'Returns true if current user is an operator';
COMMENT ON FUNCTION get_real_user_id() IS 'Returns the ID of the current real user';
COMMENT ON FUNCTION get_operator_id() IS 'Returns the ID of the current operator';
COMMENT ON FUNCTION get_admin_id() IS 'Returns the ID of the current admin';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_operator() TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_operator_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_id() TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled on all tables
DO $
DECLARE
  table_name TEXT;
  rls_enabled BOOLEAN;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'real_users', 'fictional_users', 'chats', 'messages', 
      'operators', 'admins', 'transactions', 'credit_packages',
      'credit_refunds', 'message_edit_history', 'deleted_users',
      'banned_users_tracking', 'user_activity_log', 'admin_notifications',
      'chat_queue'
    )
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = table_name;
    
    IF NOT rls_enabled THEN
      RAISE EXCEPTION 'RLS not enabled on table: %', table_name;
    END IF;
    
    RAISE NOTICE 'RLS enabled on table: %', table_name;
  END LOOP;
  
  RAISE NOTICE 'All RLS policies successfully created and enabled!';
END $;
