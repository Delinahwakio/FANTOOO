/**
 * Example usage of the credit calculation utilities
 * This file demonstrates how to use the credit calculation functions
 */

import {
  calculateMessageCost,
  calculateBatchMessageCost,
  getMessageCostBreakdown,
  hasSufficientCredits,
  isPeakHour,
  isOffPeakHour,
  getTimeMultiplier,
  formatCredits,
  creditsToKES,
  kestoCredits,
  FREE_MESSAGES_COUNT,
} from './credits'
import type { UserTier } from '@/lib/types/user'

// Example 1: Calculate cost for a single message
function example1() {
  const messageNumber = 4 // First paid message
  const userTier: UserTier = 'free'
  const isFeaturedProfile = false
  
  const cost = calculateMessageCost(messageNumber, userTier, isFeaturedProfile)
  console.log(`Message ${messageNumber} costs: ${formatCredits(cost)}`)
}

// Example 2: Calculate cost during peak hours
function example2() {
  const messageNumber = 5
  const userTier: UserTier = 'gold'
  const isFeaturedProfile = true
  const peakTime = new Date('2024-01-01T21:00:00+03:00') // 9pm EAT
  
  const cost = calculateMessageCost(messageNumber, userTier, isFeaturedProfile, peakTime)
  console.log(`Peak hour message for gold user with featured profile: ${formatCredits(cost)}`)
}

// Example 3: Get detailed cost breakdown
function example3() {
  const messageNumber = 10
  const userTier: UserTier = 'platinum'
  const isFeaturedProfile = true
  
  const breakdown = getMessageCostBreakdown(messageNumber, userTier, isFeaturedProfile)
  
  console.log('Cost Breakdown:')
  console.log(`  Base cost: ${breakdown.baseCost}`)
  console.log(`  Time multiplier: ${breakdown.timeMultiplier}x (${breakdown.timeMultiplierLabel})`)
  console.log(`  Featured multiplier: ${breakdown.featuredMultiplier}x`)
  console.log(`  Tier discount: ${breakdown.tierDiscountLabel}`)
  console.log(`  Final cost: ${formatCredits(breakdown.finalCost)}`)
}

// Example 4: Check if user has sufficient credits
function example4() {
  const userCredits = 50
  const messageNumber = 4
  const userTier: UserTier = 'silver'
  const isFeaturedProfile = false
  
  const cost = calculateMessageCost(messageNumber, userTier, isFeaturedProfile)
  const canSend = hasSufficientCredits(userCredits, cost)
  
  console.log(`User has ${formatCredits(userCredits)}`)
  console.log(`Message costs ${formatCredits(cost)}`)
  console.log(`Can send message: ${canSend ? 'Yes' : 'No'}`)
}

// Example 5: Calculate batch message costs
function example5() {
  const startMessageNumber = 4 // Start from first paid message
  const messageCount = 10
  const userTier: UserTier = 'bronze'
  const isFeaturedProfile = false
  
  const totalCost = calculateBatchMessageCost(
    startMessageNumber,
    messageCount,
    userTier,
    isFeaturedProfile
  )
  
  console.log(`Sending ${messageCount} messages will cost: ${formatCredits(totalCost)}`)
  console.log(`In KES: ${creditsToKES(totalCost)} KES`)
}

// Example 6: Check current time status
function example6() {
  const now = new Date()
  const multiplier = getTimeMultiplier(now)
  
  console.log('Current time status:')
  console.log(`  Is peak hour: ${isPeakHour(now)}`)
  console.log(`  Is off-peak hour: ${isOffPeakHour(now)}`)
  console.log(`  Time multiplier: ${multiplier}x`)
}

// Example 7: Free messages check
function example7() {
  console.log(`First ${FREE_MESSAGES_COUNT} messages are free`)
  
  for (let i = 1; i <= 5; i++) {
    const cost = calculateMessageCost(i, 'free', false)
    console.log(`  Message ${i}: ${cost === 0 ? 'FREE' : `${formatCredits(cost)}`}`)
  }
}

// Example 8: Currency conversion
function example8() {
  const credits = 100
  const kes = 1000
  
  console.log(`${formatCredits(credits)} = ${creditsToKES(credits)} KES`)
  console.log(`${kes} KES = ${formatCredits(kestoCredits(kes))}`)
}

// Example 9: Real-world scenario - Chat interface
function example9() {
  // Simulating a chat where user is about to send their 4th message
  const chatMessageCount = 3 // User has sent 3 messages already
  const nextMessageNumber = chatMessageCount + 1
  const userCredits = 25
  const userTier: UserTier = 'silver'
  const isFeaturedProfile = true
  
  // Calculate cost for next message
  const cost = calculateMessageCost(nextMessageNumber, userTier, isFeaturedProfile)
  
  // Check if user can afford it
  if (hasSufficientCredits(userCredits, cost)) {
    console.log(`✅ User can send message (has ${formatCredits(userCredits)}, needs ${formatCredits(cost)})`)
  } else {
    console.log(`❌ Insufficient credits (has ${formatCredits(userCredits)}, needs ${formatCredits(cost)})`)
    console.log(`   User needs to purchase ${formatCredits(cost - userCredits)} more`)
  }
}

// Example 10: Operator dashboard - Preview costs for user
function example10() {
  const userTier: UserTier = 'gold'
  const isFeaturedProfile = false
  const currentMessageCount = 10
  
  console.log('Next 5 messages will cost:')
  for (let i = 1; i <= 5; i++) {
    const messageNumber = currentMessageCount + i
    const cost = calculateMessageCost(messageNumber, userTier, isFeaturedProfile)
    console.log(`  Message ${messageNumber}: ${formatCredits(cost)}`)
  }
}

// Export examples for testing
export const examples = {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  example8,
  example9,
  example10,
}
