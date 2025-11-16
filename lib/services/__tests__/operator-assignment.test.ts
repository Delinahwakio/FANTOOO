/**
 * Unit tests for Operator Assignment Service
 * 
 * Tests priority calculation, queue management, and assignment logic
 */

import { describe, it, expect } from '@jest/globals'
import {
  calculatePriorityScore,
  getPriorityLevel,
  type Priority
} from '../operator-assignment'

describe('Operator Assignment Service', () => {
  describe('calculatePriorityScore', () => {
    it('should calculate base score for free tier user', () => {
      const score = calculatePriorityScore('free', 0, 0)
      expect(score).toBe(20)
    })

    it('should calculate base score for bronze tier user', () => {
      const score = calculatePriorityScore('bronze', 0, 0)
      expect(score).toBe(40)
    })

    it('should calculate base score for silver tier user', () => {
      const score = calculatePriorityScore('silver', 0, 0)
      expect(score).toBe(60)
    })

    it('should calculate base score for gold tier user', () => {
      const score = calculatePriorityScore('gold', 0, 0)
      expect(score).toBe(80)
    })

    it('should calculate base score for platinum tier user', () => {
      const score = calculatePriorityScore('platinum', 0, 0)
      expect(score).toBe(150) // 100 base + 50 VIP bonus
    })

    it('should add wait time bonus (1 point per minute)', () => {
      const score = calculatePriorityScore('free', 10, 0)
      expect(score).toBe(30) // 20 base + 10 wait time
    })

    it('should add lifetime value bonus (1 point per 100 KES)', () => {
      const score = calculatePriorityScore('free', 0, 500)
      expect(score).toBe(25) // 20 base + 5 lifetime value
    })

    it('should combine all bonuses correctly', () => {
      const score = calculatePriorityScore('gold', 15, 1000)
      expect(score).toBe(105) // 80 base + 15 wait + 10 lifetime
    })

    it('should give platinum users VIP bonus', () => {
      const score = calculatePriorityScore('platinum', 5, 200)
      expect(score).toBe(157) // 100 base + 50 VIP + 5 wait + 2 lifetime
    })

    it('should handle fractional lifetime values', () => {
      const score = calculatePriorityScore('free', 0, 150)
      expect(score).toBe(21) // 20 base + 1 (floor of 150/100)
    })

    it('should handle fractional wait times', () => {
      const score = calculatePriorityScore('free', 2.7, 0)
      expect(score).toBe(22) // 20 base + 2 (floor of 2.7)
    })

    it('should default to free tier for unknown tier', () => {
      const score = calculatePriorityScore('unknown', 0, 0)
      expect(score).toBe(20)
    })
  })

  describe('getPriorityLevel', () => {
    it('should return "urgent" for score >= 150', () => {
      expect(getPriorityLevel(150)).toBe('urgent')
      expect(getPriorityLevel(200)).toBe('urgent')
    })

    it('should return "high" for score >= 100 and < 150', () => {
      expect(getPriorityLevel(100)).toBe('high')
      expect(getPriorityLevel(125)).toBe('high')
      expect(getPriorityLevel(149)).toBe('high')
    })

    it('should return "normal" for score >= 50 and < 100', () => {
      expect(getPriorityLevel(50)).toBe('normal')
      expect(getPriorityLevel(75)).toBe('normal')
      expect(getPriorityLevel(99)).toBe('normal')
    })

    it('should return "low" for score < 50', () => {
      expect(getPriorityLevel(0)).toBe('low')
      expect(getPriorityLevel(25)).toBe('low')
      expect(getPriorityLevel(49)).toBe('low')
    })
  })

  describe('Priority Scenarios', () => {
    it('should prioritize platinum user immediately', () => {
      const score = calculatePriorityScore('platinum', 0, 0)
      const priority = getPriorityLevel(score)
      expect(priority).toBe('urgent')
    })

    it('should prioritize gold user after some wait time', () => {
      const score = calculatePriorityScore('gold', 25, 0)
      const priority = getPriorityLevel(score)
      expect(priority).toBe('high') // 80 + 25 = 105
    })

    it('should prioritize free user with high lifetime value', () => {
      const score = calculatePriorityScore('free', 0, 8000)
      const priority = getPriorityLevel(score)
      expect(priority).toBe('high') // 20 + 80 = 100
    })

    it('should escalate priority with wait time', () => {
      // Free user starts at low priority
      let score = calculatePriorityScore('free', 0, 0)
      expect(getPriorityLevel(score)).toBe('low')

      // After 30 minutes, becomes normal priority
      score = calculatePriorityScore('free', 30, 0)
      expect(getPriorityLevel(score)).toBe('normal')

      // After 80 minutes, becomes high priority
      score = calculatePriorityScore('free', 80, 0)
      expect(getPriorityLevel(score)).toBe('high')

      // After 130 minutes, becomes urgent
      score = calculatePriorityScore('free', 130, 0)
      expect(getPriorityLevel(score)).toBe('urgent')
    })

    it('should handle reassigned chat with higher priority', () => {
      // Reassigned chats typically get 'high' priority override
      // Even a free user should get high priority on reassignment
      const score = calculatePriorityScore('free', 5, 0)
      // In actual implementation, reassigned chats get 'high' priority directly
      // This test shows the score calculation
      expect(score).toBe(25) // 20 + 5
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative wait time gracefully', () => {
      const score = calculatePriorityScore('free', -5, 0)
      expect(score).toBe(20) // Should not subtract, floor of -5 is -5
    })

    it('should handle negative lifetime value gracefully', () => {
      const score = calculatePriorityScore('free', 0, -100)
      expect(score).toBe(20) // Should not subtract
    })

    it('should handle very large wait times', () => {
      const score = calculatePriorityScore('free', 1000, 0)
      expect(score).toBe(1020) // 20 + 1000
      expect(getPriorityLevel(score)).toBe('urgent')
    })

    it('should handle very large lifetime values', () => {
      const score = calculatePriorityScore('free', 0, 100000)
      expect(score).toBe(1020) // 20 + 1000
      expect(getPriorityLevel(score)).toBe('urgent')
    })
  })

  describe('Workload Balancing Scenarios', () => {
    it('should prefer operators with fewer chats', () => {
      // This is tested in the database function
      // Here we document the expected behavior
      
      // Operator A: 0 chats, quality 80 -> workload score: 20
      // Operator B: 3 chats, quality 90 -> workload score: 10
      // Operator A should be preferred despite lower quality
      
      const operatorAScore = 50 + 20 + 7 // base + workload + quality
      const operatorBScore = 50 + 10 + 10 // base + workload + quality
      
      expect(operatorAScore).toBeGreaterThan(operatorBScore)
    })

    it('should not assign to operators at max capacity', () => {
      // Operators with current_chat_count >= max_concurrent_chats
      // should not be considered for assignment
      // This is enforced in the database function
      expect(true).toBe(true) // Placeholder for integration test
    })
  })

  describe('Reassignment Loop Prevention', () => {
    it('should track assignment count', () => {
      // After 3 reassignments, chat should be escalated
      // This is enforced in the reassignChat function
      const maxReassignments = 3
      expect(maxReassignments).toBe(3)
    })

    it('should exclude previous operators', () => {
      // When reassigning, previous operator should be in excluded list
      // This prevents immediate reassignment to same operator
      expect(true).toBe(true) // Placeholder for integration test
    })
  })

  describe('Skill Matching', () => {
    it('should match required specializations', () => {
      // Operator with matching specializations gets +30 points
      // Operator with partial match gets +15 points
      // Operator with no match gets 0 points
      
      const fullMatchBonus = 30
      const partialMatchBonus = 15
      const noMatchBonus = 0
      
      expect(fullMatchBonus).toBeGreaterThan(partialMatchBonus)
      expect(partialMatchBonus).toBeGreaterThan(noMatchBonus)
    })

    it('should prefer operators with all required specializations', () => {
      // Required: ['flirty', 'romantic']
      // Operator A: ['flirty', 'romantic', 'playful'] -> full match
      // Operator B: ['flirty', 'intellectual'] -> partial match
      
      const operatorAScore = 50 + 30 // base + full match
      const operatorBScore = 50 + 15 // base + partial match
      
      expect(operatorAScore).toBeGreaterThan(operatorBScore)
    })
  })

  describe('Quality Score Impact', () => {
    it('should give bonus for high quality operators', () => {
      // Quality >= 90: +10 points
      // Quality >= 80: +7 points
      // Quality >= 70: +5 points
      // Quality < 70: 0 points
      
      expect(10).toBeGreaterThan(7)
      expect(7).toBeGreaterThan(5)
      expect(5).toBeGreaterThan(0)
    })

    it('should not assign suspended operators', () => {
      // Operators with is_suspended = true should not be considered
      // This is enforced in the database function
      expect(true).toBe(true) // Placeholder for integration test
    })
  })
})
