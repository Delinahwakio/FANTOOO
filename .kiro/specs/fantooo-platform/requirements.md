# Requirements Document

## Introduction

Fantooo is an enterprise-grade fantasy chat platform where real users engage with fictional profiles managed by trained operators. The platform is engineered for scale, performance, security, and exceptional user experience. It features a sophisticated credit system, real-time chat capabilities, intelligent operator assignment, comprehensive admin controls, and GDPR-compliant data management. The system must handle millions of concurrent users with sub-100ms response times while maintaining strict security and privacy standards.

## Glossary

- **Real User**: An authenticated user who registers on the platform to chat with fictional profiles
- **Fictional User**: A profile created and managed by operators, representing a persona that real users can chat with
- **Operator**: A trained staff member who manages one or more fictional profiles and responds to real users
- **Admin**: Platform administrator with permissions to manage users, operators, fictional profiles, and system settings
- **Super Admin**: Highest privilege admin with full system access including admin management and system configuration
- **Chat**: A conversation session between a real user and a fictional user
- **Credit**: Virtual currency used by real users to send messages (1 credit = 10 KES)
- **Chat Queue**: Priority-based queue system for assigning incoming chats to available operators
- **Assignment**: The process of connecting an operator to a chat
- **Reassignment**: Moving a chat from one operator to another
- **Edge Function**: Serverless function running on Supabase for backend operations
- **RLS**: Row Level Security - PostgreSQL security feature for data access control
- **Paystack**: Payment gateway for processing credit purchases
- **EAT**: East Africa Time (UTC+3) - standardized timezone for the platform
- **GDPR**: General Data Protection Regulation - compliance framework for data privacy

## Requirements

### Requirement 1: Admin Bootstrap System

**User Story:** As a platform owner, I want to securely create the first super admin account, so that I can initialize the platform and manage it.

#### Acceptance Criteria

1. WHEN no admins exist in THE System, THE System SHALL display a setup page at `/setup`
2. WHEN THE setup page is accessed AND admins already exist, THE System SHALL redirect to the admin login page
3. WHEN THE setup form is submitted with valid credentials AND correct setup token, THE System SHALL create a super admin account with full permissions
4. WHEN THE super admin account is created, THE System SHALL disable the setup page permanently
5. THE System SHALL validate the setup token against the environment variable `ADMIN_SETUP_TOKEN`

### Requirement 2: User Registration and Authentication

**User Story:** As a new user, I want to register with my details and create an account, so that I can access the platform and chat with profiles.

#### Acceptance Criteria

1. WHEN THE user submits registration details, THE System SHALL validate age is 18 or above
2. WHEN THE username is entered, THE System SHALL check uniqueness with debouncing within 500 milliseconds
3. WHEN THE registration is complete, THE System SHALL generate an email address in format `username@fantooo.com`
4. WHEN THE location is entered, THE System SHALL validate coordinates using geocoding service
5. THE System SHALL log age verification details for compliance purposes

### Requirement 3: Fictional Profile Management

**User Story:** As an admin, I want to create and manage fictional profiles with rich details and media, so that real users have engaging profiles to interact with.

#### Acceptance Criteria

1. WHEN creating a fictional profile, THE System SHALL require minimum 3 profile pictures
2. WHEN creating a fictional profile, THE System SHALL allow maximum 10 profile pictures
3. WHEN a fictional profile is deleted, THE System SHALL close all active chats associated with that profile
4. WHEN a fictional profile is deleted, THE System SHALL notify affected real users
5. THE System SHALL validate all profile media for file size, format, and dimensions

### Requirement 4: Real-Time Chat System

**User Story:** As a real user, I want to send and receive messages in real-time, so that I can have engaging conversations with fictional profiles.

#### Acceptance Criteria

1. WHEN THE user sends a message, THE System SHALL deliver it to the assigned operator within 100 milliseconds
2. WHEN THE operator sends a message, THE System SHALL deliver it to the real user within 100 milliseconds
3. WHEN THE user is typing, THE System SHALL display typing indicator to the operator
4. WHEN THE operator is typing, THE System SHALL display typing indicator to the user
5. THE System SHALL maintain WebSocket connection with 15-second heartbeat pings

### Requirement 5: Credit System and Payment Processing

**User Story:** As a real user, I want to purchase credits securely, so that I can send paid messages to fictional profiles.

#### Acceptance Criteria

1. WHEN THE user initiates a credit purchase, THE System SHALL lock the package price at checkout time
2. WHEN Paystack webhook is received, THE System SHALL verify transaction using provider reference for idempotency
3. WHEN payment is successful, THE System SHALL add credits to user account within a database transaction
4. WHEN duplicate webhook is received, THE System SHALL increment webhook count without processing payment again
5. THE System SHALL prevent negative credit balance using database constraint and row locking

