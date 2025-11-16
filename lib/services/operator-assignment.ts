/**
 * Operator Assignment and Queue Management Service
 * 
 * This service handles:
 * - Adding chats to the assignment queue with priority calculation
 * - Assigning operators to chats based on skill matching and availability
 * - Reassigning chats with loop prevention (max 3 attempts)
 * - Escalating chats after max reassignments
 * - Workload balancing (max concurrent chats per operator)
 * 
 * Requirements: 8.1-8.5 (Operator Assignment), 9.1-9.5 (Chat Reassignment)
 */

import { createClient } from '@/lib/supabase/server'

// Types - These will be replaced with generated types from Supabase
// For now, we define them manually based on the database schema
interface ChatQueue {
  id: string
  chat_id: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  priority_score: number
  user_tier: string
  user_lifetime_value?: number
  wait_time?: string
  required_specializations?: string[]
  preferred_operator_id?: string
  excluded_operator_ids?: string[]
  entered_queue_at: string
  attempts: number
  last_attempt_at?: string
  created_at: string
}

interface ChatQueueInsert {
  id?: string
  chat_id: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  priority_score: number
  user_tier: string
  user_lifetime_value?: number
  wait_time?: string
  required_specializations?: string[]
  preferred_operator_id?: string
  excluded_operator_ids?: string[]
  entered_queue_at?: string
  attempts?: number
  last_attempt_at?: string
  created_at?: string
}

export type Priority = 'urgent' | 'high' | 'normal' | 'low'

export interface QueueEntry {
  chatId: string
  priority: Priority
  userTier: string
  userLifetimeValue?: number
  requiredSpecializations?: string[]
  preferredOperatorId?: string
  excludedOperatorIds?: string[]
}

export interface AssignmentResult {
  success: boolean
  operatorId?: string
  operatorName?: string
  matchScore?: number
  error?: string
  escalated?: boolean
}

export interface ReassignmentOptions {
  reason: string
  preferNewOperator?: boolean
}

/**
 * Calculate priority score for queue placement
 * Higher score = higher priority in queue
 * 
 * Scoring algorithm:
 * - User tier: platinum=100, gold=80, silver=60, bronze=40, free=20
 * - Wait time: +1 point per minute waiting
 * - Lifetime value: +1 point per 100 KES spent
 * - VIP status: +50 points for platinum users
 */
export function calculatePriorityScore(
  userTier: string,
  waitTimeMinutes: number = 0,
  lifetimeValue: number = 0
): number {
  // Base score from user tier
  const tierScores: Record<string, number> = {
    platinum: 100,
    gold: 80,
    silver: 60,
    bronze: 40,
    free: 20
  }
  
  let score = tierScores[userTier] || 20
  
  // Add wait time bonus (1 point per minute)
  score += Math.floor(waitTimeMinutes)
  
  // Add lifetime value bonus (1 point per 100 KES)
  score += Math.floor(lifetimeValue / 100)
  
  // VIP bonus for platinum users
  if (userTier === 'platinum') {
    score += 50
  }
  
  return score
}

/**
 * Determine priority level based on score
 */
export function getPriorityLevel(score: number): Priority {
  if (score >= 150) return 'urgent'
  if (score >= 100) return 'high'
  if (score >= 50) return 'normal'
  return 'low'
}

/**
 * Add a chat to the assignment queue with priority calculation
 * 
 * Requirements: 8.1-8.5 (Operator Assignment)
 */
