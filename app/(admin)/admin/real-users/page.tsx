'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassInput } from '@/lib/components/ui/GlassInput';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { Modal } from '@/lib/components/ui/Modal';
import { useToast } from '@/lib/hooks/useToast';
import { cn } from '@/lib/utils/cn';

interface RealUser {
  id: string;
  username: string;
  display_name: string;
  email: string;
  age: number;
  gender: string;
  looking_for: string;
  location: string;
  credits: number;
  total_spent: number;
  user_tier: string;
  total_messages_sent: number;
  total_chats: number;
  is_active: boolean;
  is_verified: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  banned_until: string | null;
  last_active_at: string;
  created_at: string;
  circumvention_attempts?: number;
  last_circumvention_attempt?: string | null;
}

interface UserDetails extends RealUser {
  recentActivity: any[];
  stats: {
    activeChats: number;
    totalCreditsSpent: number;
  };
}

export default function RealUsersPage() {
  const [users, setUsers] = useState<RealUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned' | 'suspended'>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');
  const [isPermanentBan, setIsPermanentBan] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    loadUsers();
  }, [filterStatus, filterTier, currentPage]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        status: filterStatus,
        tier: filterTier,
        page: currentPage.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load users:', error);
      showError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user details');

      const data = await response.json();
      setSelectedUser({
        ...data.user,
        recentActivity: data.recentActivity,
        stats: data.stats,
      });
    } catch (error) {
      console.error('Failed to load user details:', error);
      showError('Failed to load user details');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) {
      showError('Please provide a ban reason');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: banReason,
          duration: banDuration ? parseInt(banDuration) : null,
          isPermanent: isPermanentBan,
        }),
      });

      if (!response.ok) throw new Error('Failed to ban user');

      showSuccess('User banned successfully');
      setShowBanModal(false);
      setBanReason('');
      setBanDuration('');
      setIsPermanentBan(false);
      loadUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to ban user:', error);
      showError('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to unban user');

      showSuccess('User unbanned successfully');
      loadUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to unban user:', error);
      showError('Failed to unban user');
    }
  };

  const handleSuspendUser = async (userId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to suspend user');

      showSuccess('User suspended successfully');
      loadUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to suspend user:', error);
      showError('Failed to suspend user');
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to reactivate user');

      showSuccess('User reactivated successfully');
      loadUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to reactivate user:', error);
      showError('Failed to reactivate user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !deletionReason) {
      showError('Please provide a deletion reason');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deletionReason }),
      });

      if (!response.ok) throw new Error('Failed to delete user');

      const data = await response.json();
      showSuccess(`User deleted. Refund: KES ${data.refundAmount}`);
      setShowDeleteModal(false);
      setDeletionReason('');
      loadUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      showError('Failed to delete user');
    }
  };

  const handleRefundCredits = async () => {
    if (!selectedUser || !refundAmount || !refundReason) {
      showError('Please fill in all refund fields');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(refundAmount),
          reason: refundReason,
          notes: refundNotes,
        }),
      });

      if (!response.ok) throw new Error('Failed to process refund');

      const data = await response.json();
      showSuccess(`Refund processed. New balance: ${data.newBalance} credits`);
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      setRefundNotes('');
      loadUsers();
      if (selectedUser) {
        loadUserDetails(selectedUser.id);
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
      showError('Failed to process refund');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-neutral-900">
            Real Users Management
          </h1>
          <p className="text-neutral-600 mt-2">
            Manage real users, handle bans, suspensions, and process refunds
          </p>
        </div>
        
        <GlassButton
          variant="outline"
          size="sm"
          onClick={loadUsers}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </GlassButton>
      </div>

      {/* Search and Filter */}
      <GlassCard variant="subtle" className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <GlassInput
                placeholder="Search by username, email, or display name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            
            <GlassButton onClick={handleSearch}>
              Search
            </GlassButton>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex gap-2">
              <span className="text-sm font-medium text-neutral-700 self-center">Status:</span>
              {(['all', 'active', 'banned', 'suspended'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-smooth capitalize text-sm',
                    filterStatus === status
                      ? 'bg-gradient-trust text-white'
                      : 'glass text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Tier Filter */}
            <div className="flex gap-2">
              <span className="text-sm font-medium text-neutral-700 self-center">Tier:</span>
              {(['all', 'free', 'bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => {
                    setFilterTier(tier);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-smooth capitalize text-sm',
                    filterTier === tier
                      ? 'bg-gradient-luxury text-white'
                      : 'glass text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* User List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <GlassCard variant="subtle" className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-neutral-600 text-lg">No users found</p>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {users.map((user) => (
              <GlassCard
                key={user.id}
                variant="default"
                hover
                onClick={() => loadUserDetails(user.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-passion flex items-center justify-center text-white font-bold text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-neutral-900">
                          {user.username}
                        </h3>
                        {user.is_banned && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            Banned
                          </span>
                        )}
                        {!user.is_active && !user.is_banned && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                            Suspended
                          </span>
                        )}
                        {user.is_verified && (
                          <svg className="w-5 h-5 text-trust-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {user.circumvention_attempts && user.circumvention_attempts > 0 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {user.circumvention_attempts} attempts
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600">{user.email}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
                        <span className="capitalize">{user.user_tier} tier</span>
                        <span>•</span>
                        <span>{user.credits} credits</span>
                        <span>•</span>
                        <span>{user.total_chats} chats</span>
                        <span>•</span>
                        <span>{user.total_messages_sent} messages</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-neutral-700">
                        KES {user.total_spent.toFixed(2)}
                      </div>
                      <div className="text-xs text-neutral-500">Total Spent</div>
                    </div>
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <GlassButton
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </GlassButton>
              
              <span className="text-sm text-neutral-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <GlassButton
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </GlassButton>
            </div>
          )}
        </>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="User Details"
          size="xl"
        >
          <div className="space-y-6">
            {/* User Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-600">Username</label>
                <p className="text-neutral-900 font-semibold">{selectedUser.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Display Name</label>
                <p className="text-neutral-900 font-semibold">{selectedUser.display_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Email</label>
                <p className="text-neutral-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Age</label>
                <p className="text-neutral-900">{selectedUser.age}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Gender</label>
                <p className="text-neutral-900 capitalize">{selectedUser.gender}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Looking For</label>
                <p className="text-neutral-900 capitalize">{selectedUser.looking_for}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Location</label>
                <p className="text-neutral-900">{selectedUser.location}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">User Tier</label>
                <p className="text-neutral-900 capitalize">{selectedUser.user_tier}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Last Active</label>
                <p className="text-neutral-900 text-sm">
                  {new Date(selectedUser.last_active_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-subtle p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-neutral-900">{selectedUser.credits}</div>
                <div className="text-sm text-neutral-600">Credits</div>
              </div>
              <div className="glass-subtle p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-neutral-900">{selectedUser.total_chats}</div>
                <div className="text-sm text-neutral-600">Total Chats</div>
              </div>
              <div className="glass-subtle p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-neutral-900">{selectedUser.stats.activeChats}</div>
                <div className="text-sm text-neutral-600">Active Chats</div>
              </div>
              <div className="glass-subtle p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-neutral-900">
                  KES {selectedUser.total_spent.toFixed(2)}
                </div>
                <div className="text-sm text-neutral-600">Total Spent</div>
              </div>
            </div>

            {/* Ban Info */}
            {selectedUser.is_banned && (
              <div className="glass-subtle p-4 rounded-xl border-2 border-red-200">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900">User is Banned</h4>
                    <p className="text-sm text-red-700 mt-1">{selectedUser.ban_reason}</p>
                    {selectedUser.banned_until && (
                      <p className="text-xs text-red-600 mt-2">
                        Until: {new Date(selectedUser.banned_until).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Circumvention Alert */}
            {selectedUser.circumvention_attempts && selectedUser.circumvention_attempts > 0 && (
              <div className="glass-subtle p-4 rounded-xl border-2 border-orange-200">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900">Ban Circumvention Detected</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      This user has attempted to circumvent a ban {selectedUser.circumvention_attempts} time(s).
                    </p>
                    {selectedUser.last_circumvention_attempt && (
                      <p className="text-xs text-orange-600 mt-2">
                        Last attempt: {new Date(selectedUser.last_circumvention_attempt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Suspension Info */}
            {!selectedUser.is_active && !selectedUser.is_banned && (
              <div className="glass-subtle p-4 rounded-xl border-2 border-yellow-200">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-900">User is Suspended</h4>
                    <p className="text-sm text-yellow-700 mt-1">This account is temporarily suspended.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {selectedUser.is_banned ? (
                <GlassButton
                  variant="trust"
                  onClick={() => handleUnbanUser(selectedUser.id)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Unban User
                </GlassButton>
              ) : (
                <GlassButton
                  variant="outline"
                  onClick={() => setShowBanModal(true)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Ban User
                </GlassButton>
              )}
              
              {!selectedUser.is_active && !selectedUser.is_banned ? (
                <GlassButton
                  variant="trust"
                  onClick={() => handleReactivateUser(selectedUser.id)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Reactivate User
                </GlassButton>
              ) : selectedUser.is_active && !selectedUser.is_banned && (
                <GlassButton
                  variant="outline"
                  onClick={() => {
                    const reason = prompt('Enter suspension reason:');
                    if (reason) {
                      handleSuspendUser(selectedUser.id, reason);
                    }
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Suspend User
                </GlassButton>
              )}
              
              <GlassButton
                variant="luxury"
                onClick={() => setShowRefundModal(true)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Refund Credits
              </GlassButton>
              
              <GlassButton
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Account
              </GlassButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Ban Modal */}
      <Modal
        isOpen={showBanModal}
        onClose={() => {
          setShowBanModal(false);
          setBanReason('');
          setBanDuration('');
          setIsPermanentBan(false);
        }}
        title="Ban User"
      >
        <div className="space-y-4">
          <div className="glass-subtle p-4 rounded-xl border-2 border-orange-200">
            <p className="text-orange-900 font-medium">
              Banning this user will close all active chats and track their IP addresses and device fingerprints for circumvention detection.
            </p>
          </div>

          <GlassInput
            label="Ban Reason"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Enter reason for ban"
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="permanentBan"
              checked={isPermanentBan}
              onChange={(e) => setIsPermanentBan(e.target.checked)}
              className="w-4 h-4 text-passion-600 focus:ring-passion-500 border-neutral-300 rounded"
            />
            <label htmlFor="permanentBan" className="text-sm font-medium text-neutral-700">
              Permanent Ban
            </label>
          </div>

          {!isPermanentBan && (
            <GlassInput
              label="Ban Duration (days)"
              type="number"
              value={banDuration}
              onChange={(e) => setBanDuration(e.target.value)}
              placeholder="Enter number of days"
              min="1"
            />
          )}
          
          <div className="flex gap-3">
            <GlassButton
              variant="outline"
              onClick={() => {
                setShowBanModal(false);
                setBanReason('');
                setBanDuration('');
                setIsPermanentBan(false);
              }}
              fullWidth
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="passion"
              onClick={handleBanUser}
              fullWidth
              disabled={!banReason}
            >
              Confirm Ban
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletionReason('');
        }}
        title="Delete User Account"
      >
        <div className="space-y-4">
          <div className="glass-subtle p-4 rounded-xl border-2 border-red-200">
            <p className="text-red-900 font-medium">
              This action cannot be undone. The user's data will be anonymized and archived according to GDPR requirements. All messages will be anonymized, active chats will be closed, and unused credits will be refunded.
            </p>
          </div>

          <GlassInput
            label="Deletion Reason"
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            placeholder="Enter reason for account deletion"
            required
          />
          
          <div className="flex gap-3">
            <GlassButton
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletionReason('');
              }}
              fullWidth
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="passion"
              onClick={handleDeleteUser}
              fullWidth
              disabled={!deletionReason}
            >
              Confirm Delete
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Refund Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setRefundAmount('');
          setRefundReason('');
          setRefundNotes('');
        }}
        title="Refund Credits"
      >
        <div className="space-y-4">
          <GlassInput
            label="Credit Amount"
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder="Enter number of credits"
            min="1"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Refund Reason *
            </label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full glass px-4 py-3 rounded-lg focus-ring"
              required
            >
              <option value="">Select reason</option>
              <option value="accidental_send">Accidental Send</option>
              <option value="inappropriate_content">Inappropriate Content</option>
              <option value="system_error">System Error</option>
              <option value="admin_discretion">Admin Discretion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={refundNotes}
              onChange={(e) => setRefundNotes(e.target.value)}
              placeholder="Add any additional notes about this refund..."
              className="w-full glass px-4 py-3 rounded-lg focus-ring min-h-[100px]"
            />
          </div>
          
          <div className="flex gap-3">
            <GlassButton
              variant="outline"
              onClick={() => {
                setShowRefundModal(false);
                setRefundAmount('');
                setRefundReason('');
                setRefundNotes('');
              }}
              fullWidth
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="luxury"
              onClick={handleRefundCredits}
              fullWidth
              disabled={!refundAmount || !refundReason}
            >
              Process Refund
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
