# Business Logic Functions Documentation

This document describes the database functions created for the Fantooo platform's core business logic.

## Overview

Five key functions have been implemented to handle:
1. Profile filtering and discovery
2. Chat creation with duplicate prevention
3. Dynamic message cost calculation
4. Operator performance tracking
5. Intelligent chat assignment

## Functions

### 1. get_available_fictional_profiles

**Purpose**: Returns fictional profiles available to a user based on their gender preference, excluding profiles they already have active chats with.

**Signature**:
```sql
get_available_fictional_profiles(
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
)
```

**Usage Example**:
```sql
-- Get available female profiles for a user
SELECT * FROM get_available_fictional_profiles(
  'user-uuid-here'::UUID,
  'female'
);

-- Get profiles based on user's preference (auto-detected)
SELECT * FROM get_available_fictional_profiles(
  'user-uuid-here'::UUID
);
```

**Features**:
- Filters by gender preference (male, female, or both)
- Excludes profiles with active chats
- Orders by featured status, popularity, and rating
- Returns flag indicating if user has active chat with profile

**Requirements**: 3.1-3.5 (Fictional Profiles), 24.1-24.5 (Duplicate Chat Prevention)

---

### 2. create_or_get_chat

**Purpose**: Creates a new chat or returns an existing chat between a real user and fictional user, preventing duplicates.

**Signature**:
```sql
create_or_get_chat(
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
)
```

**Usage Example**:
```sql
-- Create or get chat
SELECT * FROM create_or_get_chat(
  'real-user-uuid'::UUID,
  'fictional-user-uuid'::UUID
);
```

**Features**:
- Prevents duplicate chats via UNIQUE constraint
- Returns existing chat if one exists
- Updates user and profile statistics
- Returns flag indicating if chat is new

**Requirements**: 4.1-4.5 (Real-Time Chat), 24.1-24.5 (Duplicate Chat Prevention)

---

### 3. calculate_message_cost

**Purpose**: Calculates the credit cost for a message based on multiple factors including time of day, profile features, and user tier.

**Signature**:
```sql
calculate_message_cost(
  p_chat_id UUID,
  p_user_id UUID,
  p_message_number INTEGER,
  p_time_of_day TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS INTEGER
```

**Usage Example**:
```sql
-- Calculate cost for message #5 at current time
SELECT calculate_message_cost(
  'chat-uuid'::UUID,
  'user-uuid'::UUID,
  5,
  NOW()
);

-- Calculate cost for message during peak hours (9pm EAT)
SELECT calculate_message_cost(
  'chat-uuid'::UUID,
  'user-uuid'::UUID,
  5,
  '2024-11-16 21:00:00+03'::TIMESTAMP WITH TIME ZONE
);
```

**Pricing Rules**:

1. **Free Messages**: First 3 messages = 0 credits
2. **Base Cost**: 1 credit per message (after free messages)
3. **Time Multipliers** (EAT timezone):
   - Peak hours (8pm-2am): 1.2x
   - Off-peak hours (2am-8am): 0.8x
   - Normal hours (8am-8pm): 1.0x
4. **Featured Profile**: 1.5x multiplier
5. **User Tier Discounts**:
   - Platinum: 30% off (0.7x)
   - Gold: 20% off (0.8x)
   - Silver: 10% off (0.9x)
   - Bronze: 5% off (0.95x)
   - Free: No discount (1.0x)

**Examples**:
```
Message #1-3: 0 credits (free)
Message #4, normal hours, not featured, free tier: 1 credit
Message #4, peak hours, not featured, free tier: 2 credits (1 * 1.2 = 1.2, rounded up)
Message #4, normal hours, featured, free tier: 2 credits (1 * 1.5 = 1.5, rounded up)
Message #4, peak hours, featured, gold tier: 2 credits (1 * 1.2 * 1.5 * 0.8 = 1.44, rounded up)
```

**Requirements**: 6.1-6.5 (Message Cost Calculation)

---

### 4. update_operator_stats

**Purpose**: Updates operator performance statistics including response time, user ratings, and quality score.

**Signature**:
```sql
update_operator_stats(
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
)
```

**Usage Example**:
```sql
-- Update stats for today
SELECT * FROM update_operator_stats('operator-uuid'::UUID);

-- Update stats for specific date
SELECT * FROM update_operator_stats(
  'operator-uuid'::UUID,
  '2024-11-15'::DATE
);
```

**Quality Score Calculation**:
- Base score: 100 points
- Penalties:
  - Slow response time (>5 min avg): -10 points
  - Low user rating (<3.0): -20 points
  - Low user rating (<4.0): -10 points
  - Each idle incident: -5 points
  - Each reassignment: -3 points
- Final score: 0-100 range

**Auto-Suspension**: Operators with quality score below 60 are automatically suspended.

**Requirements**: 12.1-12.5 (Operator Performance Monitoring)

---

### 5. assign_chat_to_operator

**Purpose**: Assigns a chat from the queue to the best available operator using a skill matching algorithm.

**Signature**:
```sql
assign_chat_to_operator(
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
)
```

**Usage Example**:
```sql
-- Assign chat to best available operator
SELECT * FROM assign_chat_to_operator('chat-uuid'::UUID);
```

