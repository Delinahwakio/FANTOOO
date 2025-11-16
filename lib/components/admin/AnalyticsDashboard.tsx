'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

export interface AnalyticsDashboardProps {
  className?: string;
}

interface AnalyticsData {
  overview: {
    total_users: number;
    active_users: number;
    total_chats: number;
    active_chats: number;
    total_revenue: number;
    total_messages: number;
  };
  revenue: {
    date: string;
    amount: number;
  }[];
  user_growth: {
    date: string;
    count: number;
  }[];
  operator_performance: {
    id: string;
    name: string;
    quality_score: number;
    total_chats: number;
    total_messages: number;
    average_rating: number;
  }[];
  conversion_rate: {
    free_users: number;
    paid_users: number;
    conversion_percentage: number;
  };
  engagement: {
    avg_messages_per_chat: number;
    avg_credits_per_user: number;
    avg_session_duration: number;
  };
}

/**
 * AnalyticsDashboard Component
 * 
 * Admin component for displaying comprehensive platform analytics.
 * 
 * Features:
 * - Platform-wide analytics (users, chats, revenue)
 * - Operator performance rankings
 * - Revenue metrics over time
 * - User engagement trends
 * - Conversion rate tracking (free to paid)
 * - Date range filtering and export functionality
 * 
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <AnalyticsDashboard />
 * ```
 */
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/analytics?range=${dateRange}`);
      // const data = await response.json();
      // setAnalytics(data);
      
      // Simulated data
      setTimeout(() => {
        setAnalytics({
          overview: {
            total_users: 1250,
            active_users: 847,
            total_chats: 3420,
            active_chats: 156,
            total_revenue: 458900,
            total_messages: 28450,
          },
          revenue: [],
          user_growth: [],
          operator_performance: [],
          conversion_rate: {
            free_users: 850,
            paid_users: 400,
            conversion_percentage: 32,
          },
          engagement: {
            avg_messages_per_chat: 8.3,
            avg_credits_per_user: 45,
            avg_session_duration: 12.5,
          },
        });
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analytics data...');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <GlassCard variant="subtle" className="text-center py-12">
        <p className="text-neutral-600 text-lg">Failed to load analytics</p>
      </GlassCard>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            Platform Analytics
          </h2>
          <p className="text-neutral-600 mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex gap-1 glass-subtle rounded-lg p-1">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-smooth',
                  dateRange === range
                    ? 'bg-gradient-trust text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                )}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>
          
          <GlassButton
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </GlassButton>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 mb-1">Total Users</div>
              <div className="text-3xl font-bold text-neutral-900">
                {analytics.overview.total_users.toLocaleString()}
              </div>
              <div className="text-sm text-green-600 mt-2">
                {analytics.overview.active_users} active
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-passion flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 mb-1">Total Chats</div>
              <div className="text-3xl font-bold text-neutral-900">
                {analytics.overview.total_chats.toLocaleString()}
              </div>
              <div className="text-sm text-green-600 mt-2">
                {analytics.overview.active_chats} active
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-luxury flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 mb-1">Total Revenue</div>
              <div className="text-3xl font-bold text-neutral-900">
                KES {analytics.overview.total_revenue.toLocaleString()}
              </div>
              <div className="text-sm text-neutral-600 mt-2">
                {analytics.overview.total_messages.toLocaleString()} messages
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-trust flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Conversion Rate */}
      <GlassCard variant="default" className="p-6">
        <h3 className="font-display text-xl font-bold text-neutral-900 mb-4">
          Conversion Rate
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-neutral-900">
              {analytics.conversion_rate.free_users}
            </div>
            <div className="text-sm text-neutral-600 mt-1">Free Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-passion-600">
              {analytics.conversion_rate.paid_users}
            </div>
            <div className="text-sm text-neutral-600 mt-1">Paid Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {analytics.conversion_rate.conversion_percentage}%
            </div>
            <div className="text-sm text-neutral-600 mt-1">Conversion Rate</div>
          </div>
        </div>
        
        {/* Visual Bar */}
        <div className="mt-6 h-8 bg-neutral-200 rounded-full overflow-hidden flex">
          <div
            className="bg-neutral-400 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${(analytics.conversion_rate.free_users / analytics.overview.total_users) * 100}%` }}
          >
            Free
          </div>
          <div
            className="bg-gradient-passion flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${(analytics.conversion_rate.paid_users / analytics.overview.total_users) * 100}%` }}
          >
            Paid
          </div>
        </div>
      </GlassCard>

      {/* Engagement Metrics */}
      <GlassCard variant="default" className="p-6">
        <h3 className="font-display text-xl font-bold text-neutral-900 mb-4">
          Engagement Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-subtle p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-neutral-900">
              {analytics.engagement.avg_messages_per_chat.toFixed(1)}
            </div>
            <div className="text-sm text-neutral-600 mt-2">Avg Messages per Chat</div>
          </div>
          <div className="glass-subtle p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-neutral-900">
              {analytics.engagement.avg_credits_per_user}
            </div>
            <div className="text-sm text-neutral-600 mt-2">Avg Credits per User</div>
          </div>
          <div className="glass-subtle p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-neutral-900">
              {analytics.engagement.avg_session_duration.toFixed(1)} min
            </div>
            <div className="text-sm text-neutral-600 mt-2">Avg Session Duration</div>
          </div>
        </div>
      </GlassCard>

      {/* Operator Performance */}
      <GlassCard variant="default" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-neutral-900">
            Top Operators
          </h3>
          <GlassButton variant="ghost" size="sm">
            View All
          </GlassButton>
        </div>
        
        {analytics.operator_performance.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No operator data available</p>
        ) : (
          <div className="space-y-3">
            {analytics.operator_performance.slice(0, 5).map((operator, index) => (
              <div
                key={operator.id}
                className="glass-subtle p-4 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-luxury flex items-center justify-center text-white font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">{operator.name}</div>
                    <div className="text-sm text-neutral-600">
                      {operator.total_chats} chats • {operator.total_messages} messages
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-neutral-900">
                      {operator.quality_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-neutral-600">Quality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-neutral-900">
                      {operator.average_rating.toFixed(1)} ⭐
                    </div>
                    <div className="text-xs text-neutral-600">Rating</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Revenue Chart Placeholder */}
      <GlassCard variant="default" className="p-6">
        <h3 className="font-display text-xl font-bold text-neutral-900 mb-4">
          Revenue Over Time
        </h3>
        <div className="h-64 flex items-center justify-center glass-subtle rounded-xl">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-neutral-600">
              Chart visualization will be implemented with a charting library
            </p>
            <p className="text-neutral-500 text-sm mt-2">
              Consider using recharts, chart.js, or similar
            </p>
          </div>
        </div>
      </GlassCard>

      {/* User Growth Chart Placeholder */}
      <GlassCard variant="default" className="p-6">
        <h3 className="font-display text-xl font-bold text-neutral-900 mb-4">
          User Growth
        </h3>
        <div className="h-64 flex items-center justify-center glass-subtle rounded-xl">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-neutral-600">
              Chart visualization will be implemented with a charting library
            </p>
            <p className="text-neutral-500 text-sm mt-2">
              Consider using recharts, chart.js, or similar
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
