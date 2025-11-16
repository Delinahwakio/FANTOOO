# Implementation Plan

## Overview

This implementation plan breaks down the Fantooo platform development into discrete, manageable coding tasks. Each task builds incrementally on previous work, ensuring a solid foundation before adding complexity. The plan follows a bottom-up approach: database → backend logic → API layer → frontend components → integration → testing.

All tasks reference specific requirements from the requirements document and are designed to be executed by a coding agent with full context from the requirements and design documents.

---

## Phase 1: Project Foundation and Database Setup

- [x] 1. Initialize Next.js project with TypeScript and Tailwind CSS
















  - Create Next.js 14 project with App Router
  - Configure TypeScript with strict mode
  - Set up Tailwind CSS with custom configuration
  - Install core dependencies: @supabase/supabase-js, @supabase/auth-helpers-nextjs, zustand, @tanstack/react-query
  - Configure environment variables structure
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Set up Supabase project and local development environment





  - Initialize Supabase project locally with CLI
  - Configure Supabase connection in lib/supabase/client.ts and lib/supabase/server.ts
  - Set up environment variables for Supabase URL and keys
  - Create .env.local and .env.example files
  - Test database connection
  - _Requirements: All requirements depend on database connectivity_

- [x] 3. Create core database schema - Part 1: User tables





  - Write migration file for real_users table with all fields, constraints, and indexes
  - Write migration file for fictional_users table with profile picture validation
  - Write migration file for admins table with role-based permissions
  - Write migration file for operators table with performance tracking
  
  - _Requirements: 1.1-1.5 (Admin Bootstrap), 2.1-2.5 (User Registration), 3.1-3.5 (Fictional Profiles)_

- [x] 4. Create core database schema - Part 2: Chat and messaging tables








  - Write migration file for chats table with assignment tracking
  - Write migration file for messages table with partitioning by month
  - Create initial monthly partitions for messages table
  - Write migration file for chat_queue table with priority scoring
 
  - _Requirements: 4.1-4.5 (Real-Time Chat), 8.1-8.5 (Operator Assignment), 9.1-9.5 (Chat Reassignment)_

- [x] 5. Create core database schema - Part 3: Payment and audit tables





  - Write migration file for transactions table with idempotency constraints
  - Write migration file for credit_packages table
  - Write migration file for credit_refunds table
  - Write migration file for message_edit_history table
  - Write migration file for deleted_users table
  - Write migration file for banned_users_tracking table
  - Write migration file for user_activity_log table with partitioning
  - Write migration file for admin_notifications table
  
  - _Requirements: 5.1-5.5 (Credit System), 13.1-13.5 (Message Editing), 14.1-14.5 (User Deletion), 16.1-16.5 (Payment Idempotency)_


- [x] 6. Implement database triggers and constraints





  - Create trigger to prevent last super_admin deletion
  - Create trigger to handle fictional_user deletion (close active chats)
  - Create trigger to prevent operator going offline with active chats
  - Create trigger to handle operator deletion (reassign chats)
  - Create trigger to auto-suspend operators with low quality scores
  - Create trigger to prevent duplicate transaction processing
  - Create function to check message credits with row locking
  
  - _Requirements: 1.1-1.5 (Admin Bootstrap), 3.1-3.5 (Fictional Profiles), 11.1-11.5 (Operator Availability), 12.1-12.5 (Operator Performance), 15.1-15.5 (Operator Deletion)_

- [x] 7. Implement Row Level Security (RLS) policies





  - Create RLS policies for real_users table (users see own data, admins see all)
  - Create RLS policies for fictional_users table (public limited view, operators full view, admins manage)
  - Create RLS policies for chats table (users see own, operators see assigned, admins see all)
  - Create RLS policies for messages table (users see own chat messages, operators see assigned)
  - Create RLS policies for operators table (operators see own data, admins manage)
  - Create RLS policies for admins table (admins see own data, super_admins manage)
  - Create RLS policies for transactions table (users see own, admins see all)
  - Enable RLS on all tables
  - _Requirements: 30.1-30.5 (Security and RLS Policies)_

- [x] 8. Create database functions for business logic





  - Write function get_available_fictional_profiles(user_id, gender_preference) with filtering
  - Write function create_or_get_chat(real_user_id, fictional_user_id) with duplicate prevention
  - Write function calculate_message_cost(chat_id, user_id, message_number, time_of_day) with EAT timezone
  - Write function update_operator_stats(operator_id, date) for performance tracking
  - Write function assign_chat_to_operator(chat_id) with skill matching algorithm
 
  - _Requirements: 6.1-6.5 (Message Cost), 8.1-8.5 (Operator Assignment), 24.1-24.5 (Duplicate Chat Prevention)_

