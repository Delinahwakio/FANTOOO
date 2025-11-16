-- Migration: Create chat and messaging tables with partitioning
-- Requirements: 4.1-4.5 (Real-Time Chat), 8.1-8.5 (Operator Assignment), 9.1-9.5 (Chat Reassignment)

-- ============================================================================
-- CHATS TABLE
-- ============================================================================
-- Stores conversation sessions between real users and fictional profiles
-- Requirements: 4.1-4.5 (Real-Time Chat), 8.1-8.5 (Operator Assignment), 9.1-9.5 (Chat Reassignment)

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_user_id UUID NOT NULL REFERENCES real_users(id) ON DELETE CASCADE,
  fictional_user_id UUID NOT NULL REFERENCES fictional_users(id) ON DELETE CASCADE,
  assigned_operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
  assignment_time TIMESTAMP WITH TIME ZONE,
  last_operator_activity TIMESTAMP WITH TIME ZONE,
  assignment_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'idle', 'closed', 'archived', 'escalated')),
  close_reason TEXT,
  message_count INTEGER DEFAULT 0,
  free_messages_used INTEGER DEFAULT 0,
  paid_messages_count INTEGER DEFAULT 0,
  total_credits_spent INTEGER DEFAULT 0,
  user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating BETWEEN 1 AND 5),
  operator_notes TEXT,
  admin_notes TEXT,
  flags TEXT[],
  first_message_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_user_message_at TIMESTAMP WITH TIME ZONE,
  last_fictional_message_at TIMESTAMP WITH TIME ZONE,
  average_response_time INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  -- Prevent duplicate chats between same real user and fictional user
  CONSTRAINT unique_chat_pair UNIQUE(real_user_id, fictional_user_id)
);

-- Indexes for chats table
CREATE INDEX idx_chats_real_user ON chats(real_user_id);
CREATE INDEX idx_chats_fictional_user ON chats(fictional_user_id);
CREATE INDEX idx_chats_operator ON chats(assigned_operator_id);
CREATE INDEX idx_chats_status ON chats(status);
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC);
CREATE INDEX idx_chats_assignment ON chats(assigned_operator_id, status) WHERE status = 'active';
CREATE INDEX idx_chats_active ON chats(status, last_message_at DESC) WHERE status = 'active';
CREATE INDEX idx_chats_escalated ON chats(status) WHERE status = 'escalated';
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MESSAGES TABLE (PARTITIONED BY MONTH)
-- ============================================================================
-- Stores all chat messages with monthly partitioning for performance
-- Requirements: 4.1-4.5 (Real-Time Chat), 29.1-29.5 (Database Partitioning)

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('real', 'fictional')),
  content TEXT NOT NULL,
  original_content TEXT,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'voice', 'video', 'gif')),
  media_url TEXT,
  handled_by_operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
  is_free_message BOOLEAN DEFAULT false,
  credits_charged INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  edited_by UUID,
  edited_at TIMESTAMP WITH TIME ZONE,
  edit_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  sentiment_score DECIMAL(3, 2),
  toxicity_score DECIMAL(3, 2),
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Indexes for messages table (will be created on each partition)
CREATE INDEX idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_operator ON messages(handled_by_operator_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_type, created_at DESC);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_flagged ON messages(is_flagged) WHERE is_flagged = true;

-- ============================================================================
-- CREATE INITIAL MONTHLY PARTITIONS FOR MESSAGES TABLE
-- ============================================================================
-- Create partitions for current month and next 11 months

-- Function to create a monthly partition
CREATE OR REPLACE FUNCTION create_monthly_partition(
  partition_date DATE
) RETURNS void AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Generate partition name (e.g., messages_2024_11)
  partition_name := 'messages_' || to_char(partition_date, 'YYYY_MM');
  
  -- Calculate partition boundaries
  start_date := date_trunc('month', partition_date)::DATE;
  end_date := (date_trunc('month', partition_date) + INTERVAL '1 month')::DATE;
  
  -- Create partition if it doesn't exist
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF messages
     FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    start_date,
    end_date
  );
  
  RAISE NOTICE 'Created partition % for range % to %', partition_name, start_date, end_date;
END;
$$ LANGUAGE plpgsql;

-- Create partitions for current month and next 11 months (12 months total)
DO $$
DECLARE
  i INTEGER;
  partition_date DATE;