export async function addToQueue(
  entry: QueueEntry
): Promise<{ success: boolean; queueId?: string; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get user information for priority calculation
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select(`
        id,
        real_user_id,
        fictional_user_id,
        assignment_count,
        real_users!inner (
          user_tier,
          total_spent
        )
      `)
      .eq('id', entry.chatId)
      .single()
    
    if (chatError || !chat) {
      return {
        success: false,
        error: `Chat not found: ${chatError?.message || 'Unknown error'}`
      }
    }
    
    // Calculate wait time (if chat was created earlier)
    const waitTimeMinutes = 0 // Will be updated by queue monitoring
    
    // Calculate priority score
    const userTier = (chat.real_users as any).user_tier || 'free'
    const lifetimeValue = (chat.real_users as any).total_spent || 0
    const priorityScore = calculatePriorityScore(
      userTier,
      waitTimeMinutes,
      entry.userLifetimeValue || lifetimeValue
    )
    
    // Determine priority level
    const priority = entry.priority || getPriorityLevel(priorityScore)
    
    // Check if chat is already in queue
    const { data: existing } = await supabase
      .from('chat_queue')
      .select('id')
      .eq('chat_id', entry.chatId)
      .maybeSingle()
    
    if (existing) {
      // Update existing queue entry
      const { data: updated, error: updateError } = await supabase
        .from('chat_queue')
        .update({
          priority,
          priority_score: priorityScore,
          required_specializations: entry.requiredSpecializations,
          preferred_operator_id: entry.preferredOperatorId,
          excluded_operator_ids: entry.excludedOperatorIds
        })
        .eq('id', existing.id)
        .select('id')
        .single()
      
      if (updateError) {
        return {
          success: false,
          error: `Failed to update queue entry: ${updateError.message}`
        }
      }
      
      return {
        success: true,
        queueId: updated.id
      }
    }
    
    // Insert new queue entry
    const queueEntry: ChatQueueInsert = {
      chat_id: entry.chatId,
      priority,
      priority_score: priorityScore,
      user_tier: userTier,
      user_lifetime_value: lifetimeValue,
      required_specializations: entry.requiredSpecializations,
      preferred_operator_id: entry.preferredOperatorId,
      excluded_operator_ids: entry.excludedOperatorIds,
      entered_queue_at: new Date().toISOString(),
      attempts: 0
    }
    
    const { data: inserted, error: insertError } = await supabase
      .from('chat_queue')
      .insert(queueEntry)
      .select('id')
      .single()
    
    if (insertError) {
      return {
        success: false,
        error: `Failed to add to queue: ${insertError.message}`
      }
    }
    
    // Update chat status to idle (waiting for assignment)
    await supabase
      .from('chats')
      .update({ status: 'idle' })
      .eq('id', entry.chatId)
    
    return {
      success: true,
      queueId: inserted.id
    }
  } catch (error) {
    console.error('Error adding to queue:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Assign an operator to a chat using the database function
 * This leverages the skill matching algorithm in the database
 * 
 * Requirements: 8.1-8.5 (Operator Assignment)
 */
export async function assignOperator(
  chatId: string
): Promise<AssignmentResult> {
  try {
    const supabase = createClient()
    
    // Call the database function for operator assignment
    const { data, error } = await supabase
      .rpc('assign_chat_to_operator', {
        p_chat_id: chatId
      })
    
    if (error) {
      return {
        success: false,
        error: `Assignment failed: ${error.message}`
      }
    }
    
    // Check if assignment was successful
    if (!data || data.length === 0 || !data[0].assigned) {
      // Check if chat was escalated
      const { data: chat } = await supabase
        .from('chats')
        .select('status')
        .eq('id', chatId)
        .single()
      
      if (chat?.status === 'escalated') {
        return {
          success: false,
          escalated: true,
          error: 'Chat escalated after 3 failed assignment attempts'
        }
      }
      
      return {
        success: false,
        error: 'No available operators found'
      }
    }
    
    const assignment = data[0]
    
    return {
      success: true,
      operatorId: assignment.operator_id,
      operatorName: assignment.operator_name,
      matchScore: assignment.match_score
    }
  } catch (error) {
    console.error('Error assigning operator:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check operator availability
 * Verifies that operator is active, available, not suspended, and has capacity
 * 
 * Requirements: 11.1-11.5 (Operator Availability)
 */
export async function checkOperatorAvailability(
  operatorId: string
): Promise<{ available: boolean; reason?: string }> {
  try {
    const supabase = createClient()
    
    const { data: operator, error } = await supabase
      .from('operators')
      .select('is_active, is_available, is_suspended, current_chat_count, max_concurrent_chats')
      .eq('id', operatorId)
      .is('deleted_at', null)
      .single()
    
    if (error || !operator) {
      return {
        available: false,
        reason: 'Operator not found'
      }
    }
    
    if (!operator.is_active) {
      return {
        available: false,
        reason: 'Operator is not active'
      }
    }
    
    if (!operator.is_available) {
      return {
        available: false,
        reason: 'Operator is offline'
      }
    }
    
    if (operator.is_suspended) {
      return {
        available: false,
        reason: 'Operator is suspended'
      }
    }
    
    if (operator.current_chat_count >= operator.max_concurrent_chats) {
      return {
        available: false,
        reason: 'Operator has reached maximum concurrent chats'
      }
    }
    
    return {
      available: true
    }
  } catch (error) {
    console.error('Error checking operator availability:', error)
    return {
      available: false,
      reason: 'Error checking availability'
    }
  }
}

/**
 * Reassign a chat to a different operator with loop prevention
 * Maximum 3 reassignments before escalation to admin
 * 
 * Requirements: 9.1-9.5 (Chat Reassignment)
 */
export async function reassignChat(
  chatId: string,
  options: ReassignmentOptions
): Promise<AssignmentResult> {
  try {
    const supabase = createClient()
    
    // Get current chat information
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id, assignment_count, assigned_operator_id, status')
      .eq('id', chatId)
      .single()
    
    if (chatError || !chat) {
      return {
        success: false,
        error: `Chat not found: ${chatError?.message || 'Unknown error'}`
      }
    }
    
    // Check if max reassignments reached (3 attempts)
    if (chat.assignment_count >= 3) {
      // Escalate to admin
      const { error: escalateError } = await supabase
        .from('chats')
        .update({
          status: 'escalated',
          flags: supabase.rpc('array_append', {
            array: chat.flags || [],
            element: 'max_reassignments_reached'
          }),
          admin_notes: `Chat requires admin attention - ${options.reason}`
        })
        .eq('id', chatId)
      
      if (escalateError) {
        console.error('Error escalating chat:', escalateError)
      }
      
      // Create admin notification
      await supabase
        .from('admin_notifications')
        .insert({
          type: 'chat_escalation',
          message: `Chat escalated after 3 reassignment attempts: ${options.reason}`,
          metadata: {
            chat_id: chatId,
            reason: options.reason,
            assignment_count: chat.assignment_count
          },
          priority: 'high'
        })
      
      return {
        success: false,
        escalated: true,
        error: 'Chat escalated after maximum reassignments'
      }
    }
    
    // Get current operator to exclude from next assignment
    const excludedOperators = chat.assigned_operator_id 
      ? [chat.assigned_operator_id] 
      : []
    
    // If operator has active chats, decrement their count
    if (chat.assigned_operator_id) {
      await supabase
        .from('operators')
        .update({
          current_chat_count: supabase.rpc('greatest', {
            a: 0,
            b: supabase.rpc('subtract', {
              a: 'current_chat_count',
              b: 1
            })
          })
        })
        .eq('id', chat.assigned_operator_id)
      
      // Increment reassignment count for the operator
      await supabase
        .from('operators')
        .update({
          reassignment_count: supabase.rpc('add', {
            a: 'reassignment_count',
            b: 1
          })
        })
        .eq('id', chat.assigned_operator_id)
    }
    
    // Clear current assignment
    await supabase
      .from('chats')
      .update({
        assigned_operator_id: null,
        status: 'idle',
        operator_notes: `${chat.operator_notes || ''}\n[Reassigned: ${options.reason}]`.trim()
      })
      .eq('id', chatId)
    
    // Add to queue with higher priority (reassigned chats get priority)
    const { data: chatDetails } = await supabase
      .from('chats')
      .select(`
        real_user_id,
        real_users!inner (
          user_tier,
          total_spent
        )
      `)
      .eq('id', chatId)
      .single()
    
    const userTier = (chatDetails?.real_users as any)?.user_tier || 'free'
    
    const queueResult = await addToQueue({
      chatId,
      priority: 'high', // Reassigned chats get high priority
      userTier,
      excludedOperatorIds: excludedOperators
    })
    
    if (!queueResult.success) {
      return {
        success: false,
        error: `Failed to add to queue: ${queueResult.error}`
      }
    }
    
    // Try to assign immediately
    const assignmentResult = await assignOperator(chatId)
    
    return assignmentResult
  } catch (error) {
    console.error('Error reassigning chat:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get queue statistics
 * Useful for monitoring and dashboard displays
 */
export async function getQueueStats(): Promise<{
  total: number
  byPriority: Record<Priority, number>
  averageWaitTime: number
  oldestWaitTime: number
}> {
  try {
    const supabase = createClient()
    
    const { data: queue, error } = await supabase
      .from('chat_queue')
      .select('priority, entered_queue_at')
    
    if (error || !queue) {
      return {
        total: 0,
        byPriority: { urgent: 0, high: 0, normal: 0, low: 0 },
        averageWaitTime: 0,
        oldestWaitTime: 0
      }
    }
    
    const now = new Date()
    const waitTimes = queue.map(entry => {
      const entered = new Date(entry.entered_queue_at)
      return (now.getTime() - entered.getTime()) / 1000 / 60 // minutes
    })
    
    const byPriority = queue.reduce((acc, entry) => {
      acc[entry.priority as Priority] = (acc[entry.priority as Priority] || 0) + 1
      return acc
    }, {} as Record<Priority, number>)
    
    return {
      total: queue.length,
      byPriority: {
        urgent: byPriority.urgent || 0,
        high: byPriority.high || 0,
        normal: byPriority.normal || 0,
        low: byPriority.low || 0
      },
      averageWaitTime: waitTimes.length > 0 
        ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length 
        : 0,
      oldestWaitTime: waitTimes.length > 0 
        ? Math.max(...waitTimes) 
        : 0
    }
  } catch (error) {
    console.error('Error getting queue stats:', error)
    return {
      total: 0,
      byPriority: { urgent: 0, high: 0, normal: 0, low: 0 },
      averageWaitTime: 0,
      oldestWaitTime: 0
    }
  }
}

/**
 * Process the queue and assign operators to waiting chats
 * This should be called periodically (e.g., every 30 seconds)
 */
export async function processQueue(
  maxAssignments: number = 10
): Promise<{
  processed: number
  assigned: number
  failed: number
  escalated: number
}> {
  try {
    const supabase = createClient()
    
    // Get top priority chats from queue
    const { data: queueEntries, error } = await supabase
      .from('chat_queue')
      .select('chat_id, priority, priority_score')
      .order('priority_score', { ascending: false })
      .order('entered_queue_at', { ascending: true })
      .limit(maxAssignments)
    
    if (error || !queueEntries || queueEntries.length === 0) {
      return {
        processed: 0,
        assigned: 0,
        failed: 0,
        escalated: 0
      }
    }
    
    let assigned = 0
    let failed = 0
    let escalated = 0
    
    // Process each queue entry
    for (const entry of queueEntries) {
      const result = await assignOperator(entry.chat_id)
      
      if (result.success) {
        assigned++
      } else if (result.escalated) {
        escalated++
      } else {
        failed++
      }
    }
    
    return {
      processed: queueEntries.length,
      assigned,
      failed,
      escalated
    }
  } catch (error) {
    console.error('Error processing queue:', error)
    return {
      processed: 0,
      assigned: 0,
      failed: 0,
      escalated: 0
    }
  }
}