- [x] 9. Create database indexes for performance optimization





  - Create composite indexes on frequently queried columns
  - Create partial indexes for specific conditions (active chats, pending transactions)
  - Create GIN indexes for array columns (tags, specializations)
  - Create indexes on foreign keys
  
  - _Requirements: Performance optimization for all features_

- [x] 10. Seed initial data for development



  - Create seed script for credit packages (10, 50, 100, 500 credits)
  - Create seed script for sample fictional profiles (minimum 10 profiles)
  - Create seed script for operator specializations and response templates
 
  - _Requirements: 3.1-3.5 (Fictional Profiles), 5.1-5.5 (Credit System)_

---

## Phase 2: Authentication and Core Backend Logic

- [x] 11. Implement authentication system with Supabase Auth





  - Create authentication utilities in lib/supabase/auth.ts
  - Implement signUp function with email/password
  - Implement signIn function with email/password
  - Implement signOut function
  - Implement getSession function for server-side
  - Create middleware for protected routes
  
  - _Requirements: 2.1-2.5 (User Registration)_

- [x] 12. Create user registration business logic





  - Implement username uniqueness check with debouncing
  - Implement age validation (18+ enforcement)
  - Implement location validation with geocoding
  - Create function to generate email format (username@fantooo.com)
  - Create function to log age verification
  - Write user registration handler with transaction safety
  - _Requirements: 2.1-2.5 (User Registration), 22.1-22.5 (Location Validation), 23.1-23.5 (Age Verification)_

- [x] 13. Implement credit calculation system





  - Create credit calculation utility in lib/utils/credits.ts
  - Implement calculateMessageCost function with all multipliers (time, tier, featured)
  - Implement timezone handling for EAT (Africa/Nairobi)
  - Implement peak/off-peak hour detection
  - Implement tier discount calculation
  
  - _Requirements: 6.1-6.5 (Message Cost Calculation)_

- [x] 14. Implement message sending with transaction safety





  - Create sendMessage function with database transaction
  - Implement row locking (SELECT FOR UPDATE) to prevent race conditions
  - Implement credit deduction within transaction
  - Implement rollback on insufficient credits
  - Implement failed transaction logging
  - Handle InsufficientCreditsError
  - _Requirements: 7.1-7.5 (Race Condition Prevention), 4.1-4.5 (Real-Time Chat)_

- [-] 15. Implement chat creation and management



  - Create createChat function with duplicate prevention
  - Implement getChat function with user validation
  - Implement closeChat function with reason tracking
  - Implement updateChatMetrics function (message count, credits spent)
  
  - _Requirements: 4.1-4.5 (Real-Time Chat), 24.1-24.5 (Duplicate Chat Prevention)_


- [x] 16. Implement operator assignment and queue management





  - Create addToQueue function with priority calculation
  - Implement priority scoring algorithm (user tier, wait time, VIP status)
  - Create assignOperator function with skill matching
  - Implement operator availability checking
  - Implement workload balancing (max 1 concurrent chat)
  - Create reassignChat function with loop prevention (max 3 attempts)
  - Implement chat escalation after max reassignments
  - _Requirements: 8.1-8.5 (Operator Assignment), 9.1-9.5 (Chat Reassignment)_

- [x] 17. Implement payment processing with Paystack





  - Create Paystack integration utilities in lib/payment/paystack.ts
  - Implement initializePayment function with package price locking
  - Implement verifyPayment function
  - Create webhook signature verification function
  - Implement idempotency checking by provider_reference
  - Handle duplicate webhook processing
  - _Requirements: 5.1-5.5 (Credit System), 16.1-16.5 (Payment Idempotency)_

- [x] 18. Create Supabase Edge Functions - Part 1: Admin and User Management





  - Create bootstrap-first-admin Edge Function with setup token validation
  - Create delete-user-account Edge Function with GDPR compliance (anonymize messages, archive data, calculate refund)
  - Create delete-operator-account Edge Function with active chat checking
  
  - _Requirements: 1.1-1.5 (Admin Bootstrap), 14.1-14.5 (User Deletion), 15.1-15.5 (Operator Deletion)_

- [x] 19. Create Supabase Edge Functions - Part 2: Payment and Automation





  - Create process-payment Edge Function with webhook handling and idempotency
  - Create reconcile-payments Edge Function for manual payment reconciliation
  - Create auto-close-inactive-chats Edge Function (scheduled hourly)
  - Create escalate-problematic-chats Edge Function (scheduled every 15 minutes)
 
  - _Requirements: 5.1-5.5 (Credit System), 10.1-10.5 (Chat Timeout), 17.1-17.5 (Payment Reconciliation)_

