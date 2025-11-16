import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ReconcileRequest {
  transactionId: string;
  adminId: string;
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: {
      userId: string;
      credits: number;
    };
  };
}

/**
 * Verify payment with Paystack API
 */
async function verifyPaymentWithPaystack(reference: string): Promise<PaystackVerifyResponse> {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY not configured');
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.statusText}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Verify admin user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Check if user is an admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role, permissions')
      .eq('auth_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Check if admin has payment management permission
    if (!admin.permissions?.manage_payments) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const { transactionId }: ReconcileRequest = await req.json();

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: 'Missing transactionId' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Get transaction details
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // If transaction is already successful, no need to reconcile
    if (transaction.status === 'success') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Transaction already successful',
          transaction,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Verify with Paystack
    console.log(`Verifying transaction ${transaction.provider_reference} with Paystack`);
    const paystackResponse = await verifyPaymentWithPaystack(transaction.provider_reference);

    if (!paystackResponse.status) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Paystack verification failed',
          details: paystackResponse.message,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const paystackData = paystackResponse.data;

    // Check if Paystack shows success but our system doesn't
    if (paystackData.status === 'success' && transaction.status !== 'success') {
      console.log(`Reconciling transaction ${transaction.id}: Paystack shows success`);

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'success',
          provider_response: paystackData,
          completed_at: new Date().toISOString(),
          needs_manual_review: false,
          reviewed_by: admin.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        throw updateError;
      }

      // Add credits to user account
      const creditsToAdd = transaction.credits_amount;
      const { error: creditError } = await supabase.rpc('add_credits_to_user', {
        p_user_id: transaction.real_user_id,
        p_credits: creditsToAdd,
        p_transaction_id: transaction.id,
      });

      if (creditError) {
        console.error('Error adding credits during reconciliation:', creditError);
        
        // Mark for manual review again
        await supabase
          .from('transactions')
          .update({
            needs_manual_review: true,
            review_reason: `Reconciliation: Failed to add credits - ${creditError.message}`,
          })
          .eq('id', transaction.id);

        throw creditError;
      }

      console.log(`Successfully reconciled transaction ${transaction.id}, added ${creditsToAdd} credits`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Transaction reconciled successfully',
          transaction: {
            id: transaction.id,
            reference: transaction.provider_reference,
            credits: creditsToAdd,
            status: 'success',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    } else if (paystackData.status !== 'success') {
      // Paystack also shows failure
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'failed',
          failure_reason: `Paystack status: ${paystackData.status}`,
          provider_response: paystackData,
          needs_manual_review: false,
          reviewed_by: admin.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Transaction confirmed as failed',
          transaction: {
            id: transaction.id,
            reference: transaction.provider_reference,
            status: 'failed',
            reason: paystackData.status,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    } else {
      // Both show success, no action needed
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Transaction status matches Paystack',
          transaction: {
            id: transaction.id,
            reference: transaction.provider_reference,
            status: transaction.status,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }
  } catch (error) {
    console.error('Reconciliation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to reconcile payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
