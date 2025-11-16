/**
 * Example Usage: Operator Assignment Service
 * 
 * This file demonstrates how to use the operator assignment service
 * in various scenarios throughout the application.
 */

import {
  addToQueue,
  assignOperator,
  checkOperatorAvailability,
  reassignChat,
  getQueueStats,
  processQueue,
  calculatePriorityScore,
  getPriorityLevel
} from './operator-assignment'

// ============================================================================
// Example 1: New Chat - Add to Queue and Assign
// ============================================================================
async function example1_newChatAssignment() {
  console.log('=== Example 1: New Chat Assignment ===')
  
  const chatId = 'new-chat-uuid'
  const userTier = 'gold'
  
  // Step 1: Add chat to queue
  const queueResult = await addToQueue({
    chatId,
    userTier,
    priority: 'normal',
    requiredSpecializations: ['flirty', 'romantic']
  })
  
  if (!queueResult.success) {
    console.error('Failed to add to queue:', queueResult.error)
    return
  }
  
  console.log('Chat added to queue:', queueResult.queueId)
  
  // Step 2: Try immediate assignment
  const assignResult = await assignOperator(chatId)
  
  if (assignResult.success) {
    console.log('✓ Chat assigned to:', assignResult.operatorName)
    console.log('  Match score:', assignResult.matchScore)
    console.log('  Operator ID:', assignResult.operatorId)
  } else {
    console.log('⏳ No operator available, chat remains in queue')
    console.log('  Will be processed by background queue processor')
  }
}

// ============================================================================
// Example 2: Check Operator Availability Before Manual Assignment
// ============================================================================
async function example2_checkAvailability() {
  console.log('=== Example 2: Check Operator Availability ===')
  
  const operatorId = 'operator-uuid'
  
  const { available, reason } = await checkOperatorAvailability(operatorId)
  
  if (available) {
    console.log('✓ Operator is available for assignment')
  } else {
    console.log('✗ Operator not available:', reason)
  }
}

// ============================================================================
// Example 3: Reassign Chat Due to Operator Idle
// ============================================================================
async function example3_reassignIdleOperator() {
  console.log('=== Example 3: Reassign Idle Operator ===')
  
  const chatId = 'active-chat-uuid'
  
  // Operator hasn't responded in 3 minutes
  const result = await reassignChat(chatId, {
    reason: 'Operator idle for 3 minutes',
    preferNewOperator: true
  })
  
  if (result.success) {
    console.log('✓ Chat reassigned to:', result.operatorName)
    console.log('  New operator ID:', result.operatorId)
  } else if (result.escalated) {
    console.log('⚠ Chat escalated to admin after max reassignments')
    console.log('  Admin notification created')
  } else {
    console.error('✗ Reassignment failed:', result.error)
  }
}

// ============================================================================
// Example 4: Reassign Chat Due to User Request
// ============================================================================
async function example4_reassignUserRequest() {
  console.log('=== Example 4: Reassign on User Request ===')
  
  const chatId = 'active-chat-uuid'
  
  // User requested different operator
  const result = await reassignChat(chatId, {
    reason: 'User requested different operator'
  })
  
  if (result.success) {
    console.log('✓ Chat reassigned successfully')
  } else if (result.escalated) {
    console.log('⚠ Chat escalated - too many reassignments')
  } else {
    console.error('✗ Reassignment failed:', result.error)
  }
}

// ============================================================================
// Example 5: Monitor Queue Statistics
// ============================================================================
async function example5_monitorQueue() {
  console.log('=== Example 5: Queue Statistics ===')
  
  const stats = await getQueueStats()
  
  console.log('Queue Statistics:')
  console.log('  Total chats waiting:', stats.total)
  console.log('  By priority:')
  console.log('    - Urgent:', stats.byPriority.urgent)
  console.log('    - High:', stats.byPriority.high)
  console.log('    - Normal:', stats.byPriority.normal)
  console.log('    - Low:', stats.byPriority.low)
  console.log('  Average wait time:', stats.averageWaitTime.toFixed(1), 'minutes')
  console.log('  Oldest wait time:', stats.oldestWaitTime.toFixed(1), 'minutes')
  
  // Alert if queue is getting too long
  if (stats.total > 20) {
    console.log('⚠ WARNING: Queue is getting long, consider adding more operators')
  }
  
  // Alert if wait times are too high
  if (stats.averageWaitTime > 5) {
    console.log('⚠ WARNING: Average wait time exceeds 5 minutes')
  }
}