- [x] 20. Implement credit refund system





  - Create processRefund function with audit trail
  - Implement refund reason validation
  - Create refund approval workflow
  - Implement credit addition with transaction safety
 
  - _Requirements: 18.1-18.5 (Credit Refund Processing)_

---

## Phase 3: Design System and UI Components

- [x] 21. Set up design system foundation





  - Configure Tailwind CSS with custom color palette (passion, luxury, trust, neutral)
  - Configure custom fonts (Playfair Display, Inter)
  - Create CSS variables for spacing, typography, and colors
  - Set up responsive breakpoints
  - Create animation keyframes (shimmer, pulse, bounce, slideIn, fadeIn)
  - _Requirements: Design system implementation_

- [x] 22. Create base UI components - Part 1: Glass components





  - Create GlassCard component with variants (default, elevated, subtle)
  - Create GlassButton component with variants (passion, luxury, outline, ghost) and sizes
  - Create GlassInput component with error states, labels, and icons
  - Create LoadingSpinner component with sizes
 
  - _Requirements: Design system implementation_

- [x] 23. Create base UI components - Part 2: Feedback and navigation





  - Create Modal component with animations using Headless UI
  - Create Toast notification system with variants (success, error, warning, info)
  - Create Navigation component with role-based menu items
  - Create Dropdown component for user menus
 
  - _Requirements: Design system implementation_

- [x] 24. Create profile components





  - Create ProfileCard component for fictional user display
  - Create ProfileCarousel component for image galleries
  - Create ProfileGrid component with responsive layout
  - Create ProfileDetails component for full profile view
  
  - _Requirements: 3.1-3.5 (Fictional Profiles)_

- [x] 25. Create chat components - Part 1: Message display





  - Create ChatBubble component with sender differentiation
  - Create MessageList component with virtual scrolling
  - Create TypingIndicator component with animation
  - Create MessageStatus component (sending, sent, delivered, read)
 
  - _Requirements: 4.1-4.5 (Real-Time Chat)_

- [x] 26. Create chat components - Part 2: Message input and actions





  - Create MessageInput component with character limit
  - Create EmojiPicker component integration
  - Create MediaUpload component for images/videos
  - Create CreditIndicator component showing remaining credits
  
  - _Requirements: 4.1-4.5 (Real-Time Chat), 6.1-6.5 (Message Cost)_

- [x] 27. Create operator-specific components





  - Create ThreePanelLayout component (real user | chat | fictional user)
  - Create ProfileNotes component with save functionality
  - Create QueueDisplay component showing waiting chats
  - Create AvailabilityToggle component with active chat validation
  - Create ResponseTemplates component for quick replies
  - _Requirements: 11.1-11.5 (Operator Availability), 25.1-25.5 (Operator Dashboard)_

- [x] 28. Create admin-specific components





  - Create ChatInspector component with live monitoring
  - Create UserManagement component with CRUD operations
  - Create OperatorManagement component with performance metrics
  - Create PaymentReconciliation component
  - Create AnalyticsDashboard component with charts
  - _Requirements: 17.1-17.5 (Payment Reconciliation), 19.1-19.5 (Admin Role Management), 26.1-26.5 (Admin Chat Inspection), 27.1-27.5 (Analytics)_


- [x] 29. Create shared utility components





  - Create LocationAutocomplete component with Google Maps integration
  - Create PaymentModal component with Paystack integration
  - Create ImageUpload component with validation
  - Create DatePicker component
  - Create SearchBar component with debouncing
  - _Requirements: 2.1-2.5 (User Registration), 5.1-5.5 (Credit System), 22.1-22.5 (Location Validation)_

---

## Phase 4: Frontend Pages and User Flows

- [x] 30. Create landing page (/)





  - Implement hero section with emotional value proposition
  - Create "How it works" section (user-facing language only)
  - Add call-to-action buttons
  - Implement glassmorphism design
  - Ensure NO operational details are visible (no mention of operators, admins, fictional)
  
  - _Requirements: 20.1-20.5 (Public-Facing Content Security)_

- [x] 31. Create admin setup page (/setup)





  - Implement setup form with name, email, password, setup token fields
  - Add setup token validation against environment variable
  - Implement check for existing admins (show only if none exist)
  - Create first super_admin account on submission
  - Redirect to admin login after successful setup
  - Self-disable after first admin created
  - _Requirements: 1.1-1.5 (Admin Bootstrap System)_

- [x] 32. Create user onboarding flow (/get-started)





  - Implement Step 1: Username input with uniqueness check and debouncing
  - Implement Step 2: Location autocomplete, gender, age (18+ validation), looking_for
  - Implement Step 3: Password creation with complexity requirements
  - Auto-generate email format (username@fantooo.com)
  - Log age verification for compliance
  - Create user account and redirect to discover page
  - _Requirements: 2.1-2.5 (User Registration), 22.1-22.5 (Location Validation), 23.1-23.5 (Age Verification)_

