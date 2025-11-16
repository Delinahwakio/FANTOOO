'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassInput } from '@/lib/components/ui/GlassInput';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleInputChange = (field: 'username' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please enter your username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const email = `${formData.username}@fantooo.com`;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (signInError) {
        setError('Invalid username or password');
        setIsLoading(false);
        return;
      }

      // Redirect to discover page
      router.push('/discover');
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50">
      <div className="w-full max-w-md">
        <GlassCard variant="elevated" className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Welcome back
            </h1>
            <p className="text-neutral-600">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <GlassInput
              label="Username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              fullWidth
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <GlassInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              fullWidth
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {error && (
              <div className="text-sm text-passion-600 text-center">
                {error}
              </div>
            )}

            <GlassButton
              type="submit"
              variant="passion"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              Sign In
            </GlassButton>
          </form>
        </GlassCard>

        <div className="text-center mt-6">
          <p className="text-neutral-600">
            Don't have an account?{' '}
            <a href="/get-started" className="text-passion-600 hover:text-passion-700 font-semibold">
              Get started
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