// ============================================================================
// Example 6: Background Queue Processor
// ============================================================================
async function example6_processQueue() {
  console.log('=== Example 6: Process Queue (Background Job) ===')
  
  // This should run every 30 seconds in production
  const result = await processQueue(10) // Process up to 10 chats
  
  console.log('Queue Processing Results:')
  console.log('  Processed:', result.processed)
  console.log('  Successfully assigned:', result.assigned)
  console.log('  Failed assignments:', result.failed)
  console.log('  Escalated to admin:', result.escalated)
  
  // Calculate success rate
  if (result.processed > 0) {
    const successRate = (result.assigned / result.processed) * 100
    console.log('  Success rate:', successRate.toFixed(1) + '%')
  }
}

// ============================================================================
// Example 7: Calculate Priority for Different User Types
// ============================================================================
function example7_priorityCalculation() {
  console.log('=== Example 7: Priority Calculation ===')
  
  // Free user, just joined
  const freeUserScore = calculatePriorityScore('free', 0, 0)
  console.log('Free user (new):', freeUserScore, '->', getPriorityLevel(freeUserScore))
  
  // Free user, waiting 10 minutes
  const freeUserWaitingScore = calculatePriorityScore('free', 10, 0)
  console.log('Free user (10 min wait):', freeUserWaitingScore, '->', getPriorityLevel(freeUserWaitingScore))
  
  // Gold user, just joined
  const goldUserScore = calculatePriorityScore('gold', 0, 0)
  console.log('Gold user (new):', goldUserScore, '->', getPriorityLevel(goldUserScore))
  
  // Platinum user, just joined
  const platinumUserScore = calculatePriorityScore('platinum', 0, 0)
  console.log('Platinum user (new):', platinumUserScore, '->', getPriorityLevel(platinumUserScore))
  
  // Free user with high lifetime value
  const valuableUserScore = calculatePriorityScore('free', 0, 5000)
  console.log('Free user (5000 KES spent):', valuableUserScore, '->', getPriorityLevel(valuableUserScore))
  
  // Free user, long wait time
  const longWaitScore = calculatePriorityScore('free', 60, 0)
  console.log('Free user (60 min wait):', longWaitScore, '->', getPriorityLevel(longWaitScore))
}

// ============================================================================
// Example 8: Add Reassigned Chat to Queue with Higher Priority
// ============================================================================
async function example8_reassignedChatPriority() {
  console.log('=== Example 8: Reassigned Chat Priority ===')
  
  const chatId = 'reassigned-chat-uuid'
  const previousOperatorId = 'previous-operator-uuid'
  
  // Reassigned chats get high priority
  const result = await addToQueue({
    chatId,
    userTier: 'free', // Even free users get high priority on reassignment
    priority: 'high',
    excludedOperatorIds: [previousOperatorId] // Don't assign back to same operator
  })
  
  if (result.success) {
    console.log('✓ Reassigned chat added to queue with high priority')
    console.log('  Previous operator excluded from assignment')
  }
}

// ============================================================================
// Example 9: Add Chat with Specific Specialization Requirements
// ============================================================================
async function example9_specializedAssignment() {
  console.log('=== Example 9: Specialized Assignment ===')
  
  const chatId = 'specialized-chat-uuid'
  
  // Fictional profile requires specific response style
  const result = await addToQueue({
    chatId,
    userTier: 'silver',
    requiredSpecializations: ['intellectual', 'friendly'],
    priority: 'normal'
  })
  
  if (result.success) {
    console.log('✓ Chat added with specialization requirements')
    console.log('  Will be matched with operators having intellectual/friendly skills')
  }
}

// ============================================================================
// Example 10: Preferred Operator Assignment
// ============================================================================
async function example10_preferredOperator() {
  console.log('=== Example 10: Preferred Operator ===')
  
  const chatId = 'chat-uuid'
  const preferredOperatorId = 'preferred-operator-uuid'
  
  // User had good experience with this operator before
  const result = await addToQueue({
    chatId,
    userTier: 'gold',
    preferredOperatorId, // This operator gets +20 bonus points
    priority: 'normal'
  })
  
  if (result.success) {
    console.log('✓ Chat added with preferred operator')
    console.log('  Preferred operator will be prioritized if available')
  }
}