- [x] 33. Create operator login page (/op-login)





  - Implement login form with email and password
  - Add authentication with Supabase Auth
  - Validate operator role
  - Redirect to operator waiting room on success
  - Ensure NO link from landing page (hidden route)
  - _Requirements: 11.1-11.5 (Operator Availability)_

- [x] 34. Create admin login page (/admin-login)





  - Implement login form with email and password
  - Add authentication with Supabase Auth
  - Validate admin role
  - Redirect to admin dashboard on success
  - Ensure NO link from landing page (hidden route)
  - _Requirements: 1.1-1.5 (Admin Bootstrap), 19.1-19.5 (Admin Role Management)_

- [x] 35. Create discover page (/discover)





  - Implement fictional profile grid with filtering
  - Add search functionality
  - Implement infinite scroll pagination
  - Add filter by gender, age, location
  - Create "Chat" button with duplicate chat prevention
  - Add favorite functionality
  - _Requirements: 3.1-3.5 (Fictional Profiles), 24.1-24.5 (Duplicate Chat Prevention)_

- [x] 36. Create profile view page (/profile/[id])





  - Display full fictional profile with all details
  - Implement photo carousel
  - Show bio, interests, personality traits
  - Add "Start Chat" button
  - Add favorite/unfavorite button
  - Handle profile not found error
  - _Requirements: 3.1-3.5 (Fictional Profiles)_

- [x] 37. Create user chat page (/chat/[chatId])





  - Implement real-time chat interface
  - Display message history with virtual scrolling
  - Show credit indicator
  - Implement message input with credit cost preview
  - Handle insufficient credits (show purchase modal)
  - Show typing indicators
  - Implement optimistic updates
  - _Requirements: 4.1-4.5 (Real-Time Chat), 6.1-6.5 (Message Cost), 7.1-7.5 (Race Condition Prevention)_

- [x] 38. Create favorites page (/favorites)





  - Display grid of favorited fictional profiles
  - Implement quick chat access
  - Add unfavorite functionality
  - Handle empty state
  - _Requirements: 3.1-3.5 (Fictional Profiles)_

- [x] 39. Create user profile page (/me)





  - Display user information
  - Implement profile editing (name, bio, location, profile picture)
  - Show chat history
  - Display credit balance
  - Add account deletion option with confirmation
  - _Requirements: 2.1-2.5 (User Registration), 14.1-14.5 (User Deletion)_

- [x] 40. Create credits purchase page (/credits)





  - Display credit packages with pricing
  - Highlight featured packages (POPULAR, BEST VALUE)
  - Implement Paystack payment integration
  - Show transaction history
  - Handle payment success/failure
  - _Requirements: 5.1-5.5 (Credit System), 16.1-16.5 (Payment Idempotency)_


---

## Phase 5: Operator Interface

- [ ] 41. Create operator waiting room page (/operator/waiting)
  - Display assignment queue with priority indicators
  - Show operator stats (messages sent, chats handled, quality score)
  - Implement availability toggle with active chat validation
  - Display current active chats
  - Show quality score and suspension warnings
  - Auto-refresh queue every 10 seconds
  - _Requirements: 8.1-8.5 (Operator Assignment), 11.1-11.5 (Operator Availability), 12.1-12.5 (Operator Performance)_

- [ ] 42. Create operator chat page (/operator/chat/[chatId])
  - Implement three-panel layout (real user | chat | fictional user)
  - Display real user profile in left panel with editable notes
  - Display chat history in center panel
  - Display fictional user profile in right panel with personality guidelines and response templates
  - Implement message sending as fictional user
  - Show assignment information (current operator, previous operators)
  - Add save notes functionality for both profiles
  - _Requirements: 4.1-4.5 (Real-Time Chat), 25.1-25.5 (Operator Dashboard)_

- [ ] 43. Create operator stats page (/operator/stats)
  - Display personal performance metrics (response time, user ratings, messages sent)
  - Show quality score trends over time
  - Display idle incidents and reassignment count
  - Show suspension warnings if quality score is low
  - Implement date range filtering
  - _Requirements: 12.1-12.5 (Operator Performance)_

- [ ] 44. Create operator settings page (/operator/settings)
  - Implement password change functionality
  - Allow specialization preferences editing
  - Display account information
  - Show suspension status and reason if applicable
  - _Requirements: 11.1-11.5 (Operator Availability), 12.1-12.5 (Operator Performance)_

---

## Phase 6: Admin Panel

