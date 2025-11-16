'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/lib/components/ui/GlassCard'
import { GlassButton } from '@/lib/components/ui/GlassButton'
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner'
import { DatePicker } from '@/lib/components/shared/DatePicker'
import { useOperatorStats } from '@/lib/hooks/useOperator'
import { toast } from '@/lib/hooks/useToast'

/**
 * Operator Stats Page
 * 
 * Displays:
 * - Personal performance metrics (response time, user ratings, messages sent)
 * - Quality score trends over time
 * - Idle incidents and reassignment count
 * - Suspension warnings if quality score is low
 * - Date range filtering for historical data
 * 
 * Requirements: 12.1-12.5 (Operator Performance)
 */
export default function OperatorStatsPage() {
  const router = useRouter()
  
  // Date range state
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showTrends, setShowTrends] = useState(false)

  // Build query params
  const queryParams = showTrends && startDate && endDate
    ? `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    : ''

  // Fetch operator stats
  const { data: stats, isLoading, error, refetch } = useOperatorStats(queryParams)

  // Handle date range apply
  const handleApplyDateRange = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }
    if (startDate > endDate) {
      toast.error('Start date must be before end date')
      return
    }
    setShowTrends(true)
    refetch()
  }

  // Handle clear date range
  const handleClearDateRange = () => {
    setStartDate(null)
    setEndDate(null)
    setShowTrends(false)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show error state
  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard variant="elevated" className="max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            Failed to Load Stats
          </h2>
          <p className="text-neutral-600 mb-6">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <GlassButton
            variant="passion"
            onClick={() => window.location.reload()}
          >
            Retry
          </GlassButton>
        </GlassCard>
      </div>
    )
  }

  const { operator, performance, warnings, trends } = stats

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Performance Statistics
          </h1>
          <p className="text-neutral-600">
            Track your performance metrics and quality score
          </p>
        </div>
        <div className="flex gap-2">
          <GlassButton
            variant="outline"
            onClick={() => router.push('/operator/waiting')}
          >
            ← Back to Dashboard
          </GlassButton>
          <GlassButton
            variant="outline"
            onClick={() => router.push('/operator/settings')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </GlassButton>
        </div>
      </div>

      {/* Suspension Warning */}
      {operator.is_suspended && (
        <GlassCard variant="elevated" className="mb-6 border-2 border-red-300 bg-red-50/50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-1">
                Account Suspended
              </h3>
              <p className="text-red-700 mb-2">
                {operator.suspension_reason || 'Your account has been suspended due to low quality score.'}
              </p>
              {operator.suspended_until && (
                <p className="text-sm text-red-600">
                  Suspended until: {new Date(operator.suspended_until).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Quality Score Warning */}
      {warnings.suspension_warning && !operator.is_suspended && (
        <GlassCard variant="elevated" className="mb-6 border-2 border-orange-300 bg-orange-50/50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900 mb-1">
                Quality Score Warning
              </h3>
              <p className="text-orange-700 mb-2">
                Your quality score ({performance.quality_score.toFixed(2)}) is approaching the threshold ({warnings.quality_threshold}).
                Improve your performance to avoid suspension.
              </p>
              <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                <p className="text-sm font-semibold text-orange-900 mb-2">Tips to improve:</p>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Respond faster to messages</li>
                  <li>• Maintain engaging conversations</li>
                  <li>• Avoid idle time during active chats</li>
                  <li>• Follow fictional profile guidelines</li>
                </ul>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Date Range Filter */}
      <GlassCard variant="elevated" className="mb-8">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">
          Filter by Date Range
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Start Date
            </label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              maxDate={new Date()}
              placeholder="Select start date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              End Date
            </label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              maxDate={new Date()}
              minDate={startDate || undefined}
              placeholder="Select end date"
            />
          </div>
          <div className="flex gap-2">
            <GlassButton
              variant="passion"
              onClick={handleApplyDateRange}
              disabled={!startDate || !endDate}
              className="flex-1"
            >
              Apply Filter
            </GlassButton>
            {showTrends && (
              <GlassButton
                variant="outline"
                onClick={handleClearDateRange}
              >
                Clear
              </GlassButton>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Overall Performance Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          {showTrends ? 'Period Performance' : 'Overall Performance'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quality Score */}
          <GlassCard variant="elevated">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                Quality Score
              </h3>
              <svg className="w-5 h-5 text-trust-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className={`text-4xl font-bold mb-2 ${
              warnings.low_quality_score ? 'text-red-600' : 
              warnings.suspension_warning ? 'text-orange-600' : 
              'text-green-600'
            }`}>
              {performance.quality_score.toFixed(2)}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">
                Threshold: {warnings.quality_threshold}
              </span>
              <span className={`font-semibold ${
                warnings.low_quality_score ? 'text-red-600' : 
                warnings.suspension_warning ? 'text-orange-600' : 
                'text-green-600'
              }`}>
                {warnings.low_quality_score ? 'Below Threshold' :
                 warnings.suspension_warning ? 'Warning' :
                 'Good Standing'}
              </span>
            </div>
          </GlassCard>

          {/* Messages Sent */}
          <GlassCard variant="elevated">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                Messages Sent
              </h3>
              <svg className="w-5 h-5 text-passion-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-neutral-900 mb-2">
              {showTrends && trends?.period_totals
                ? trends.period_totals.messages_sent.toLocaleString()
                : performance.total_messages_sent.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">
              {showTrends ? 'In selected period' : 'All time'}
            </p>
          </GlassCard>

          {/* Chats Handled */}
          <GlassCard variant="elevated">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                Chats Handled
              </h3>
              <svg className="w-5 h-5 text-luxury-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-neutral-900 mb-2">
              {showTrends && trends?.period_totals
                ? trends.period_totals.chats_handled.toLocaleString()
                : performance.total_chats_handled.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">
              {showTrends ? 'In selected period' : 'All time'}
            </p>
          </GlassCard>

          {/* Average Rating */}
          <GlassCard variant="elevated">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                Average Rating
              </h3>
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-neutral-900 mb-2">
              {showTrends && trends?.period_totals
                ? trends.period_totals.average_rating.toFixed(2)
                : performance.average_user_rating.toFixed(2)} ⭐
            </p>
            <p className="text-xs text-neutral-500">
              {performance.total_ratings} total ratings
            </p>
          </GlassCard>
        </div>
      </div>

      {/* Performance Issues */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Performance Issues
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Idle Incidents */}
          <GlassCard variant="subtle">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                Idle Incidents
              </h3>
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-neutral-900 mb-1">
              {performance.idle_incidents}
            </p>
            <p className="text-xs text-neutral-500">
              Times you were idle during active chats
            </p>
          </GlassCard>

          {/* Reassignments */}
          <GlassCard variant="subtle">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                Reassignments
              </h3>
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-neutral-900 mb-1">
              {performance.reassignment_count}
            </p>
            <p className="text-xs text-neutral-500">
              Chats reassigned to other operators
            </p>
          </GlassCard>

          {/* User Complaints */}
          <GlassCard variant="subtle">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                User Complaints
              </h3>
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-neutral-900 mb-1">
              {performance.user_complaints}
            </p>
            <p className="text-xs text-neutral-500">
              Complaints received from users
            </p>
          </GlassCard>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Additional Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Response Time */}
          <GlassCard variant="subtle">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                Average Response Time
              </h3>
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-neutral-900 mb-1">
              {performance.average_response_time || 'N/A'}
            </p>
            <p className="text-xs text-neutral-500">
              Time to respond to messages
            </p>
          </GlassCard>

          {/* Total Earnings */}
          <GlassCard variant="subtle">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                Total Earnings
              </h3>
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-neutral-900 mb-1">
              KES {performance.total_earnings.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">
              {showTrends && trends?.period_totals
                ? `KES ${trends.period_totals.total_credits_earned.toLocaleString()} in period`
                : 'All time earnings'}
            </p>
          </GlassCard>
        </div>
      </div>

      {/* Trends Chart */}
      {showTrends && trends?.daily && trends.daily.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Performance Trends
          </h2>
          <GlassCard variant="elevated">
            <div className="space-y-6">
              {/* Messages Trend */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                  Messages Sent Over Time
                </h3>
                <div className="space-y-2">
                  {trends.daily.map((day, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-neutral-600 w-24">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 bg-neutral-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-passion-500 h-full rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.min((day.messages_sent / Math.max(...trends.daily.map(d => d.messages_sent))) * 100, 100)}%`
                          }}
                        >
                          <span className="text-xs font-semibold text-white">
                            {day.messages_sent}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chats Trend */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                  Chats Handled Over Time
                </h3>
                <div className="space-y-2">
                  {trends.daily.map((day, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-neutral-600 w-24">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 bg-neutral-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-luxury-500 h-full rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.min((day.chats_handled / Math.max(...trends.daily.map(d => d.chats_handled))) * 100, 100)}%`
                          }}
                        >
                          <span className="text-xs font-semibold text-white">
                            {day.chats_handled}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Trend */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                  Average Rating Over Time
                </h3>
                <div className="space-y-2">
                  {trends.daily.filter(d => d.average_rating > 0).map((day, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-neutral-600 w-24">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 bg-neutral-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-yellow-500 h-full rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${(day.average_rating / 5) * 100}%`
                          }}
                        >
                          <span className="text-xs font-semibold text-white">
                            {day.average_rating.toFixed(2)} ⭐
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* No Trends Message */}
      {showTrends && (!trends?.daily || trends.daily.length === 0) && (
        <GlassCard variant="subtle" className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            No Data Available
          </h3>
          <p className="text-neutral-600">
            No performance data found for the selected date range.
          </p>
        </GlassCard>
      )}
    </div>
  )
}
