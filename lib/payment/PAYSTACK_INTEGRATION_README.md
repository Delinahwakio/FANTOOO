# Paystack Payment Integration

This module handles all payment processing for the Fantooo platform using Paystack as the payment gateway.

## Features

- ✅ Payment initialization with price locking
- ✅ Payment verification
- ✅ Webhook signature verification
- ✅ Idempotency checking (prevents duplicate processing)
- ✅ Transaction history tracking
- ✅ Automatic credit addition on successful payment

## Requirements

This implementation satisfies:
- **Requirement 5.1-5.5**: Credit System and Payment Processing
- **Requirement 16.1-16.5**: Payment Webhook Idempotency

## Environment Variables

```env
PAYSTACK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Usage

### 1. Initialize Payment

```typescript
import { initializePayment } from '@/lib/payment/paystack';

// In your API route or server component
const result = await initializePayment({
  userId: 'user-uuid',
  packageId: 'package-uuid',
  email: 'user@fantooo.com',
  callbackUrl: 'https://fantooo.com/credits/verify'
});

// Redirect user to authorization URL
redirect(result.authorizationUrl);
```

### 2. Verify Payment

```typescript
import { verifyPayment } from '@/lib/payment/paystack';

// After user completes payment and returns to callback URL
const reference = searchParams.get('reference');

const paymentData = await verifyPayment(reference);

if (paymentData.status === 'success') {
  // Payment successful - credits will be added via webhook
  console.log('Payment successful!');
} else {
  // Payment failed
  console.log('Payment failed:', paymentData.gateway_response);
}
```

### 3. Process Webhook (Idempotent)

```typescript
import { verifyWebhookSignature, processWebhook } from '@/lib/payment/paystack';