- [ ] 45. Create admin dashboard page (/admin/dashboard)
  - Display overview statistics (total users, active chats, revenue)
  - Show unread admin notifications
  - Display system health indicators
  - Show recent activity feed
  - Add quick access links to all admin sections
  - _Requirements: 27.1-27.5 (Analytics and Reporting)_

- [ ] 46. Create fictional profiles management page (/admin/fictional-profiles)
  - Implement CRUD operations for fictional profiles
  - Add profile picture upload with validation (min 3, max 10)
  - Implement bulk import functionality
  - Show active chat count before deletion
  - Add featured profile toggle
  - Display profile performance metrics
  - _Requirements: 3.1-3.5 (Fictional Profiles)_

- [ ] 47. Create real users management page (/admin/real-users)
  - Display user list with search and filtering
  - Implement user details view
  - Add block/suspend functionality
  - Implement account deletion with GDPR compliance
  - Create credit refund interface
  - Show ban circumvention detection alerts
  - _Requirements: 14.1-14.5 (User Deletion), 18.1-18.5 (Credit Refund), 21.1-21.5 (Banned User Detection)_

- [ ] 48. Create operators management page (/admin/operators)
  - Implement operator account creation
  - Display operator list with performance metrics
  - Show quality scores and suspension status
  - Implement operator suspension/reactivation
  - Add active chat check before deletion
  - Display operator activity logs
  - _Requirements: 12.1-12.5 (Operator Performance), 15.1-15.5 (Operator Deletion)_

- [ ] 49. Create chat management page (/admin/chats)
  - Implement chat search and filtering
  - Display live chat grid with status indicators
  - Show escalated chats queue
  - Implement chat inspection with three-panel view
  - Add message editing with audit trail
  - Show reassignment history
  - Implement manual chat reassignment
  - _Requirements: 9.1-9.5 (Chat Reassignment), 13.1-13.5 (Message Editing), 26.1-26.5 (Admin Chat Inspection)_

- [ ] 50. Create payment reconciliation page (/admin/payments)
  - Display failed payments dashboard
  - Implement manual reconciliation interface
  - Show transaction details with Paystack status
  - Add refund processing functionality
  - Display transaction audit trail
  - Show webhook duplicate detection
  - _Requirements: 16.1-16.5 (Payment Idempotency), 17.1-17.5 (Payment Reconciliation)_

- [ ] 51. Create admin management page (/admin/admins)
  - Implement admin creation (super_admin only)
  - Display admin list with roles
  - Add role assignment (super_admin, admin, moderator)
  - Implement permission management
  - Prevent deletion of last super_admin
  - Show admin activity logs
  - _Requirements: 1.1-1.5 (Admin Bootstrap), 19.1-19.5 (Admin Role Management)_

- [ ] 52. Create platform analytics page (/admin/stats)
  - Display platform-wide analytics (users, chats, revenue)
  - Show operator performance rankings
  - Display revenue metrics over time
  - Show user engagement trends
  - Implement conversion rate tracking (free to paid)
  - Add date range filtering and export functionality
  - _Requirements: 27.1-27.5 (Analytics and Reporting)_

- [ ] 53. Create admin settings page (/admin/settings)
  - Implement platform configuration options
  - Add credit package management
  - Configure peak/off-peak hours
  - Set operator quality thresholds
  - Manage system-wide settings
  - _Requirements: 6.1-6.5 (Message Cost), 12.1-12.5 (Operator Performance)_


---

## Phase 7: Real-time Features and Integration

- [ ] 54. Implement real-time chat subscriptions
  - Create useRealtime hook for WebSocket connections
  - Implement message subscription for specific chat
  - Handle new message events with optimistic updates
  - Implement typing indicator broadcasting
  - Handle connection state (connected, disconnected, reconnecting)
  - Implement automatic reconnection with exponential backoff
  - _Requirements: 4.1-4.5 (Real-Time Chat)_

- [ ] 55. Implement real-time operator assignment notifications
  - Create subscription for chat queue updates
  - Notify operators of new chat assignments
  - Update operator dashboard in real-time
  - Handle assignment acceptance/rejection
  - _Requirements: 8.1-8.5 (Operator Assignment)_

- [ ] 56. Implement real-time admin notifications
  - Create subscription for admin_notifications table
  - Display toast notifications for critical events
  - Update notification badge count
  - Implement notification read/unread status
  - _Requirements: 9.1-9.5 (Chat Reassignment), 12.1-12.5 (Operator Performance)_

- [ ] 57. Implement presence detection and heartbeat system
  - Create heartbeat mechanism with 15-second intervals
  - Track user online/offline status
  - Detect tab visibility and mouse activity
  - Update last_active_at timestamps
  - Handle network quality monitoring
  - _Requirements: 4.1-4.5 (Real-Time Chat)_

