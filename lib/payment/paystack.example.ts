/**
 * Paystack Integration Examples
 * 
 * This file demonstrates how to use the Paystack payment integration
 * in various scenarios.
 */

import {
  initializePayment,
  verifyPayment,
  verifyWebhookSignature,
  processWebhook,
  getUserTransactions,
  getTransactionByReference,
} from './paystack';

/**
 * Example 1: Initialize a payment
 * 
 * This would typically be called from an API route when a user
 * clicks "Purchase Credits"
 */
export async function exampleInitializePayment() {
  try {
    const result = await initializePayment({
      userId: 'user-uuid-here',
      packageId: 'package-uuid-here',
      email: 'user@fantooo.com',
      callbackUrl: 'https://fantooo.com/credits/verify',
    });

    console.log('Payment initialized successfully!');
    console.log('Authorization URL:', result.authorizationUrl);
    console.log('Reference:', result.reference);

    // In a real app, you would redirect the user to the authorization URL
    // redirect(result.authorizationUrl);

    return result;
  } catch (error) {
    console.error('Payment initialization failed:', error);
    throw error;
  }
}

/**
 * Example 2: Verify a payment after user returns from Paystack
 * 
 * This would be called in your callback page to confirm payment status
 */
export async function exampleVerifyPayment(reference: string) {
  try {
    const paymentData = await verifyPayment(reference);

    console.log('Payment verification result:');
    console.log('Status:', paymentData.status);
    console.log('Amount:', paymentData.amount / 100, paymentData.currency);
    console.log('Reference:', paymentData.reference);
    console.log('Paid at:', paymentData.paid_at);

    if (paymentData.status === 'success') {
      console.log('✅ Payment successful!');
      console.log('Credits:', paymentData.metadata.credits);
      return { success: true, data: paymentData };
    } else {
      console.log('❌ Payment failed:', paymentData.gateway_response);
      return { success: false, message: paymentData.gateway_response };
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
}

/**
 * Example 3: Process a webhook from Paystack
 * 
 * This would be called in your webhook API route
 */
export async function exampleProcessWebhook(
  rawBody: string,
  signature: string | null
) {
  try {
    // Step 1: Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return { error: 'Invalid signature', status: 401 };
    }

    console.log('✅ Webhook signature verified');

    // Step 2: Parse webhook data
    const webhookPayload = JSON.parse(rawBody);
    const event = webhookPayload.event;
    const data = webhookPayload.data;

    console.log('Webhook event:', event);

    // Step 3: Process charge.success event
    if (event === 'charge.success') {
      const result = await processWebhook(data);

      console.log('Webhook processing result:');
      console.log('Success:', result.success);
      console.log('Duplicate:', result.duplicate);
      console.log('Message:', result.message);

      if (result.duplicate) {
        console.log('⚠️  Duplicate webhook - already processed');
      } else if (result.success) {
        console.log('✅ Credits added successfully');
      }

      return { success: true, result };
    }

    console.log('ℹ️  Ignoring event:', event);
    return { success: true, message: 'Event ignored' };
  } catch (error) {
    console.error('Webhook processing failed:', error);
    throw error;
  }
}

/**
 * Example 4: Get user's transaction history
 * 
 * This would be used to display transaction history in user profile
 */
export async function exampleGetTransactionHistory(userId: string) {
  try {
    const transactions = await getUserTransactions(userId, 20);

    console.log(`Found ${transactions.length} transactions for user ${userId}`);

    transactions.forEach((tx, index) => {
      console.log(`\nTransaction ${index + 1}:`);
      console.log('  Reference:', tx.provider_reference);
      console.log('  Type:', tx.type);
      console.log('  Amount:', tx.amount, 'KES');
      console.log('  Credits:', tx.credits_amount);
      console.log('  Status:', tx.status);
      console.log('  Date:', new Date(tx.created_at).toLocaleString());
      console.log('  Webhooks received:', tx.webhook_received_count);
    });

    return transactions;
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    throw error;
  }
}

/**
 * Example 5: Check transaction status by reference
 * 
 * Useful for debugging or manual verification
 */
export async function exampleCheckTransactionStatus(reference: string) {
  try {
    const transaction = await getTransactionByReference(reference);

    if (!transaction) {
      console.log('❌ Transaction not found:', reference);
      return null;
    }

    console.log('Transaction details:');
    console.log('  ID:', transaction.id);
    console.log('  User ID:', transaction.real_user_id);
    console.log('  Status:', transaction.status);
    console.log('  Amount:', transaction.amount, 'KES');
    console.log('  Credits:', transaction.credits_amount);
    console.log('  Webhooks received:', transaction.webhook_received_count);
    console.log('  Created:', new Date(transaction.created_at).toLocaleString());

    if (transaction.completed_at) {
      console.log('  Completed:', new Date(transaction.completed_at).toLocaleString());
    }

    if (transaction.failure_reason) {
      console.log('  Failure reason:', transaction.failure_reason);
    }

    if (transaction.needs_manual_review) {
      console.log('  ⚠️  Needs manual review');
    }

    return transaction;
  } catch (error) {
    console.error('Failed to check transaction status:', error);
    throw error;
  }
}

/**
 * Example 6: Complete payment flow simulation
 */
export async function exampleCompletePaymentFlow() {
  console.log('=== Complete Payment Flow Example ===\n');

  // Step 1: Initialize payment
  console.log('Step 1: Initialize payment...');
  const { authorizationUrl, reference } = await exampleInitializePayment();
  console.log('✅ Payment initialized\n');

  // Step 2: User completes payment on Paystack (simulated)
  console.log('Step 2: User redirected to Paystack...');
  console.log('(User completes payment on Paystack website)');
  console.log('✅ Payment completed on Paystack\n');

  // Step 3: Webhook received (simulated)
  console.log('Step 3: Webhook received from Paystack...');
  const webhookData = {
    event: 'charge.success',
    data: {
      reference,
      status: 'success',
      amount: 40000, // 400 KES in kobo
      metadata: {
        userId: 'user-uuid-here',
        packageId: 'package-uuid-here',
        credits: 50,
      },
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      gateway_response: 'Successful',
      customer: {
        email: 'user@fantooo.com',
      },
    },
  };

  const webhookBody = JSON.stringify(webhookData);
  // In real scenario, signature would come from Paystack
  const signature = 'simulated-signature';

  // Note: This will fail signature verification in real scenario
  // await exampleProcessWebhook(webhookBody, signature);
  console.log('✅ Webhook processed (simulated)\n');

  // Step 4: User returns to callback URL
  console.log('Step 4: User redirected back to app...');
  await exampleVerifyPayment(reference);
  console.log('✅ Payment verified\n');

  // Step 5: Check final transaction status
  console.log('Step 5: Check transaction status...');
  await exampleCheckTransactionStatus(reference);
  console.log('✅ Transaction complete\n');

  console.log('=== Payment Flow Complete ===');
}

/**
 * Example 7: Handle duplicate webhook
 */
export async function exampleHandleDuplicateWebhook() {
  console.log('=== Duplicate Webhook Handling Example ===\n');

  const reference = 'fantooo_1234567890_test';

  // First webhook
  console.log('Processing first webhook...');
  const webhookData = {
    reference,
    status: 'success',
    amount: 40000,
    metadata: { userId: 'test-user', credits: 50 },
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    gateway_response: 'Successful',
    customer: { email: 'test@fantooo.com' },
  };

  const result1 = await processWebhook(webhookData as any);
  console.log('First webhook result:', result1);
  console.log('✅ Credits added\n');

  // Second webhook (duplicate)
  console.log('Processing duplicate webhook...');
  const result2 = await processWebhook(webhookData as any);
  console.log('Second webhook result:', result2);
  console.log('✅ Duplicate detected - no credits added\n');

  console.log('=== Duplicate Handling Complete ===');
}

// Export all examples
export const examples = {
  initializePayment: exampleInitializePayment,
  verifyPayment: exampleVerifyPayment,
  processWebhook: exampleProcessWebhook,
  getTransactionHistory: exampleGetTransactionHistory,
  checkTransactionStatus: exampleCheckTransactionStatus,
  completePaymentFlow: exampleCompletePaymentFlow,
  handleDuplicateWebhook: exampleHandleDuplicateWebhook,
};
