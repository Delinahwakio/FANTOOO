'use client';

import React, { useState } from 'react';
import { Modal } from '../Modal';
import { Toast, ToastContainer } from '../Toast';
import { Navigation, MobileNavigation, NavItem } from '../Navigation';
import { Dropdown, UserDropdown, DropdownItem } from '../Dropdown';
import { GlassButton } from '../GlassButton';
import { GlassCard } from '../GlassCard';

/**
 * Demo component showcasing Modal, Toast, Navigation, and Dropdown components
 * 
 * This component demonstrates all the feedback and navigation UI components
 * created in Task 23.
 */
export const FeedbackNavigationDemo: React.FC = () => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Toast state
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>>([]);
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items
  const navItems: NavItem[] = [
    {
      label: 'Home',
      href: '/',
      roles: ['guest', 'user', 'operator', 'admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Discover',
      href: '/discover',
      roles: ['user'],
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      label: 'Chats',
      href: '/chats',
      roles: ['user'],
      badge: 3,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: 'Admin',
      href: '/admin',
      roles: ['admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Dropdown items
  const dropdownItems: DropdownItem[] = [
    {
      label: 'Profile',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => addToast('Navigating to profile...', 'info'),
    },
    {
      label: 'Settings',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => addToast('Opening settings...', 'info'),
    },
    {
      label: 'Help',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => addToast('Opening help center...', 'info'),
    },
    {
      label: 'Logout',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      onClick: () => addToast('Logging out...', 'warning'),
      variant: 'danger',
      divider: true,
    },
  ];

  // Toast helpers
  const addToast = (message: string, variant: 'success' | 'error' | 'warning' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, variant }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl font-bold text-gradient-passion mb-4">
            Feedback & Navigation Components
          </h1>
          <p className="text-neutral-600 text-lg">
            Task 23: Modal, Toast, Navigation, and Dropdown components
          </p>
        </div>

        {/* Modal Demo */}
        <GlassCard variant="elevated">
          <h2 className="font-display text-2xl font-bold mb-4">Modal Component</h2>
          <p className="text-neutral-600 mb-6">
            A modal dialog with glassmorphism effects and smooth animations using Headless UI.
          </p>
          <GlassButton onClick={() => setIsModalOpen(true)}>
            Open Modal
          </GlassButton>
        </GlassCard>

        {/* Toast Demo */}
        <GlassCard variant="elevated">
          <h2 className="font-display text-2xl font-bold mb-4">Toast Notifications</h2>
          <p className="text-neutral-600 mb-6">
            Toast notifications with multiple variants and auto-dismiss functionality.
          </p>
          <div className="flex flex-wrap gap-3">
            <GlassButton
              variant="trust"
              onClick={() => addToast('This is a success message!', 'success')}
            >
              Success Toast
            </GlassButton>
            <GlassButton
              variant="passion"
              onClick={() => addToast('This is an error message!', 'error')}
            >
              Error Toast
            </GlassButton>
            <GlassButton
              variant="luxury"
              onClick={() => addToast('This is a warning message!', 'warning')}
            >
              Warning Toast
            </GlassButton>
            <GlassButton
              variant="outline"
              onClick={() => addToast('This is an info message!', 'info')}
            >
              Info Toast
            </GlassButton>
          </div>
        </GlassCard>

        {/* Navigation Demo */}
        <GlassCard variant="elevated">
          <h2 className="font-display text-2xl font-bold mb-4">Navigation Component</h2>
          <p className="text-neutral-600 mb-6">
            Role-based navigation with horizontal and vertical layouts.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Horizontal (User Role)</h3>
              <Navigation role="user" items={navItems} />
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Vertical (Admin Role)</h3>
              <Navigation role="admin" items={navItems} orientation="vertical" />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Mobile Navigation</h3>
              <MobileNavigation
                role="user"
                items={navItems}
                isOpen={isMobileMenuOpen}
                onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </div>
        </GlassCard>

        {/* Dropdown Demo */}
        <GlassCard variant="elevated">
          <h2 className="font-display text-2xl font-bold mb-4">Dropdown Components</h2>
          <p className="text-neutral-600 mb-6">
            Dropdown menus with glassmorphism effects using Headless UI.
          </p>
          
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm font-medium mb-2">Basic Dropdown</p>
              <Dropdown
                trigger={
                  <GlassButton variant="outline">
                    Menu
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </GlassButton>
                }
                items={dropdownItems}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">User Dropdown</p>
              <UserDropdown
                user={{
                  name: 'John Doe',
                  email: 'john@fantooo.com',
                  role: 'user',
                }}
                items={dropdownItems}
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Modal Instance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        description="This is a modal dialog with glassmorphism effects and smooth animations."
        size="md"
      >
        <p className="text-neutral-700 mb-6">
          You can add any content here. The modal supports different sizes, custom close buttons,
          and overlay click handling.
        </p>
        <div className="flex gap-3">
          <GlassButton
            variant="passion"
            onClick={() => {
              addToast('Action confirmed!', 'success');
              setIsModalOpen(false);
            }}
          >
            Confirm
          </GlassButton>
          <GlassButton
            variant="ghost"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </GlassButton>
        </div>
      </Modal>

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        position="top-right"
        onClose={removeToast}
      />
    </div>
  );
};
