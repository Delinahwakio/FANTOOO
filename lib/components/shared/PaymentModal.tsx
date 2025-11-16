import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Modal } from '@/lib/components/ui/Modal';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassCard } from '@/lib/components/ui/GlassCard';

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  badge?: string;
  discountPercentage?: number;
  bonusCredits: number;
  isFeatured: boolean;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: CreditPackage[];
  onPurchaseComplete?: (credits: number) => void;
  onPurchaseError?: (error: Error) => void;
}

/**
 * PaymentModal Component
 * 
 * A modal for purchasing credits with Paystack integration.
 * Displays credit packages and handles payment flow.
 * 
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback when modal is closed
 * @param packages - Array of credit packages to display
 * @param onPurchaseComplete - Callback when purchase is successful
 * @param onPurchaseError - Callback when purchase fails
 * 
 * @example
 * ```tsx
 * <PaymentModal
 *   isOpen={showPayment}
 *   onClose={() => setShowPayment(false)}
 *   packages={creditPackages}
 *   onPurchaseComplete={(credits) => {
 *     console.log('Purchased:', credits);
 *   }}
 * />
 * ```
 */
export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  packages,
  onPurchaseComplete,
  onPurchaseError,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setIsProcessing(true);

    try {
      // In production, this would:
      // 1. Call API to initialize Paystack payment
      // 2. Get payment URL and reference
      // 3. Open Paystack popup or redirect
      // 4. Handle webhook callback
      // 5. Update user credits

      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate successful payment
      const totalCredits = pkg.credits + pkg.bonusCredits;
      
      if (onPurchaseComplete) {
        onPurchaseComplete(totalCredits);
      }

      onClose();
    } catch (error) {
      console.error('Payment error:', error);
      if (onPurchaseError) {
        onPurchaseError(error as Error);
      }
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Purchase Credits"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-neutral-600">
            Choose a credit package to continue chatting
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <GlassCard
              key={pkg.id}
              variant={pkg.isFeatured ? 'elevated' : 'default'}
              className={cn(
                'relative',
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

              <div className="space-y-4">
                {/* Package Name */}
                <div className="text-center">
                  <h3 className="font-display text-2xl font-bold text-neutral-900">
                    {pkg.name}
                  </h3>
                </div>

                {/* Credits */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-gradient-passion">
                      {pkg.credits}
                    </span>
                    <span className="text-neutral-600">credits</span>
                  </div>
                  {pkg.bonusCredits > 0 && (
                    <div className="mt-1 text-sm text-luxury-600 font-semibold">
                      + {pkg.bonusCredits} bonus credits
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-2">
                    {pkg.discountPercentage && (
                      <span className="text-lg text-neutral-400 line-through">
                        {formatPrice(
                          pkg.price / (1 - pkg.discountPercentage / 100),
                          pkg.currency
                        )}
                      </span>
                    )}
                    <span className="text-3xl font-bold text-neutral-900">
                      {formatPrice(pkg.price, pkg.currency)}
                    </span>
                  </div>
                  {pkg.discountPercentage && (
                    <div className="mt-1 text-sm text-passion-600 font-semibold">
                      Save {pkg.discountPercentage}%
                    </div>
                  )}
                </div>

                {/* Purchase Button */}
                <GlassButton
                  variant={pkg.isFeatured ? 'luxury' : 'passion'}
                  size="lg"
                  fullWidth
                  onClick={() => handlePurchase(pkg)}
                  isLoading={isProcessing && selectedPackage?.id === pkg.id}
                  disabled={isProcessing}
                >
                  {isProcessing && selectedPackage?.id === pkg.id
                    ? 'Processing...'
                    : 'Purchase'}
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-neutral-500 space-y-2">
          <p>Secure payment powered by Paystack</p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-trust-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-trust-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-trust-500"
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
              <span>Instant</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
