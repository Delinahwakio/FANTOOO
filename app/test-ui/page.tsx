'use client';

import React, { useState } from 'react';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  LoadingSpinner,
} from '@/lib/components/ui';

/**
 * UI Components Test Page
 * 
 * This page demonstrates all the glass UI components with various configurations.
 */
export default function TestUIPage() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingTest = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-100 via-luxury-100 to-trust-100 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-display text-5xl font-bold text-gradient-passion">
            Glass UI Components
          </h1>
          <p className="text-neutral-700 text-lg">
            Testing all glass components with various configurations
          </p>
        </div>

        {/* GlassCard Variants */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            GlassCard Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard variant="default">
              <h3 className="font-display text-xl font-bold mb-2">Default</h3>
              <p className="text-neutral-700">
                Standard glass effect with balanced transparency and blur.
              </p>
            </GlassCard>

            <GlassCard variant="elevated" hover>
              <h3 className="font-display text-xl font-bold mb-2">Elevated</h3>
              <p className="text-neutral-700">
                Enhanced glass with more opacity and shadow. Hover me!
              </p>
            </GlassCard>

            <GlassCard variant="subtle">
              <h3 className="font-display text-xl font-bold mb-2">Subtle</h3>
              <p className="text-neutral-700">
                Minimal glass effect with light transparency.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* GlassButton Variants */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            GlassButton Variants
          </h2>
          <div className="flex flex-wrap gap-4">
            <GlassButton variant="passion" size="md">
              Passion
            </GlassButton>
            <GlassButton variant="luxury" size="md">
              Luxury
            </GlassButton>
            <GlassButton variant="trust" size="md">
              Trust
            </GlassButton>
            <GlassButton variant="outline" size="md">
              Outline
            </GlassButton>
            <GlassButton variant="ghost" size="md">
              Ghost
            </GlassButton>
          </div>
        </section>

        {/* GlassButton Sizes */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            GlassButton Sizes
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <GlassButton variant="passion" size="sm">
              Small
            </GlassButton>
            <GlassButton variant="passion" size="md">
              Medium
            </GlassButton>
            <GlassButton variant="passion" size="lg">
              Large
            </GlassButton>
            <GlassButton variant="passion" size="xl">
              Extra Large
            </GlassButton>
          </div>
        </section>

        {/* GlassButton States */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            GlassButton States
          </h2>
          <div className="flex flex-wrap gap-4">
            <GlassButton variant="passion" onClick={handleLoadingTest}>
              Normal
            </GlassButton>
            <GlassButton variant="passion" isLoading>
              Loading
            </GlassButton>
            <GlassButton variant="passion" disabled>
              Disabled
            </GlassButton>
            <GlassButton variant="passion" fullWidth>
              Full Width
            </GlassButton>
          </div>
        </section>

        {/* GlassInput Variants */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            GlassInput Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassInput
              label="Basic Input"
              placeholder="Enter text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />

            <GlassInput
              label="With Helper Text"
              placeholder="Enter email..."
              helperText="We'll never share your email"
            />

            <GlassInput
              label="With Error"
              placeholder="Enter password..."
              error="Password is required"
            />

            <GlassInput
              label="Disabled Input"
              placeholder="Disabled..."
              disabled
            />

            <GlassInput
              label="With Left Icon"
              placeholder="Search..."
              leftIcon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />

            <GlassInput
              label="With Right Icon"
              placeholder="Password..."
              type="password"
              rightIcon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              }
            />
          </div>
        </section>

        {/* LoadingSpinner Variants */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            LoadingSpinner Variants
          </h2>
          <GlassCard variant="elevated">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <LoadingSpinner variant="passion" size="md" label="Passion" />
              <LoadingSpinner variant="luxury" size="md" label="Luxury" />
              <LoadingSpinner variant="trust" size="md" label="Trust" />
              <LoadingSpinner variant="neutral" size="md" label="Neutral" />
            </div>
          </GlassCard>
        </section>

        {/* LoadingSpinner Sizes */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            LoadingSpinner Sizes
          </h2>
          <GlassCard variant="elevated">
            <div className="flex items-center justify-around">
              <LoadingSpinner variant="passion" size="xs" />
              <LoadingSpinner variant="passion" size="sm" />
              <LoadingSpinner variant="passion" size="md" />
              <LoadingSpinner variant="passion" size="lg" />
              <LoadingSpinner variant="passion" size="xl" />
            </div>
          </GlassCard>
        </section>

        {/* Combined Example */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            Combined Example
          </h2>
          <GlassCard variant="elevated" className="max-w-md mx-auto">
            <h3 className="font-display text-2xl font-bold mb-4 text-gradient-luxury">
              Sign In
            </h3>
            <div className="space-y-4">
              <GlassInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                fullWidth
                leftIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                }
              />
              <GlassInput
                label="Password"
                type="password"
                placeholder="••••••••"
                fullWidth
                rightIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
              />
              <GlassButton
                variant="passion"
                size="lg"
                fullWidth
                isLoading={isLoading}
                onClick={handleLoadingTest}
              >
                Sign In
              </GlassButton>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}
