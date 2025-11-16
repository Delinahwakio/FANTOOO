/**
 * Credit Calculation Utility
 * 
 * Handles all credit-related calculations including:
 * - Message cost calculation with time-based multipliers
 * - Peak/off-peak hour detection in EAT timezone
 * - User tier discount application
 * - Featured profile multipliers
 */

import { UserTier } from '@/lib/types/user'

// Base cost for a paid message (message 4+)
const BASE_MESSAGE_COST = 1 // 1 credit = 10 KES

// Free messages per chat (messages 1-3 are free)
export const FREE_MESSAGES_COUNT = 3

// Time-based multipliers
const PEAK_HOUR_MULTIPLIER = 1.2 // 8pm-2am EAT
const OFF_PEAK_MULTIPLIER = 0.8 // 2am-8am EAT
const NORMAL_MULTIPLIER = 1.0 // 8am-8pm EAT

// Featured profile multiplier
const FEATURED_PROFILE_MULTIPLIER = 1.5

// User tier discount percentages
const TIER_DISCOUNTS: Record<UserTier, number> = {
  free: 0, // No discount
  bronze: 0.05, // 5% discount
  silver: 0.10, // 10% discount
  gold: 0.15, // 15% discount
  platinum: 0.20, // 20% discount
}

// EAT timezone identifier
const EAT_TIMEZONE = 'Africa/Nairobi'

/**
 * Get the current time in EAT timezone
 */
export function getCurrentEATTime(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: EAT_TIMEZONE })
  )
}

/**
 * Get the hour in EAT timezone for a given date
 */
export function getEATHour(date: Date = new Date()): number {
  const eatTimeString = date.toLocaleString('en-US', {
    timeZone: EAT_TIMEZONE,
    hour: 'numeric',
    hour12: false,
  })
  return parseInt(eatTimeString, 10)
}

/**
 * Determine if the current time is during peak hours (8pm-2am EAT)
 */
export function isPeakHour(date: Date = new Date()): boolean {
  const hour = getEATHour(date)
  // Peak hours: 20:00 (8pm) to 01:59 (2am)
  // This means hour >= 20 OR hour < 2
  return hour >= 20 || hour < 2
}

/**
 * Determine if the current time is during off-peak hours (2am-8am EAT)
 */
export function isOffPeakHour(date: Date = new Date()): boolean {
  const hour = getEATHour(date)
  // Off-peak hours: 02:00 (2am) to 07:59 (8am)
  return hour >= 2 && hour < 8
}

/**
 * Get the time-based multiplier for the current time
 */
export function getTimeMultiplier(date: Date = new Date()): number {
  if (isPeakHour(date)) {
    return PEAK_HOUR_MULTIPLIER
  }
  if (isOffPeakHour(date)) {
    return OFF_PEAK_MULTIPLIER
  }
  return NORMAL_MULTIPLIER
}

/**
 * Get the discount multiplier for a user tier
 * Returns a value between 0 and 1 (e.g., 0.95 for 5% discount)
 */
export function getTierDiscountMultiplier(userTier: UserTier): number {
  const discount = TIER_DISCOUNTS[userTier] || 0
  return 1 - discount
}

/**
 * Calculate the cost of a message
 * 
 * @param messageNumber - The message number in the chat (1-based)
 * @param userTier - The user's tier level
 * @param isFeaturedProfile - Whether the fictional profile is featured
 * @param timestamp - Optional timestamp for the message (defaults to now)
 * @returns The credit cost for the message (0 for free messages)
 */