- [ ] 58. Implement state management with Zustand
  - Create auth store for user session
  - Create chat store for active conversations
  - Create credits store for balance tracking
  - Create notifications store for toast messages
  - Implement persistence for critical state
  - _Requirements: All user-facing features_

- [ ] 59. Implement React Query for server state
  - Configure QueryClient with caching strategy
  - Create queries for fictional profiles (30min cache)
  - Create queries for user credits (no cache)
  - Create queries for chat messages with pagination
  - Implement optimistic updates for messages
  - Add error handling and retry logic
  - _Requirements: All data fetching operations_

---

## Phase 8: API Routes and Server Actions

- [ ] 60. Create API routes for authentication
  - Implement POST /api/auth/signup with user registration logic
  - Implement POST /api/auth/signin with authentication
  - Implement POST /api/auth/signout
  - Implement GET /api/auth/session for session validation
  - Add rate limiting (5 requests per minute)
  - _Requirements: 2.1-2.5 (User Registration)_

- [ ] 61. Create API routes for user management
  - Implement GET /api/users/me for current user profile
  - Implement PATCH /api/users/me for profile updates
  - Implement DELETE /api/users/me for account deletion
  - Implement GET /api/users/credits for credit balance
  - Add input validation with Zod
  - _Requirements: 2.1-2.5 (User Registration), 14.1-14.5 (User Deletion)_

- [ ] 62. Create API routes for fictional profiles
  - Implement GET /api/fictional-profiles with filtering and pagination
  - Implement GET /api/fictional-profiles/[id] for single profile
  - Implement POST /api/fictional-profiles (admin only)
  - Implement PATCH /api/fictional-profiles/[id] (admin only)
  - Implement DELETE /api/fictional-profiles/[id] (admin only)
  - _Requirements: 3.1-3.5 (Fictional Profiles)_

- [ ] 63. Create API routes for chat operations
  - Implement POST /api/chats for chat creation with duplicate prevention
  - Implement GET /api/chats for user's chat list
  - Implement GET /api/chats/[id] for single chat
  - Implement POST /api/chats/[id]/messages for sending messages with transaction safety
  - Implement GET /api/chats/[id]/messages for message history with pagination
  - Implement PATCH /api/chats/[id]/close for closing chats
  - Add rate limiting (60 messages per minute)
  - _Requirements: 4.1-4.5 (Real-Time Chat), 7.1-7.5 (Race Condition Prevention), 24.1-24.5 (Duplicate Chat Prevention)_

- [ ] 64. Create API routes for payment operations
  - Implement POST /api/payments/initialize for Paystack payment initialization
  - Implement POST /api/payments/webhook for Paystack webhook handling
  - Implement GET /api/payments/transactions for transaction history
  - Implement POST /api/payments/verify for manual verification
  - Add webhook signature verification
  - _Requirements: 5.1-5.5 (Credit System), 16.1-16.5 (Payment Idempotency)_

- [ ] 65. Create API routes for operator operations
  - Implement GET /api/operator/queue for assignment queue
  - Implement POST /api/operator/availability for toggling availability
  - Implement POST /api/operator/accept-chat for accepting assignments
  - Implement GET /api/operator/stats for performance metrics
  - _Requirements: 8.1-8.5 (Operator Assignment), 11.1-11.5 (Operator Availability)_

- [ ] 66. Create API routes for admin operations
  - Implement GET /api/admin/users with search and filtering
  - Implement POST /api/admin/users/[id]/ban for banning users
  - Implement POST /api/admin/users/[id]/refund for credit refunds
  - Implement GET /api/admin/operators with performance data
  - Implement POST /api/admin/operators for creating operators
  - Implement GET /api/admin/chats with filtering
  - Implement PATCH /api/admin/messages/[id] for message editing
  - Implement GET /api/admin/analytics for platform statistics
  - _Requirements: 13.1-13.5 (Message Editing), 17.1-17.5 (Payment Reconciliation), 18.1-18.5 (Credit Refund), 27.1-27.5 (Analytics)_

- [ ] 67. Create cron job API routes
  - Implement GET /api/cron/auto-close-chats (hourly)
  - Implement GET /api/cron/escalate-chats (every 15 minutes)
  - Implement GET /api/cron/update-operator-stats (daily)
  - Implement GET /api/cron/refresh-materialized-views (every 6 hours)
  - Add cron secret verification
  - _Requirements: 10.1-10.5 (Chat Timeout), 9.1-9.5 (Chat Reassignment)_


---

## Phase 9: Security and Performance

- [ ] 68. Implement input validation and sanitization
  - Create validation schemas with Zod for all API routes
  - Implement XSS prevention with DOMPurify
  - Add SQL injection prevention (parameterized queries)
  - Validate file uploads (size, type, dimensions)
  - Sanitize user-generated content
  - _Requirements: 30.1-30.5 (Security and RLS Policies)_

