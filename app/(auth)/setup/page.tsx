'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassInput } from '@/lib/components/ui/GlassInput';
import { createClient } from '@/lib/supabase/client';

export default function SetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAdmins, setIsCheckingAdmins] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    setupToken: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkExistingAdmins();
  }, []);

  const checkExistingAdmins = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Error checking admins:', error);
        setIsCheckingAdmins(false);
        return;
      }

      // If admins exist, redirect to admin login
      if (data && data.length > 0) {
        router.push('/admin-login');
        return;
      }

      setIsCheckingAdmins(false);
    } catch (err) {
      console.error('Error checking admins:', err);
      setIsCheckingAdmins(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.setupToken.trim()) {
      errors.setupToken = 'Setup token is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call the bootstrap-first-admin Edge Function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bootstrap-first-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            setupToken: formData.setupToken,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create admin account');
      }

      // Success - redirect to admin login
      router.push('/admin-login?setup=success');
    } catch (err) {
      console.error('Setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create admin account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (isCheckingAdmins) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-passion-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Checking setup status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Fantooo Admin Setup
          </h1>
          <p className="text-neutral-600">
            Create the first super admin account
          </p>
        </div>

        <GlassCard variant="elevated">
          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              label="Full Name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              error={fieldErrors.name}
              disabled={isLoading}
              fullWidth
              required
            />

            <GlassInput
              label="Email Address"
              name="email"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={handleChange}
              error={fieldErrors.email}
              disabled={isLoading}
              fullWidth
              required
            />

            <GlassInput
              label="Password"
              name="password"
              type="password"
              placeholder="Enter a secure password"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              helperText="Minimum 8 characters"
              disabled={isLoading}
              fullWidth
              required
            />

            <GlassInput
              label="Setup Token"
              name="setupToken"
              type="password"
              placeholder="Enter the setup token"
              value={formData.setupToken}
              onChange={handleChange}
              error={fieldErrors.setupToken}
              helperText="This token is configured in your environment variables"
              disabled={isLoading}
              fullWidth
              required
            />

            {error && (
              <div className="p-3 rounded-lg bg-passion-50 border border-passion-200 text-passion-700 text-sm">
                {error}
              </div>
            )}

            <GlassButton
              type="submit"
              variant="passion"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
            >
              Create Super Admin Account
            </GlassButton>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-600 text-center">
              This page will be disabled after the first admin is created.
            </p>
          </div>
        </GlassCard>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Already have an admin account?{' '}
            <a
              href="/admin-login"
              className="text-passion-600 hover:text-passion-700 font-medium"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
