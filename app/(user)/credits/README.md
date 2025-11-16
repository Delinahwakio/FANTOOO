# Credits Purchase Page

## Overview

The credits purchase page (`/credits`) allows users to view their current credit balance, purchase credit packages, and view their transaction history.

## Features

### 1. Current Balance Display
- Shows user's current credit balance
- Displays equivalent value in KES (1 credit = 10 KES)
- Real-time updates via Supabase subscriptions

### 2. Credit Packages
- Displays all active credit packages from database
- Highlights featured packages with special styling
- Shows:
  - Package name
  - Credit amount
  - Bonus credits (if any)
  - Price in KES
  - Discount percentage (if applicable)
  - Special badges (POPULAR, BEST VALUE, etc.)

### 3. Transaction History
- Shows last 10 transactions
- Displays:
  - Transaction type (purchase, refund, bonus, deduction)
  - Status (pending, processing, success, failed, refunded)
  - Credit amount
  - Price
  - Date and time
- Color-coded status indicators
- Type-specific icons

### 4. Payment Integration
- Uses PaymentModal component for Paystack integration
- Handles payment success/failure
- Refreshes credits and transaction history after purchase
- Secure payment processing

## Requirements Addressed

### Requirement 5.1-5.5: Credit System
- ✅ Display credit packages with pricing
- ✅ Lock package price at checkout time (handled by PaymentModal)
- ✅ Process payments via Paystack
- ✅ Add credits to user account after successful payment
- ✅ Prevent negative credit balance

### Requirement 16.1-16.5: Payment Idempotency
- ✅ Transaction history shows webhook processing
- ✅ Duplicate webhook detection (webhook_received_count)
- ✅ Unique provider_reference for idempotency
- ✅ Transaction status tracking

## Database Tables Used

### credit_packages
```sql
- id: UUID
- name: TEXT
- credits: INTEGER
- price: DECIMAL
- currency: TEXT (default 'KES')
- is_featured: BOOLEAN
- badge_text: TEXT
- discount_percentage: INTEGER
- bonus_credits: INTEGER
- is_active: BOOLEAN
```

### transactions
```sql
- id: UUID
- real_user_id: UUID
- type: TEXT (purchase, refund, bonus, deduction)
- amount: DECIMAL
- credits_amount: INTEGER
- payment_provider: TEXT
- provider_reference: TEXT (UNIQUE)
- status: TEXT (pending, processing, success, failed, refunded)
- webhook_received_count: INTEGER
- created_at: TIMESTAMP
- completed_at: TIMESTAMP
```

## Component Structure

```
CreditsPage
├── Header (title and description)
├── Current Balance Card
│   └── Credit amount and KES value
├── Credit Packages Grid
│   └── Package Cards (with featured highlighting)
├── Transaction History
│   └── Transaction List (with status and type indicators)
├── Payment Info Card
│   └── Security badges and information
└── PaymentModal (conditional)
    └── Paystack integration
```

## State Management

### Local State
- `packages`: Array of credit packages from database
- `transactions`: Array of user transactions
- `showPaymentModal`: Boolean for modal visibility
- `error`: Error message string
- `loadingPackages`: Loading state for packages
- `loadingTransactions`: Loading state for transactions

### Hooks Used
- `useCredits()`: Manages user credit balance with real-time updates
- `useRouter()`: Next.js navigation
- `createClient()`: Supabase client for database queries

## API Integration

### Fetch Credit Packages
```typescript
GET /credit_packages
WHERE is_active = true
ORDER BY credits ASC
```

### Fetch Transaction History
```typescript
GET /transactions
WHERE real_user_id = current_user_id
ORDER BY created_at DESC
LIMIT 10
```

## Payment Flow

1. User clicks "Buy Now" on a package
2. PaymentModal opens with selected package
3. User completes payment via Paystack
4. Webhook processes payment (idempotency via provider_reference)
5. Credits added to user account
6. Transaction recorded in database
7. Page refreshes credits and transaction history
8. Success message displayed

## Error Handling

- Failed package fetch: Shows error message
- Failed transaction fetch: Logs error, shows empty state
- Payment failure: Shows error via PaymentModal callback
- Network errors: Graceful degradation with error messages

## Styling

- Uses glassmorphism design system
- Responsive grid layout (1 col mobile, 2 col tablet, 4 col desktop)
- Featured packages have elevated styling and border
- Color-coded transaction statuses
- Hover effects on package cards
- Smooth transitions and animations

## Security

- User authentication required (protected route)
- RLS policies enforce data access control
- Secure payment processing via Paystack
- Transaction idempotency prevents duplicate charges
- SSL encryption for all data transmission

## Performance

- Lazy loading of transaction history
- Optimized database queries with indexes
- Real-time credit updates via Supabase subscriptions
- Efficient re-renders with React hooks

## Future Enhancements

- [ ] Pagination for transaction history
- [ ] Filter transactions by type/status
- [ ] Export transaction history
- [ ] Promo code support
- [ ] Subscription packages
- [ ] Auto-recharge when credits run low
- [ ] Gift credits to other users

## Testing

### Manual Testing Checklist
- [ ] Page loads with current credit balance
- [ ] Credit packages display correctly
- [ ] Featured packages are highlighted
- [ ] Transaction history shows correctly
- [ ] Empty state displays when no transactions
- [ ] Payment modal opens on "Buy Now" click
- [ ] Credits refresh after successful payment
- [ ] Transaction history updates after purchase
- [ ] Error messages display appropriately
- [ ] Responsive design works on all screen sizes

### Integration Testing
- [ ] Test credit package fetching
- [ ] Test transaction history fetching
- [ ] Test payment flow end-to-end
- [ ] Test real-time credit updates
- [ ] Test error handling scenarios

## Related Files

- `/lib/components/shared/PaymentModal.tsx` - Payment modal component
- `/lib/hooks/useCredits.ts` - Credits management hook
- `/lib/components/ui/GlassCard.tsx` - Card component
- `/lib/components/ui/GlassButton.tsx` - Button component
- `/lib/components/ui/LoadingSpinner.tsx` - Loading indicator
- `/supabase/migrations/20241116000003_create_payment_and_audit_tables.sql` - Database schema
