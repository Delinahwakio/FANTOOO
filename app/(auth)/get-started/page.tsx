'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassInput } from '@/lib/components/ui/GlassInput';
import { LocationAutocomplete, LocationDetails } from '@/lib/components/shared/LocationAutocomplete';
import { createClient } from '@/lib/supabase/client';

type Step = 1 | 2 | 3;

interface FormData {
  username: string;
  displayName: string;
  location: string;
  latitude?: number;
  longitude?: number;
  gender: 'male' | 'female' | 'other' | '';
  age: string;
  lookingFor: 'male' | 'female' | 'both' | '';
  password: string;
  confirmPassword: string;
}

export default function GetStartedPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    displayName: '',
    location: '',
    latitude: undefined,
    longitude: undefined,
    gender: '',
    age: '',
    lookingFor: '',
    password: '',
    confirmPassword: '',
  });

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string;
  }>({
    checking: false,
    available: null,
    error: '',
  });

  // Debounced username check
  useEffect(() => {
    if (currentStep !== 1 || !formData.username || formData.username.length < 3) {
      setUsernameStatus({ checking: false, available: null, error: '' });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus({ checking: true, available: null, error: '' });
      
      try {
        const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(formData.username)}`);
        const data = await response.json();
        
        if (data.error) {
          setUsernameStatus({ checking: false, available: false, error: data.error });
        } else {
          setUsernameStatus({ 
            checking: false, 
            available: data.available, 
            error: data.available ? '' : 'Username already taken' 
          });
        }
      } catch (err) {
        setUsernameStatus({ 
          checking: false, 
          available: null, 
          error: 'Failed to check username' 
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, currentStep]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLocationSelect = (location: LocationDetails) => {
    setFormData((prev) => ({
      ...prev,
      location: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  };

  const validateStep1 = (): boolean => {
    if (!formData.username || formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    
    if (!formData.displayName || formData.displayName.length < 2) {
      setError('Display name must be at least 2 characters');
      return false;
    }

    if (!usernameStatus.available) {
      setError(usernameStatus.error || 'Please choose an available username');
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.location) {
      setError('Please enter your location');
      return false;
    }

    if (!formData.gender) {
      setError('Please select your gender');
      return false;
    }

    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age) || age < 18 || age > 100) {
      setError('You must be 18 or older to register');
      return false;
    }

    if (!formData.lookingFor) {
      setError('Please select who you are looking for');
      return false;
    }

    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setError('');
    
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          displayName: formData.displayName,
          age: parseInt(formData.age),
          gender: formData.gender,
          lookingFor: formData.lookingFor,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      // Sign in the user
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${formData.username}@fantooo.com`,
        password: formData.password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        setError('Account created but failed to sign in. Please try logging in.');
        setIsLoading(false);
        return;
      }

      // Redirect to discover page
      router.push('/discover');
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">
          Let's get started
        </h2>
        <p className="text-neutral-600">
          Choose a username and display name
        </p>
      </div>

      <GlassInput
        label="Username"
        placeholder="Choose a unique username"
        value={formData.username}
        onChange={(e) => handleInputChange('username', e.target.value)}
        error={usernameStatus.error}
        helperText={
          usernameStatus.checking
            ? 'Checking availability...'
            : usernameStatus.available
            ? '✓ Username available'
            : ''
        }
        fullWidth
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      />

      <GlassInput
        label="Display Name"
        placeholder="How should we call you?"
        value={formData.displayName}
        onChange={(e) => handleInputChange('displayName', e.target.value)}
        fullWidth
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {error && (
        <div className="text-sm text-passion-600 text-center">
          {error}
        </div>
      )}

      <GlassButton
        variant="passion"
        size="lg"
        fullWidth
        onClick={handleNext}
        disabled={usernameStatus.checking || !usernameStatus.available}
      >
        Next
      </GlassButton>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">
          Tell us about yourself
        </h2>
        <p className="text-neutral-600">
          Help us personalize your experience
        </p>
      </div>

      <LocationAutocomplete
        label="Location"
        placeholder="Enter your city"
        value={formData.location}
        onChange={(value) => handleInputChange('location', value)}
        onLocationSelect={handleLocationSelect}
        fullWidth
      />

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Gender
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['male', 'female', 'other'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleInputChange('gender', option)}
              className={`glass px-4 py-3 rounded-lg transition-smooth capitalize ${
                formData.gender === option
                  ? 'bg-passion-100 border-2 border-passion-500'
                  : 'hover:bg-white/50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <GlassInput
        label="Age"
        type="number"
        placeholder="Your age"
        value={formData.age}
        onChange={(e) => handleInputChange('age', e.target.value)}
        helperText="You must be 18 or older"
        fullWidth
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Looking for
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['male', 'female', 'both'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleInputChange('lookingFor', option)}
              className={`glass px-4 py-3 rounded-lg transition-smooth capitalize ${
                formData.lookingFor === option
                  ? 'bg-passion-100 border-2 border-passion-500'
                  : 'hover:bg-white/50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-sm text-passion-600 text-center">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <GlassButton
          variant="outline"
          size="lg"
          fullWidth
          onClick={handleBack}
        >
          Back
        </GlassButton>
        <GlassButton
          variant="passion"
          size="lg"
          fullWidth
          onClick={handleNext}
        >
          Next
        </GlassButton>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">
          Secure your account
        </h2>
        <p className="text-neutral-600">
          Create a strong password
        </p>
      </div>

      <GlassInput
        label="Password"
        type="password"
        placeholder="Create a password"
        value={formData.password}
        onChange={(e) => handleInputChange('password', e.target.value)}
        helperText="At least 8 characters with uppercase, lowercase, and numbers"
        fullWidth
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
      />

      <GlassInput
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
        fullWidth
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      <div className="glass-subtle p-4 rounded-lg">
        <p className="text-sm text-neutral-600">
          Your email will be: <span className="font-semibold text-neutral-900">{formData.username}@fantooo.com</span>
        </p>
      </div>

      {error && (
        <div className="text-sm text-passion-600 text-center">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <GlassButton
          variant="outline"
          size="lg"
          fullWidth
          onClick={handleBack}
          disabled={isLoading}
        >
          Back
        </GlassButton>
        <GlassButton
          variant="passion"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          isLoading={isLoading}
        >
          Create Account
        </GlassButton>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50">
      <div className="w-full max-w-md">
        <GlassCard variant="elevated" className="p-8">
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-smooth ${
                  step <= currentStep
                    ? 'w-12 bg-gradient-passion'
                    : 'w-8 bg-neutral-300'
                }`}
              />
            ))}
          </div>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </GlassCard>

        <div className="text-center mt-6">
          <p className="text-neutral-600">
            Already have an account?{' '}
            <a href="/login" className="text-passion-600 hover:text-passion-700 font-semibold">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
