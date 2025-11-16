'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassInput } from '@/lib/components/ui/GlassInput';
import { createClient } from '@/lib/supabase/client';

export default function OperatorLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();

      // Sign in with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Authentication failed');
        setIsLoading(false);
        return;
      }

      // Validate operator role by checking operators table
      const { data: operator, error: operatorError } = await supabase
        .from('operators')
        .select('id, is_active, is_suspended, deleted_at')
        .eq('auth_id', authData.user.id)
        .single();

      if (operatorError || !operator) {
        // Not an operator account
        await supabase.auth.signOut();
        setError('This account does not have operator access');
        setIsLoading(false);
        return;
      }

      // Check if operator account is deleted
      if (operator.deleted_at) {
        await supabase.auth.signOut();
        setError('This operator account has been deleted');
        setIsLoading(false);
        return;
      }

      // Check if operator is suspended
      if (operator.is_suspended) {
        await supabase.auth.signOut();
        setError('This operator account is currently suspended');
        setIsLoading(false);
        return;
      }

      // Check if operator is active
      if (!operator.is_active) {
        await supabase.auth.signOut();
        setError('This operator account is not active');
        setIsLoading(false);
        return;
      }

      // Redirect to operator waiting room on success
      router.push('/operator/waiting');
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
              Operator Login
            </h1>
            <p className="text-neutral-600">
              Sign in to access the operator dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <GlassInput
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              fullWidth
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
              <div className="text-sm text-passion-600 text-center bg-passion-50 border border-passion-200 rounded-lg p-3">
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

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              This is a restricted access area for operators only.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
