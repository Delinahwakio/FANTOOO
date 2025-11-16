# Fantooo - Enterprise-Grade Fantasy Chat Platform

## Project Vision
Fantooo is a premium fantasy chat platform engineered for scale, performance, and exceptional user experience. Real users engage with fictional profiles managed by trained operators, creating authentic, engaging conversations that feel natural and exciting.

## CRITICAL: Public-Facing Language
**Landing page and all user-facing content must NEVER mention:**
- ❌ "Operators" or "admin"
- ❌ That profiles are fictional or managed
- ❌ Behind-the-scenes mechanics
- ❌ Any operational details

**Use only:**
- ✅ "Chat with exciting people"
- ✅ "Meet interesting profiles"
- ✅ "Connect with amazing personalities"
- ✅ Focus on user experience and emotional connection

## Core Architecture Principles
- **Scalability First**: Built to handle millions of concurrent users
- **Performance Obsessed**: Sub-100ms response times, optimistic UI updates
- **Security Hardened**: End-to-end encryption, zero-trust architecture
- **Revenue Optimized**: Smart credit system with psychological pricing
- **Operator Efficiency**: AI-assisted responses, smart queue management
- **Data-Driven**: Real-time analytics, A/B testing infrastructure

---

## Advanced Chat System Architecture

### Intelligent Chat Assignment & Queue Management

#### Multi-Tier Queue System
```typescript
// Priority-based queue with skill matching
interface QueueEntry {
  chatId: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  waitTime: number;
  userValue: number; // Lifetime spend
  fictionalProfileId: string;
  requiredSkills?: string[];
  preferredOperatorId?: string;
}
```

**Queue Priority Logic**:
1. **Urgent**: VIP users (>10,000 credits spent), wait time >5min
2. **High**: Premium users (>1,000 credits), wait time >3min
3. **Normal**: Regular users, wait time >1min
4. **Low**: Free-tier users, new conversations

#### Smart Operator Matching Algorithm
```typescript
interface OperatorScore {
  operatorId: string;
  score: number;
  factors: {
    availability: number;      // 0-100
    performance: number;        // Response time, user satisfaction
    specialization: number;     // Match with fictional profile type
    workload: number;          // Current active chats
    userHistory: number;       // Previous interactions with this user
    timezone: number;          // Optimal working hours
  };
}
```

**Matching Criteria**:
- Operator specialization (flirty, romantic, friendly, intellectual)
- Historical performance with similar profiles
- Current workload (max 5 concurrent chats)
- User satisfaction ratings
- Response time averages
- Language proficiency
- Timezone alignment

#### Real-time Activity Monitoring
- **Heartbeat System**: 15-second WebSocket pings
- **Typing Indicators**: Real-time typing status with 3-second timeout
- **Presence Detection**: Tab visibility, mouse movement, keyboard activity
- **Network Quality**: Monitor latency, packet loss, connection stability
- **Auto-recovery**: Seamless reconnection with state preservation

#### Chat Timeout & Abandonment Handling
```typescript
interface ChatTimeoutConfig {
  inactivityThreshold: number; // 24 hours
  warningThreshold: number;    // 23 hours
  autoCloseEnabled: boolean;
  refundUnusedCredits: boolean;
}

// Auto-close logic
async function handleInactiveChats() {
  const inactiveChats = await db.query(`
    SELECT * FROM chats 
    WHERE status = 'active' 
    AND last_message_at < NOW() - INTERVAL '24 hours'
  `);
  
  for (const chat of inactiveChats) {
    // Close chat
    await db.query(`
      UPDATE chats 
      SET status = 'closed', 
          close_reason = 'inactivity_timeout',
          closed_at = NOW()
      WHERE id = $1
    `, [chat.id]);
    
    // No refunds for abandoned chats - credits were used for service availability
  }
}
```

**Abandonment Scenarios:**
1. User starts chat, never sends message after 3 free messages → Auto-close after 24h
2. User sends paid messages, then abandons → No refund (service was provided)
3. Operator sends message, user never responds → Auto-close after 24h
4. Both parties inactive → Auto-close after 24h

#### Intelligent Reassignment System
```typescript
interface ReassignmentRule {
  trigger: 'idle' | 'timeout' | 'quality' | 'manual';
  threshold: number;
  action: 'warn' | 'reassign' | 'escalate';
  cooldown: number;
  maxReassignments: 3; // Prevent infinite loops
}

// Reassignment with loop prevention
async function reassignChat(chatId: string, reason: string) {
  const chat = await db.query('SELECT * FROM chats WHERE id = $1', [chatId]);
  
  // Check reassignment limit
  if (chat.assignment_count >= 3) {
    // Escalate to admin after 3 reassignments
    await db.query(`
      UPDATE chats 
      SET status = 'escalated',
          flags = array_append(flags, 'max_reassignments_reached'),
          admin_notes = 'Chat requires admin attention - multiple reassignment failures'
      WHERE id = $1
    `, [chatId]);
    
    await notifyAdmins({
      type: 'chat_escalation',
      chatId,
      reason: 'Maximum reassignments exceeded'
    });
    
    return;
  }
  
  // Proceed with reassignment
  await db.query(`
    UPDATE chats 
    SET assigned_operator_id = NULL,
        assignment_count = assignment_count + 1,
        status = 'idle'
    WHERE id = $1
  `, [chatId]);
  
  // Add to queue
  await addToQueue(chatId, 'high'); // Higher priority for reassigned chats
}
```

**Reassignment Triggers**:
1. **Idle Detection**: No activity for 3 minutes → Warning at 2:30
2. **Quality Issues**: User dissatisfaction signals (rapid messages, keywords)
3. **Operator Request**: Voluntary handoff with context transfer
4. **Performance**: Slow response times (>2min average)
5. **Workload Balancing**: Redistribute during peak hours
6. **Max Limit**: After 3 reassignments → Escalate to admin

**Context Preservation**:
- Full chat history transfer
- Operator notes handoff
- User preferences and flags
- Conversation tone analysis
- Pre-written response templates

#### Admin Chat Interface Features

**Three-Panel Layout**:
- **Left Panel - Real User Profile**:
  ```
  ┌─────────────────────┐
  │ [Profile Picture]   │
  │ Name: John Doe      │
  │ Age: 25             │
  │ Location: Nairobi   │
  │ Gender: Male        │
  │ Looking for: Female │
  │                     │
  │ Real Profile Notes: │
  │ ┌─────────────────┐ │
  │ │ [Editable Area] │ │
  │ │                 │ │
  │ └─────────────────┘ │
  │ [Save Notes] [Clear]│
  └─────────────────────┘
  ```

- **Center Panel - Chat History**:
  ```
  ┌─────────────────────────────┐
  │ Chat Timeline               │
  │ ┌─────────────────────────┐ │
  │ │ User: Hello there       │ │
  │ │ [FREE] [12:30 PM]      │ │
  │ └─────────────────────────┘ │
  │ ┌─────────────────────────┐ │
  │ │ Fictional: Hi! How are  │ │
  │ │ you? [Op: Sarah]        │ │
  │ │ [12:32 PM] [EDIT] [DEL] │ │
  │ └─────────────────────────┘ │
  │                             │
  │ Assignment Info:            │
  │ Current: Sarah (3 min ago)  │
  │ Previous: Mike (timeout)    │
  │                             │
  │ [Message Input]             │
  │ [Send as Admin]             │
  └─────────────────────────────┘
  ```

- **Right Panel - Fictional Profile**:
  ```
  ┌─────────────────────┐
  │ [Profile Pictures]  │
  │ Name: Emma Stone    │
  │ Age: 23             │
  │ Location: Kisumu    │
  │ Gender: Female      │
  │                     │
  │ Fictional Notes:    │
  │ ┌─────────────────┐ │
  │ │ Personality:    │ │
  │ │ Flirty, fun     │ │
  │ │ Interests: Art  │ │
  │ └─────────────────┘ │
  │                     │
  │ Admin Controls:     │
  │ [Reassign Chat]     │
  │ [Force Close]       │
  │ [Block User]        │
  └─────────────────────┘
  ```

### Chat Inspection Dashboard

#### Real-time Monitoring Features
- **Live Chat Grid**: 
  - Shows all active chats in real-time
  - Color-coded status (active, idle, timeout warning)
  - Operator response times
  - Message frequency indicators

- **Idle Alerts System**:
  - Visual alerts for chats approaching timeout
  - Sound notifications for critical timeouts
  - Automatic reassignment confirmations

- **Operator Performance Tracking**:
  - Response time averages
  - Messages per hour
  - Idle incidents count
  - Reassignment frequency

#### Queue Management Interface
```
┌─────────────────────────────────────────┐
│ LIVE CHAT MONITOR                       │
├─────────────────────────────────────────┤
│ Queue: 12 chats waiting                 │
│ Active: 8 operators online              │
│                                         │
│ ┌─────┬─────────┬──────────┬──────────┐ │
│ │Chat │Operator │Status    │Timer     │ │
│ ├─────┼─────────┼──────────┼──────────┤ │
│ │#001 │Sarah    │🟢 Active │2m 15s   │ │
│ │#002 │Mike     │🟡 Warning│4m 45s   │ │
│ │#003 │Lisa     │🔴 Idle   │6m 12s   │ │
│ │#004 │Queue    │⏳ Waiting│-        │ │
│ └─────┴─────────┴──────────┴──────────┘ │
│                                         │
│ Auto Actions:                           │
│ ☑ Reassign after 5min idle             │
│ ☑ Alert at 4min mark                   │
│ ☑ Max 3 reassignments per chat         │
│                                         │
│ [Force Reassign] [Bulk Actions]         │
└─────────────────────────────────────────┘
```