### Requirement 6: Message Cost Calculation

**User Story:** As a real user, I want transparent message pricing based on time and profile type, so that I understand the cost of my conversations.

#### Acceptance Criteria

1. WHEN THE user sends messages 1 through 3 in a chat, THE System SHALL charge zero credits
2. WHEN THE user sends message 4 or higher, THE System SHALL calculate cost based on time of day in EAT timezone
3. WHEN THE message is sent during peak hours (8pm-2am EAT), THE System SHALL apply 1.2x multiplier
4. WHEN THE message is sent during off-peak hours (2am-8am EAT), THE System SHALL apply 0.8x multiplier
5. WHEN THE fictional profile is featured, THE System SHALL apply 1.5x multiplier to base cost

### Requirement 7: Concurrent Message Race Condition Prevention

**User Story:** As a platform operator, I want to prevent users from sending more messages than their credit balance allows, so that the system maintains financial integrity.

#### Acceptance Criteria

1. WHEN THE user attempts to send a message, THE System SHALL lock the user row using `SELECT FOR UPDATE`
2. WHEN THE credit balance is insufficient, THE System SHALL reject the message and return an error
3. WHEN THE message is sent successfully, THE System SHALL deduct credits within the same transaction
4. WHEN THE transaction fails, THE System SHALL rollback all changes and log the failure
5. THE System SHALL enforce credit balance constraint at database level using `CHECK (credits >= 0)`

### Requirement 8: Operator Assignment and Queue Management

**User Story:** As an operator, I want to receive chat assignments based on my skills and availability, so that I can provide quality responses to users.

#### Acceptance Criteria

1. WHEN a chat enters THE queue, THE System SHALL calculate priority score based on user tier and wait time
2. WHEN an operator becomes available, THE System SHALL assign the highest priority chat matching operator skills
3. WHEN THE operator has 5 active chats, THE System SHALL not assign additional chats
4. WHEN THE operator specialization matches fictional profile type, THE System SHALL increase matching score
5. THE System SHALL track operator response time and user satisfaction for future assignments

### Requirement 9: Chat Reassignment and Loop Prevention

**User Story:** As a platform operator, I want to prevent infinite reassignment loops, so that problematic chats are escalated to admins.

#### Acceptance Criteria

1. WHEN a chat is reassigned, THE System SHALL increment assignment count
2. WHEN assignment count reaches 3, THE System SHALL change chat status to escalated
3. WHEN chat is escalated, THE System SHALL create high-priority admin notification
4. WHEN chat is escalated, THE System SHALL add flag `max_reassignments_reached`
5. THE System SHALL preserve full chat history and operator notes during reassignment

### Requirement 10: Chat Timeout and Auto-Closure

**User Story:** As a platform operator, I want inactive chats to close automatically, so that system resources are managed efficiently.

#### Acceptance Criteria

1. WHEN a chat has no activity for 24 hours, THE System SHALL close the chat automatically
2. WHEN a chat is auto-closed, THE System SHALL set close reason to `inactivity_timeout`
3. WHEN a chat is auto-closed, THE System SHALL not refund unused credits
4. THE System SHALL run auto-close check every hour via scheduled Edge Function
5. THE System SHALL update chat status to closed and set closed_at timestamp

### Requirement 11: Operator Availability Management

**User Story:** As an operator, I want to toggle my availability status, so that I can control when I receive new chat assignments.

#### Acceptance Criteria

1. WHEN THE operator attempts to go offline, THE System SHALL check for active chats
2. WHEN THE operator has active chats, THE System SHALL prevent going offline with error message
3. WHEN THE operator has zero active chats, THE System SHALL allow going offline
4. WHEN THE operator goes offline, THE System SHALL remove them from assignment pool
5. THE System SHALL enforce availability constraint using database trigger

### Requirement 12: Operator Performance Monitoring

**User Story:** As an admin, I want to monitor operator performance automatically, so that quality standards are maintained.

#### Acceptance Criteria

1. WHEN operator quality score drops below 60, THE System SHALL suspend the operator automatically
2. WHEN operator is suspended, THE System SHALL set suspension duration to 7 days
3. WHEN operator is suspended, THE System SHALL force availability to false
4. WHEN operator is suspended, THE System SHALL create admin notification
5. THE System SHALL track quality score based on response time, user ratings, and idle incidents

### Requirement 13: Message Editing and Audit Trail

**User Story:** As an admin, I want to edit messages with full audit trail, so that content can be moderated while maintaining accountability.

#### Acceptance Criteria

