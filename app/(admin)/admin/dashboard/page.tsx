'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

interface DashboardStats {
  total_users: number;
  active_users: number;
  total_chats: number;
  active_chats: number;
  total_revenue: number;
  total_messages: number;
  total_operators: number;
  available_operators: number;
}

interface AdminNotification {
  id: string;
  type: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

interface RecentActivity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  entity_type?: string;
  entity_id?: string;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  realtime: 'healthy' | 'warning' | 'error';
  payment_gateway: 'healthy' | 'warning' | 'error';
  edge_functions: 'healthy' | 'warning' | 'error';
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    realtime: 'healthy',
    payment_gateway: 'healthy',
    edge_functions: 'healthy',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load all dashboard data in parallel
      const [statsRes, notificationsRes, activityRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/notifications?unread=true&limit=5'),
        fetch('/api/admin/dashboard/activity?limit=10'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getHealthColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
    }
  };

  const getHealthIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-neutral-600 text-lg">
          Welcome back! Here's what's happening on your platform.
        </p>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 mb-1">Total Users</div>
              <div className="text-3xl font-bold text-neutral-900">
                {stats?.total_users.toLocaleString() || 0}
              </div>
              <div className="text-sm text-green-600 mt-2">
                {stats?.active_users || 0} active
              </div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-passion flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 mb-1">Active Chats</div>
              <div className="text-3xl font-bold text-neutral-900">
                {stats?.active_chats.toLocaleString() || 0}
              </div>
              <div className="text-sm text-neutral-600 mt-2">
                {stats?.total_chats.toLocaleString() || 0} total
              </div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-luxury flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                KES {stats?.total_revenue.toLocaleString() || 0}
              </div>
              <div className="text-sm text-neutral-600 mt-2">
                {stats?.total_messages.toLocaleString() || 0} messages
              </div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-trust flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 mb-1">Operators</div>
              <div className="text-3xl font-bold text-neutral-900">
                {stats?.total_operators || 0}
              </div>
              <div className="text-sm text-green-600 mt-2">
                {stats?.available_operators || 0} available
              </div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* System Health */}
        <GlassCard variant="default" className="p-6">
          <h2 className="font-display text-xl font-bold text-neutral-900 mb-4">
            System Health
          </h2>
          <div className="space-y-3">
            {Object.entries(systemHealth).map(([key, status]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 glass-subtle rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-1.5 rounded-lg', getHealthColor(status))}>
                    {getHealthIcon(status)}
                  </div>
                  <span className="font-medium text-neutral-900 capitalize">
                    {key.replace('_', ' ')}
                  </span>
                </div>
                <span className={cn('text-sm font-medium capitalize', getHealthColor(status).split(' ')[0])}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Unread Notifications */}
        <GlassCard variant="default" className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-neutral-900">
              Unread Notifications
            </h2>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/notifications')}
            >
              View All
            </GlassButton>
          </div>
          
          {notifications.length === 0 ? (
            <div className="text-center py-8 glass-subtle rounded-xl">
              <svg className="w-12 h-12 mx-auto text-neutral-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-neutral-600">No unread notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 glass-subtle rounded-xl hover:bg-white/60 transition-smooth cursor-pointer"
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium border',
                          getPriorityColor(notification.priority)
                        )}>
                          {notification.priority}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-900 font-medium">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-passion-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <GlassCard variant="default" className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-neutral-900">
            Recent Activity
          </h2>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/activity')}
          >
            View All
          </GlassButton>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 glass-subtle rounded-xl">
            <svg className="w-12 h-12 mx-auto text-neutral-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-neutral-600">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 glass-subtle rounded-lg hover:bg-white/60 transition-smooth"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-trust flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900 font-medium">
                    {activity.description}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatTimeAgo(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Quick Access Links */}
      <GlassCard variant="default" className="p-6">
        <h2 className="font-display text-xl font-bold text-neutral-900 mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', href: '/admin/real-users' },
            { label: 'Profiles', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', href: '/admin/fictional-profiles' },
            { label: 'Operators', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', href: '/admin/operators' },
            { label: 'Chats', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', href: '/admin/chats' },
            { label: 'Payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', href: '/admin/payments' },
            { label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', href: '/admin/stats' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="p-4 glass-subtle rounded-xl hover:bg-white/80 transition-smooth group"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-passion flex items-center justify-center group-hover:scale-110 transition-smooth">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <p className="text-sm font-medium text-neutral-900 text-center">
                {item.label}
              </p>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