**Match Score Algorithm**:
- Base score: 50 points
- Specialization match:
  - All required specializations: +30 points
  - Some required specializations: +15 points
  - No match: 0 points
- Workload score:
  - 0 active chats: +20 points
  - 1-2 active chats: +15 points
  - 3-4 active chats: +10 points
  - 5+ active chats: +5 points
- Quality score bonus:
  - 90+: +10 points
  - 80-89: +7 points
  - 70-79: +5 points
  - <70: 0 points
- Preferred operator: +20 points

**Assignment Rules**:
1. Only assigns to active, available, non-suspended operators
2. Respects max concurrent chat limits
3. Excludes operators who previously handled the chat
4. After 3 failed attempts, escalates chat to admin
5. Creates admin notification on escalation

**Requirements**: 8.1-8.5 (Operator Assignment), 9.1-9.5 (Chat Reassignment)

---

## Testing

A comprehensive test file is provided: `20241116000008_test_business_logic_functions.sql`

To run tests:
```sql
-- Run the test file in your Supabase SQL editor or via CLI
\i supabase/migrations/20241116000008_test_business_logic_functions.sql
```

The test file will:
1. Create temporary test data
2. Execute each function with various scenarios
3. Validate results
4. Clean up test data
5. Display test results with ✓ or ⚠ indicators

---

## Permissions

**Authenticated Users** can execute:
- `get_available_fictional_profiles`
- `create_or_get_chat`
- `calculate_message_cost`

**Service Role** can execute:
- `update_operator_stats`
- `assign_chat_to_operator`

All functions use `SECURITY DEFINER` to run with elevated privileges while maintaining security through RLS policies.

---

## Performance Considerations

### Indexes Created
- `idx_fictional_users_gender_active`: Speeds up profile filtering
- `idx_chats_user_pair`: Speeds up duplicate chat detection
- `idx_operators_availability_workload`: Speeds up operator selection
- `idx_operators_specializations_gin`: Speeds up specialization matching

### Optimization Tips
1. **Profile Discovery**: Results are ordered by featured status and popularity for optimal user experience
2. **Chat Creation**: Uses UNIQUE constraint for atomic duplicate prevention
3. **Cost Calculation**: All calculations are done in a single function call to minimize round trips
4. **Operator Stats**: Excludes outliers (>1 hour response time) for accurate averages
5. **Chat Assignment**: Uses efficient GIN index for array matching on specializations

---

## Integration Examples

### Frontend Usage (via Supabase Client)

```typescript
// Get available profiles
const { data: profiles } = await supabase
  .rpc('get_available_fictional_profiles', {
    p_user_id: userId,
    p_gender_preference: 'female'
  });

// Create or get chat
const { data: chat } = await supabase
  .rpc('create_or_get_chat', {
    p_real_user_id: userId,
    p_fictional_user_id: profileId
  });

// Calculate message cost
const { data: cost } = await supabase
  .rpc('calculate_message_cost', {
    p_chat_id: chatId,
    p_user_id: userId,
    p_message_number: messageNumber,
    p_time_of_day: new Date().toISOString()
  });
```

### Backend Usage (Edge Functions)

```typescript
// Update operator stats (scheduled job)
const { data: stats } = await supabaseAdmin
  .rpc('update_operator_stats', {
    p_operator_id: operatorId,
    p_date: new Date().toISOString().split('T')[0]
  });

// Assign chat to operator
const { data: assignment } = await supabaseAdmin
  .rpc('assign_chat_to_operator', {
    p_chat_id: chatId
  });
```

---

## Troubleshooting

### Common Issues

1. **Function not found**
   - Ensure migration 20241116000007 has been applied
   - Check function permissions with `\df` in psql

2. **Permission denied**
   - Verify user has correct role (authenticated vs service_role)
   - Check RLS policies on related tables

3. **Incorrect cost calculation**
   - Verify timezone is set correctly (Africa/Nairobi for EAT)
   - Check featured status and user tier in database

4. **No operator assigned**
   - Verify operators exist with `is_available = true`
   - Check operator workload limits
   - Review excluded_operator_ids in queue

---

## Maintenance

### Scheduled Jobs

These functions should be called by scheduled jobs:

1. **update_operator_stats**: Run daily at midnight
   ```sql
   -- Update all active operators
   SELECT update_operator_stats(id, CURRENT_DATE)
   FROM operators
   WHERE is_active = true;
   ```

2. **assign_chat_to_operator**: Run every 30 seconds for pending chats
   ```sql
   -- Process all chats in queue
   SELECT assign_chat_to_operator(chat_id)
   FROM chat_queue
   ORDER BY priority_score DESC;
   ```

---

## Version History

- **v1.0** (2024-11-16): Initial implementation
  - Created all 5 core business logic functions
  - Added comprehensive testing
  - Documented usage and integration

---

## Related Documentation

- [Requirements Document](../../.kiro/specs/fantooo-platform/requirements.md)
- [Design Document](../../.kiro/specs/fantooo-platform/design.md)
- [Tasks Document](../../.kiro/specs/fantooo-platform/tasks.md)
- [RLS Policies](./README_RLS_POLICIES.md)
- [Database Triggers](./README_TRIGGERS.md)
