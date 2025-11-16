import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

interface PaystackWebhookPayload {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
    };
    metadata?: {
      userId: string;
      packageId: string;
      credits: number;
    };
  };
}

/**
 * Verify Paystack webhook signature
 */
function verifyPaystackSignature(payload: string, signature: string): boolean {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY not configured');
  }

  const hash = createHmac('sha512', secret)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-paystack-signature',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook signature' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Verify webhook signature
    if (!verifyPaystackSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const payload: PaystackWebhookPayload = JSON.parse(rawBody);

    // Only process charge.success events
    if (payload.event !== 'charge.success') {
      console.log(`Ignoring event: ${payload.event}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const { reference, status, amount, metadata } = payload.data;

    if (!metadata || !metadata.userId || !metadata.credits) {
      console.error('Missing metadata in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload: missing metadata' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Check for existing transaction (idempotency)
    const { data: existingTransaction, error: checkError } = await supabase
      .from('transactions')
      .select('*')
      .eq('provider_reference', reference)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found, which is expected for new transactions
      console.error('Error checking existing transaction:', checkError);
      throw checkError;
    }

    if (existingTransaction) {
      // Transaction already exists
      if (existingTransaction.status === 'success') {
        // Already processed successfully, increment webhook count
        await supabase
          .from('transactions')
          .update({
            webhook_received_count: existingTransaction.webhook_received_count + 1,
            last_webhook_at: new Date().toISOString(),
          })
          .eq('id', existingTransaction.id);

        console.log(`Duplicate webhook for transaction ${reference}, already processed`);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Transaction already processed',
            duplicate: true,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      } else {
        // Transaction exists but not successful, update webhook count
        await supabase
          .from('transactions')
          .update({
            webhook_received_count: existingTransaction.webhook_received_count + 1,
            last_webhook_at: new Date().toISOString(),
          })
          .eq('id', existingTransaction.id);
      }
    }

    // Get package details if packageId is provided
    let packageSnapshot = null;
    if (metadata.packageId) {
      const { data: packageData } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('id', metadata.packageId)
        .single();

      if (packageData) {
        packageSnapshot = packageData;
      }
    }

    // Process payment in a transaction
    if (status === 'success') {
      // Create or update transaction record
      const transactionData = {
        real_user_id: metadata.userId,
        type: 'purchase',
        amount: amount / 100, // Paystack amount is in kobo (cents)
        credits_amount: metadata.credits,
        payment_provider: 'paystack',
        provider_reference: reference,
        provider_response: payload.data,
        status: 'success',
        webhook_received_count: existingTransaction ? existingTransaction.webhook_received_count + 1 : 1,
        last_webhook_at: new Date().toISOString(),
        package_id: metadata.packageId || null,
        package_snapshot: packageSnapshot,
        completed_at: new Date().toISOString(),
      };

      let transaction;
      if (existingTransaction) {
        // Update existing transaction
        const { data, error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', existingTransaction.id)
          .select()
          .single();

        if (error) throw error;
        transaction = data;
      } else {
        // Create new transaction
        const { data, error } = await supabase
          .from('transactions')
          .insert(transactionData)
          .select()
          .single();

        if (error) throw error;
        transaction = data;
      }

      // Add credits to user account (only if not already processed)
      if (!existingTransaction || existingTransaction.status !== 'success') {
        const { error: creditError } = await supabase.rpc('add_credits_to_user', {
          p_user_id: metadata.userId,
          p_credits: metadata.credits,
          p_transaction_id: transaction.id,
        });

        if (creditError) {
          console.error('Error adding credits:', creditError);
          // Mark transaction for manual review
          await supabase
            .from('transactions')
            .update({
              needs_manual_review: true,
              review_reason: `Failed to add credits: ${creditError.message}`,
            })
            .eq('id', transaction.id);

          throw creditError;
        }

        console.log(`Successfully added ${metadata.credits} credits to user ${metadata.userId}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment processed successfully',
          transaction: {
            id: transaction.id,
            credits: metadata.credits,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    } else {
      // Payment failed
      const transactionData = {
        real_user_id: metadata.userId,
        type: 'purchase',
        amount: amount / 100,
        credits_amount: metadata.credits,
        payment_provider: 'paystack',
        provider_reference: reference,
        provider_response: payload.data,
        status: 'failed',
        failure_reason: `Payment status: ${status}`,
        webhook_received_count: existingTransaction ? existingTransaction.webhook_received_count + 1 : 1,
        last_webhook_at: new Date().toISOString(),
        package_id: metadata.packageId || null,
      };

      if (existingTransaction) {
        await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', existingTransaction.id);
      } else {
        await supabase.from('transactions').insert(transactionData);
      }

      console.log(`Payment failed for transaction ${reference}: ${status}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment failure recorded',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Return 200 to prevent Paystack from retrying
    // But log the error for manual review
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Payment processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        requiresManualReview: true,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
