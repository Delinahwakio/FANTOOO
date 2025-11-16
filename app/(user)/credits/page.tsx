'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { PaymentModal, CreditPackage } from '@/lib/components/shared/PaymentModal';
import { useCredits } from '@/lib/hooks/useCredits';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  credits_amount: number;
  status: string;
  payment_provider: string;
  created_at: string;
  completed_at: string | null;
}

export default function CreditsPage() {
  const router = useRouter();
  const { credits, loading: creditsLoading, refreshCredits } = useCredits();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch credit packages
  useEffect(() => {
    async function fetchPackages() {
      try {
        setLoadingPackages(true);
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('credit_packages')
          .select('*')
          .eq('is_active', true)
          .order('credits', { ascending: true });

        if (error) throw error;

        // Transform to CreditPackage format
        const formattedPackages: CreditPackage[] = (data || []).map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          credits: pkg.credits,
          price: pkg.price,
          currency: pkg.currency,
          badge: pkg.badge_text || undefined,
          discountPercentage: pkg.discount_percentage || undefined,
          bonusCredits: pkg.bonus_credits || 0,
          isFeatured: pkg.is_featured || false,
        }));

        setPackages(formattedPackages);
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError('Failed to load credit packages');
      } finally {
        setLoadingPackages(false);
      }
    }

    fetchPackages();
  }, []);

  // Fetch transaction history
  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoadingTransactions(true);
        const supabase = createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's real_user_id
        const { data: userData } = await supabase
          .from('real_users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!userData) return;

        // Fetch transactions
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('real_user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setTransactions(data || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoadingTransactions(false);
      }
    }

    fetchTransactions();
  }, []);

  const handlePurchaseComplete = async (creditsAdded: number) => {
    // Refresh credits and transactions
    await refreshCredits();
    
    // Refresh transactions
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from('real_users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userData) {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('real_user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (data) setTransactions(data);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'pending':
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'refunded':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        );
      case 'refund':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        );
      case 'bonus':
        return (
          <svg className="w-5 h-5 text-luxury-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (creditsLoading || loadingPackages) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-50 via-white to-luxury-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gradient-passion mb-4">
            Purchase Credits
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Get more credits to continue your exciting conversations
          </p>
        </div>

        {/* Current Balance */}
        <GlassCard variant="elevated" className="mb-12 max-w-md mx-auto">
          <div className="text-center py-6">
            <p className="text-sm text-neutral-600 mb-2">Your Current Balance</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-gradient-luxury">{credits}</span>
              <span className="text-xl text-neutral-600">credits</span>
            </div>
            <p className="text-sm text-neutral-500 mt-2">
              ≈ {formatPrice(credits * 10, 'KES')}
            </p>
          </div>
        </GlassCard>

        {/* Error Message */}
        {error && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          </div>
        )}

        {/* Credit Packages */}
        <div className="mb-16">
          <h2 className="font-display text-2xl font-bold text-neutral-900 text-center mb-8">
            Choose Your Package
          </h2>
          
          {packages.length === 0 ? (
            <div className="text-center text-neutral-600">
              No packages available at the moment
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {packages.map((pkg) => (
                <GlassCard
                  key={pkg.id}
                  variant={pkg.isFeatured ? 'elevated' : 'default'}
                  className={cn(
                    'relative hover:scale-105 transition-transform duration-200',
                    pkg.isFeatured && 'border-2 border-luxury-500'
                  )}
                >
                  {/* Badge */}
                  {pkg.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-luxury text-white px-4 py-1 rounded-full text-xs font-bold shadow-luxury">
                        {pkg.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 py-2">
                    {/* Package Name */}
                    <div className="text-center">
                      <h3 className="font-display text-xl font-bold text-neutral-900">
                        {pkg.name}
                      </h3>
                    </div>

                    {/* Credits */}
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-3xl font-bold text-gradient-passion">
                          {pkg.credits}
                        </span>
                        <span className="text-sm text-neutral-600">credits</span>
                      </div>
                      {pkg.bonusCredits > 0 && (
                        <div className="mt-1 text-sm text-luxury-600 font-semibold">
                          + {pkg.bonusCredits} bonus
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-2">
                        {pkg.discountPercentage && (
                          <span className="text-sm text-neutral-400 line-through">
                            {formatPrice(
                              pkg.price / (1 - pkg.discountPercentage / 100),
                              pkg.currency
                            )}
                          </span>
                        )}
                        <span className="text-2xl font-bold text-neutral-900">
                          {formatPrice(pkg.price, pkg.currency)}
                        </span>
                      </div>
                      {pkg.discountPercentage && (
                        <div className="mt-1 text-xs text-passion-600 font-semibold">
                          Save {pkg.discountPercentage}%
                        </div>
                      )}
                    </div>

                    {/* Purchase Button */}
                    <GlassButton
                      variant={pkg.isFeatured ? 'luxury' : 'passion'}
                      size="md"
                      fullWidth
                      onClick={() => setShowPaymentModal(true)}
                    >
                      Buy Now
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-neutral-900 mb-6">
            Transaction History
          </h2>

          {loadingTransactions ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : transactions.length === 0 ? (
            <GlassCard>
              <div className="text-center py-12 text-neutral-600">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>No transactions yet</p>
                <p className="text-sm mt-2">Your purchase history will appear here</p>
              </div>
            </GlassCard>
          ) : (
            <GlassCard>
              <div className="divide-y divide-neutral-200">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="py-4 px-6 hover:bg-neutral-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getTypeIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-neutral-900 capitalize">
                              {transaction.type}
                            </p>
                            <span
                              className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium',
                                getStatusColor(transaction.status)
                              )}
                            >
                              {transaction.status}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-600">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-neutral-900">
                          {transaction.type === 'purchase' || transaction.type === 'bonus'
                            ? '+'
                            : '-'}
                          {transaction.credits_amount} credits
                        </p>
                        <p className="text-sm text-neutral-600">
                          {formatPrice(transaction.amount, 'KES')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Payment Info */}
        <div className="mt-12 max-w-4xl mx-auto">
          <GlassCard variant="subtle">
            <div className="text-center py-6">
              <h3 className="font-display text-lg font-bold text-neutral-900 mb-4">
                Secure Payment Information
              </h3>
              <div className="flex items-center justify-center gap-8 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-trust-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>256-bit SSL Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-trust-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>PCI DSS Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-trust-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Instant Credit Delivery</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-neutral-500">
                Powered by Paystack • All transactions are secure and encrypted
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        packages={packages}
        onPurchaseComplete={handlePurchaseComplete}
        onPurchaseError={(error) => {
          console.error('Payment error:', error);
          setError('Payment failed. Please try again.');
        }}
      />
    </div>
  );
}