### Advanced Credit & Monetization System

#### Dynamic Pricing Strategy
```typescript
interface CreditPricing {
  basePrice: number;
  tierMultipliers: {
    free: 1.0;      // Full price
    bronze: 0.95;   // 5% discount
    silver: 0.90;   // 10% discount
    gold: 0.85;     // 15% discount
    platinum: 0.80; // 20% discount
  };
  timeBasedPricing: {
    peakHours: 1.2;    // 20% premium (8pm-12am EAT/UTC+3)
    offPeak: 0.8;      // 20% discount (2am-8am EAT/UTC+3)
  };
  demandBasedPricing: boolean; // Surge pricing for popular profiles
  timezone: 'Africa/Nairobi'; // EAT (UTC+3) - standardized for Kenya market
}
```

#### Psychological Pricing Packages
```typescript
const creditPackages = [
  {
    credits: 10,
    price: 100, // 10 KES per credit
    badge: null,
    description: 'Starter Pack'
  },
  {
    credits: 50,
    price: 400, // 8 KES per credit (20% savings)
    badge: 'POPULAR',
    description: 'Most Popular',
    savings: '20%'
  },
  {
    credits: 100,
    price: 700, // 7 KES per credit (30% savings)
    badge: 'BEST VALUE',
    description: 'Best Value',
    savings: '30%',
    bonus: 10 // Extra 10 credits free
  },
  {
    credits: 500,
    price: 3000, // 6 KES per credit (40% savings)
    badge: 'VIP',
    description: 'Ultimate Pack',
    savings: '40%',
    bonus: 100 // Extra 100 credits free
  }
];
```

#### Smart Credit System
```typescript
interface MessageCostCalculator {
  calculateCost(context: {
    chat: Chat;
    user: RealUser;
    fictional: FictionalUser;
    messageNumber: number;
    timeOfDay: Date;
  }): number;
}

// Implementation with timezone handling
async function calculateMessageCost(context): Promise<number> {
  // Free messages (first 3 per chat)
  if (context.messageNumber <= 3) {
    return 0;
  }
  
  // Base cost
  let cost = 1;
  
  // Premium profile multiplier
  if (context.fictional.is_featured) {
    cost *= 1.5;
  }
  
  // Time-based pricing (using EAT/UTC+3 - Kenya timezone)
  const eatTime = new Date(context.timeOfDay.toLocaleString('en-US', { 
    timeZone: 'Africa/Nairobi' 
  }));
  const hour = eatTime.getHours();
  
  if (hour >= 20 || hour <= 2) { // Peak hours (8pm-2am EAT)
    cost *= 1.2;
  } else if (hour >= 2 && hour <= 8) { // Off-peak (2am-8am EAT)
    cost *= 0.8;
  }
  
  // User tier discount
  const tierDiscount = getTierDiscount(context.user.user_tier);
  cost *= tierDiscount;
  
  // Loyalty bonus (every 100 messages)
  if (context.user.total_messages_sent % 100 === 0) {
    cost = 0; // Free message as reward
  }
  
  return Math.ceil(cost);
}
```

#### Credit Deduction with Rollback & Race Condition Prevention
```typescript
async function sendMessageWithTransaction(
  chatId: string,
  content: string,
  userId: string
): Promise<Message> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // CRITICAL: Lock user row to prevent concurrent message race conditions
    // This prevents user with 5 credits from sending 10 messages simultaneously
    const userResult = await client.query(
      'SELECT * FROM real_users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    const user = userResult.rows[0];
    
    // Calculate cost
    const cost = await calculateMessageCost({...});
    
    // Check sufficient credits (enforced at DB level with CHECK constraint too)
    if (user.credits < cost) {
      throw new InsufficientCreditsError(
        `Need ${cost} credits, have ${user.credits}`
      );
    }
    
    // Deduct credits (DB constraint prevents negative: CHECK (credits >= 0))
    await client.query(
      'UPDATE real_users SET credits = credits - $1, updated_at = NOW() WHERE id = $2',
      [cost, userId]
    );
    
    // Create message
    const message = await client.query(
      'INSERT INTO messages (chat_id, content, sender_type, credits_charged) VALUES ($1, $2, $3, $4) RETURNING *',
      [chatId, content, 'real', cost]
    );
    
    // Update chat metrics
    await client.query(
      'UPDATE chats SET message_count = message_count + 1, paid_messages_count = paid_messages_count + 1, last_message_at = NOW() WHERE id = $1',
      [chatId]
    );
    
    await client.query('COMMIT');
    
    // Trigger real-time notification
    await notifyOperator(chatId, message);
    
    return message.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Log failed transaction for reconciliation
    await logFailedTransaction({
      userId,
      chatId,
      error: error.message,
      timestamp: new Date()
    });
    
    throw error;
  } finally {
    client.release();
  }
}
```