export function calculateMessageCost(
  messageNumber: number,
  userTier: UserTier,
  isFeaturedProfile: boolean = false,
  timestamp: Date = new Date()
): number {
  // Messages 1-3 are free
  if (messageNumber <= FREE_MESSAGES_COUNT) {
    return 0
  }

  // Start with base cost
  let cost = BASE_MESSAGE_COST

  // Apply time-based multiplier
  const timeMultiplier = getTimeMultiplier(timestamp)
  cost *= timeMultiplier

  // Apply featured profile multiplier
  if (isFeaturedProfile) {
    cost *= FEATURED_PROFILE_MULTIPLIER
  }

  // Apply user tier discount
  const tierMultiplier = getTierDiscountMultiplier(userTier)
  cost *= tierMultiplier

  // Round to nearest integer (credits are whole numbers)
  return Math.round(cost)
}

/**
 * Calculate the cost for multiple messages
 * Useful for previewing costs or batch calculations
 */
export function calculateBatchMessageCost(
  startMessageNumber: number,
  messageCount: number,
  userTier: UserTier,
  isFeaturedProfile: boolean = false,
  timestamp: Date = new Date()
): number {
  let totalCost = 0

  for (let i = 0; i < messageCount; i++) {
    const messageNumber = startMessageNumber + i
    totalCost += calculateMessageCost(
      messageNumber,
      userTier,
      isFeaturedProfile,
      timestamp
    )
  }

  return totalCost
}

/**
 * Check if a user has sufficient credits for a message
 */
export function hasSufficientCredits(
  currentCredits: number,
  messageCost: number
): boolean {
  return currentCredits >= messageCost
}

/**
 * Get a breakdown of the cost calculation for transparency
 */
export interface CostBreakdown {
  baseCost: number
  timeMultiplier: number
  timeMultiplierLabel: string
  featuredMultiplier: number
  tierDiscount: number
  tierDiscountLabel: string
  finalCost: number
  isFreeMessage: boolean
}

export function getMessageCostBreakdown(
  messageNumber: number,
  userTier: UserTier,
  isFeaturedProfile: boolean = false,
  timestamp: Date = new Date()
): CostBreakdown {
  const isFreeMessage = messageNumber <= FREE_MESSAGES_COUNT

  if (isFreeMessage) {
    return {
      baseCost: 0,
      timeMultiplier: 1,
      timeMultiplierLabel: 'Free message',
      featuredMultiplier: 1,
      tierDiscount: 0,
      tierDiscountLabel: 'N/A',
      finalCost: 0,
      isFreeMessage: true,
    }
  }

  const timeMultiplier = getTimeMultiplier(timestamp)
  const tierDiscount = TIER_DISCOUNTS[userTier] || 0
  const tierMultiplier = getTierDiscountMultiplier(userTier)

  let timeLabel = 'Normal hours'
  if (isPeakHour(timestamp)) {
    timeLabel = 'Peak hours (8pm-2am EAT)'
  } else if (isOffPeakHour(timestamp)) {
    timeLabel = 'Off-peak hours (2am-8am EAT)'
  } else {
    timeLabel = 'Normal hours (8am-8pm EAT)'
  }

  const tierLabel = tierDiscount > 0 ? `${(tierDiscount * 100).toFixed(0)}% ${userTier} discount` : 'No discount'

  const finalCost = calculateMessageCost(
    messageNumber,
    userTier,
    isFeaturedProfile,
    timestamp
  )

  return {
    baseCost: BASE_MESSAGE_COST,
    timeMultiplier,
    timeMultiplierLabel: timeLabel,
    featuredMultiplier: isFeaturedProfile ? FEATURED_PROFILE_MULTIPLIER : 1,
    tierDiscount,
    tierDiscountLabel: tierLabel,
    finalCost,
    isFreeMessage: false,
  }
}

/**
 * Format credits for display (e.g., "10 credits" or "1 credit")
 */
export function formatCredits(credits: number): string {
  return `${credits} ${credits === 1 ? 'credit' : 'credits'}`
}

/**
 * Convert credits to KES (1 credit = 10 KES)
 */
export function creditsToKES(credits: number): number {
  return credits * 10
}

/**
 * Convert KES to credits (10 KES = 1 credit)
 */
export function kestoCredits(kes: number): number {
  return Math.floor(kes / 10)
}
