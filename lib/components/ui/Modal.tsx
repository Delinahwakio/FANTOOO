import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

/**
 * Modal Component
 * 
 * A modal dialog component with glassmorphism effects and smooth animations using Headless UI.
 * 
 * @param isOpen - Controls modal visibility
 * @param onClose - Callback when modal is closed
 * @param title - Optional modal title
 * @param description - Optional modal description
 * @param children - Modal content
 * @param size - Modal size: 'sm', 'md', 'lg', 'xl', or 'full'
 * @param showCloseButton - Show close button in top right
 * @param closeOnOverlayClick - Allow closing by clicking overlay
 * @param className - Additional CSS classes for modal content
 * 
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   size="md"
 * >
 *   <p>Are you sure you want to proceed?</p>
 *   <div className="flex gap-4 mt-6">
 *     <GlassButton onClick={handleConfirm}>Confirm</GlassButton>
 *     <GlassButton variant="ghost" onClick={() => setIsOpen(false)}>Cancel</GlassButton>
 *   </div>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}) => {
  const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeOnOverlayClick ? onClose : () => {}}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'glass-elevated w-full rounded-3xl p-8 text-left align-middle shadow-2xl transform transition-all',
                  sizeClasses[size],
                  className
                )}
              >
                {/* Close Button */}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-700 transition-smooth focus-ring rounded-lg p-1"
                    aria-label="Close modal"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}

                {/* Title */}
                {title && (
                  <Dialog.Title
                    as="h3"
                    className="font-display text-3xl font-bold text-neutral-900 mb-2"
                  >
                    {title}
                  </Dialog.Title>
                )}

                {/* Description */}
                {description && (
                  <Dialog.Description className="text-neutral-600 mb-6">
                    {description}
                  </Dialog.Description>
                )}

                {/* Content */}
                <div className="mt-4">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

Modal.displayName = 'Modal';