#### Credit Refund System
```typescript
interface RefundRequest {
  userId: string;
  amount: number;
  reason: 'accidental_send' | 'inappropriate_content' | 'system_error' | 'admin_discretion';
  messageId?: string;
  adminId: string;
  notes: string;
}

async function processRefund(request: RefundRequest): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Add credits back
    await client.query(
      'UPDATE real_users SET credits = credits + $1 WHERE id = $2',
      [request.amount, request.userId]
    );
    
    // Create audit trail
    await client.query(`
      INSERT INTO credit_refunds 
      (user_id, amount, reason, message_id, processed_by, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      request.userId,
      request.amount,
      request.reason,
      request.messageId,
      request.adminId,
      request.notes
    ]);
    
    await client.query('COMMIT');
    
    // Notify user
    await notifyUser(request.userId, {
      type: 'credit_refund',
      amount: request.amount,
      reason: request.reason
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

#### Gamification & Retention
```typescript
interface LoyaltyProgram {
  tiers: {
    free: { minSpend: 0, benefits: [] };
    bronze: { 
      minSpend: 1000, 
      benefits: ['5% discount', 'Priority support'] 
    };
    silver: { 
      minSpend: 5000, 
      benefits: ['10% discount', 'Exclusive profiles', 'No ads'] 
    };
    gold: { 
      minSpend: 20000, 
      benefits: ['15% discount', 'VIP badge', 'Early access'] 
    };
    platinum: { 
      minSpend: 100000, 
      benefits: ['20% discount', 'Dedicated operator', 'Custom profiles'] 
    };
  };
  
  dailyRewards: {
    day1: 1,
    day3: 3,
    day7: 10,
    day30: 50
  };
  
  achievements: [
    { id: 'first_chat', reward: 5, description: 'Start your first chat' },
    { id: 'social_butterfly', reward: 20, description: 'Chat with 10 profiles' },
    { id: 'night_owl', reward: 10, description: 'Send 100 messages after 10pm' },
    { id: 'big_spender', reward: 100, description: 'Purchase 500+ credits' }
  ];
}
```

#### Revenue Optimization
```typescript
// A/B Testing for pricing
interface PricingExperiment {
  variantA: { price: 100, credits: 10 }; // Control
  variantB: { price: 90, credits: 10 };  // 10% discount
  variantC: { price: 100, credits: 12 }; // 20% more credits
  
  metrics: {
    conversionRate: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
  };
}

// Smart upselling
async function suggestCreditPackage(user: RealUser): Promise<CreditPackage> {
  const usage = await analyzeUsagePattern(user.id);
  
  if (usage.messagesPerDay > 50) {
    return packages.find(p => p.credits === 500); // Heavy user
  } else if (usage.messagesPerDay > 20) {
    return packages.find(p => p.credits === 100); // Regular user
  } else {
    return packages.find(p => p.credits === 50); // Casual user
  }
}
```

### Admin Advanced Features

#### Message Editing Capabilities
- **Inline Editing**: Click any message to edit content
- **Edit History**: Track all message modifications
- **Operator Identification**: Show which operator sent each message
- **Bulk Operations**: Edit multiple messages, delete conversations

#### Chat Analytics & Insights
- **Conversation Quality Metrics**: Message length, response time, engagement
- **User Satisfaction Indicators**: Chat duration, return rates
- **Operator Performance Analytics**: Success rates, user ratings
- **Revenue Tracking**: Credits spent per chat, conversion rates

---

## Premium Design System - "Passion & Elegance"

### Color Philosophy
A sophisticated palette that evokes passion, trust, and premium quality. Moving away from dark mode to a vibrant, energetic light theme with strategic dark accents.

### Primary Palette
```css
/* Passion Gradient - Primary Brand */
--passion-primary: #E91E63;      /* Deep Pink - Main CTA */
--passion-secondary: #FF6B9D;    /* Soft Pink - Hover states */
--passion-dark: #C2185B;         /* Dark Pink - Active states */
--passion-light: #FCE4EC;        /* Blush - Backgrounds */

/* Luxury Accent */
--luxury-gold: #FFD700;          /* Gold - Premium features */
--luxury-purple: #9C27B0;        /* Purple - VIP indicators */
--luxury-gradient: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%);

/* Trust & Stability */
--trust-blue: #2196F3;           /* Blue - Info, links */
--trust-teal: #00BCD4;           /* Teal - Success states */
--trust-navy: #1A237E;           /* Navy - Headers, text */

/* Neutral Foundation */
--neutral-white: #FFFFFF;        /* Pure white - Cards, surfaces */
--neutral-light: #F8F9FA;        /* Off-white - Page background */
--neutral-gray: #E0E0E0;         /* Light gray - Borders */
--neutral-text: #212121;         /* Almost black - Primary text */
--neutral-muted: #757575;        /* Gray - Secondary text */

/* Semantic Colors */
--success: #4CAF50;              /* Green - Success */
--warning: #FF9800;              /* Orange - Warnings */
--error: #F44336;                /* Red - Errors */
--info: #2196F3;                 /* Blue - Information */
```

### Typography System
```css
/* Font Stack */
--font-display: 'Playfair Display', Georgia, serif;  /* Headlines */
--font-body: 'Inter', -apple-system, sans-serif;     /* Body text */
--font-mono: 'JetBrains Mono', monospace;            /* Code, stats */

/* Type Scale (Perfect Fourth - 1.333) */
--text-xs: 0.75rem;      /* 12px - Captions */
--text-sm: 0.875rem;     /* 14px - Small text */
--text-base: 1rem;       /* 16px - Body */
--text-lg: 1.125rem;     /* 18px - Large body */
--text-xl: 1.333rem;     /* 21px - H4 */
--text-2xl: 1.777rem;    /* 28px - H3 */
--text-3xl: 2.369rem;    /* 38px - H2 */
--text-4xl: 3.157rem;    /* 51px - H1 */
--text-5xl: 4.209rem;    /* 67px - Display */

/* Font Weights */
--weight-light: 300;
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
--weight-black: 900;
```

### Spacing & Layout System
```css
/* 8px base unit for consistency */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.5rem;    /* 24px */
--space-6: 2rem;      /* 32px */
--space-8: 3rem;      /* 48px */
--space-10: 4rem;     /* 64px */
--space-12: 6rem;     /* 96px */
--space-16: 8rem;     /* 128px */

/* Border Radius */
--radius-sm: 4px;     /* Buttons, inputs */
--radius-md: 8px;     /* Cards */
--radius-lg: 16px;    /* Modals */
--radius-xl: 24px;    /* Hero sections */
--radius-full: 9999px; /* Pills, avatars */

/* Shadows - Layered depth */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.04);
--shadow-passion: 0 10px 30px rgba(233,30,99,0.3);
--shadow-luxury: 0 10px 30px rgba(156,39,176,0.3);
```

### Component Patterns
```css
/* Premium Card */
.premium-card {
  background: var(--neutral-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--neutral-gray);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--passion-secondary);
}

/* Gradient Button */
.btn-passion {
  background: var(--luxury-gradient);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-sm);
  font-weight: var(--weight-semibold);
  box-shadow: var(--shadow-passion);
  transition: all 0.3s ease;
}

.btn-passion:hover {
  transform: scale(1.05);
  box-shadow: 0 15px 40px rgba(233,30,99,0.4);
}

/* Floating Input */
.input-floating {
  background: var(--neutral-white);
  border: 2px solid var(--neutral-gray);
  border-radius: var(--radius-sm);
  padding: var(--space-4);
  transition: all 0.3s ease;
}

.input-floating:focus {
  border-color: var(--passion-primary);
  box-shadow: 0 0 0 4px rgba(233,30,99,0.1);
  outline: none;
}

/* Profile Card with Gradient Overlay */
.profile-card {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  aspect-ratio: 3/4;
}

.profile-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}

/* Status Indicators */
.status-online {
  width: 12px;
  height: 12px;
  background: var(--success);
  border: 2px solid white;
  border-radius: var(--radius-full);
  box-shadow: 0 0 10px var(--success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Micro-interactions & Animations
```css
/* Smooth transitions everywhere */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading skeleton */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--neutral-gray) 0%,
    var(--neutral-light) 50%,
    var(--neutral-gray) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

/* Notification badge */
.badge-notification {
  background: var(--error);
  color: white;
  border-radius: var(--radius-full);
  padding: 2px 6px;
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
```

---

## Enterprise Database Architecture

### Database Design Principles
- **Normalized for integrity, denormalized for performance**
- **Partitioning strategy for messages (by month)**
- **Read replicas for analytics queries**
- **Materialized views for real-time dashboards**
- **Comprehensive indexing strategy**
- **Audit trails for compliance**

### Core Tables

#### 1. **real_users** - User Profiles
```sql
CREATE TABLE real_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL, -- username@fantooo.com
  
  -- Profile
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  looking_for TEXT NOT NULL CHECK (looking_for IN ('male', 'female', 'both')),
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bio TEXT,
  profile_picture TEXT,
  profile_pictures TEXT[], -- Multiple photos
  
  -- Gamification
  credits INTEGER DEFAULT 0 CHECK (credits >= 0),
  total_spent DECIMAL(10, 2) DEFAULT 0,
  user_tier TEXT DEFAULT 'free' CHECK (user_tier IN ('free', 'bronze', 'silver', 'gold', 'platinum')),
  loyalty_points INTEGER DEFAULT 0,
  
  -- Engagement metrics
  total_messages_sent INTEGER DEFAULT 0,
  total_chats INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  last_active_at TIMESTAMP DEFAULT NOW(),
  
  -- Security & compliance
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  banned_until TIMESTAMP,
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}',
  privacy_settings JSONB DEFAULT '{"show_online": true, "show_location": true}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_real_users_auth_id ON real_users(auth_id);
CREATE INDEX idx_real_users_username ON real_users(username);
CREATE INDEX idx_real_users_location ON real_users(location);
CREATE INDEX idx_real_users_tier ON real_users(user_tier);
CREATE INDEX idx_real_users_last_active ON real_users(last_active_at DESC);
CREATE INDEX idx_real_users_credits ON real_users(credits DESC);
```

#### 2. **fictional_users** - Operator-Managed Profiles
```sql
CREATE TABLE fictional_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  location TEXT NOT NULL,
  
  -- Rich profile
  bio TEXT NOT NULL,
  personality_traits TEXT[], -- ['flirty', 'intellectual', 'adventurous']
  interests TEXT[],
  occupation TEXT,
  education TEXT,
  relationship_status TEXT,
  
  -- Media (minimum 3 photos enforced at application level)
  profile_pictures TEXT[] NOT NULL CHECK (array_length(profile_pictures, 1) >= 3),
  cover_photo TEXT,
  
  -- Operator Guidelines (NOT AI)
  response_style TEXT CHECK (response_style IN ('flirty', 'romantic', 'friendly', 'intellectual', 'playful')),
  response_templates JSONB, -- Pre-written response templates for operators
  personality_guidelines TEXT, -- Instructions for operators on how to portray this profile
  
  -- Performance metrics
  total_chats INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0, -- Free to paid
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMP,
  max_concurrent_chats INTEGER DEFAULT 10,
  
  -- Metadata
  tags TEXT[], -- For search and filtering
  category TEXT, -- 'model', 'celebrity', 'fantasy', 'anime'
  popularity_score INTEGER DEFAULT 0,
  
  -- Audit
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- Validation constraints
  CONSTRAINT valid_profile_pictures CHECK (
    array_length(profile_pictures, 1) >= 3 AND
    array_length(profile_pictures, 1) <= 10
  )
);

-- Indexes
CREATE INDEX idx_fictional_gender ON fictional_users(gender);
CREATE INDEX idx_fictional_active ON fictional_users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_fictional_featured ON fictional_users(is_featured, featured_until);
CREATE INDEX idx_fictional_popularity ON fictional_users(popularity_score DESC);
CREATE INDEX idx_fictional_tags ON fictional_users USING GIN(tags);

-- Trigger to handle fictional profile deletion
CREATE OR REPLACE FUNCTION handle_fictional_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Close all active chats for this fictional profile
  UPDATE chats 
  SET status = 'closed',
      close_reason = 'profile_deleted',
      closed_at = NOW()
  WHERE fictional_user_id = OLD.id 
  AND status = 'active';
  
  -- Notify affected users
  INSERT INTO notifications (user_id, type, message, created_at)
  SELECT 
    real_user_id,
    'chat_closed',
    'This chat has been closed as the profile is no longer available.',
    NOW()
  FROM chats
  WHERE fictional_user_id = OLD.id
  AND status = 'closed'
  AND close_reason = 'profile_deleted';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fictional_user_deletion_trigger
BEFORE UPDATE OF deleted_at ON fictional_users
FOR EACH ROW
WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION handle_fictional_user_deletion();
```

#### 3. **chats** - Conversation Management
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_user_id UUID REFERENCES real_users(id) NOT NULL,
  fictional_user_id UUID REFERENCES fictional_users(id) NOT NULL,
  
  -- Assignment
  assigned_operator_id UUID REFERENCES operators(id),
  assignment_time TIMESTAMP,
  last_operator_activity TIMESTAMP,
  assignment_count INTEGER DEFAULT 0, -- Track reassignments
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'idle', 'closed', 'archived')),
  close_reason TEXT,
  
  -- Metrics
  message_count INTEGER DEFAULT 0,
  free_messages_used INTEGER DEFAULT 0,
  paid_messages_count INTEGER DEFAULT 0,
  total_credits_spent INTEGER DEFAULT 0,
  
  -- Quality tracking
  user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating BETWEEN 1 AND 5),
  operator_notes TEXT,
  admin_notes TEXT,
  flags TEXT[], -- ['slow_response', 'quality_issue', 'vip']
  
  -- Timing
  first_message_at TIMESTAMP,
  last_message_at TIMESTAMP,
  last_user_message_at TIMESTAMP,
  last_fictional_message_at TIMESTAMP,
  average_response_time INTERVAL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  
  UNIQUE(real_user_id, fictional_user_id)
);

-- Indexes
CREATE INDEX idx_chats_real_user ON chats(real_user_id);
CREATE INDEX idx_chats_fictional_user ON chats(fictional_user_id);
CREATE INDEX idx_chats_operator ON chats(assigned_operator_id);
CREATE INDEX idx_chats_status ON chats(status);
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC);
CREATE INDEX idx_chats_assignment ON chats(assigned_operator_id, status) WHERE status = 'active';
```

