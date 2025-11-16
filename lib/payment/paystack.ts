/**
 * Paystack Payment Integration
 * 
 * Handles payment initialization, verification, webhook processing,
 * and idempotency checking for credit purchases.
 * 
 * Requirements: 5.1-5.5 (Credit System), 16.1-16.5 (Payment Idempotency)
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Credit package interface
 */
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  is_featured: boolean;
  badge_text?: string;
  discount_percentage?: number;
  bonus_credits: number;
  is_active: boolean;
}

/**
 * Payment initialization parameters
 */
export interface InitializePaymentParams {
  userId: string;
  packageId: string;
  email: string;
  callbackUrl?: string;
}

/**
 * Payment initialization response from Paystack
 */
export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Payment verification response from Paystack
 */
export interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      userId: string;
      packageId: string;
      credits: number;
    };
    customer: {
      id: number;
      email: string;
    };
  };
}

/**
 * Transaction record in database
 */
export interface Transaction {
  id: string;
  real_user_id: string;
  type: 'purchase' | 'refund' | 'bonus' | 'deduction';
  amount: number;
  credits_amount: number;
  payment_provider: string;
  provider_reference: string;
  provider_response: any;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
  failure_reason?: string;
  webhook_received_count: number;
  last_webhook_at?: string;
  package_id: string;
  package_snapshot: any;
  needs_manual_review: boolean;
  created_at: string;
  completed_at?: string;
}

/**
 * Initialize a payment with Paystack
 * 
 * This function:
 * - Fetches the credit package and locks the price at checkout time
 * - Creates a pending transaction record
 * - Initializes payment with Paystack API
 * - Returns authorization URL for user to complete payment
 * 
 * @param params - Payment initialization parameters
 * @returns Paystack authorization URL and reference
 * @throws Error if package not found or API call fails
 */
