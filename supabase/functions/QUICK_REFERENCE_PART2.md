# Edge Functions Part 2 - Quick Reference

## Quick Commands

### Deploy All Functions
```bash
# Bash
./supabase/functions/deploy.sh

# PowerShell
./supabase/functions/deploy.ps1
```

### Deploy Individual Functions
```bash
supabase functions deploy process-payment --no-verify-jwt
supabase functions deploy reconcile-payments --no-verify-jwt
supabase functions deploy auto-close-inactive-chats --no-verify-jwt
supabase functions deploy escalate-problematic-chats --no-verify-jwt
```

### Set Secrets
```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx
supabase secrets set CRON_SECRET=your-secret-here
```

### View Logs
```bash
supabase functions logs process-payment --follow
supabase functions logs reconcile-payments --follow
supabase functions logs auto-close-inactive-chats --follow
supabase functions logs escalate-problematic-chats --follow
```

---

## Function URLs

### Production
```
process-payment:
https://<project-ref>.supabase.co/functions/v1/process-payment

reconcile-payments:
https://<project-ref>.supabase.co/functions/v1/reconcile-payments

auto-close-inactive-chats:
https://<project-ref>.supabase.co/functions/v1/auto-close-inactive-chats

escalate-problematic-chats:
https://<project-ref>.supabase.co/functions/v1/escalate-problematic-chats
```

### Local Development
```
process-payment:
http://localhost:54321/functions/v1/process-payment

reconcile-payments:
http://localhost:54321/functions/v1/reconcile-payments

auto-close-inactive-chats:
http://localhost:54321/functions/v1/auto-close-inactive-chats

escalate-problematic-chats:
http://localhost:54321/functions/v1/escalate-problematic-chats
```

---

## Quick Tests

### Test Payment Webhook
```bash
curl -X POST http://localhost:54321/functions/v1/process-payment \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: test-sig" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "test-123",
      "status": "success",
      "amount": 40000,
      "metadata": {"userId": "user-id", "credits": 50}
    }
  }'
```

### Test Reconciliation
```bash
curl -X POST http://localhost:54321/functions/v1/reconcile-payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"transactionId": "transaction-id"}'
```

### Test Auto-Close
```bash
curl -X POST http://localhost:54321/functions/v1/auto-close-inactive-chats \
  -H "Authorization: Bearer <cron-secret>"
```

### Test Escalation
```bash
curl -X POST http://localhost:54321/functions/v1/escalate-problematic-chats \
  -H "Authorization: Bearer <cron-secret>"
```

---

## Paystack Webhook Configuration

1. Go to: https://dashboard.paystack.com/#/settings/developer
2. Click "Webhooks"
3. Add URL: `https://<project-ref>.supabase.co/functions/v1/process-payment`
4. Select events: `charge.success`
5. Save

---

## Cron Job Configuration (Vercel)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/auto-close-chats",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/escalate-chats",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Create API routes that call the Edge Functions:
```typescript
// app/api/cron/auto-close-chats/route.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auto-close-inactive-chats`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
    }
  );

  return response;
}
```

---

## Database Functions

### Add Credits
```sql
SELECT add_credits_to_user(
  'user-id'::UUID,
  50,
  'transaction-id'::UUID
);
```

### Check and Deduct Credits
```sql
SELECT check_and_deduct_credits(
  'user-id'::UUID,
  2,
  'chat-id'::UUID,
  'message-id'::UUID
);
```

### Refund Credits
```sql
SELECT refund_credits_to_user(
  'user-id'::UUID,
  10,
  'accidental_send',
  'admin-id'::UUID,
  'User accidentally sent message'
);
```

### Calculate Refund
```sql
SELECT calculate_user_refund('user-id'::UUID);
```

---

## Monitoring Queries

### Check Recent Transactions
```sql
SELECT 
  id,
  real_user_id,
  type,
  amount,
  credits_amount,
  status,
  webhook_received_count,
  created_at
FROM transactions
ORDER BY created_at DESC
LIMIT 10;
```

### Check Failed Payments
```sql
SELECT 
  id,
  provider_reference,
  status,
  failure_reason,
  needs_manual_review
FROM transactions
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Check Closed Chats
```sql
SELECT 
  id,
  close_reason,
  closed_at,
  message_count,
  total_credits_spent
FROM chats
WHERE status = 'closed'
  AND closed_at > NOW() - INTERVAL '24 hours'
ORDER BY closed_at DESC;
```

### Check Escalated Chats
```sql
SELECT 
  id,
  flags,
  assignment_count,
  status,
  updated_at
FROM chats
WHERE status = 'escalated'
ORDER BY updated_at DESC;
```

### Check Admin Notifications
```sql
SELECT 
  type,
  message,
  priority,
  is_read,
  created_at
FROM admin_notifications
WHERE is_read = false
ORDER BY priority DESC, created_at DESC;
```

---

## Troubleshooting

### Payment Not Processing
1. Check webhook signature is correct
2. Verify PAYSTACK_SECRET_KEY is set
3. Check function logs: `supabase functions logs process-payment`
4. Verify metadata includes userId and credits

### Reconciliation Failing
1. Verify admin has `manage_payments` permission
2. Check PAYSTACK_SECRET_KEY is set
3. Verify transaction exists in database
4. Check Paystack API status

### Chats Not Auto-Closing
1. Verify cron job is running
2. Check CRON_SECRET matches
3. Verify chats have last_message_at > 24 hours
4. Check function logs

### Chats Not Escalating
1. Verify cron job is running every 15 minutes
2. Check escalation criteria are met
3. Verify chats aren't already flagged
4. Check function logs

---

## Common Issues

### Issue: Webhook signature verification fails
**Solution**: Ensure PAYSTACK_SECRET_KEY matches your Paystack account

### Issue: Duplicate webhooks processing
**Solution**: This is handled automatically - check webhook_received_count

### Issue: Credits not added after payment
**Solution**: Check transaction status and needs_manual_review flag

### Issue: Cron jobs not running
**Solution**: Verify Vercel cron configuration and CRON_SECRET

### Issue: Admin can't reconcile payments
**Solution**: Check admin has manage_payments permission

---

## Support

For issues or questions:
1. Check function logs
2. Review admin notifications
3. Check database transaction records
4. Review EDGE_FUNCTIONS_PART2.md for detailed documentation