#### 4. **messages** - Partitioned for Scale
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) NOT NULL,
  
  -- Content
  sender_type TEXT NOT NULL CHECK (sender_type IN ('real', 'fictional')),
  content TEXT NOT NULL,
  original_content TEXT, -- Store original before edits
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'voice', 'video', 'gif')),
  media_url TEXT,
  
  -- Metadata
  handled_by_operator_id UUID REFERENCES operators(id),
  is_free_message BOOLEAN DEFAULT false,
  credits_charged INTEGER DEFAULT 0,
  
  -- Editing tracking
  is_edited BOOLEAN DEFAULT false,
  edited_by UUID, -- Admin or operator who edited
  edited_at TIMESTAMP,
  edit_count INTEGER DEFAULT 0,
  
  -- Status tracking
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  
  -- Quality & moderation
  sentiment_score DECIMAL(3, 2), -- -1 to 1
  toxicity_score DECIMAL(3, 2), -- 0 to 1
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE messages_2024_01 PARTITION OF messages
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- ... create partitions for each month

-- Indexes
CREATE INDEX idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_operator ON messages(handled_by_operator_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Message edit history table for audit trail
CREATE TABLE message_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  original_content TEXT NOT NULL,
  new_content TEXT NOT NULL,
  edited_by UUID NOT NULL, -- Admin or operator ID
  editor_type TEXT NOT NULL CHECK (editor_type IN ('admin', 'operator')),
  edit_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_edit_history_message ON message_edit_history(message_id, created_at DESC);
CREATE INDEX idx_edit_history_editor ON message_edit_history(edited_by);
```

#### 5. **operators** - Enhanced Operator Management
```sql
CREATE TABLE operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  
  -- Skills & specialization
  specializations TEXT[], -- ['flirty', 'romantic', 'intellectual']
  languages TEXT[] DEFAULT ARRAY['en'],
  skill_level TEXT DEFAULT 'junior' CHECK (skill_level IN ('junior', 'mid', 'senior', 'expert')),
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT false,
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  
  -- Performance metrics
  total_messages_sent INTEGER DEFAULT 0,
  total_chats_handled INTEGER DEFAULT 0,
  average_response_time INTERVAL,
  average_user_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Quality metrics
  quality_score DECIMAL(5, 2) DEFAULT 100, -- 0-100
  idle_incidents INTEGER DEFAULT 0,
  reassignment_count INTEGER DEFAULT 0,
  user_complaints INTEGER DEFAULT 0,
  
  -- Activity tracking
  last_activity TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  total_online_time INTERVAL DEFAULT '0',
  
  -- Compensation (if applicable)
  hourly_rate DECIMAL(10, 2),
  commission_rate DECIMAL(5, 2),
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  
  -- Audit
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_operators_available ON operators(is_available, is_active);
CREATE INDEX idx_operators_quality ON operators(quality_score DESC);
CREATE INDEX idx_operators_specializations ON operators USING GIN(specializations);
```

#### 6. **chat_queue** - Real-time Queue Management
```sql
CREATE TABLE chat_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) UNIQUE NOT NULL,
  
  -- Priority calculation
  priority TEXT NOT NULL CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  priority_score INTEGER NOT NULL, -- Calculated score for ordering
  
  -- User context
  user_tier TEXT NOT NULL,
  user_lifetime_value DECIMAL(10, 2),
  wait_time INTERVAL,
  
  -- Matching requirements
  required_specializations TEXT[],
  preferred_operator_id UUID REFERENCES operators(id),
  excluded_operator_ids UUID[], -- Operators to avoid
  
  -- Metadata
  entered_queue_at TIMESTAMP DEFAULT NOW(),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for queue processing
CREATE INDEX idx_queue_priority ON chat_queue(priority_score DESC, entered_queue_at ASC);
CREATE INDEX idx_queue_chat ON chat_queue(chat_id);
```

#### 7. **transactions** - Financial Records with Idempotency
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_user_id UUID REFERENCES real_users(id) NOT NULL,
  
  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('purchase', 'refund', 'bonus', 'deduction')),
  amount DECIMAL(10, 2) NOT NULL,
  credits_amount INTEGER NOT NULL,
  
  -- Payment gateway
  payment_provider TEXT DEFAULT 'paystack',
  provider_reference TEXT UNIQUE NOT NULL, -- CRITICAL: Prevents duplicate webhook processing
  provider_response JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
  failure_reason TEXT,
  
  -- Idempotency & webhook handling
  webhook_received_count INTEGER DEFAULT 0, -- Track duplicate webhooks
  last_webhook_at TIMESTAMP,
  
  -- Metadata
  package_id UUID REFERENCES credit_packages(id),
  package_snapshot JSONB, -- Store package details at purchase time (price lock)
  promo_code TEXT,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Reconciliation
  needs_manual_review BOOLEAN DEFAULT false,
  review_reason TEXT,
  reviewed_by UUID REFERENCES admins(id),
  reviewed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  refunded_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_transactions_user ON transactions(real_user_id, created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_reference ON transactions(provider_reference);
CREATE INDEX idx_transactions_review ON transactions(needs_manual_review) WHERE needs_manual_review = true;

-- Prevent duplicate transaction processing
CREATE OR REPLACE FUNCTION prevent_duplicate_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if transaction with same provider_reference already exists
  IF EXISTS (
    SELECT 1 FROM transactions 
    WHERE provider_reference = NEW.provider_reference 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Duplicate transaction detected: %', NEW.provider_reference;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_transaction_trigger
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_transaction();
```

#### 8. **credit_packages** - Dynamic Pricing with Price Locking
```sql
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  
  -- Marketing
  is_featured BOOLEAN DEFAULT false,
  badge_text TEXT, -- 'BEST VALUE', 'POPULAR'
  discount_percentage INTEGER,
  bonus_credits INTEGER DEFAULT 0, -- Extra credits given free
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  
  -- A/B testing
  variant TEXT, -- For price testing
  conversion_rate DECIMAL(5, 2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Price locking: When user initiates checkout, snapshot the package details
-- This prevents price changes mid-checkout from affecting the transaction
-- Implementation: Store package_snapshot JSONB in transactions table
```

#### 9. **user_activity_log** - Behavioral Analytics
```sql
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES real_users(id) NOT NULL,
  
  -- Activity
  activity_type TEXT NOT NULL, -- 'login', 'view_profile', 'send_message', 'purchase'
  entity_type TEXT, -- 'fictional_user', 'chat', 'transaction'
  entity_id UUID,
  
  -- Context
  metadata JSONB,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT, -- For detecting banned user circumvention
  
  created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE INDEX idx_activity_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_type ON user_activity_log(activity_type, created_at DESC);
CREATE INDEX idx_activity_ip ON user_activity_log(ip_address);
CREATE INDEX idx_activity_device ON user_activity_log(device_fingerprint);
```

#### 12. **credit_refunds** - Refund Audit Trail
```sql
CREATE TABLE credit_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES real_users(id) NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'accidental_send',
    'inappropriate_content',
    'system_error',
    'admin_discretion',
    'account_deletion'
  )),
  
  -- Context
  message_id UUID REFERENCES messages(id),
  chat_id UUID REFERENCES chats(id),
  
  -- Approval
  processed_by UUID REFERENCES admins(id) NOT NULL,
  notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refunds_user ON credit_refunds(user_id, created_at DESC);
CREATE INDEX idx_refunds_processor ON credit_refunds(processed_by);
```

#### 13. **deleted_users** - GDPR Compliance Archive
```sql
CREATE TABLE deleted_users (
  id UUID PRIMARY KEY,
  original_user_id UUID NOT NULL,
  username TEXT,
  email TEXT,
  
  -- Deletion details
  deletion_reason TEXT,
  deletion_requested_at TIMESTAMP,
  deletion_completed_at TIMESTAMP DEFAULT NOW(),
  
  -- Data retention
  total_spent DECIMAL(10, 2),
  total_messages_sent INTEGER,
  account_age_days INTEGER,
  
  -- Anonymization
  data_anonymized BOOLEAN DEFAULT true,
  messages_anonymized BOOLEAN DEFAULT true,
  
  -- Refund
  unused_credits INTEGER,
  refund_amount DECIMAL(10, 2),
  refund_processed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deleted_users_original ON deleted_users(original_user_id);
CREATE INDEX idx_deleted_users_date ON deleted_users(deletion_completed_at DESC);
```

