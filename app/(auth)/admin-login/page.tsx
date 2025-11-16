'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassInput } from '@/lib/components/ui/GlassInput';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupSuccess = searchParams.get('setup') === 'success';
  
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

      // Validate admin role by checking admins table
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('id, role, is_active, deleted_at')
        .eq('auth_id', authData.user.id)
        .single();

      if (adminError || !admin) {
        // Not an admin account
        await supabase.auth.signOut();
        setError('This account does not have admin access');
        setIsLoading(false);
        return;
      }

      // Check if admin account is deleted
      if (admin.deleted_at) {
        await supabase.auth.signOut();
        setError('This admin account has been deleted');
        setIsLoading(false);
        return;
      }

      // Check if admin is active
      if (!admin.is_active) {
        await supabase.auth.signOut();
        setError('This admin account is not active');
        setIsLoading(false);
        return;
      }

      // Redirect to admin dashboard on success
      router.push('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50">
      <div className="w-full max-w-md">
        {setupSuccess && (
          <div className="mb-6 p-4 rounded-lg bg-trust-50 border border-trust-200 text-trust-700 text-center">
            Super admin account created successfully! You can now sign in.
          </div>
        )}

        <GlassCard variant="elevated" className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Admin Login
            </h1>
            <p className="text-neutral-600">
              Sign in to access the admin panel
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
              This is a restricted access area for administrators only.
            </p>
          </div>
        </GlassCard>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Need to set up the first admin?{' '}
            <a
              href="/setup"
              className="text-passion-600 hover:text-passion-700 font-medium"
            >
              Go to setup
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
