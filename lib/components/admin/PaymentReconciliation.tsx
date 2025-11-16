'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassInput } from '@/lib/components/ui/GlassInput';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { Modal } from '@/lib/components/ui/Modal';
import { cn } from '@/lib/utils/cn';

export interface PaymentReconciliationProps {
  className?: string;
}

interface Transaction {
  id: string;
  real_user_id: string;
  type: 'purchase' | 'refund' | 'bonus' | 'deduction';
  amount: number;
  credits_amount: number;
  payment_provider: string;
  provider_reference: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
  failure_reason?: string;
  webhook_received_count: number;
  last_webhook_at?: string;
  needs_manual_review: boolean;
  review_reason?: string;
  created_at: string;
  completed_at?: string;
  user?: {
    username: string;
    email: string;
  };
}

/**
 * PaymentReconciliation Component
 * 
 * Admin component for managing payment reconciliation and failed transactions.
 * 
 * Features:
 * - Failed payments dashboard
 * - Manual reconciliation interface
 * - Transaction details with Paystack status
 * - Refund processing functionality
 * - Transaction audit trail
 * - Webhook duplicate detection
 * 
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <PaymentReconciliation />
 * ```
 */
export const PaymentReconciliation: React.FC<PaymentReconciliationProps> = ({ className }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('failed');
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/payments?status=${statusFilter}`);
      // const data = await response.json();
      // setTransactions(data);
      
      // Simulated data
      setTimeout(() => {
        setTransactions([]);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setIsLoading(false);
    }
  };

  const handleReconcileTransaction = async (transactionId: string) => {
    setIsReconciling(true);
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/admin/payments/${transactionId}/reconcile`, {
      //   method: 'POST',
      // });
      
      setShowReconcileModal(false);
      loadTransactions();
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Failed to reconcile transaction:', error);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleVerifyWithPaystack = async (transactionId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/payments/${transactionId}/verify`, {
      //   method: 'POST',
      // });
      // const data = await response.json();
      // Update transaction with Paystack status
      
      loadTransactions();
    } catch (error) {
      console.error('Failed to verify with Paystack:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'refunded':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      searchQuery === '' ||
      transaction.provider_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.user?.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            Payment Reconciliation
          </h2>
          <p className="text-neutral-600 mt-1">
            Review and reconcile failed or pending transactions
          </p>
        </div>
        
        <GlassButton
          variant="outline"
          size="sm"
          onClick={loadTransactions}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </GlassButton>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard variant="subtle" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600">Failed Payments</div>
              <div className="text-2xl font-bold text-red-600">
                {transactions.filter(t => t.status === 'failed').length}
              </div>
            </div>
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </GlassCard>

        <GlassCard variant="subtle" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600">Pending Review</div>
              <div className="text-2xl font-bold text-yellow-600">
                {transactions.filter(t => t.needs_manual_review).length}
              </div>
            </div>
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </GlassCard>

        <GlassCard variant="subtle" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600">Duplicate Webhooks</div>
              <div className="text-2xl font-bold text-blue-600">
                {transactions.filter(t => t.webhook_received_count > 1).length}
              </div>
            </div>
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </GlassCard>

        <GlassCard variant="subtle" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600">Total Amount</div>
              <div className="text-2xl font-bold text-neutral-900">
                KES {transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </div>
            </div>
            <svg className="w-10 h-10 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </GlassCard>
      </div>

      {/* Search and Filter */}
      <GlassCard variant="subtle" className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <GlassInput
              placeholder="Search by reference, username, or email..."
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
            {['all', 'failed', 'pending', 'success'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-smooth capitalize',
                  statusFilter === status
                    ? 'bg-gradient-trust text-white'
                    : 'glass text-neutral-700 hover:bg-neutral-100'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Transaction List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <GlassCard variant="subtle" className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-neutral-600 text-lg">No transactions found</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <GlassCard
              key={transaction.id}
              variant="default"
              hover
              onClick={() => setSelectedTransaction(transaction)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(transaction.status))}>
                      {transaction.status}
                    </span>
                    {transaction.needs_manual_review && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        Needs Review
                      </span>
                    )}
                    {transaction.webhook_received_count > 1 && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {transaction.webhook_received_count} webhooks
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-neutral-600">Reference</div>
                      <div className="font-mono text-neutral-900">{transaction.provider_reference}</div>
                    </div>
                    <div>
                      <div className="text-neutral-600">User</div>
                      <div className="text-neutral-900">{transaction.user?.username || 'Unknown'}</div>
                    </div>
                    <div>
                      <div className="text-neutral-600">Amount</div>
                      <div className="text-neutral-900 font-semibold">
                        KES {transaction.amount.toFixed(2)} ({transaction.credits_amount} credits)
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-600">Date</div>
                      <div className="text-neutral-900">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {transaction.failure_reason && (
                    <div className="mt-2 text-sm text-red-600">
                      Reason: {transaction.failure_reason}
                    </div>
                  )}
                </div>

                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Modal
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          title="Transaction Details"
        >
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className={cn('px-4 py-2 rounded-lg text-sm font-medium', getStatusColor(selectedTransaction.status))}>
                {selectedTransaction.status.toUpperCase()}
              </span>
              {selectedTransaction.needs_manual_review && (
                <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                  NEEDS REVIEW
                </span>
              )}
            </div>

            {/* Transaction Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-600">Provider Reference</label>
                <p className="text-neutral-900 font-mono text-sm">{selectedTransaction.provider_reference}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Transaction ID</label>
                <p className="text-neutral-900 font-mono text-sm">{selectedTransaction.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">User</label>
                <p className="text-neutral-900">{selectedTransaction.user?.username}</p>
                <p className="text-neutral-600 text-sm">{selectedTransaction.user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Payment Provider</label>
                <p className="text-neutral-900 capitalize">{selectedTransaction.payment_provider}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Amount</label>
                <p className="text-neutral-900 font-semibold">KES {selectedTransaction.amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Credits</label>
                <p className="text-neutral-900 font-semibold">{selectedTransaction.credits_amount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Created At</label>
                <p className="text-neutral-900">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Webhooks Received</label>
                <p className="text-neutral-900">{selectedTransaction.webhook_received_count}</p>
              </div>
            </div>

            {/* Failure Reason */}
            {selectedTransaction.failure_reason && (
              <div className="glass-subtle p-4 rounded-xl border-2 border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">Failure Reason</h4>
                <p className="text-red-700">{selectedTransaction.failure_reason}</p>
              </div>
            )}

            {/* Review Reason */}
            {selectedTransaction.review_reason && (
              <div className="glass-subtle p-4 rounded-xl border-2 border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">Review Reason</h4>
                <p className="text-orange-700">{selectedTransaction.review_reason}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <GlassButton
                variant="trust"
                onClick={() => handleVerifyWithPaystack(selectedTransaction.id)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verify with Paystack
              </GlassButton>
              
              {selectedTransaction.status === 'failed' && (
                <GlassButton
                  variant="passion"
                  onClick={() => setShowReconcileModal(true)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reconcile Transaction
                </GlassButton>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Reconcile Confirmation Modal */}
      <Modal
        isOpen={showReconcileModal}
        onClose={() => setShowReconcileModal(false)}
        title="Reconcile Transaction"
      >
        <div className="space-y-4">
          <div className="glass-subtle p-4 rounded-xl border-2 border-yellow-200">
            <p className="text-yellow-900 font-medium">
              This will manually mark the transaction as successful and add credits to the user's account.
              Only proceed if you have verified the payment was successful with Paystack.
            </p>
          </div>
          
          {selectedTransaction && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">User:</span>
                <span className="font-medium">{selectedTransaction.user?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Amount:</span>
                <span className="font-medium">KES {selectedTransaction.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Credits:</span>
                <span className="font-medium">{selectedTransaction.credits_amount}</span>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <GlassButton
              variant="outline"
              onClick={() => setShowReconcileModal(false)}
              fullWidth
              disabled={isReconciling}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="passion"
              onClick={() => selectedTransaction && handleReconcileTransaction(selectedTransaction.id)}
              fullWidth
              isLoading={isReconciling}
            >
              Confirm Reconciliation
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