- [ ] 69. Implement rate limiting
  - Create rate limiting middleware with Redis or in-memory store
  - Apply different limits per endpoint (auth: 5/min, messages: 60/min, API: 100/min)
  - Implement IP-based rate limiting
  - Add rate limit headers to responses
  - Handle rate limit exceeded errors
  - _Requirements: Security best practices_

- [ ] 70. Implement error handling and logging
  - Create centralized error handling middleware
  - Implement error logging with Sentry or similar
  - Create custom error classes (APIError, InsufficientCreditsError, etc.)
  - Add error context and stack traces
  - Implement user-friendly error messages
  - Log security events (failed logins, permission denied)
  - _Requirements: All features require proper error handling_

- [ ] 71. Implement performance optimizations - Frontend
  - Add code splitting with dynamic imports
  - Implement image optimization with Next.js Image
  - Add virtual scrolling for long lists
  - Implement optimistic updates for better UX
  - Add loading skeletons for async content
  - Optimize bundle size (analyze and remove unused code)
  - _Requirements: Performance targets (< 2.5s LCP, < 100ms message latency)_

- [ ] 72. Implement performance optimizations - Database
  - Verify all indexes are created and used
  - Create materialized views for analytics queries
  - Implement connection pooling
  - Add query result caching where appropriate
  - Monitor slow queries with pg_stat_statements
  - Optimize N+1 queries
  - _Requirements: Performance targets (< 50ms query time)_

- [ ] 73. Implement monitoring and observability
  - Set up application monitoring (Vercel Analytics or Sentry)
  - Create health check endpoint (/api/health)
  - Implement performance tracking (Web Vitals)
  - Add database query monitoring
  - Create alerting for critical errors
  - Set up uptime monitoring
  - _Requirements: 99.9% uptime target_

- [ ] 74. Implement security headers and HTTPS
  - Configure security headers in next.config.js
  - Add Content Security Policy (CSP)
  - Enable Strict-Transport-Security (HSTS)
  - Add X-Frame-Options, X-Content-Type-Options
  - Configure CORS properly
  - Ensure all connections use HTTPS
  - _Requirements: 30.1-30.5 (Security and RLS Policies)_

---

## Phase 10: Testing and Quality Assurance

- [ ] 75. Write unit tests for credit calculation
  - Test free messages (first 3)
  - Test peak hour multiplier (8pm-2am EAT)
  - Test off-peak multiplier (2am-8am EAT)
  - Test featured profile multiplier
  - Test tier discounts
  - Test loyalty bonuses
  - _Requirements: 6.1-6.5 (Message Cost Calculation)_

- [ ] 76. Write unit tests for validation functions
  - Test age validation (18+ enforcement)
  - Test username uniqueness checking
  - Test email format generation
  - Test location validation
  - Test password complexity requirements
  - _Requirements: 2.1-2.5 (User Registration), 22.1-22.5 (Location Validation), 23.1-23.5 (Age Verification)_

- [ ] 77. Write integration tests for chat flow
  - Test chat creation with duplicate prevention
  - Test message sending with credit deduction
  - Test insufficient credits error handling
  - Test message delivery to operator
  - Test chat closure
  - _Requirements: 4.1-4.5 (Real-Time Chat), 7.1-7.5 (Race Condition Prevention), 24.1-24.5 (Duplicate Chat Prevention)_

- [ ] 78. Write integration tests for payment flow
  - Test payment initialization
  - Test webhook processing with idempotency
  - Test duplicate webhook handling
  - Test credit addition after successful payment
  - Test failed payment handling
  - _Requirements: 5.1-5.5 (Credit System), 16.1-16.5 (Payment Idempotency)_

- [ ] 79. Write database transaction safety tests
  - Test concurrent message sending with insufficient credits
  - Test row locking prevents race conditions
  - Test transaction rollback on error
  - Test credit balance never goes negative
  - _Requirements: 7.1-7.5 (Race Condition Prevention)_

- [ ] 80. Write E2E tests for critical user flows
  - Test complete user registration flow
  - Test chat initiation and messaging
  - Test credit purchase flow
  - Test operator assignment and chat handling
  - Test admin operations (user management, chat inspection)
  - _Requirements: All critical user flows_

---

## Phase 11: Deployment and Production Setup

- [ ] 81. Configure production environment variables
  - Set up Vercel environment variables
  - Configure Supabase production project
  - Set up Paystack live keys
  - Configure Google Maps API key
  - Set admin setup token
  - Configure monitoring and logging services
  - _Requirements: All features require proper configuration_

