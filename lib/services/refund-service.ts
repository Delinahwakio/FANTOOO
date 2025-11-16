/**
 * Credit Refund Service
 * 
 * Handles credit refund processing with:
 * - Refund reason validation
 * - Transaction safety with database transactions
 * - Audit trail creation
 * - User notification
 * 
 * Requirements: 18.1-18.5 (Credit Refund Processing)
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import { 
  DatabaseError, 
  TransactionError, 
  UserNotFoundError,
  UnauthorizedError 
} from '@/lib/errors'

/**
 * Valid refund reasons as per requirements
 */
export const REFUND_REASONS = [
  'accidental_send',
  'inappropriate_content',
  'system_error',
  'admin_discretion',
  'account_deletion'
] as const

export type RefundReason = typeof REFUND_REASONS[number]

/**
 * Refund status types
 */
export type RefundStatus = 'pending' | 'completed' | 'rejected'

/**
 * Refund request interface
 */
export interface RefundRequest {
  userId: string
  amount: number
  reason: RefundReason
  messageId?: string
  chatId?: string
  processedBy: string
  notes?: string
}

/**
 * Refund result interface
 */
export interface RefundResult {
  success: boolean
  refundId: string
  userId: string
  amount: number
  newBalance: number
  reason: RefundReason
  processedAt: Date
}

/**
 * Validate refund reason
 * 
 * @param reason - The refund reason to validate
 * @returns true if valid, false otherwise
 */
export function isValidRefundReason(reason: string): reason is RefundReason {
  return REFUND_REASONS.includes(reason as RefundReason)
}

/**
 * Process a credit refund with full audit trail
 * 
 * This function:
 * 1. Validates the refund request
 * 2. Checks user exists and admin permissions
 * 3. Adds credits back to user account within a transaction
 * 4. Creates audit record in credit_refunds table
 * 5. Returns refund result
 * 
 * @param request - The refund request details
 * @returns RefundResult with refund details
 * @throws UserNotFoundError if user doesn't exist
 * @throws UnauthorizedError if processor is not an admin
 * @throws TransactionError if database transaction fails
 * @throws DatabaseError for other database errors
 */
export async function processRefund(
  request: RefundRequest
): Promise<RefundResult> {
  // Validate refund reason
  if (!isValidRefundReason(request.reason)) {
    throw new Error(
      `Invalid refund reason: ${request.reason}. Must be one of: ${REFUND_REASONS.join(', ')}`
    )
  }

  // Validate amount
  if (request.amount <= 0) {
    throw new Error('Refund amount must be greater than 0')
  }

  const supabase = await createServerClient()

  try {
    // Verify the processor is an admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, is_active, permissions')
      .eq('id', request.processedBy)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (adminError || !admin) {
      throw new UnauthorizedError('Only active admins can process refunds')
    }

    // Check admin has refund permissions
    const permissions = admin.permissions as any
    if (permissions && !permissions.manage_payments) {
      throw new UnauthorizedError('Admin does not have permission to process refunds')
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('real_users')
      .select('id, credits, username, email')
      .eq('id', request.userId)
      .is('deleted_at', null)
      .single()

    if (userError || !user) {
      throw new UserNotFoundError(request.userId)
    }

    // Process refund in a transaction using RPC function
    // We'll call a database function that handles the transaction atomically
    const { data: refundData, error: refundError } = await supabase
      .rpc('process_credit_refund', {
        p_user_id: request.userId,
        p_amount: request.amount,
        p_reason: request.reason,
        p_message_id: request.messageId || null,
        p_chat_id: request.chatId || null,
        p_processed_by: request.processedBy,
        p_notes: request.notes || null
      })

    if (refundError) {
      throw new TransactionError(
        'Failed to process refund transaction',
        refundError
      )
    }

    // Return refund result
    return {
      success: true,
      refundId: refundData.refund_id,
      userId: request.userId,
      amount: request.amount,
      newBalance: refundData.new_balance,
      reason: request.reason,
      processedAt: new Date(refundData.processed_at)
    }

  } catch (error) {
    // Re-throw known errors
    if (
      error instanceof UserNotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof TransactionError
    ) {
      throw error
    }

    // Wrap unknown errors
    throw new DatabaseError(
      'Failed to process refund',
      error
    )
  }
}

/**
 * Get refund history for a user
 * 
 * @param userId - The user ID
 * @param limit - Maximum number of refunds to return (default: 50)
 * @returns Array of refund records
 */
export async function getUserRefundHistory(
  userId: string,
  limit: number = 50
) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('credit_refunds')
    .select(`
      id,
      amount,
      reason,
      message_id,
      chat_id,
      notes,
      status,
      created_at,
      processed_by,
      admins (
        name,
        email
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to fetch refund history', error)
  }

  return data || []
}

/**
 * Get all pending refunds (for admin review)
 * 
 * @param limit - Maximum number of refunds to return (default: 100)
 * @returns Array of pending refund records
 */
export async function getPendingRefunds(limit: number = 100) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('credit_refunds')
    .select(`
      id,
      user_id,
      amount,
      reason,
      message_id,
      chat_id,
      notes,
      status,
      created_at,
      real_users (
        username,
        email,
        credits
      ),
      admins (
        name,
        email
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to fetch pending refunds', error)
  }

  return data || []
}

/**
 * Update refund status
 * 
 * @param refundId - The refund ID
 * @param status - The new status
 * @param adminId - The admin making the update
 * @returns Updated refund record
 */
export async function updateRefundStatus(
  refundId: string,
  status: RefundStatus,
  adminId: string
) {
  const supabase = await createServerClient()

  // Verify admin
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('id')
    .eq('id', adminId)
    .eq('is_active', true)
    .single()

  if (adminError || !admin) {
    throw new UnauthorizedError('Only active admins can update refund status')
  }

  const { data, error } = await supabase
    .from('credit_refunds')
    .update({ status })
    .eq('id', refundId)
    .select()
    .single()

  if (error) {
    throw new DatabaseError('Failed to update refund status', error)
  }

  return data
}

/**
 * Calculate refund amount for account deletion
 * 
 * @param userId - The user ID
 * @returns Refund amount in credits and KES
 */
export async function calculateAccountDeletionRefund(userId: string) {
  const supabase = await createServerClient()

  const { data: user, error } = await supabase
    .from('real_users')
    .select('credits')
    .eq('id', userId)
    .single()

  if (error || !user) {
    throw new UserNotFoundError(userId)
  }

  const credits = user.credits || 0
  const refundAmountKES = credits * 10 // 10 KES per credit

  return {
    credits,
    amountKES: refundAmountKES
  }
}

/**
 * Get refund statistics for admin dashboard
 * 
 * @param startDate - Start date for statistics (optional)
 * @param endDate - End date for statistics (optional)
 * @returns Refund statistics
 */
export async function getRefundStatistics(
  startDate?: Date,
  endDate?: Date
) {
  const supabase = await createServerClient()

  let query = supabase
    .from('credit_refunds')
    .select('amount, reason, status, created_at')

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString())
  }

  const { data, error } = await query

  if (error) {
    throw new DatabaseError('Failed to fetch refund statistics', error)
  }

  // Calculate statistics
  const total = data?.length || 0
  const totalAmount = data?.reduce((sum, r) => sum + r.amount, 0) || 0
  const byReason = data?.reduce((acc, r) => {
    acc[r.reason] = (acc[r.reason] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  const byStatus = data?.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return {
    total,
    totalAmount,
    totalAmountKES: totalAmount * 10,
    byReason,
    byStatus,
    averageAmount: total > 0 ? totalAmount / total : 0
  }
}
