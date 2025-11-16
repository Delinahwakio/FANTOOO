'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassInput } from '@/lib/components/ui/GlassInput';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { Modal } from '@/lib/components/ui/Modal';
import { useToast } from '@/lib/hooks/useToast';
import { Operator } from '@/lib/types/operator';
import { cn } from '@/lib/utils/cn';

interface ActivityLog {
  id: string;
  activity_type: string;
  metadata: any;
  created_at: string;
}

export default function OperatorsManagementPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const { success: showSuccess, error: showError } = useToast();

  // Create operator form state
  const [newOperator, setNewOperator] = useState({
    name: '',
    email: '',
    password: '',
    specializations: [] as string[],
    skill_level: 'junior' as const,
    languages: ['en'],
  });

  // Suspension form state
  const [suspensionData, setSuspensionData] = useState({
    reason: '',
    duration_days: 7,
  });

  useEffect(() => {
    loadOperators();
  }, []);

  useEffect(() => {
    if (selectedOperator) {
      loadActivityLogs(selectedOperator.id);
    }
  }, [selectedOperator]);

  const loadOperators = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/operators');
      if (!response.ok) throw new Error('Failed to load operators');
      const data = await response.json();
      setOperators(data.operators || []);
    } catch (error) {
      console.error('Failed to load operators:', error);
      showError('Failed to load operators');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityLogs = async (operatorId: string) => {
    setIsLoadingLogs(true);
    try {
      const response = await fetch(`/api/admin/operators/${operatorId}/activity`);
      if (!response.ok) throw new Error('Failed to load activity logs');
      const data = await response.json();
      setActivityLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleCreateOperator = async () => {
    try {
      const response = await fetch('/api/admin/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOperator),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create operator');
      }

      showSuccess('Operator created successfully');
      setShowCreateModal(false);
      setNewOperator({
        name: '',
        email: '',
        password: '',
        specializations: [],
        skill_level: 'junior',
        languages: ['en'],
      });
      loadOperators();
    } catch (error: any) {
      console.error('Failed to create operator:', error);
      showError(error.message || 'Failed to create operator');
    }
  };

  const handleSuspendOperator = async () => {
    if (!selectedOperator) return;

    try {
      const response = await fetch(`/api/admin/operators/${selectedOperator.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suspensionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to suspend operator');
      }

      showSuccess('Operator suspended successfully');
      setShowSuspendModal(false);
      setSuspensionData({ reason: '', duration_days: 7 });
      loadOperators();
      setSelectedOperator(null);
    } catch (error: any) {
      console.error('Failed to suspend operator:', error);
      showError(error.message || 'Failed to suspend operator');
    }
  };

  const handleReactivateOperator = async (operatorId: string) => {
    try {
      const response = await fetch(`/api/admin/operators/${operatorId}/reactivate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reactivate operator');
      }

      showSuccess('Operator reactivated successfully');
      loadOperators();
      setSelectedOperator(null);
    } catch (error: any) {
      console.error('Failed to reactivate operator:', error);
      showError(error.message || 'Failed to reactivate operator');
    }
  };

  const handleDeleteOperator = async () => {
    if (!selectedOperator) return;

    try {
      const response = await fetch(`/api/admin/operators/${selectedOperator.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete operator');
      }

      showSuccess('Operator deleted successfully');
      setShowDeleteModal(false);
      loadOperators();
      setSelectedOperator(null);
    } catch (error: any) {
      console.error('Failed to delete operator:', error);
      showError(error.message || 'Failed to delete operator');
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const filteredOperators = operators.filter((operator) => {
    const matchesSearch = searchQuery === '' ||
      operator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'active' && !operator.is_suspended) ||
      (filterStatus === 'suspended' && operator.is_suspended);

    return matchesSearch && matchesFilter;
  });

  const formatActivityType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">
            Operator Management
          </h1>
          <p className="text-neutral-600 mt-1">
            Manage operators and monitor performance metrics
          </p>
        </div>
        
        <div className="flex gap-2">
          <GlassButton
            variant="outline"
            size="sm"
            onClick={loadOperators}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </GlassButton>
          <GlassButton
            variant="passion"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Operator
          </GlassButton>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <GlassInput
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <div className="flex gap-2">
          <GlassButton
            variant={filterStatus === 'all' ? 'passion' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All
          </GlassButton>
          <GlassButton
            variant={filterStatus === 'active' ? 'passion' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('active')}
          >
            Active
          </GlassButton>
          <GlassButton
            variant={filterStatus === 'suspended' ? 'passion' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('suspended')}
          >
            Suspended
          </GlassButton>
        </div>
      </div>

      {/* Operator List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredOperators.length === 0 ? (
        <GlassCard variant="subtle" className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-neutral-600 text-lg">No operators found</p>
          <GlassButton
            variant="passion"
            className="mt-4"
            onClick={() => setShowCreateModal(true)}
          >
            Create First Operator
          </GlassButton>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOperators.map((operator) => (
            <GlassCard
              key={operator.id}
              variant="default"
              hover
              onClick={() => setSelectedOperator(operator)}
              className="cursor-pointer"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-luxury flex items-center justify-center text-white font-bold text-lg">
                      {operator.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-neutral-900">
                          {operator.name}
                        </h3>
                        {operator.is_available && !operator.is_suspended && (
                          <span className="w-3 h-3 bg-green-500 rounded-full" title="Available" />
                        )}
                      </div>
                      <p className="text-sm text-neutral-600">{operator.email}</p>
                    </div>
                  </div>
                  
                  {operator.is_suspended && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                      Suspended
                    </span>
                  )}
                </div>

                {/* Quality Score */}
                <div className={cn('p-3 rounded-xl', getQualityScoreBg(operator.quality_score))}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">Quality Score</span>
                    <span className={cn('text-2xl font-bold', getQualityScoreColor(operator.quality_score))}>
                      {operator.quality_score.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-white/50 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        operator.quality_score >= 80 ? 'bg-green-500' :
                        operator.quality_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${Math.min(operator.quality_score, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-neutral-900">
                      {operator.total_chats_handled}
                    </div>
                    <div className="text-xs text-neutral-600">Chats</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-neutral-900">
                      {operator.total_messages_sent}
                    </div>
                    <div className="text-xs text-neutral-600">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-neutral-900">
                      {operator.average_user_rating.toFixed(1)}
                    </div>
                    <div className="text-xs text-neutral-600">Rating</div>
                  </div>
                </div>

                {/* Skill Level & Specializations */}
                <div className="flex items-center justify-between text-sm">
                  <span className="px-3 py-1 glass-subtle rounded-full capitalize font-medium">
                    {operator.skill_level}
                  </span>
                  {operator.specializations && operator.specializations.length > 0 && (
                    <div className="flex gap-1">
                      {operator.specializations.slice(0, 2).map((spec, idx) => (
                        <span key={idx} className="px-2 py-1 bg-luxury-100 text-luxury-700 text-xs rounded-full">
                          {spec}
                        </span>
                      ))}
                      {operator.specializations.length > 2 && (
                        <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                          +{operator.specializations.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Operator Details Modal */}
      {selectedOperator && (
        <Modal
          isOpen={!!selectedOperator}
          onClose={() => setSelectedOperator(null)}
          title="Operator Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-600">Name</label>
                <p className="text-neutral-900 font-semibold">{selectedOperator.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Email</label>
                <p className="text-neutral-900">{selectedOperator.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Skill Level</label>
                <p className="text-neutral-900 capitalize">{selectedOperator.skill_level}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Status</label>
                <p className="text-neutral-900">
                  {selectedOperator.is_available ? 'Available' : 'Offline'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Active Chats</label>
                <p className="text-neutral-900">
                  {selectedOperator.current_chat_count} / {selectedOperator.max_concurrent_chats}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Last Active</label>
                <p className="text-neutral-900 text-sm">
                  {new Date(selectedOperator.last_activity).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div>
              <h4 className="font-semibold text-lg text-neutral-900 mb-3">Performance Metrics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-subtle p-3 rounded-xl">
                  <div className="text-sm text-neutral-600">Quality Score</div>
                  <div className={cn('text-2xl font-bold', getQualityScoreColor(selectedOperator.quality_score))}>
                    {selectedOperator.quality_score.toFixed(1)}
                  </div>
                </div>
                <div className="glass-subtle p-3 rounded-xl">
                  <div className="text-sm text-neutral-600">User Rating</div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {selectedOperator.average_user_rating.toFixed(1)} ⭐
                  </div>
                </div>
                <div className="glass-subtle p-3 rounded-xl">
                  <div className="text-sm text-neutral-600">Chats Handled</div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {selectedOperator.total_chats_handled}
                  </div>
                </div>
                <div className="glass-subtle p-3 rounded-xl">
                  <div className="text-sm text-neutral-600">Messages Sent</div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {selectedOperator.total_messages_sent}
                  </div>
                </div>
                <div className="glass-subtle p-3 rounded-xl">
                  <div className="text-sm text-neutral-600">Idle Incidents</div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {selectedOperator.idle_incidents}
                  </div>
                </div>
                <div className="glass-subtle p-3 rounded-xl">
                  <div className="text-sm text-neutral-600">Reassignments</div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {selectedOperator.reassignment_count}
                  </div>
                </div>
              </div>
            </div>

            {/* Suspension Info */}
            {selectedOperator.is_suspended && (
              <div className="glass-subtle p-4 rounded-xl border-2 border-red-200">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900">Operator is Suspended</h4>
                    <p className="text-sm text-red-700 mt-1">{selectedOperator.suspension_reason}</p>
                    {selectedOperator.suspended_until && (
                      <p className="text-xs text-red-600 mt-2">
                        Until: {new Date(selectedOperator.suspended_until).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Activity Logs */}
            <div>
              <h4 className="font-semibold text-lg text-neutral-900 mb-3">Recent Activity</h4>
              {isLoadingLogs ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : activityLogs.length === 0 ? (
                <p className="text-neutral-600 text-sm text-center py-4">No activity logs found</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="glass-subtle p-3 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">
                            {formatActivityType(log.activity_type)}
                          </p>
                          {log.metadata && (
                            <p className="text-xs text-neutral-600 mt-1">
                              {JSON.stringify(log.metadata)}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-neutral-500">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {selectedOperator.is_suspended ? (
                <GlassButton
                  variant="trust"
                  onClick={() => handleReactivateOperator(selectedOperator.id)}
                >
                  Reactivate Operator
                </GlassButton>
              ) : (
                <GlassButton
                  variant="outline"
                  onClick={() => setShowSuspendModal(true)}
                >
                  Suspend Operator
                </GlassButton>
              )}
              
              <GlassButton
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Delete Operator
              </GlassButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Operator Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Operator"
      >
        <div className="space-y-4">
          <GlassInput
            label="Name"
            value={newOperator.name}
            onChange={(e) => setNewOperator({ ...newOperator, name: e.target.value })}
            placeholder="Enter operator name"
          />
          
          <GlassInput
            label="Email"
            type="email"
            value={newOperator.email}
            onChange={(e) => setNewOperator({ ...newOperator, email: e.target.value })}
            placeholder="operator@fantooo.com"
          />
          
          <GlassInput
            label="Password"
            type="password"
            value={newOperator.password}
            onChange={(e) => setNewOperator({ ...newOperator, password: e.target.value })}
            placeholder="Enter secure password"
          />
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Skill Level
            </label>
            <select
              value={newOperator.skill_level}
              onChange={(e) => setNewOperator({ ...newOperator, skill_level: e.target.value as any })}
              className="w-full glass px-4 py-3 rounded-lg focus-ring"
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid-Level</option>
              <option value="senior">Senior</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Specializations (comma-separated)
            </label>
            <GlassInput
              value={newOperator.specializations.join(', ')}
              onChange={(e) => setNewOperator({ 
                ...newOperator, 
                specializations: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              placeholder="e.g., flirty, romantic, intellectual"
            />
          </div>
          
          <div className="flex gap-3">
            <GlassButton
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              fullWidth
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="passion"
              onClick={handleCreateOperator}
              fullWidth
              disabled={!newOperator.name || !newOperator.email || !newOperator.password}
            >
              Create Operator
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Suspend Operator Modal */}
      <Modal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        title="Suspend Operator"
      >
        <div className="space-y-4">
          <div className="glass-subtle p-4 rounded-xl border-2 border-yellow-200">
            <p className="text-yellow-900 font-medium">
              The operator will be unable to access the system during suspension.
            </p>
          </div>

          <GlassInput
            label="Suspension Reason"
            value={suspensionData.reason}
            onChange={(e) => setSuspensionData({ ...suspensionData, reason: e.target.value })}
            placeholder="Enter reason for suspension"
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Duration (days)
            </label>
            <GlassInput
              type="number"
              value={suspensionData.duration_days.toString()}
              onChange={(e) => setSuspensionData({ 
                ...suspensionData, 
                duration_days: parseInt(e.target.value) || 7 
              })}
              min="1"
              max="365"
            />
          </div>
          
          <div className="flex gap-3">
            <GlassButton
              variant="outline"
              onClick={() => setShowSuspendModal(false)}
              fullWidth
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="passion"
              onClick={handleSuspendOperator}
              fullWidth
              disabled={!suspensionData.reason}
            >
              Confirm Suspension
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Operator"
      >
        <div className="space-y-4">
          <div className="glass-subtle p-4 rounded-xl border-2 border-red-200">
            <p className="text-red-900 font-medium">
              This action cannot be undone. The operator must have no active chats to be deleted.
            </p>
          </div>
          
          <div className="flex gap-3">
            <GlassButton
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              fullWidth
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="passion"
              onClick={handleDeleteOperator}
              fullWidth
            >
              Confirm Delete
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
