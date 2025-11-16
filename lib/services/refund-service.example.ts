/**
 * Credit Refund Service - Usage Examples
 * 
 * This file demonstrates various use cases for the refund service
 */

import {
  processRefund,
  getUserRefundHistory,
  getPendingRefunds,
  calculateAccountDeletionRefund,
  getRefundStatistics,
  isValidRefundReason,
  REFUND_REASONS,
  type RefundRequest
} from './refund-service'

// ============================================================================
// Example 1: Process a Simple Refund
// ============================================================================

async function example1_simpleRefund() {
  try {
    const result = await processRefund({
      userId: 'user-uuid-here',
      amount: 10,
      reason: 'system_error',
      processedBy: 'admin-uuid-here',
      notes: 'Refund for duplicate charge due to system error'
    })

    console.log('Refund processed successfully!')
    console.log(`Refund ID: ${result.refundId}`)
    console.log(`Amount: ${result.amount} credits`)
    console.log(`New balance: ${result.newBalance} credits`)
    console.log(`Processed at: ${result.processedAt}`)
  } catch (error) {
    console.error('Failed to process refund:', error)
  }
}

// ============================================================================
// Example 2: Refund for Accidental Message Send
// ============================================================================

async function example2_accidentalSendRefund() {
  const refundRequest: RefundRequest = {
    userId: 'user-uuid',
    amount: 2, // Cost of the message
    reason: 'accidental_send',
    processedBy: 'admin-uuid',
    messageId: 'message-uuid', // Link to the specific message
    chatId: 'chat-uuid', // Link to the chat
    notes: 'User reported accidental send within 5 minutes'
  }

  try {
    const result = await processRefund(refundRequest)
    console.log(`Refunded ${result.amount} credits for accidental send`)
  } catch (error) {
    console.error('Refund failed:', error)
  }
}

// ============================================================================
// Example 3: Refund for Inappropriate Content
// ============================================================================

async function example3_inappropriateContentRefund() {
  try {
    const result = await processRefund({
      userId: 'user-uuid',
      amount: 5,
      reason: 'inappropriate_content',
      processedBy: 'admin-uuid',
      messageId: 'message-uuid',
      chatId: 'chat-uuid',
      notes: 'Operator sent inappropriate content. User complaint verified.'
    })

    console.log('Refund processed for inappropriate content')
    console.log(`User new balance: ${result.newBalance} credits`)
  } catch (error) {
    console.error('Failed to process refund:', error)
  }
}

// ============================================================================
// Example 4: Account Deletion Refund
// ============================================================================

async function example4_accountDeletionRefund() {
  const userId = 'user-uuid'

  try {
    // First, calculate the refund amount
    const refundInfo = await calculateAccountDeletionRefund(userId)
    
    console.log(`User has ${refundInfo.credits} unused credits`)
    console.log(`Refund amount: ${refundInfo.amountKES} KES`)

    // Process the refund if there are unused credits
    if (refundInfo.credits > 0) {
      const result = await processRefund({
        userId,
        amount: refundInfo.credits,
        reason: 'account_deletion',
        processedBy: 'admin-uuid',
        notes: `Account deletion refund: ${refundInfo.credits} credits (${refundInfo.amountKES} KES)`
      })

      console.log(`Refund processed: ${result.refundId}`)
    } else {
      console.log('No unused credits to refund')
    }
  } catch (error) {
    console.error('Failed to process account deletion refund:', error)
  }
}

// ============================================================================
// Example 5: Admin Discretion Refund
// ============================================================================

async function example5_adminDiscretionRefund() {
  try {
    const result = await processRefund({
      userId: 'user-uuid',
      amount: 15,
      reason: 'admin_discretion',
      processedBy: 'admin-uuid',
      notes: 'Goodwill gesture for poor service experience. Customer retention.'
    })

    console.log('Goodwill refund processed')
  } catch (error) {
    console.error('Failed to process refund:', error)
  }
}

// ============================================================================
// Example 6: Get User Refund History
// ============================================================================

async function example6_getUserRefundHistory() {
  try {
    const refunds = await getUserRefundHistory('user-uuid', 50)

    console.log(`Found ${refunds.length} refunds for user`)
    
    refunds.forEach(refund => {
      console.log('---')
      console.log(`Date: ${refund.created_at}`)
      console.log(`Amount: ${refund.amount} credits`)
      console.log(`Reason: ${refund.reason}`)
      console.log(`Status: ${refund.status}`)
      console.log(`Processed by: ${refund.admins?.name}`)
      if (refund.notes) {
        console.log(`Notes: ${refund.notes}`)
      }
    })
  } catch (error) {
    console.error('Failed to fetch refund history:', error)
  }
}

// ============================================================================
// Example 7: Get Pending Refunds (Admin Dashboard)
// ============================================================================

