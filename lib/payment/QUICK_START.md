# Paystack Integration - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Environment Variables

Add to your `.env.local`:

```env
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
```

### 2. Database Function

Run this SQL in your Supabase SQL Editor:

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
  UPDATE transactions
  SET 
    status = 'success',
    provider_response = p_provider_response,
    webhook_received_count = webhook_received_count + 1,
    last_webhook_at = NOW(),
    completed_at = NOW()
  WHERE provider_reference = p_reference;
  
  UPDATE real_users
  SET 
    credits = credits + p_credits,
    total_spent = total_spent + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

### 3. Create API Routes

#### `/app/api/payments/initialize/route.ts`

```typescript
import { initializePayment } from '@/lib/payment/paystack';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { packageId } = await request.json();
  
  // Get user email
  const { data: userData } = await supabase
    .from('real_users')
    .select('email')
    .eq('auth_id', user.id)
    .single();

  const result = await initializePayment({
    userId: userData.id,
    packageId,
    email: userData.email,
  });

  return Response.json(result);
}
```

#### `/app/api/payments/webhook/route.ts`

```typescript
import { verifyWebhookSignature, processWebhook } from '@/lib/payment/paystack';

export async function POST(request: Request) {
  const signature = request.headers.get('x-paystack-signature');
  const body = await request.text();
  
  if (!verifyWebhookSignature(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const webhookData = JSON.parse(body);
  
  if (webhookData.event === 'charge.success') {
    const result = await processWebhook(webhookData.data);
    return Response.json(result);
  }
  
  return Response.json({ success: true });
}
```

#### `/app/api/payments/verify/route.ts`

```typescript
import { verifyPayment } from '@/lib/payment/paystack';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  
  if (!reference) {
    return Response.json({ error: 'Reference required' }, { status: 400 });
  }

  const paymentData = await verifyPayment(reference);
  
  return Response.json({
    success: paymentData.status === 'success',
    data: paymentData,
  });
}
```

### 4. Frontend Component

```typescript
'use client';

import { useState } from 'react';

export function PurchaseCreditsButton({ packageId }: { packageId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      
      const { authorizationUrl } = await response.json();
      
      // Redirect to Paystack
      window.location.href = authorizationUrl;
    } catch (error) {
      console.error('Payment initialization failed:', error);
      alert('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePurchase} disabled={loading}>
      {loading ? 'Processing...' : 'Purchase Credits'}
    </button>
  );
}
```

### 5. Configure Webhook in Paystack Dashboard

1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/payments/webhook`
3. Save

## ✅ Testing

### Test Payment Flow

```typescript
// 1. Initialize payment
const result = await fetch('/api/payments/initialize', {
  method: 'POST',
  body: JSON.stringify({ packageId: 'your-package-id' })
});

// 2. Use test card: 4084084084084081
// 3. Complete payment on Paystack
// 4. Webhook automatically processes payment
// 5. Credits added to user account
```

### Test Cards

- **Success**: 4084084084084081
- **Insufficient Funds**: 5060666666666666666
- **Invalid CVV**: 5078585078585078585

## 🔒 Security Checklist

- [x] Webhook signature verification implemented
- [x] Idempotency checking prevents duplicate credits
- [x] Price locking at checkout time
- [x] Server-side payment verification
- [x] Environment variables secured
- [x] Database constraints prevent negative credits

## 📊 Monitoring

Check these in your database:

```sql
-- Failed payments needing review
SELECT * FROM transactions 
WHERE needs_manual_review = true;

-- Duplicate webhooks
SELECT provider_reference, webhook_received_count 
FROM transactions 
WHERE webhook_received_count > 1;

-- Recent transactions
SELECT * FROM transactions 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🐛 Troubleshooting

### Payment not completing?

1. Check Paystack dashboard for transaction status
2. Check webhook delivery in Paystack dashboard
3. Verify webhook URL is correct
4. Check database for transaction record

### Credits not added?

1. Check transaction status in database
2. Verify webhook was received (webhook_received_count > 0)
3. Check if transaction needs manual review
4. Verify database function exists

### Webhook signature failing?

1. Verify PAYSTACK_SECRET_KEY is correct
2. Check webhook is sending raw body (not parsed JSON)
3. Verify signature header name is correct

## 📚 Next Steps

- [ ] Add transaction history page
- [ ] Implement refund functionality
- [ ] Add payment analytics
- [ ] Set up monitoring alerts
- [ ] Test with live keys in production

## 🆘 Need Help?

- Check `PAYSTACK_INTEGRATION_README.md` for detailed docs
- Review `paystack.example.ts` for code examples
- Check Paystack documentation: https://paystack.com/docs