#### 14. **banned_users_tracking** - Prevent Circumvention
```sql
CREATE TABLE banned_users_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES real_users(id) NOT NULL,
  
  -- Ban details
  ban_reason TEXT NOT NULL,
  banned_by UUID REFERENCES admins(id) NOT NULL,
  banned_until TIMESTAMP,
  is_permanent BOOLEAN DEFAULT false,
  
  -- Tracking for circumvention detection
  ip_addresses INET[],
  device_fingerprints TEXT[],
  email_pattern TEXT, -- For detecting similar emails
  
  -- Attempts to circumvent
  circumvention_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_banned_users ON banned_users_tracking(user_id);
CREATE INDEX idx_banned_ips ON banned_users_tracking USING GIN(ip_addresses);
CREATE INDEX idx_banned_devices ON banned_users_tracking USING GIN(device_fingerprints);
```

#### 15. **profile_media_validation** - Image Validation Log
```sql
CREATE TABLE profile_media_validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fictional_user_id UUID REFERENCES fictional_users(id),
  real_user_id UUID REFERENCES real_users(id),
  
  -- Media details
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('profile_picture', 'cover_photo', 'gallery')),
  
  -- Validation
  file_size_bytes BIGINT,
  file_format TEXT,
  dimensions TEXT, -- e.g., "1920x1080"
  
  -- Content moderation
  is_approved BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  moderated_by UUID REFERENCES admins(id),
  moderated_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_validation_fictional ON profile_media_validation(fictional_user_id);
CREATE INDEX idx_media_validation_flagged ON profile_media_validation(is_flagged) WHERE is_flagged = true;
```

#### 16. **location_validation_log** - Geocoding Validation
```sql
CREATE TABLE location_validation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES real_users(id),
  
  -- Input
  location_text TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Validation
  is_valid BOOLEAN DEFAULT true,
  validation_error TEXT,
  geocoding_service TEXT DEFAULT 'google_maps',
  
  -- Corrected values (if needed)
  corrected_location TEXT,
  corrected_latitude DECIMAL(10, 8),
  corrected_longitude DECIMAL(11, 8),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_location_validation_user ON location_validation_log(user_id);
```

#### 17. **admin_notifications** - System Alerts
```sql
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'operator_suspended',
    'chat_escalation',
    'payment_failed',
    'high_refund_rate',
    'system_error',
    'security_alert'
  )),
  
  message TEXT NOT NULL,
  metadata JSONB,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_by UUID REFERENCES admins(id),
  read_at TIMESTAMP,
  
  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_notifications_unread ON admin_notifications(is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_admin_notifications_priority ON admin_notifications(priority, created_at DESC);
```

#### 18. **age_verification_log** - Legal Compliance
```sql
CREATE TABLE age_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES real_users(id) NOT NULL,
  
  -- Verification details
  stated_age INTEGER NOT NULL,
  verification_method TEXT CHECK (verification_method IN ('self_declared', 'id_verification', 'third_party')),
  
  -- ID verification (if applicable)
  id_document_type TEXT,
  id_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES admins(id),
  verified_at TIMESTAMP,
  
  -- Compliance
  is_compliant BOOLEAN DEFAULT true,
  compliance_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_age_verification_user ON age_verification_log(user_id);
CREATE INDEX idx_age_verification_compliance ON age_verification_log(is_compliant) WHERE is_compliant = false;
```

#### 10. **admins** - Admin Role Management
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  
  -- Role-based permissions
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  
  -- Permissions (super_admin has all, admin has most, moderator has limited)
  permissions JSONB DEFAULT '{
    "manage_users": true,
    "manage_fictional_profiles": true,
    "manage_operators": true,
    "manage_chats": true,
    "view_analytics": true,
    "manage_payments": true,
    "manage_admins": false,
    "system_settings": false,
    "delete_data": false
  }',
  
  -- Activity tracking
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  last_activity TIMESTAMP DEFAULT NOW(),
  
  -- Audit trail
  created_by UUID REFERENCES admins(id), -- Which admin created this admin
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_admins_auth ON admins(auth_id);
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_active ON admins(is_active) WHERE deleted_at IS NULL;

-- Ensure at least one super_admin always exists
CREATE OR REPLACE FUNCTION prevent_last_super_admin_deletion()
RETURNS TRIGGER AS $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  IF OLD.role = 'super_admin' AND (NEW.deleted_at IS NOT NULL OR NEW.is_active = false) THEN
    SELECT COUNT(*) INTO super_admin_count
    FROM admins
    WHERE role = 'super_admin' 
    AND is_active = true 
    AND deleted_at IS NULL
    AND id != OLD.id;
    
    IF super_admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot delete or deactivate the last super admin';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_last_super_admin_trigger
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION prevent_last_super_admin_deletion();