- [ ] 82. Set up domain and email routing
  - Purchase domain (fantooo.com)
  - Configure Cloudflare DNS
  - Set up Cloudflare Email Routing with catch-all forwarding
  - Configure email forwarding to admin inbox
  - Test email delivery with Paystack receipts
  - _Requirements: 28.1-28.5 (Email System Configuration)_

- [ ] 83. Deploy database migrations to production
  - Review all migration files
  - Test migrations on staging database
  - Apply migrations to production database
  - Verify all tables, indexes, and constraints
  - Run seed scripts for initial data
  - _Requirements: All database-dependent features_

- [ ] 84. Deploy Supabase Edge Functions
  - Deploy bootstrap-first-admin function
  - Deploy delete-user-account function
  - Deploy delete-operator-account function
  - Deploy process-payment function
  - Deploy reconcile-payments function
  - Deploy auto-close-inactive-chats function
  - Deploy escalate-problematic-chats function
  - Test all functions in production
  - _Requirements: 1.1-1.5 (Admin Bootstrap), 5.1-5.5 (Credit System), 10.1-10.5 (Chat Timeout), 14.1-14.5 (User Deletion), 15.1-15.5 (Operator Deletion), 17.1-17.5 (Payment Reconciliation)_

- [ ] 85. Configure scheduled jobs and cron
  - Set up Vercel cron jobs in vercel.json
  - Configure auto-close-chats (hourly)
  - Configure escalate-chats (every 15 minutes)
  - Configure update-operator-stats (daily)
  - Configure refresh-materialized-views (every 6 hours)
  - Test cron execution
  - _Requirements: 10.1-10.5 (Chat Timeout), 9.1-9.5 (Chat Reassignment)_

- [ ] 86. Set up monitoring and alerting
  - Configure Vercel Analytics
  - Set up error tracking with Sentry
  - Configure uptime monitoring
  - Set up database monitoring
  - Create alert rules for critical errors
  - Test alerting system
  - _Requirements: 99.9% uptime target_

- [ ] 87. Configure backup and disaster recovery
  - Verify Supabase automatic backups
  - Set up manual backup scripts
  - Document disaster recovery procedures
  - Test database restore process
  - Configure point-in-time recovery
  - _Requirements: RPO 15 minutes, RTO 1 hour_

- [ ] 88. Perform security audit
  - Review all RLS policies
  - Test authentication and authorization
  - Verify input validation and sanitization
  - Check for SQL injection vulnerabilities
  - Test XSS prevention
  - Review API rate limiting
  - Verify webhook signature validation
  - Test HTTPS enforcement
  - _Requirements: 30.1-30.5 (Security and RLS Policies)_

- [ ] 89. Perform load testing
  - Test with 1000 concurrent users
  - Verify message delivery latency < 100ms
  - Test database query performance < 50ms
  - Verify API response time < 200ms
  - Test real-time subscription scalability
  - Identify and fix bottlenecks
  - _Requirements: Performance targets_

- [ ] 90. Create first super admin account
  - Access /setup page in production
  - Enter admin details and setup token
  - Verify super_admin account creation
  - Test admin login
  - Verify full permissions
  - Document admin credentials securely
  - _Requirements: 1.1-1.5 (Admin Bootstrap System)_

- [ ] 91. Create initial fictional profiles
  - Use admin panel to create 20+ fictional profiles
  - Upload profile pictures (min 3 per profile)
  - Set personality guidelines and response templates
  - Activate profiles
  - Test profile discovery by users
  - _Requirements: 3.1-3.5 (Fictional Profiles)_

- [ ] 92. Create operator accounts
  - Use admin panel to create operator accounts
  - Assign specializations
  - Set quality thresholds
  - Test operator login and assignment
  - Verify chat handling workflow
  - _Requirements: 8.1-8.5 (Operator Assignment), 11.1-11.5 (Operator Availability)_

- [ ] 93. Final production testing
  - Test complete user registration and onboarding
  - Test fictional profile browsing and chat initiation
  - Test real-time messaging between user and operator
  - Test credit purchase with Paystack
  - Test operator assignment and reassignment
  - Test admin operations (user management, chat inspection, analytics)
  - Verify all Edge Functions execute correctly
  - Test scheduled jobs execution
  - _Requirements: All features_

- [ ] 94. Create documentation
  - Write deployment guide
  - Document environment variables
  - Create admin user guide
  - Create operator user guide
  - Document API endpoints
  - Create troubleshooting guide
  - Document backup and recovery procedures
  - _Requirements: Production readiness_

- [ ] 95. Launch production
  - Announce platform availability
  - Monitor system health and performance
  - Watch for errors and issues
  - Be ready for rapid response to problems
  - Collect user feedback
  - Plan iterative improvements
  - _Requirements: All features complete and tested_