export async function initializePayment(
  params: InitializePaymentParams
): Promise<{ authorizationUrl: string; reference: string }> {
  const { userId, packageId, email, callbackUrl } = params;

  // Validate environment variables
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!paystackSecretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing');
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch credit package to lock price
  const { data: creditPackage, error: packageError } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('id', packageId)
    .eq('is_active', true)
    .single();

  if (packageError || !creditPackage) {
    throw new Error(`Credit package not found: ${packageId}`);
  }

  // Generate unique reference
  const reference = `fantooo_${Date.now()}_${userId.substring(0, 8)}`;

  // Create package snapshot to preserve pricing
  const packageSnapshot = {
    name: creditPackage.name,
    credits: creditPackage.credits,
    price: creditPackage.price,
    currency: creditPackage.currency,
    bonus_credits: creditPackage.bonus_credits,
    discount_percentage: creditPackage.discount_percentage,
  };

  // Create pending transaction record
  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      real_user_id: userId,
      type: 'purchase',
      amount: creditPackage.price,
      credits_amount: creditPackage.credits + (creditPackage.bonus_credits || 0),
      payment_provider: 'paystack',
      provider_reference: reference,
      status: 'pending',
      package_id: packageId,
      package_snapshot: packageSnapshot,
      webhook_received_count: 0,
      needs_manual_review: false,
    });

  if (transactionError) {
    throw new Error(`Failed to create transaction: ${transactionError.message}`);
  }

  // Initialize payment with Paystack
  const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: creditPackage.price * 100, // Convert to kobo (smallest currency unit)
      reference,
      currency: creditPackage.currency,
      callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/credits/verify`,
      metadata: {
        userId,
        packageId,
        credits: creditPackage.credits + (creditPackage.bonus_credits || 0),
        packageName: creditPackage.name,
      },
    }),
  });

  if (!paystackResponse.ok) {
    const errorData = await paystackResponse.json();
    throw new Error(`Paystack API error: ${errorData.message || 'Unknown error'}`);
  }

  const data: PaystackInitializeResponse = await paystackResponse.json();

  if (!data.status) {
    throw new Error(`Payment initialization failed: ${data.message}`);
  }

  return {
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  };
}

/**
 * Verify a payment with Paystack
 * 
 * This function:
 * - Verifies the payment status with Paystack API
 * - Returns payment details including status and metadata
 * 
 * @param reference - Payment reference to verify
 * @returns Payment verification data
 * @throws Error if verification fails
 */
export async function verifyPayment(
  reference: string
): Promise<PaystackVerificationResponse['data']> {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!paystackSecretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const paystackResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    }
  );

  if (!paystackResponse.ok) {
    const errorData = await paystackResponse.json();
    throw new Error(`Paystack verification error: ${errorData.message || 'Unknown error'}`);
  }

  const data: PaystackVerificationResponse = await paystackResponse.json();

  if (!data.status) {
    throw new Error(`Payment verification failed: ${data.message}`);
  }

  return data.data;
}

/**
 * Verify Paystack webhook signature
 * 
 * This function validates that the webhook request is genuinely from Paystack
 * by verifying the HMAC signature in the request header.
 * 
 * @param payload - Webhook payload (raw body)
 * @param signature - Signature from x-paystack-signature header
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  payload: string | object,
  signature: string | null
): boolean {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!paystackSecretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  if (!signature) {
    return false;
  }

  // Convert payload to string if it's an object
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  // Compute HMAC SHA512 hash
  const hash = crypto
    .createHmac('sha512', paystackSecretKey)
    .update(payloadString)
    .digest('hex');

  // Compare hashes (constant-time comparison to prevent timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(signature)
  );
}

/**
 * Process webhook with idempotency checking
 * 
 * This function:
 * - Checks if transaction already exists by provider_reference
 * - If exists with success status, returns success without processing (idempotency)
 * - If exists but not successful, increments webhook count
 * - If new, creates transaction and adds credits
 * - Handles duplicate webhook processing gracefully
 * 
 * Requirements: 16.1-16.5 (Payment Idempotency)
 * 
 * @param webhookData - Webhook payload from Paystack
 * @returns Processing result
 */
export async function processWebhook(
  webhookData: PaystackVerificationResponse['data']
): Promise<{ success: boolean; duplicate: boolean; message: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const reference = webhookData.reference;
  const userId = webhookData.metadata.userId;
  const credits = webhookData.metadata.credits;

  // Check for existing transaction (idempotency check)
  const { data: existingTransaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('provider_reference', reference)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected for new transactions
    throw new Error(`Failed to check existing transaction: ${fetchError.message}`);
  }

  // If transaction exists and is already successful, return without processing
  if (existingTransaction && existingTransaction.status === 'success') {
    // Increment webhook count to track duplicate webhooks
    await supabase
      .from('transactions')
      .update({
        webhook_received_count: existingTransaction.webhook_received_count + 1,
        last_webhook_at: new Date().toISOString(),
      })
      .eq('id', existingTransaction.id);

    return {
      success: true,
      duplicate: true,
      message: 'Transaction already processed successfully',
    };
  }

  // Process the payment
  if (webhookData.status === 'success') {
    // Start transaction to add credits atomically
    const { error: updateError } = await supabase.rpc('process_successful_payment', {
      p_user_id: userId,
      p_credits: credits,
      p_reference: reference,
      p_amount: webhookData.amount / 100, // Convert from kobo to main currency
      p_provider_response: webhookData,
    });

    if (updateError) {
      // Mark transaction for manual review
      if (existingTransaction) {
        await supabase
          .from('transactions')
          .update({
            needs_manual_review: true,
            failure_reason: updateError.message,
            webhook_received_count: existingTransaction.webhook_received_count + 1,
            last_webhook_at: new Date().toISOString(),
          })
          .eq('id', existingTransaction.id);
      }

      throw new Error(`Failed to process payment: ${updateError.message}`);
    }

    return {
      success: true,
      duplicate: false,
      message: 'Payment processed successfully',
    };
  } else {
    // Payment failed
    if (existingTransaction) {
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          failure_reason: webhookData.gateway_response || 'Payment failed',
          provider_response: webhookData,
          webhook_received_count: existingTransaction.webhook_received_count + 1,
          last_webhook_at: new Date().toISOString(),
        })
        .eq('id', existingTransaction.id);
    }

    return {
      success: false,
      duplicate: false,
      message: `Payment failed: ${webhookData.gateway_response}`,
    };
  }
}

/**
 * Get transaction by reference
 * 
 * @param reference - Provider reference
 * @returns Transaction record or null
 */
export async function getTransactionByReference(
  reference: string
): Promise<Transaction | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('provider_reference', reference)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch transaction: ${error.message}`);
  }

  return data as Transaction;
}

/**
 * Get user's transaction history
 * 
 * @param userId - User ID
 * @param limit - Maximum number of transactions to return
 * @returns Array of transactions
 */
export async function getUserTransactions(
  userId: string,
  limit: number = 50
): Promise<Transaction[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('real_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data as Transaction[];
}