-- Admin permission levels explained:
-- SUPER_ADMIN: Full system access, can create/delete other admins, change system settings
-- ADMIN: Can manage users, profiles, operators, chats, view analytics, handle payments
-- MODERATOR: Can view and moderate chats, manage user reports, limited access
```

#### 11. **operators** - Enhanced Operator Management
```sql
CREATE TABLE operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  
  -- Skills & specialization
  specializations TEXT[], -- ['flirty', 'romantic', 'intellectual']
  languages TEXT[] DEFAULT ARRAY['en'],
  skill_level TEXT DEFAULT 'junior' CHECK (skill_level IN ('junior', 'mid', 'senior', 'expert')),
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT false,
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  
  -- Performance metrics
  total_messages_sent INTEGER DEFAULT 0,
  total_chats_handled INTEGER DEFAULT 0,
  average_response_time INTERVAL,
  average_user_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Quality metrics
  quality_score DECIMAL(5, 2) DEFAULT 100, -- 0-100
  idle_incidents INTEGER DEFAULT 0,
  reassignment_count INTEGER DEFAULT 0,
  user_complaints INTEGER DEFAULT 0,
  
  -- Performance thresholds for auto-suspension
  quality_threshold DECIMAL(5, 2) DEFAULT 60, -- Suspend if below 60
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  suspended_until TIMESTAMP,
  
  -- Activity tracking
  last_activity TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  total_online_time INTERVAL DEFAULT '0',
  
  -- Compensation (if applicable)
  hourly_rate DECIMAL(10, 2),
  commission_rate DECIMAL(5, 2),
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  
  -- Audit
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_operators_available ON operators(is_available, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_operators_quality ON operators(quality_score DESC);
CREATE INDEX idx_operators_specializations ON operators USING GIN(specializations);
CREATE INDEX idx_operators_suspended ON operators(is_suspended, suspended_until);

-- Prevent operator from going offline with active chats
CREATE OR REPLACE FUNCTION prevent_offline_with_active_chats()
RETURNS TRIGGER AS $$
DECLARE
  active_chat_count INTEGER;
BEGIN
  IF NEW.is_available = false AND OLD.is_available = true THEN
    SELECT COUNT(*) INTO active_chat_count
    FROM chats
    WHERE assigned_operator_id = NEW.id
    AND status = 'active';
    
    IF active_chat_count > 0 THEN
      RAISE EXCEPTION 'Cannot go offline with % active chats. Please reassign or close them first.', active_chat_count;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_offline_with_chats_trigger
BEFORE UPDATE OF is_available ON operators
FOR EACH ROW
EXECUTE FUNCTION prevent_offline_with_active_chats();

-- Handle operator deletion
CREATE OR REPLACE FUNCTION handle_operator_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Reassign all active chats
  UPDATE chats
  SET assigned_operator_id = NULL,
      status = 'idle',
      assignment_count = assignment_count + 1,
      admin_notes = COALESCE(admin_notes || ' | ', '') || 'Operator ' || OLD.name || ' was deleted'
  WHERE assigned_operator_id = OLD.id
  AND status = 'active';
  
  -- Add reassigned chats to queue with high priority
  INSERT INTO chat_queue (chat_id, priority, priority_score, user_tier, entered_queue_at)
  SELECT 
    id,
    'high',
    80,
    (SELECT user_tier FROM real_users WHERE id = real_user_id),
    NOW()
  FROM chats
  WHERE assigned_operator_id IS NULL
  AND status = 'idle';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER operator_deletion_trigger
BEFORE UPDATE OF deleted_at ON operators
FOR EACH ROW
WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION handle_operator_deletion();

-- Auto-suspend operators with low quality scores
CREATE OR REPLACE FUNCTION check_operator_quality()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quality_score < NEW.quality_threshold AND NOT NEW.is_suspended THEN
    NEW.is_suspended := true;
    NEW.suspension_reason := 'Quality score below threshold (' || NEW.quality_score || ' < ' || NEW.quality_threshold || ')';
    NEW.suspended_until := NOW() + INTERVAL '7 days'; -- 7-day suspension for retraining
    NEW.is_available := false;
    
    -- Notify admins
    INSERT INTO admin_notifications (type, message, metadata, created_at)
    VALUES (
      'operator_suspended',
      'Operator ' || NEW.name || ' has been auto-suspended due to low quality score',
      jsonb_build_object('operator_id', NEW.id, 'quality_score', NEW.quality_score),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER operator_quality_check_trigger
BEFORE UPDATE OF quality_score ON operators
FOR EACH ROW
EXECUTE FUNCTION check_operator_quality();
```

---

## Supabase Edge Functions - Complete Implementation

### 1. Critical Edge Functions

#### **bootstrap-first-admin** - One-Time Admin Setup
```typescript
// Edge Function: supabase/functions/bootstrap-first-admin/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { name, email, password, setupToken } = await req.json();
  
  // Verify setup token from environment
  const SETUP_TOKEN = Deno.env.get('ADMIN_SETUP_TOKEN');
  if (setupToken !== SETUP_TOKEN) {
    return new Response(JSON.stringify({ error: 'Invalid setup token' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check if any admin already exists
  const { data: existingAdmins } = await supabase
    .from('admins')
    .select('id')
    .limit(1);
  
  if (existingAdmins && existingAdmins.length > 0) {
    return new Response(JSON.stringify({ error: 'Admin already exists' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (authError) throw authError;
  
  // Create super admin
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .insert({
      auth_id: authUser.user.id,
      name,
      email,
      role: 'super_admin',
      permissions: {
        manage_users: true,
        manage_fictional_profiles: true,
        manage_operators: true,
        manage_chats: true,
        view_analytics: true,
        manage_payments: true,
        manage_admins: true,
        system_settings: true,
        delete_data: true
      }
    })
    .select()
    .single();
  
  if (adminError) throw adminError;
  
  return new Response(JSON.stringify({ success: true, admin }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### **delete-user-account** - GDPR Compliance
```typescript
// Edge Function: supabase/functions/delete-user-account/index.ts
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { userId, reason } = await req.json();
  
  // Get user details before deletion
  const { data: user } = await supabase
    .from('real_users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Calculate refund for unused credits
  const refundAmount = user.credits * 10; // 10 KES per credit
  
  // Archive user data
  await supabase.from('deleted_users').insert({
    id: crypto.randomUUID(),
    original_user_id: user.id,
    username: user.username,
    email: user.email,
    deletion_reason: reason,
    deletion_requested_at: new Date().toISOString(),
    total_spent: user.total_spent,
    total_messages_sent: user.total_messages_sent,
    unused_credits: user.credits,
    refund_amount: refundAmount,
    data_anonymized: true,
    messages_anonymized: true
  });
  
  // Anonymize messages (keep for operators but remove user identification)
  await supabase
    .from('messages')
    .update({ 
      content: '[Message from deleted user]',
      original_content: '[Deleted]'
    })
    .in('chat_id', 
      supabase.from('chats').select('id').eq('real_user_id', userId)
    );
  
  // Close all active chats
  await supabase
    .from('chats')
    .update({ 
      status: 'closed',
      close_reason: 'user_deleted',
      closed_at: new Date().toISOString()
    })
    .eq('real_user_id', userId)
    .eq('status', 'active');
  
  // Soft delete user
  await supabase
    .from('real_users')
    .update({ 
      deleted_at: new Date().toISOString(),
      is_active: false,
      email: `deleted_${userId}@fantooo.com`,
      username: `deleted_${userId}`
    })
    .eq('id', userId);
  
  // Delete auth user
  await supabase.auth.admin.deleteUser(user.auth_id);
  
  // Process refund if applicable
  if (refundAmount > 0) {
    await supabase.from('credit_refunds').insert({
      user_id: userId,
      amount: user.credits,
      reason: 'account_deletion',
      notes: `Refund for ${user.credits} unused credits`,
      status: 'pending'
    });
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    refundAmount,
    message: 'Account deleted successfully'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### **delete-operator-account** - Operator Removal
```typescript
// Edge Function: supabase/functions/delete-operator-account/index.ts
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { operatorId, adminId } = await req.json();
  
  // Get operator details
  const { data: operator } = await supabase
    .from('operators')
    .select('*')
    .eq('id', operatorId)
    .single();
  
  if (!operator) {
    return new Response(JSON.stringify({ error: 'Operator not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check for active chats
  const { data: activeChats } = await supabase
    .from('chats')
    .select('id')
    .eq('assigned_operator_id', operatorId)
    .eq('status', 'active');
  
  if (activeChats && activeChats.length > 0) {
    return new Response(JSON.stringify({ 
      error: `Cannot delete operator with ${activeChats.length} active chats. Please reassign them first.`
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Archive performance data (already in operators table with deleted_at)
  
  // Soft delete operator
  await supabase
    .from('operators')
    .update({ 
      deleted_at: new Date().toISOString(),
      is_active: false,
      is_available: false
    })
    .eq('id', operatorId);
  
  // Delete auth user
  await supabase.auth.admin.deleteUser(operator.auth_id);
  
  return new Response(JSON.stringify({ 
    success: true,
    message: 'Operator deleted successfully'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### **reconcile-payments** - Manual Payment Reconciliation
```typescript
// Edge Function: supabase/functions/reconcile-payments/index.ts
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { transactionId, adminId } = await req.json();
  
  // Get transaction
  const { data: transaction } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();
  
  if (!transaction) {
    return new Response(JSON.stringify({ error: 'Transaction not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check Paystack API for actual payment status
  const paystackResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${transaction.provider_reference}`,
    {
      headers: {
        Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`
      }
    }
  );
  
  const paystackData = await paystackResponse.json();
  
  if (paystackData.data.status === 'success' && transaction.status !== 'success') {
    // Payment was successful but credits weren't added
    
    // Add credits
    await supabase
      .from('real_users')
      .update({ 
        credits: supabase.raw(`credits + ${transaction.credits_amount}`)
      })
      .eq('id', transaction.real_user_id);
    
    // Update transaction
    await supabase
      .from('transactions')
      .update({ 
        status: 'success',
        completed_at: new Date().toISOString(),
        needs_manual_review: false,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', transactionId);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Payment reconciled and credits added'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ 
    success: false,
    message: 'Payment status unchanged',
    paystackStatus: paystackData.data.status
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### **auto-close-inactive-chats** - Scheduled Cleanup
```typescript
// Edge Function: supabase/functions/auto-close-inactive-chats/index.ts
// Run via cron: 0 * * * * (every hour)
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Find chats inactive for 24+ hours
  const { data: inactiveChats } = await supabase
    .from('chats')
    .select('*')
    .eq('status', 'active')
    .lt('last_message_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  let closedCount = 0;
  
  for (const chat of inactiveChats || []) {
    await supabase
      .from('chats')
      .update({
        status: 'closed',
        close_reason: 'inactivity_timeout',
        closed_at: new Date().toISOString()
      })
      .eq('id', chat.id);
    
    closedCount++;
  }
  
  return new Response(JSON.stringify({ 
    success: true,
    closedCount,
    message: `Closed ${closedCount} inactive chats`
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### **escalate-problematic-chats** - Quality Control
```typescript
// Edge Function: supabase/functions/escalate-problematic-chats/index.ts
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Find chats with 3+ reassignments
  const { data: problematicChats } = await supabase
    .from('chats')
    .select('*')
    .eq('status', 'active')
    .gte('assignment_count', 3);
  
  let escalatedCount = 0;
  
  for (const chat of problematicChats || []) {
    await supabase
      .from('chats')
      .update({
        status: 'escalated',
        flags: [...(chat.flags || []), 'max_reassignments_reached'],
        admin_notes: 'Chat requires admin attention - multiple reassignment failures'
      })
      .eq('id', chat.id);
    
    // Notify admins
    await supabase.from('admin_notifications').insert({
      type: 'chat_escalation',
      message: `Chat ${chat.id} has been escalated after ${chat.assignment_count} reassignments`,
      metadata: { chatId: chat.id, assignmentCount: chat.assignment_count },
      priority: 'high'
    });
    
    escalatedCount++;
  }
  
  return new Response(JSON.stringify({ 
    success: true,
    escalatedCount,
    message: `Escalated ${escalatedCount} problematic chats`
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### **process-payment** - Paystack Webhook Handler
```typescript
// Edge Function: supabase/functions/process-payment/index.ts
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const payload = await req.json();
  const reference = payload.data.reference;
  
  // Check if transaction already processed (idempotency)
  const { data: existingTransaction } = await supabase
    .from('transactions')
    .select('*')
    .eq('provider_reference', reference)
    .single();
  
  if (existingTransaction) {
    // Update webhook count
    await supabase
      .from('transactions')
      .update({ 
        webhook_received_count: existingTransaction.webhook_received_count + 1,
        last_webhook_at: new Date().toISOString()
      })
      .eq('id', existingTransaction.id);
    
    if (existingTransaction.status === 'success') {
      // Already processed, return success
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  if (payload.data.status === 'success') {
    // Add credits to user
    await supabase
      .from('real_users')
      .update({ 
        credits: supabase.raw(`credits + ${payload.data.metadata.credits}`),
        total_spent: supabase.raw(`total_spent + ${payload.data.amount / 100}`)
      })
      .eq('id', payload.data.metadata.userId);
    
    // Update transaction
    await supabase
      .from('transactions')
      .update({ 
        status: 'success',
        completed_at: new Date().toISOString(),
        provider_response: payload
      })
      .eq('provider_reference', reference);
  } else {
    // Mark as failed
    await supabase
      .from('transactions')
      .update({ 
        status: 'failed',
        failure_reason: payload.data.gateway_response,
        needs_manual_review: true,
        review_reason: 'Payment failed'
      })
      .eq('provider_reference', reference);
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### 2. Database Functions
- `get_available_fictional_profiles(user_id, gender_preference)`
- `create_or_get_chat(real_user_id, fictional_user_id)` - With duplicate prevention
- `update_operator_stats(operator_id, date)`
- `check_message_credits(real_user_id, chat_id)` - With row locking

### 3. RLS Policies
- Real users can only access their own data
- Operators can only access assigned chats
- Admins have full access to all data
- Public read access for fictional profiles (limited fields only - no operator guidelines)

---

## Application Architecture & Routes

### Frontend Architecture

#### CRITICAL: Landing Page Security (`/`)
**MUST NOT reveal operational details:**
- ❌ NO mention of "operators", "admin", "fictional", "managed profiles"
- ❌ NO links to `/op-login` or `/admin-login` (hidden routes)
- ❌ NO behind-the-scenes mechanics

**User-facing language only:**
- ✅ "Chat with exciting people"
- ✅ "Meet amazing personalities"
- ✅ "Connect with interesting profiles"
- ✅ "Start meaningful conversations"

**Landing Page Content:**
- Hero section with emotional value proposition
- How it works (from user perspective only)
- Call-to-action buttons
- Glassmorphism design elements
- NO operational details visible

#### Admin Bootstrap
0. **Setup Page** (`/setup`)
   - **Only shows if NO admins exist in database**
   - Requires secret setup token from environment variable
   - Creates first super_admin account
   - Redirects to admin login after setup
   - Self-disables after first admin created
   - Form fields: Name, Email, Password, Setup Token

1. **Onboarding** (`/get-started`)
   - Step 1: Name (uniqueness check with debouncing)
   - Step 2: Location (with autocomplete + geocoding validation), Gender, Age (18+ enforced), Looking for
   - Step 3: Password creation (min 8 chars, complexity requirements)
   - Auto-generate email format: `username@fantooo.com`
   - Age verification logged for compliance

### Authenticated User Routes
3. **Discover** (`/discover`)
   - Grid of fictional profile cards
   - Filter and search functionality
   - Infinite scroll pagination

4. **Profile View** (`/profile/[id]`)
   - Full fictional profile display
   - Multiple photos carousel
   - Favorite/Chat action buttons

5. **Chat** (`/chat/[chatId]`)
   - Real-time messaging interface
   - Credit status indicator
   - Message history

6. **Favorites** (`/favorites`)
   - Grid of favorited profiles
   - Quick access to chat

7. **User Profile** (`/me`)
   - Edit personal information
   - Upload profile picture
   - View chat history

8. **Credits** (`/credits`)
   - Purchase credits interface
   - Transaction history
   - Paystack integration

### Operator Routes (Hidden - No Public Links)
9. **Operator Login** (`/op-login`)
   - Authentication for operators
   - NO link from landing page
   - Direct URL access only

10. **Waiting Room** (`/operator/waiting`)
    - Assignment queue interface
    - Availability toggle (prevents offline with active chats)
    - Stats overview
    - Quality score monitoring

11. **Operator Chat** (`/operator/chat/[chatId]`)
    - Three-panel layout
    - Real user profile (left)
    - Chat interface (center)
    - Fictional user profile (right)
    - Notes sections with save functionality
    - Response templates (NOT AI suggestions)

12. **Operator Stats** (`/operator/stats`)
    - Personal performance metrics
    - Message count by date
    - Quality score trends
    - Suspension warnings

13. **Operator Settings** (`/operator/settings`)
    - Password change functionality
    - Specialization preferences

### Admin Routes (Hidden - No Public Links)
14. **Admin Login** (`/admin-login`)
    - Login interface for existing admins
    - NO link from landing page
    - Direct URL access only

15. **Admin Dashboard** (`/admin/dashboard`)
    - Overview statistics
    - Quick access to all sections
    - Unread notifications
    - System health indicators

16. **Manage Fictional Profiles** (`/admin/fictional-profiles`)
    - CRUD operations for fictional users
    - Bulk import functionality
    - Profile picture validation (min 3, max 10 photos)
    - Active chat count before deletion

17. **Manage Real Users** (`/admin/real-users`)
    - User management and moderation
    - Block/suspend functionality
    - Account deletion (GDPR)
    - Credit refund interface
    - Ban circumvention detection

18. **Manage Operators** (`/admin/operators`)
    - Operator account creation
    - Performance monitoring
    - Account management
    - Suspension/reactivation
    - Active chat check before deletion

19. **Chat Management** (`/admin/chats`)
    - Search and filter chats
    - Message editing capabilities (with audit trail)
    - Operator assignment tracking
    - Escalated chats queue
    - Reassignment history

20. **Payment Reconciliation** (`/admin/payments`)
    - Failed payment dashboard
    - Manual reconciliation interface
    - Refund processing
    - Transaction audit trail

21. **Admin Management** (`/admin/admins`)
    - Create new admins (super_admin only)
    - Role assignment: super_admin, admin, moderator
    - Permission management
    - Cannot delete last super_admin

22. **Admin Stats** (`/admin/stats`)
    - Platform-wide analytics
    - Operator performance rankings
    - Revenue metrics
    - User engagement trends

23. **Admin Settings** (`/admin/settings`)
    - Platform configuration
    - App settings management
    - System maintenance

---

## Key Components

### Shared Components
- **GlassCard**: Glassmorphism card component
- **GlassButton**: Styled button with glass effect
- **GlassInput**: Form input with glass styling
- **ProfileCard**: Fictional user display card
- **ChatBubble**: Message display component
- **LoadingSpinner**: Consistent loading indicator
- **Modal**: Reusable modal component
- **Toast**: Notification system
- **Navigation**: Role-based navigation

### Specialized Components
- **LocationAutocomplete**: Location search with coordinates
- **ProfileCarousel**: Image carousel for profiles
- **ChatInterface**: Real-time chat component
- **OperatorQueue**: Assignment management interface
- **StatsChart**: Data visualization components
- **PaymentModal**: Paystack integration component
- **ProfileNotes**: Editable notes component

### Layout Components
- **AuthLayout**: For login/register pages
- **DashboardLayout**: For authenticated user pages
- **OperatorLayout**: For operator interface
- **AdminLayout**: For admin panel

---

## Domain & Email Setup

### Domain Requirements
To make the `name@fantooo.com` email system work, proper domain setup is essential.

### **Recommended Solution: Cloudflare Email Routing (FREE)**

#### Step 1: Domain Purchase
- **Buy `fantooo.com` from any domain registrar**:
  - Namecheap (~$12/year)
  - GoDaddy (~$15/year) 
  - Porkbun (~$9/year)
  - Google Domains (~$12/year)
- **You DON'T need to buy from Cloudflare** - any registrar works

#### Step 2: Cloudflare Setup
1. **Create free Cloudflare account**
2. **Add your domain to Cloudflare**:
   - Add site: `fantooo.com`
   - Change nameservers at your registrar to Cloudflare's
   - Wait for DNS propagation (24-48 hours)

#### Step 3: Email Routing Configuration
```bash
# In Cloudflare Dashboard:
# Email > Email Routing > Custom addresses

# Set up catch-all rule:
# *@fantooo.com → your-admin@gmail.com

# This means:
# francis@fantooo.com → forwards to your-admin@gmail.com
# sarah@fantooo.com → forwards to your-admin@gmail.com  
# ANY-NAME@fantooo.com → forwards to your-admin@gmail.com
```

#### Step 4: DNS Configuration (Automatic)
Cloudflare automatically sets up:
- MX records for mail routing
- SPF records for email authentication
- DKIM signatures for security

### **How It Works**
1. **User registers as "Francis"** → System creates `francis@fantooo.com`
2. **Paystack sends receipt** → Email goes to `francis@fantooo.com`
3. **Cloudflare receives email** → Forwards to your admin Gmail
4. **You receive all receipts** → In one centralized inbox

### **Benefits**
- ✅ **Completely FREE** (only pay for domain ~$10/year)
- ✅ **All emails are valid** and accepted
- ✅ **Paystack receipts work perfectly**
- ✅ **No email server management**
- ✅ **Centralized receipt collection**
- ✅ **Professional email addresses**

### **Cost Breakdown**
- Domain registration: ~$10-15/year
- Cloudflare Email Routing: FREE forever
- **Total annual cost: ~$10-15**

### **Implementation Notes**
- Users never need to access their `name@fantooo.com` emails
- All Paystack receipts forward to your admin email
- You can track all transactions in your dashboard
- Email addresses are legitimate and pass all validation

---

## Payment Integration (Paystack)

### Configuration
- Use Paystack's inline payment
- Handle receipts without email requirement
- Credit packages: 10, 25, 50, 100 credits
- Pricing: 1 credit = 10 KES

### Implementation
- Webhook for payment verification
- Automatic credit addition
- Transaction logging
- Failed payment handling

---

## Real-time Features

### WebSocket/Supabase Realtime
- Live chat messaging
- Operator assignment notifications
- User availability status
- Chat assignment updates

### State Management
- React Context for user data
- Real-time subscriptions for chats
- Optimistic updates for messaging
- Connection state monitoring

---

## Security Considerations

### Data Protection
- Row Level Security (RLS) on all tables
- API route protection with JWT
- Input validation and sanitization
- Rate limiting on sensitive endpoints

### Privacy Features
- Fictional profile anonymity
- Secure password handling
- Message encryption options

---

## Performance Optimizations

### Frontend
- Image lazy loading
- Virtual scrolling for long lists
- Code splitting by route
- Optimized bundle size

### Backend
- Database indexing on frequently queried fields
- Connection pooling
- Caching frequently accessed data
- Efficient query optimization

---

## Development Workflow

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom glassmorphism
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Paystack
- **Deployment**: Vercel
- **Real-time**: Supabase Realtime

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
NEXT_PUBLIC_APP_URL=
```

### Deployment Considerations
- Environment-specific configurations
- Database migrations
- Edge function deployments
- CDN setup for images
- SSL certificate configuration




### Analytics Integration
- User behavior tracking
- Conversion rate monitoring
- Performance metrics
- Business intelligence dashboard

---

## Edge Cases & Implementation Checklist

### 1. ✅ Admin Bootstrap & First Admin Creation
- **Setup page** (`/setup`) only shows if no admins exist
- Requires `ADMIN_SETUP_TOKEN` from environment variable
- Creates first super_admin with full permissions
- Self-disables after first admin created
- Super_admin can create other admins with limited roles

**Admin Roles & Permissions:**
- **Super Admin**: Full access, can manage other admins, system settings, delete data
- **Admin**: Can manage users, profiles, operators, chats, payments (cannot manage admins)
- **Moderator**: Limited access, can moderate chats and handle user reports only

### 2. ✅ User Account Deletion (GDPR Compliance)
- Edge Function: `delete-user-account`
- Soft deletes user (sets `deleted_at`)
- Anonymizes messages: `[Message from deleted user]`
- Archives data in `deleted_users` table
- Calculates refund for unused credits (10 KES per credit)
- Closes all active chats
- Deletes auth user
- Logs deletion in audit trail

### 3. ✅ Operator Account Deletion/Deactivation
- Edge Function: `delete-operator-account`
- Checks for active chats (prevents deletion if any exist)
- Requires manual reassignment first
- Archives performance data (kept in operators table with `deleted_at`)
- Soft deletes operator
- Deletes auth user

### 4. ✅ Chat Timeout & Abandonment
- Edge Function: `auto-close-inactive-chats` (runs hourly via cron)
- Auto-closes chats with no activity for 24+ hours
- Close reason: `inactivity_timeout`
- **No refunds** for abandoned chats (service was provided)
- Scenarios covered:
  - User starts chat, never sends message after 3 free messages
  - User sends paid messages, then abandons
  - Operator sends message, user never responds
  - Both parties inactive

### 5. ✅ Concurrent Message Sending (Race Conditions)
- Database row locking: `SELECT ... FOR UPDATE` on user credits
- Transaction-based credit deduction
- DB constraint: `CHECK (credits >= 0)` prevents negative credits
- Application-level validation
- Failed transaction logging for reconciliation
- Prevents user with 5 credits from sending 10 messages simultaneously

### 6. ✅ Payment Webhook Failures
- Idempotency: `provider_reference` is UNIQUE in transactions table
- Tracks duplicate webhooks: `webhook_received_count`
- Edge Function: `reconcile-payments` for manual reconciliation
- Admin dashboard shows failed payments needing review
- Checks Paystack API for actual payment status
- Adds missing credits if payment was successful
- `needs_manual_review` flag for problematic transactions

### 7. ✅ Operator Reassignment Loops
- Max reassignment limit: 3 attempts
- After 3 reassignments → Escalate to admin
- Chat status changes to `escalated`
- Admin notification created with priority: `high`
- Prevents infinite reassignment loops
- Tracks reassignment count in `chats.assignment_count`

### 8. ✅ Fictional Profile Deletion
- Database trigger: `fictional_user_deletion_trigger`
- Closes all active chats for that profile
- Close reason: `profile_deleted`
- Notifies affected users: "This chat has been closed as the profile is no longer available"
- Soft delete (sets `deleted_at`)

### 9. ✅ Credit Refund Scenarios
- Function: `processRefund()` with audit trail
- Reasons: accidental_send, inappropriate_content, system_error, admin_discretion, account_deletion
- Stored in `credit_refunds` table
- Requires admin approval
- Tracks: refund amount, reason, message_id, processed_by, notes
- User notification sent after refund

### 10. ✅ Timezone & Peak Hour Pricing
- Standardized on **EAT (Africa/Nairobi, UTC+3)** for Kenya market
- Peak hours: 8pm-2am EAT (1.2x multiplier)
- Off-peak: 2am-8am EAT (0.8x multiplier)
- Uses `toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })`
- Consistent pricing regardless of user's device timezone

### 11. ✅ Duplicate Chat Prevention
- Database constraint: `UNIQUE(real_user_id, fictional_user_id)`
- UI debouncing on "Chat" button (500ms)
- Function: `create_or_get_chat()` returns existing chat if found
- Prevents multiple chats between same user pair

### 12. ✅ Negative Credits Prevention
- Database constraint: `CHECK (credits >= 0)`
- Row locking in transactions: `FOR UPDATE`
- Application-level validation before deduction
- Transaction rollback on insufficient credits
- Error: `InsufficientCreditsError`

### 13. ✅ Operator Availability Toggle
- Database trigger: `prevent_offline_with_active_chats_trigger`
- Prevents going offline with active chats
- Error message: "Cannot go offline with X active chats. Please reassign or close them first."
- Must reassign or close chats before going offline

### 14. ✅ Message Editing Audit Trail
- Table: `message_edit_history`
- Tracks: original_content, new_content, edited_by, editor_type, edit_reason
- Messages table fields: `is_edited`, `edited_by`, `edited_at`, `edit_count`
- Full audit trail for compliance
- Shows who edited (admin or operator) and when

### 15. ✅ Fictional Profile Picture Validation
- Table: `profile_media_validation`
- Minimum 3 photos enforced: `CHECK (array_length(profile_pictures, 1) >= 3)`
- Maximum 10 photos
- Validates: file_size, file_format, dimensions
- Content moderation: `is_flagged`, `flag_reason`
- Admin approval required

### 16. ✅ Location Validation
- Table: `location_validation_log`
- Geocoding validation via Google Maps API
- Checks coordinates match location text
- Stores: location_text, latitude, longitude
- Corrected values if needed
- Validation errors logged

### 17. ✅ Age Verification (18+ Compliance)
- Table: `age_verification_log`
- Enforced at registration: `CHECK (age >= 18 AND age <= 100)`
- Verification methods: self_declared, id_verification, third_party
- Logs: stated_age, verification_method, verified_by
- Legal compliance for adult content
- Admin can verify IDs manually

### 18. ✅ Banned User Circumvention
- Table: `banned_users_tracking`
- Tracks: ip_addresses, device_fingerprints, email_pattern
- Detects circumvention attempts
- Logs: circumvention_attempts, last_attempt_at
- Device fingerprinting in `user_activity_log`
- IP tracking for ban enforcement

### 19. ✅ Credit Package Price Changes
- Field: `package_snapshot` in transactions table
- Locks price at checkout time
- Stores complete package details in transaction
- Prevents mid-checkout price changes
- User pays the price they saw when clicking "Buy"

### 20. ✅ Operator Performance Degradation
- Database trigger: `check_operator_quality_trigger`
- Auto-suspends if `quality_score < quality_threshold` (default: 60)
- Suspension duration: 7 days for retraining
- Sets: `is_suspended`, `suspension_reason`, `suspended_until`
- Forces `is_available = false`
- Admin notification created
- Requires admin reactivation after retraining

---

## Admin Role Management

### Creating Additional Admins
- **Only super_admin can create other admins**
- Available roles: super_admin, admin, moderator
- Permission customization per role
- Cannot delete last super_admin (database trigger prevents this)

### Permission Levels

**Super Admin:**
- ✅ Manage users, fictional profiles, operators, chats
- ✅ View analytics, manage payments
- ✅ **Manage other admins** (create, edit, delete)
- ✅ **System settings** (platform configuration)
- ✅ **Delete data** (GDPR compliance)

**Admin:**
- ✅ Manage users, fictional profiles, operators, chats
- ✅ View analytics, manage payments
- ❌ Cannot manage other admins
- ❌ Cannot change system settings
- ❌ Limited delete permissions

**Moderator:**
- ✅ View and moderate chats
- ✅ Handle user reports
- ✅ Limited user management (ban/suspend)
- ❌ Cannot manage fictional profiles
- ❌ Cannot manage operators
- ❌ Cannot access payments
- ❌ Cannot view full analytics

---

## Security & Privacy

### Public-Facing Content Rules
**NEVER mention in user-facing areas:**
- Operators or operator management
- Admin or admin panel
- That profiles are fictional or managed
- Behind-the-scenes mechanics
- AI or automation (we removed AI, but don't mention operators either)

**Always use:**
- "Chat with exciting people"
- "Meet interesting profiles"
- "Connect with amazing personalities"
- Focus on emotional experience, not mechanics

### Hidden Routes
- `/op-login` - No links from public pages
- `/admin-login` - No links from public pages
- `/setup` - Only accessible if no admins exist
- Direct URL access only for operational routes

---

## Implementation Priority

**Phase 1 (Critical - Must Have):**
1. ✅ Admin bootstrap system (`/setup` page + Edge Function)
2. ✅ User account deletion (GDPR compliance)
3. ✅ Payment webhook handling with idempotency
4. ✅ Concurrent message race condition prevention
5. ✅ Operator reassignment loop prevention

**Phase 2 (Important - Should Have):**
6. ✅ Chat timeout & auto-close
7. ✅ Payment reconciliation dashboard
8. ✅ Operator performance auto-suspension
9. ✅ Message editing audit trail
10. ✅ Fictional profile deletion handling

**Phase 3 (Nice to Have):**
11. ✅ Age verification logging
12. ✅ Location validation
13. ✅ Profile picture validation
14. ✅ Banned user circumvention detection
15. ✅ Credit refund system

---

This context document serves as the complete blueprint for building Fantooo. Each section provides detailed specifications for implementation while maintaining the core vision of a seamless fantasy chat platform. All 20 critical edge cases are now documented and addressed with specific implementation details.