async function example7_getPendingRefunds() {
  try {
    const pendingRefunds = await getPendingRefunds(100)

    console.log(`Found ${pendingRefunds.length} pending refunds`)
    
    pendingRefunds.forEach(refund => {
      console.log('---')
      console.log(`User: ${refund.real_users?.username}`)
      console.log(`Amount: ${refund.amount} credits`)
      console.log(`Reason: ${refund.reason}`)
      console.log(`Current balance: ${refund.real_users?.credits} credits`)
      console.log(`Requested: ${refund.created_at}`)
      if (refund.notes) {
        console.log(`Notes: ${refund.notes}`)
      }
    })
  } catch (error) {
    console.error('Failed to fetch pending refunds:', error)
  }
}

// ============================================================================
// Example 8: Get Refund Statistics
// ============================================================================

async function example8_getRefundStatistics() {
  try {
    // Get statistics for the current year
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-12-31')
    
    const stats = await getRefundStatistics(startDate, endDate)

    console.log('=== Refund Statistics ===')
    console.log(`Total refunds: ${stats.total}`)
    console.log(`Total amount: ${stats.totalAmount} credits`)
    console.log(`Total amount: ${stats.totalAmountKES} KES`)
    console.log(`Average refund: ${stats.averageAmount.toFixed(2)} credits`)
    
    console.log('\nBy Reason:')
    Object.entries(stats.byReason).forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count}`)
    })
    
    console.log('\nBy Status:')
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`)
    })
  } catch (error) {
    console.error('Failed to fetch refund statistics:', error)
  }
}

// ============================================================================
// Example 9: Validate Refund Reason
// ============================================================================

async function example9_validateRefundReason() {
  const userInput = 'system_error'

  if (isValidRefundReason(userInput)) {
    console.log(`"${userInput}" is a valid refund reason`)
    
    // Process refund
    await processRefund({
      userId: 'user-uuid',
      amount: 5,
      reason: userInput,
      processedBy: 'admin-uuid'
    })
  } else {
    console.error(`Invalid refund reason: "${userInput}"`)
    console.log(`Valid reasons are: ${REFUND_REASONS.join(', ')}`)
  }
}

// ============================================================================
// Example 10: Batch Refund Processing
// ============================================================================

async function example10_batchRefundProcessing() {
  const refundRequests: RefundRequest[] = [
    {
      userId: 'user-1',
      amount: 5,
      reason: 'system_error',
      processedBy: 'admin-uuid',
      notes: 'System outage caused incorrect charges'
    },
    {
      userId: 'user-2',
      amount: 3,
      reason: 'system_error',
      processedBy: 'admin-uuid',
      notes: 'System outage caused incorrect charges'
    },
    {
      userId: 'user-3',
      amount: 7,
      reason: 'system_error',
      processedBy: 'admin-uuid',
      notes: 'System outage caused incorrect charges'
    }
  ]

  console.log(`Processing ${refundRequests.length} refunds...`)

  const results = await Promise.allSettled(
    refundRequests.map(request => processRefund(request))
  )

  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  console.log(`Successful: ${successful}`)
  console.log(`Failed: ${failed}`)

  // Log failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Refund ${index + 1} failed:`, result.reason)
    }
  })
}

// ============================================================================
// Example 11: Error Handling
// ============================================================================

async function example11_errorHandling() {
  try {
    await processRefund({
      userId: 'non-existent-user',
      amount: 10,
      reason: 'system_error',
      processedBy: 'admin-uuid'
    })
  } catch (error: any) {
    // Handle specific error types
    if (error.name === 'UserNotFoundError') {
      console.error('User does not exist')
    } else if (error.name === 'UnauthorizedError') {
      console.error('Admin does not have permission to process refunds')
    } else if (error.name === 'TransactionError') {
      console.error('Database transaction failed:', error.message)
    } else if (error.name === 'DatabaseError') {
      console.error('Database error:', error.message)
    } else {
      console.error('Unknown error:', error.message)
    }
  }
}

// ============================================================================
// Example 12: Refund with User Notification
// ============================================================================

async function example12_refundWithNotification() {
  try {
    const result = await processRefund({
      userId: 'user-uuid',
      amount: 10,
      reason: 'system_error',
      processedBy: 'admin-uuid',
      notes: 'Refund for system error'
    })

    // After successful refund, send notification to user
    // (This would be implemented in a separate notification service)
    console.log('Refund processed, sending notification...')
    
    // await sendUserNotification({
    //   userId: result.userId,
    //   type: 'credit_refund',
    //   title: 'Credits Refunded',
    //   message: `${result.amount} credits have been added to your account`,
    //   data: {
    //     amount: result.amount,
    //     reason: result.reason,
    //     newBalance: result.newBalance
    //   }
    // })

    console.log('Notification sent')
  } catch (error) {
    console.error('Failed to process refund:', error)
  }
}

// ============================================================================
// Export examples for testing
// ============================================================================

export const examples = {
  example1_simpleRefund,
  example2_accidentalSendRefund,
  example3_inappropriateContentRefund,
  example4_accountDeletionRefund,
  example5_adminDiscretionRefund,
  example6_getUserRefundHistory,
  example7_getPendingRefunds,
  example8_getRefundStatistics,
  example9_validateRefundReason,
  example10_batchRefundProcessing,
  example11_errorHandling,
  example12_refundWithNotification
}