1. WHEN a message is edited, THE System SHALL store original content in message_edit_history table
2. WHEN a message is edited, THE System SHALL record editor ID and editor type (admin or operator)
3. WHEN a message is edited, THE System SHALL increment edit count on the message
4. WHEN a message is edited, THE System SHALL set is_edited flag to true
5. THE System SHALL display edit history with timestamps for compliance purposes

### Requirement 14: User Account Deletion (GDPR Compliance)

**User Story:** As a real user, I want to delete my account and data, so that I can exercise my right to be forgotten.

#### Acceptance Criteria

1. WHEN user account deletion is requested, THE System SHALL archive user data in deleted_users table
2. WHEN user account deletion is processed, THE System SHALL anonymize all messages to `[Message from deleted user]`
3. WHEN user account deletion is processed, THE System SHALL close all active chats
4. WHEN user account deletion is processed, THE System SHALL calculate refund for unused credits at 10 KES per credit
5. THE System SHALL delete auth user and soft delete user record with deleted_at timestamp

### Requirement 15: Operator Account Deletion

**User Story:** As an admin, I want to delete operator accounts safely, so that departing operators are removed without disrupting active chats.

#### Acceptance Criteria

1. WHEN operator deletion is requested, THE System SHALL check for active chats
2. WHEN operator has active chats, THE System SHALL reject deletion with error message
3. WHEN operator has zero active chats, THE System SHALL soft delete operator record
4. WHEN operator is deleted, THE System SHALL delete associated auth user
5. THE System SHALL preserve operator performance data with deleted_at timestamp

### Requirement 16: Payment Webhook Idempotency

**User Story:** As a platform operator, I want payment webhooks to be processed exactly once, so that credits are not duplicated.

#### Acceptance Criteria

1. WHEN a payment webhook is received, THE System SHALL check for existing transaction by provider_reference
2. WHEN transaction already exists with success status, THE System SHALL return success without processing
3. WHEN transaction exists but not successful, THE System SHALL update webhook count
4. WHEN transaction is new, THE System SHALL create transaction record and add credits
5. THE System SHALL enforce unique constraint on provider_reference at database level

### Requirement 17: Payment Reconciliation

**User Story:** As an admin, I want to manually reconcile failed payments, so that legitimate purchases are honored.

#### Acceptance Criteria

1. WHEN payment reconciliation is initiated, THE System SHALL query Paystack API for transaction status
2. WHEN Paystack shows success but credits not added, THE System SHALL add credits to user account
3. WHEN reconciliation is complete, THE System SHALL update transaction status to success
4. WHEN reconciliation is complete, THE System SHALL record admin ID and timestamp
5. THE System SHALL display failed payments dashboard with reconciliation interface

### Requirement 18: Credit Refund Processing

**User Story:** As an admin, I want to refund credits to users, so that customer service issues can be resolved.

#### Acceptance Criteria

1. WHEN a refund is requested, THE System SHALL require refund reason from predefined list
2. WHEN refund is approved, THE System SHALL add credits back to user account
3. WHEN refund is processed, THE System SHALL create audit record in credit_refunds table
4. WHEN refund is processed, THE System SHALL record admin ID and notes
5. THE System SHALL notify user of refund with reason

### Requirement 19: Admin Role Management

**User Story:** As a super admin, I want to create admins with different permission levels, so that access control is properly managed.

#### Acceptance Criteria

1. WHEN creating an admin, THE System SHALL allow role selection from super_admin, admin, or moderator
2. WHEN assigning permissions, THE System SHALL enforce role-based permission templates
3. WHEN deleting an admin, THE System SHALL check if they are the last super admin
4. WHEN attempting to delete last super admin, THE System SHALL reject with error message
5. THE System SHALL enforce super admin protection using database trigger

### Requirement 20: Public-Facing Content Security

**User Story:** As a platform owner, I want the landing page to hide operational details, so that the user experience remains immersive.

#### Acceptance Criteria

1. THE landing page SHALL not mention operators, admins, or fictional profiles
2. THE landing page SHALL not contain links to `/op-login` or `/admin-login`
3. THE landing page SHALL use user-facing language like "Chat with exciting people"
4. THE landing page SHALL focus on emotional value proposition
5. THE System SHALL restrict operational routes to direct URL access only

### Requirement 21: Banned User Circumvention Detection

**User Story:** As an admin, I want to detect when banned users try to create new accounts, so that platform rules are enforced.

#### Acceptance Criteria

1. WHEN a user is banned, THE System SHALL record IP addresses and device fingerprints
2. WHEN a new registration occurs, THE System SHALL check IP and device against banned_users_tracking
3. WHEN a match is found, THE System SHALL increment circumvention_attempts counter
4. WHEN circumvention is detected, THE System SHALL flag the new account for admin review
5. THE System SHALL log all circumvention attempts with timestamps

