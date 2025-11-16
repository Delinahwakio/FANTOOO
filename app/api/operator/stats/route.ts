import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/operator/stats
 * 
 * Get operator performance statistics with optional date range filtering
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * 
 * Returns messages sent, chats handled, quality score, trends over time, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get current operator
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get operator record with stats
    const { data: operator, error: operatorError } = await supabase
      .from('operators')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Get active chats
    const { data: activeChats, error: chatsError } = await supabase
      .from('chats')
      .select('id, real_user_id, fictional_user_id, created_at, message_count')
      .eq('assigned_operator_id', operator.id)
      .eq('status', 'active')

    if (chatsError) {
      console.error('Error fetching active chats:', chatsError)
    }

    // Get historical data for trends (if date range provided)
    let trends = null
    if (startDate && endDate) {
      // Get chats in date range
      const { data: historicalChats } = await supabase
        .from('chats')
        .select('created_at, closed_at, message_count, total_credits_spent, user_satisfaction_rating')
        .eq('assigned_operator_id', operator.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Get messages in date range
      const { data: historicalMessages } = await supabase
        .from('messages')
        .select('created_at, handled_by_operator_id')
        .eq('handled_by_operator_id', operator.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Calculate trends by day
      const dailyStats = new Map<string, {
        date: string
        messages: number
        chats: number
        ratings: number[]
        totalRating: number
      }>()

      // Process messages
      historicalMessages?.forEach(msg => {
        const date = new Date(msg.created_at).toISOString().split('T')[0]
        const stats = dailyStats.get(date) || { date, messages: 0, chats: 0, ratings: [], totalRating: 0 }
        stats.messages++
        dailyStats.set(date, stats)
      })

      // Process chats
      historicalChats?.forEach(chat => {
        const date = new Date(chat.created_at).toISOString().split('T')[0]
        const stats = dailyStats.get(date) || { date, messages: 0, chats: 0, ratings: [], totalRating: 0 }
        stats.chats++
        if (chat.user_satisfaction_rating) {
          stats.ratings.push(chat.user_satisfaction_rating)
          stats.totalRating += chat.user_satisfaction_rating
        }
        dailyStats.set(date, stats)
      })

      // Convert to array and calculate averages
      trends = Array.from(dailyStats.values())
        .map(day => ({
          date: day.date,
          messages_sent: day.messages,
          chats_handled: day.chats,
          average_rating: day.ratings.length > 0 
            ? day.totalRating / day.ratings.length 
            : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Calculate period totals
      const periodTotals = {
        messages_sent: historicalMessages?.length || 0,
        chats_handled: historicalChats?.length || 0,
        average_rating: historicalChats && historicalChats.length > 0
          ? historicalChats
              .filter(c => c.user_satisfaction_rating)
              .reduce((sum, c) => sum + (c.user_satisfaction_rating || 0), 0) / 
            historicalChats.filter(c => c.user_satisfaction_rating).length
          : 0,
        total_credits_earned: historicalChats?.reduce((sum, c) => sum + (c.total_credits_spent || 0), 0) || 0
      }

      trends = {
        daily: trends,
        period_totals: periodTotals
      }
    }

    // Prepare stats response
    const stats = {
      operator: {
        id: operator.id,
        name: operator.name,
        email: operator.email,
        is_available: operator.is_available,
        is_suspended: operator.is_suspended,
        suspension_reason: operator.suspension_reason,
        suspended_until: operator.suspended_until,
      },
      performance: {
        total_messages_sent: operator.total_messages_sent,
        total_chats_handled: operator.total_chats_handled,
        quality_score: operator.quality_score,
        average_response_time: operator.average_response_time,
        average_user_rating: operator.average_user_rating,
        total_ratings: operator.total_ratings,
        idle_incidents: operator.idle_incidents,
        reassignment_count: operator.reassignment_count,
        user_complaints: operator.user_complaints,
        total_online_time: operator.total_online_time,
        total_earnings: operator.total_earnings,
      },
      current: {
        active_chats_count: operator.current_chat_count,
        active_chats: activeChats || [],
        max_concurrent_chats: operator.max_concurrent_chats,
      },
      warnings: {
        low_quality_score: operator.quality_score < operator.quality_threshold,
        quality_threshold: operator.quality_threshold,
        suspension_warning: operator.quality_score < operator.quality_threshold + 10,
      },
      trends
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in GET /api/operator/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
