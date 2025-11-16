'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/lib/components/ui/GlassCard'
import { GlassButton } from '@/lib/components/ui/GlassButton'
import { GlassInput } from '@/lib/components/ui/GlassInput'
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner'
import { useOperatorSettings, useUpdateOperatorSettings } from '@/lib/hooks/useOperator'
import { toast } from '@/lib/hooks/useToast'
import { updatePassword } from '@/lib/supabase/auth'

/**
 * Operator Settings Page
 * 
 * Displays:
 * - Password change functionality
 * - Specialization preferences editing
 * - Account information display
 * - Suspension status and reason if applicable
 * 
 * Requirements: 11.1-11.5 (Operator Availability), 12.1-12.5 (Operator Performance)
 */
export default function OperatorSettingsPage() {
  const router = useRouter()
  
  // Fetch operator data
  const { data: settingsData, isLoading, error, refetch } = useOperatorSettings()
  const updateSettings = useUpdateOperatorSettings()

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Specializations state
  const [specializations, setSpecializations] = useState<string[]>([])
  const [newSpecialization, setNewSpecialization] = useState('')
  const [isEditingSpecializations, setIsEditingSpecializations] = useState(false)

  // Initialize specializations when data loads
  useEffect(() => {
    if (settingsData?.operator) {
      setSpecializations(settingsData.operator.specializations || [])
    }
  }, [settingsData])

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      toast.error('Password must contain uppercase, lowercase, and numbers')
      return
    }

    setIsChangingPassword(true)

    try {
      // Update password using Supabase Auth
      const { error } = await updatePassword(newPassword)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Password updated successfully')
      
      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Handle add specialization
  const handleAddSpecialization = () => {
    if (!newSpecialization.trim()) {
      toast.error('Please enter a specialization')
      return
    }

    if (specializations.includes(newSpecialization.trim())) {
      toast.error('Specialization already exists')
      return
    }

    setSpecializations([...specializations, newSpecialization.trim()])
    setNewSpecialization('')
  }

  // Handle remove specialization
  const handleRemoveSpecialization = (spec: string) => {
    setSpecializations(specializations.filter(s => s !== spec))
  }

  // Handle save specializations
  const handleSaveSpecializations = async () => {
    try {
      await updateSettings.mutateAsync({ specializations })
      toast.success('Specializations updated successfully')
      setIsEditingSpecializations(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update specializations')
    }
  }

  // Handle cancel editing specializations
  const handleCancelEditSpecializations = () => {
    setSpecializations(settingsData?.operator?.specializations || [])
    setNewSpecialization('')
    setIsEditingSpecializations(false)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show error state
  if (error || !settingsData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard variant="elevated" className="max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            Failed to Load Settings
          </h2>
          <p className="text-neutral-600 mb-6">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <GlassButton
            variant="passion"
            onClick={() => window.location.reload()}
          >
            Retry
          </GlassButton>
        </GlassCard>
      </div>
    )
  }

  const { operator } = settingsData

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Settings
          </h1>
          <p className="text-neutral-600">
            Manage your account settings and preferences
          </p>
        </div>
        <GlassButton
          variant="outline"
          onClick={() => router.push('/operator/waiting')}
        >
          ← Back to Dashboard
        </GlassButton>
      </div>

      {/* Suspension Warning */}
      {operator.is_suspended && (
        <GlassCard variant="elevated" className="mb-6 border-2 border-red-300 bg-red-50/50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-1">
                Account Suspended
              </h3>
              <p className="text-red-700 mb-2">
                {operator.suspension_reason || 'Your account has been suspended due to low quality score.'}
              </p>
              {operator.suspended_until && (
                <p className="text-sm text-red-600">
                  Suspended until: {new Date(operator.suspended_until).toLocaleDateString()}
                </p>
              )}
              <div className="mt-3 p-3 bg-red-100 rounded-lg">
                <p className="text-sm font-semibold text-red-900 mb-2">What this means:</p>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• You cannot receive new chat assignments</li>
                  <li>• Your availability is automatically set to offline</li>
                  <li>• Contact an administrator for more information</li>
                </ul>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Account Information */}
      <GlassCard variant="elevated" className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-trust-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Account Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Name
            </label>
            <p className="text-lg font-semibold text-neutral-900">
              {operator.name}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Email
            </label>
            <p className="text-lg font-semibold text-neutral-900">
              {operator.email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Skill Level
            </label>
            <p className="text-lg font-semibold text-neutral-900 capitalize">
              {operator.skill_level || 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Account Status
            </label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                operator.is_suspended 
                  ? 'bg-red-100 text-red-700'
                  : operator.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-neutral-100 text-neutral-700'
              }`}>
                {operator.is_suspended ? 'Suspended' : operator.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Max Concurrent Chats
            </label>
            <p className="text-lg font-semibold text-neutral-900">
              {operator.max_concurrent_chats || 5}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Quality Threshold
            </label>
            <p className="text-lg font-semibold text-neutral-900">
              {operator.quality_threshold || 60}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Specializations */}
      <GlassCard variant="elevated" className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-luxury-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Specializations
          </h2>
          {!isEditingSpecializations && (
            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => setIsEditingSpecializations(true)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </GlassButton>
          )}
        </div>

        {isEditingSpecializations ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <GlassInput
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                placeholder="Add a specialization (e.g., flirty, romantic)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSpecialization()
                  }
                }}
              />
              <GlassButton
                variant="passion"
                onClick={handleAddSpecialization}
              >
                Add
              </GlassButton>
            </div>

            <div className="flex flex-wrap gap-2">
              {specializations.length === 0 ? (
                <p className="text-neutral-500 text-sm">
                  No specializations added yet
                </p>
              ) : (
                specializations.map((spec) => (
                  <div
                    key={spec}
                    className="px-3 py-1.5 bg-passion-100 text-passion-700 rounded-full flex items-center gap-2"
                  >
                    <span className="text-sm font-medium">{spec}</span>
                    <button
                      onClick={() => handleRemoveSpecialization(spec)}
                      className="hover:text-passion-900 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-neutral-200">
              <GlassButton
                variant="passion"
                onClick={handleSaveSpecializations}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
              </GlassButton>
              <GlassButton
                variant="outline"
                onClick={handleCancelEditSpecializations}
                disabled={updateSettings.isPending}
              >
                Cancel
              </GlassButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {specializations.length === 0 ? (
              <p className="text-neutral-500 text-sm">
                No specializations set. Click Edit to add some.
              </p>
            ) : (
              specializations.map((spec) => (
                <span
                  key={spec}
                  className="px-3 py-1.5 bg-passion-100 text-passion-700 rounded-full text-sm font-medium"
                >
                  {spec}
                </span>
              ))
            )}
          </div>
        )}
      </GlassCard>

      {/* Password Change */}
      <GlassCard variant="elevated">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-passion-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Change Password
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <GlassInput
            type="password"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            disabled={isChangingPassword}
          />

          <GlassInput
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
            disabled={isChangingPassword}
            helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
          />

          <GlassInput
            type="password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            disabled={isChangingPassword}
          />

          <div className="pt-4">
            <GlassButton
              type="submit"
              variant="passion"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