### Requirement 22: Location Validation

**User Story:** As a real user, I want my location to be validated, so that my profile shows accurate geographic information.

#### Acceptance Criteria

1. WHEN a location is entered, THE System SHALL query geocoding service for coordinates
2. WHEN coordinates are returned, THE System SHALL validate they match the location text
3. WHEN validation fails, THE System SHALL log error in location_validation_log table
4. WHEN validation succeeds, THE System SHALL store latitude and longitude
5. THE System SHALL provide corrected location suggestions when validation fails

### Requirement 23: Age Verification Logging

**User Story:** As a platform operator, I want age verification logged, so that legal compliance is maintained.

#### Acceptance Criteria

1. WHEN a user registers, THE System SHALL log stated age in age_verification_log table
2. WHEN age is below 18, THE System SHALL reject registration
3. WHEN age is 18 or above, THE System SHALL allow registration
4. THE System SHALL record verification method as self_declared
5. THE System SHALL enforce age constraint at database level using `CHECK (age >= 18 AND age <= 100)`

### Requirement 24: Duplicate Chat Prevention

**User Story:** As a real user, I want to avoid creating duplicate chats with the same profile, so that my conversations are organized.

#### Acceptance Criteria

1. WHEN a user initiates a chat, THE System SHALL check for existing chat between user and fictional profile
2. WHEN existing chat is found, THE System SHALL return the existing chat
3. WHEN no existing chat is found, THE System SHALL create new chat
4. THE System SHALL enforce unique constraint on (real_user_id, fictional_user_id) at database level
5. THE System SHALL debounce chat button clicks with 500 millisecond delay

### Requirement 25: Real-Time Operator Dashboard

**User Story:** As an operator, I want a three-panel chat interface, so that I can manage conversations effectively.

#### Acceptance Criteria

1. THE operator chat interface SHALL display real user profile in left panel
2. THE operator chat interface SHALL display chat history in center panel
3. THE operator chat interface SHALL display fictional user profile in right panel
4. WHEN operator adds notes, THE System SHALL save notes to database
5. THE operator interface SHALL display assignment information and previous operators

### Requirement 26: Admin Chat Inspection

**User Story:** As an admin, I want to inspect all chats in real-time, so that I can monitor quality and intervene when needed.

#### Acceptance Criteria

1. THE admin dashboard SHALL display live chat grid with status indicators
2. WHEN a chat approaches timeout, THE System SHALL display visual alert
3. WHEN admin selects a chat, THE System SHALL display three-panel view with full history
4. THE admin interface SHALL allow message editing with audit trail
5. THE admin interface SHALL allow manual chat reassignment

### Requirement 27: Analytics and Reporting

**User Story:** As an admin, I want comprehensive analytics, so that I can make data-driven decisions.

#### Acceptance Criteria

1. THE analytics dashboard SHALL display total users, active chats, and revenue metrics
2. THE analytics dashboard SHALL display operator performance rankings
3. THE analytics dashboard SHALL display user engagement trends over time
4. THE analytics dashboard SHALL display conversion rates from free to paid messages
5. THE System SHALL update analytics in real-time using materialized views

### Requirement 28: Email System Configuration

**User Story:** As a platform owner, I want email addresses to work with payment receipts, so that users receive transaction confirmations.

#### Acceptance Criteria

1. THE System SHALL generate email addresses in format `username@fantooo.com`
2. THE System SHALL configure Cloudflare Email Routing for catch-all forwarding
3. WHEN Paystack sends receipt, THE email SHALL be forwarded to admin inbox
4. THE System SHALL validate email addresses pass Paystack validation
5. THE System SHALL document email setup in deployment guide

### Requirement 29: Database Partitioning

**User Story:** As a platform operator, I want messages partitioned by month, so that query performance remains optimal at scale.

#### Acceptance Criteria

1. THE messages table SHALL be partitioned by created_at timestamp
2. THE System SHALL create monthly partitions automatically
3. WHEN querying messages, THE System SHALL use partition pruning for performance
4. THE System SHALL maintain indexes on each partition
5. THE System SHALL archive old partitions after 12 months

### Requirement 30: Security and RLS Policies

**User Story:** As a platform operator, I want row-level security enforced, so that users can only access their own data.

#### Acceptance Criteria

1. THE System SHALL enforce RLS policy that real users can only access their own data
2. THE System SHALL enforce RLS policy that operators can only access assigned chats
3. THE System SHALL enforce RLS policy that admins have full access to all data
4. THE System SHALL allow public read access to fictional profiles with limited fields only
5. THE System SHALL exclude operator guidelines from public fictional profile access