// ============================================================================
// Example 11: Complete Workflow - New Chat to Assignment
// ============================================================================
async function example11_completeWorkflow() {
  console.log('=== Example 11: Complete Workflow ===')
  
  // Scenario: User starts chat with fictional profile
  const chatId = 'new-chat-uuid'
  const userId = 'user-uuid'
  const fictionalProfileId = 'fictional-uuid'
  
  console.log('Step 1: User initiates chat')
  console.log('  Chat ID:', chatId)
  console.log('  User ID:', userId)
  console.log('  Fictional Profile:', fictionalProfileId)
  
  console.log('\nStep 2: Add to assignment queue')
  const queueResult = await addToQueue({
    chatId,
    userTier: 'gold',
    requiredSpecializations: ['romantic', 'playful']
  })
  
  if (!queueResult.success) {
    console.error('✗ Failed to add to queue')
    return
  }
  
  console.log('✓ Added to queue')
  
  console.log('\nStep 3: Attempt immediate assignment')
  const assignResult = await assignOperator(chatId)
  
  if (assignResult.success) {
    console.log('✓ Operator assigned immediately')
    console.log('  Operator:', assignResult.operatorName)
    console.log('  Match score:', assignResult.matchScore)
    console.log('\nStep 4: Notify operator of new assignment')
    console.log('  Send real-time notification to operator')
    console.log('  Update operator dashboard')
  } else {
    console.log('⏳ No operator available')
    console.log('\nStep 4: Wait for background processor')
    console.log('  Chat will be assigned when operator becomes available')
    console.log('  User sees "Connecting you with someone..." message')
  }
}

// ============================================================================
// Example 12: Monitoring and Alerting
// ============================================================================
async function example12_monitoringAlerts() {
  console.log('=== Example 12: Monitoring and Alerts ===')
  
  const stats = await getQueueStats()
  
  // Check for various alert conditions
  const alerts: string[] = []
  
  if (stats.total > 50) {
    alerts.push('CRITICAL: Queue length exceeds 50 chats')
  } else if (stats.total > 20) {
    alerts.push('WARNING: Queue length exceeds 20 chats')
  }
  
  if (stats.averageWaitTime > 10) {
    alerts.push('CRITICAL: Average wait time exceeds 10 minutes')
  } else if (stats.averageWaitTime > 5) {
    alerts.push('WARNING: Average wait time exceeds 5 minutes')
  }
  
  if (stats.oldestWaitTime > 15) {
    alerts.push('CRITICAL: A chat has been waiting for over 15 minutes')
  }
  
  if (stats.byPriority.urgent > 5) {
    alerts.push('WARNING: Multiple urgent priority chats in queue')
  }
  
  if (alerts.length > 0) {
    console.log('⚠ ALERTS:')
    alerts.forEach(alert => console.log('  -', alert))
    console.log('\nRecommended actions:')
    console.log('  - Notify available operators')
    console.log('  - Consider activating backup operators')
    console.log('  - Review operator availability settings')
  } else {
    console.log('✓ All metrics within normal range')
  }
}

// ============================================================================
// Run Examples
// ============================================================================
async function runExamples() {
  // Uncomment to run specific examples
  
  // await example1_newChatAssignment()
  // await example2_checkAvailability()
  // await example3_reassignIdleOperator()
  // await example4_reassignUserRequest()
  // await example5_monitorQueue()
  // await example6_processQueue()
  // example7_priorityCalculation()
  // await example8_reassignedChatPriority()
  // await example9_specializedAssignment()
  // await example10_preferredOperator()
  // await example11_completeWorkflow()
  // await example12_monitoringAlerts()
}

// Export for use in other files
export {
  example1_newChatAssignment,
  example2_checkAvailability,
  example3_reassignIdleOperator,
  example4_reassignUserRequest,
  example5_monitorQueue,
  example6_processQueue,
  example7_priorityCalculation,
  example8_reassignedChatPriority,
  example9_specializedAssignment,
  example10_preferredOperator,
  example11_completeWorkflow,
  example12_monitoringAlerts
}