BEGIN
  FOR i IN 0..11 LOOP
    partition_date := (CURRENT_DATE + (i || ' months')::INTERVAL)::DATE;
    PERFORM create_monthly_partition(partition_date);
  END LOOP;
END $$;

-- ============================================================================
-- CHAT QUEUE TABLE
-- ============================================================================
-- Manages priority-based queue for assigning chats to operators
-- Requirements: 8.1-8.5 (Operator Assignment), 9.1-9.5 (Chat Reassignment)

CREATE TABLE IF NOT EXISTS chat_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  priority TEXT NOT NULL CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  priority_score INTEGER NOT NULL,
  user_tier TEXT NOT NULL,
  user_lifetime_value DECIMAL(10, 2),
  wait_time INTERVAL,
  required_specializations TEXT[],
  preferred_operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
  excluded_operator_ids UUID[],
  entered_queue_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure each chat appears only once in queue
  CONSTRAINT unique_chat_in_queue UNIQUE(chat_id)
);

-- Indexes for chat_queue table
CREATE INDEX idx_queue_priority ON chat_queue(priority_score DESC, entered_queue_at ASC);
CREATE INDEX idx_queue_chat ON chat_queue(chat_id);
CREATE INDEX idx_queue_priority_text ON chat_queue(priority);
CREATE INDEX idx_queue_user_tier ON chat_queue(user_tier);
CREATE INDEX idx_queue_attempts ON chat_queue(attempts);
CREATE INDEX idx_queue_specializations ON chat_queue USING GIN(required_specializations);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically create next month's partition
CREATE OR REPLACE FUNCTION auto_create_next_month_partition()
RETURNS void AS $$
DECLARE
  next_month DATE;
BEGIN
  next_month := (date_trunc('month', CURRENT_DATE) + INTERVAL '12 months')::DATE;
  PERFORM create_monthly_partition(next_month);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate priority score for chat queue
CREATE OR REPLACE FUNCTION calculate_priority_score(
  p_user_tier TEXT,
  p_wait_time INTERVAL,
  p_user_lifetime_value DECIMAL
) RETURNS INTEGER AS $$
DECLARE
  tier_score INTEGER := 0;
  wait_score INTEGER := 0;
  value_score INTEGER := 0;
  total_score INTEGER;
BEGIN
  -- Tier scoring (0-40 points)
  tier_score := CASE p_user_tier
    WHEN 'platinum' THEN 40
    WHEN 'gold' THEN 30
    WHEN 'silver' THEN 20
    WHEN 'bronze' THEN 10
    ELSE 0
  END;
  
  -- Wait time scoring (0-40 points, 1 point per minute, max 40)
  wait_score := LEAST(EXTRACT(EPOCH FROM p_wait_time)::INTEGER / 60, 40);
  
  -- Lifetime value scoring (0-20 points)
  value_score := CASE
    WHEN p_user_lifetime_value >= 10000 THEN 20
    WHEN p_user_lifetime_value >= 5000 THEN 15
    WHEN p_user_lifetime_value >= 1000 THEN 10
    WHEN p_user_lifetime_value >= 500 THEN 5
    ELSE 0
  END;
  
  total_score := tier_score + wait_score + value_score;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE chats IS 'Conversation sessions between real users and fictional profiles';
COMMENT ON TABLE messages IS 'Chat messages partitioned by month for performance';
COMMENT ON TABLE chat_queue IS 'Priority-based queue for assigning chats to operators';

COMMENT ON COLUMN chats.assignment_count IS 'Number of times chat has been reassigned (max 3 before escalation)';
COMMENT ON COLUMN chats.status IS 'Chat status: active, idle, closed, archived, escalated';
COMMENT ON COLUMN chats.free_messages_used IS 'Count of free messages used (first 3 messages are free)';
COMMENT ON COLUMN messages.is_free_message IS 'Whether this message was sent for free (first 3 messages)';
COMMENT ON COLUMN messages.credits_charged IS 'Credits deducted for this message';
COMMENT ON COLUMN chat_queue.priority_score IS 'Calculated priority score (0-100) based on tier, wait time, and lifetime value';
COMMENT ON COLUMN chat_queue.excluded_operator_ids IS 'Operators who previously handled this chat (for reassignment)';

COMMENT ON FUNCTION create_monthly_partition IS 'Creates a monthly partition for the messages table';
COMMENT ON FUNCTION calculate_priority_score IS 'Calculates priority score for chat queue based on user tier, wait time, and lifetime value';