// In your webhook API route
export async function POST(request: Request) {
  const signature = request.headers.get('x-paystack-signature');
  const body = await request.text();
  
  // Verify signature
  if (!verifyWebhookSignature(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const webhookData = JSON.parse(body);
  
  // Process webhook (idempotent - safe to call multiple times)
  const result = await processWebhook(webhookData.data);
  
  return Response.json(result);
}
```

### 4. Get Transaction History

```typescript
import { getUserTransactions } from '@/lib/payment/paystack';

const transactions = await getUserTransactions(userId, 50);
```

## How It Works

### Payment Flow

```
1. User selects credit package
   ↓
2. initializePayment() called
   - Fetches package details
   - Locks price at checkout time (package_snapshot)
   - Creates pending transaction record
   - Calls Paystack API to initialize payment
   ↓
3. User redirected to Paystack payment page
   ↓
4. User completes payment
   ↓
5. Paystack sends webhook to your server
   ↓
6. processWebhook() called
   - Verifies webhook signature
   - Checks for existing transaction (idempotency)
   - If duplicate, increments webhook count and returns
   - If new/pending, adds credits to user account
   - Updates transaction status
   ↓
7. User redirected back to your app
   ↓
8. verifyPayment() called to confirm status
```

### Idempotency

The system prevents duplicate credit additions through:

1. **Unique provider_reference**: Database constraint ensures one transaction per reference
2. **Status checking**: If transaction already has 'success' status, webhook is ignored
3. **Webhook counting**: Tracks how many times webhook was received
4. **Atomic operations**: Credits added within database transaction

Example:
```typescript
// First webhook call
await processWebhook(webhookData);
// Result: { success: true, duplicate: false, message: 'Payment processed successfully' }

// Second webhook call (duplicate)
await processWebhook(webhookData);
// Result: { success: true, duplicate: true, message: 'Transaction already processed successfully' }
```

### Price Locking

When a payment is initialized, the package details are saved in `package_snapshot`:

```json
{
  "name": "50 Credits",
  "credits": 50,
  "price": 400,
  "currency": "KES",
  "bonus_credits": 5,
  "discount_percentage": 10
}
```

This ensures that even if package prices change, the user pays the price they saw at checkout.

## Security

### Webhook Signature Verification

All webhooks are verified using HMAC SHA512:

```typescript
const hash = crypto
  .createHmac('sha512', PAYSTACK_SECRET_KEY)
  .update(payloadString)
  .digest('hex');

// Constant-time comparison to prevent timing attacks
crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
```

### Environment Variables

- Never expose `PAYSTACK_SECRET_KEY` to the client
- Only use `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in frontend code
- Use service role key for server-side Supabase operations

## Database Schema

### transactions table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_user_id UUID REFERENCES real_users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'refund', 'bonus', 'deduction')),
  amount DECIMAL(10, 2) NOT NULL,
  credits_amount INTEGER NOT NULL,
  payment_provider TEXT DEFAULT 'paystack',
  provider_reference TEXT UNIQUE NOT NULL, -- Ensures idempotency
  provider_response JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
  failure_reason TEXT,
  webhook_received_count INTEGER DEFAULT 0,
  last_webhook_at TIMESTAMP,
  package_id UUID REFERENCES credit_packages(id),
  package_snapshot JSONB, -- Price locking
  needs_manual_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### credit_packages table

```sql
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  is_featured BOOLEAN DEFAULT false,
  badge_text TEXT,
  discount_percentage INTEGER,
  bonus_credits INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Database Function Required

You need to create this database function for atomic credit addition:

```sql
CREATE OR REPLACE FUNCTION process_successful_payment(
  p_user_id UUID,
  p_credits INTEGER,
  p_reference TEXT,
  p_amount DECIMAL,
  p_provider_response JSONB
)
RETURNS VOID AS $$
BEGIN
  -- Update transaction status
  UPDATE transactions
  SET 
    status = 'success',
    provider_response = p_provider_response,
    webhook_received_count = webhook_received_count + 1,
    last_webhook_at = NOW(),
    completed_at = NOW()
  WHERE provider_reference = p_reference;
  
  -- Add credits to user (atomic)
  UPDATE real_users
  SET 
    credits = credits + p_credits,
    total_spent = total_spent + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

## Error Handling

```typescript
try {
  const result = await initializePayment({...});
} catch (error) {
  if (error.message.includes('Credit package not found')) {
    // Handle package not found
  } else if (error.message.includes('Paystack API error')) {
    // Handle Paystack API error
  } else {
    // Handle other errors
  }
}
```

## Testing

### Test Payment Initialization

```typescript
const result = await initializePayment({
  userId: 'test-user-id',
  packageId: 'test-package-id',
  email: 'test@fantooo.com'
});

expect(result.authorizationUrl).toContain('paystack.com');
expect(result.reference).toContain('fantooo_');
```

### Test Webhook Idempotency

```typescript
const webhookData = {
  reference: 'test-ref-123',
  status: 'success',
  amount: 40000,
  metadata: { userId: 'test-user', credits: 50 }
};

// First call
const result1 = await processWebhook(webhookData);
expect(result1.duplicate).toBe(false);

// Second call (duplicate)
const result2 = await processWebhook(webhookData);
expect(result2.duplicate).toBe(true);

// User should only have 50 credits, not 100
const user = await getUser('test-user');
expect(user.credits).toBe(50);
```

## Paystack Test Cards

For testing in development:

- **Success**: 4084084084084081
- **Insufficient Funds**: 5060666666666666666
- **Invalid CVV**: 5078585078585078585

## Production Checklist

- [ ] Replace test keys with live keys
- [ ] Configure webhook URL in Paystack dashboard
- [ ] Test webhook signature verification
- [ ] Set up monitoring for failed payments
- [ ] Configure manual review alerts
- [ ] Test idempotency with duplicate webhooks
- [ ] Verify price locking works correctly
- [ ] Test all error scenarios

## Support

For issues with Paystack integration:
1. Check Paystack dashboard for transaction details
2. Review transaction logs in database
3. Check webhook delivery logs in Paystack
4. Verify environment variables are correct
5. Test webhook signature verification

## Related Files

- `lib/errors/index.ts` - Payment error types
- `lib/types/database.ts` - Database type definitions
- `app/api/payments/*` - Payment API routes (to be created)
- `supabase/functions/process-payment` - Edge function for webhooks (to be created)
