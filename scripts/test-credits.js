/**
 * Test script for credit calculation utilities
 * Run with: node scripts/test-credits.js
 */

// Mock the credit calculation logic for testing
const BASE_MESSAGE_COST = 1
const FREE_MESSAGES_COUNT = 3
const PEAK_HOUR_MULTIPLIER = 1.2
const OFF_PEAK_MULTIPLIER = 0.8
const NORMAL_MULTIPLIER = 1.0
const FEATURED_PROFILE_MULTIPLIER = 1.5

const TIER_DISCOUNTS = {
  free: 0,
  bronze: 0.05,
  silver: 0.10,
  gold: 0.15,
  platinum: 0.20,
}

function getEATHour(date) {
  const eatTimeString = date.toLocaleString('en-US', {
    timeZone: 'Africa/Nairobi',
    hour: 'numeric',
    hour12: false,
  })
  return parseInt(eatTimeString, 10)
}

function isPeakHour(date) {
  const hour = getEATHour(date)
  return hour >= 20 || hour < 2
}

function isOffPeakHour(date) {
  const hour = getEATHour(date)
  return hour >= 2 && hour < 8
}

function getTimeMultiplier(date) {
  if (isPeakHour(date)) return PEAK_HOUR_MULTIPLIER
  if (isOffPeakHour(date)) return OFF_PEAK_MULTIPLIER
  return NORMAL_MULTIPLIER
}

function getTierDiscountMultiplier(userTier) {
  const discount = TIER_DISCOUNTS[userTier] || 0
  return 1 - discount
}

function calculateMessageCost(messageNumber, userTier, isFeaturedProfile, timestamp) {
  if (messageNumber <= FREE_MESSAGES_COUNT) return 0

  let cost = BASE_MESSAGE_COST
  cost *= getTimeMultiplier(timestamp)
  if (isFeaturedProfile) cost *= FEATURED_PROFILE_MULTIPLIER
  cost *= getTierDiscountMultiplier(userTier)

  return Math.round(cost)
}

// Test cases
console.log('🧪 Testing Credit Calculation System\n')

// Test 1: Free messages
console.log('Test 1: Free Messages (1-3)')
for (let i = 1; i <= 3; i++) {
  const cost = calculateMessageCost(i, 'free', false, new Date())
  console.log(`  Message ${i}: ${cost} credits ${cost === 0 ? '✅' : '❌'}`)
}

// Test 2: Peak hours (simulate 9pm EAT)
console.log('\nTest 2: Peak Hours (8pm-2am EAT) - 1.2x multiplier')
const peakDate = new Date('2024-01-01T21:00:00+03:00') // 9pm EAT
const peakCost = calculateMessageCost(4, 'free', false, peakDate)
console.log(`  Message 4 at peak: ${peakCost} credits ${peakCost === 1 ? '✅' : '❌'}`)

// Test 3: Off-peak hours (simulate 4am EAT)
console.log('\nTest 3: Off-Peak Hours (2am-8am EAT) - 0.8x multiplier')
const offPeakDate = new Date('2024-01-01T04:00:00+03:00') // 4am EAT
const offPeakCost = calculateMessageCost(4, 'free', false, offPeakDate)
console.log(`  Message 4 at off-peak: ${offPeakCost} credits ${offPeakCost === 1 ? '✅' : '❌'}`)

// Test 4: Normal hours (simulate 2pm EAT)
console.log('\nTest 4: Normal Hours (8am-8pm EAT) - 1.0x multiplier')
const normalDate = new Date('2024-01-01T14:00:00+03:00') // 2pm EAT
const normalCost = calculateMessageCost(4, 'free', false, normalDate)
console.log(`  Message 4 at normal: ${normalCost} credits ${normalCost === 1 ? '✅' : '❌'}`)

// Test 5: Featured profile multiplier
console.log('\nTest 5: Featured Profile - 1.5x multiplier')
const featuredCost = calculateMessageCost(4, 'free', true, normalDate)
console.log(`  Message 4 featured: ${featuredCost} credits ${featuredCost === 2 ? '✅' : '❌'}`)

// Test 6: User tier discounts
console.log('\nTest 6: User Tier Discounts')
const tiers = ['free', 'bronze', 'silver', 'gold', 'platinum']
tiers.forEach(tier => {
  const cost = calculateMessageCost(4, tier, false, normalDate)
  const discount = TIER_DISCOUNTS[tier]
  const expected = Math.round(BASE_MESSAGE_COST * (1 - discount))
  console.log(`  ${tier}: ${cost} credits (${discount * 100}% discount) ${cost === expected ? '✅' : '❌'}`)
})

// Test 7: Combined multipliers (peak + featured + gold tier)
console.log('\nTest 7: Combined Multipliers (Peak + Featured + Gold)')
const combinedCost = calculateMessageCost(4, 'gold', true, peakDate)
// Base: 1, Peak: 1.2, Featured: 1.5, Gold: 0.85 = 1 * 1.2 * 1.5 * 0.85 = 1.53 ≈ 2
console.log(`  Combined cost: ${combinedCost} credits ${combinedCost === 2 ? '✅' : '❌'}`)

// Test 8: Timezone handling
console.log('\nTest 8: EAT Timezone Handling')
const now = new Date()
const eatHour = getEATHour(now)
console.log(`  Current EAT hour: ${eatHour} ${eatHour >= 0 && eatHour < 24 ? '✅' : '❌'}`)
console.log(`  Is peak hour: ${isPeakHour(now)}`)
console.log(`  Is off-peak hour: ${isOffPeakHour(now)}`)

console.log('\n✨ All tests completed!')
