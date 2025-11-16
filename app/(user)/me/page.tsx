'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RealUser } from '@/lib/types/user';
import { Chat } from '@/lib/types/chat';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassInput } from '@/lib/components/ui/GlassInput';
import { LocationAutocomplete } from '@/lib/components/shared/LocationAutocomplete';
import { ImageUpload } from '@/lib/components/shared/ImageUpload';
import { Modal } from '@/lib/components/ui/Modal';
import { useAuth } from '@/lib/hooks/useAuth';

interface ChatWithFictional extends Chat {
  fictional_user: {
    id: string;
    name: string;
    age: number;
    gender: string;
    location: string;
    profile_pictures: string[];
    is_featured: boolean;
  };
}

export default function UserProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  
  const [user, setUser] = useState<RealUser | null>(null);
  const [chats, setChats] = useState<ChatWithFictional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    profile_picture: '',
  });



  // Fetch user profile
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
      return;
    }

    if (authUser) {
      fetchUserProfile();
      fetchChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, authLoading]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/users/me');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setUser(data.user);
      
      // Initialize edit form
      setEditForm({
        display_name: data.user.display_name || '',
        bio: data.user.bio || '',
        location: data.user.location || '',
        latitude: data.user.latitude,
        longitude: data.user.longitude,
        profile_picture: data.user.profile_picture || '',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/users/me/chats?limit=10');
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const data = await response.json();
      setChats(data.chats || []);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  // Handle profile update
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // TODO: Upload profile image if changed
      // For now, we'll just update the text fields
      const updates = {
        display_name: editForm.display_name,
        bio: editForm.bio,
        location: editForm.location,
        latitude: editForm.latitude,
        longitude: editForm.longitude,
        profile_picture: editForm.profile_picture,
      };

      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setUser(data.user);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch('/api/users/me', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      const data = await response.json();
      
      // Show success message
      alert(`Account deleted successfully. ${data.refund_amount > 0 ? `Refund of ${data.refund_amount} KES will be processed.` : ''}`);
      
      // Redirect to home
      router.push('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (details: { address: string; latitude: number; longitude: number; placeId: string }) => {
    setEditForm(prev => ({
      ...prev,
      location: details.address,
      latitude: details.latitude,
      longitude: details.longitude,
    }));
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (user) {
      setEditForm({
        display_name: user.display_name || '',
        bio: user.bio || '',
        location: user.location || '',
        latitude: user.latitude,
        longitude: user.longitude,
        profile_picture: user.profile_picture || '',
      });
    }
    setIsEditing(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-passion-600">
          <svg
            className="animate-spin h-8 w-8"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-lg font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50 flex items-center justify-center p-4">
        <GlassCard variant="elevated" className="p-8 max-w-md text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-passion-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Error</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <GlassButton variant="passion" onClick={() => router.push('/discover')}>
            Go to Discover
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-neutral-900 mb-2">
                My Profile
              </h1>
              <p className="text-lg text-neutral-600">
                Manage your account and preferences
              </p>
            </div>
            <GlassButton
              variant="outline"
              size="md"
              onClick={() => router.push('/discover')}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Discover
            </GlassButton>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <GlassCard variant="elevated" className="p-4 mb-6 border-2 border-red-200">
            <div className="flex items-center gap-3 text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>{error}</p>
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <GlassCard variant="elevated" className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">Profile Information</h2>
                {!isEditing ? (
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Profile
                  </GlassButton>
                ) : (
                  <div className="flex gap-2">
                    <GlassButton
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton
                      variant="passion"
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </GlassButton>
                  </div>
                )}
              </div>

              {/* Profile Picture */}
              <div className="mb-6">
                {isEditing ? (
                  <ImageUpload
                    value={editForm.profile_picture}
                    onChange={(file) => {
                      if (file && !Array.isArray(file)) {
                        // Create preview URL
                        const url = URL.createObjectURL(file);
                        setEditForm(prev => ({ ...prev, profile_picture: url }));
                        // TODO: Upload file to storage and get URL
                      }
                    }}
                    label="Profile Picture"
                    helperText="Upload a profile picture (max 5MB)"
                    maxSizeMB={5}
                    minWidth={200}
                    minHeight={200}
                    preview
                  />
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-neutral-200">
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={user.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900">{user.display_name}</h3>
                      <p className="text-neutral-600">@{user.username}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Display Name
                  </label>
                  {isEditing ? (
                    <GlassInput
                      value={editForm.display_name}
                      onChange={(e) =>
                        setEditForm(prev => ({ ...prev, display_name: e.target.value }))
                      }
                      placeholder="Your display name"
                    />
                  ) : (
                    <p className="text-neutral-900">{user.display_name}</p>
                  )}
                </div>

                {/* Username (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Username
                  </label>
                  <p className="text-neutral-900">@{user.username}</p>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email
                  </label>
                  <p className="text-neutral-900">{user.email}</p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editForm.bio}
                      onChange={(e) =>
                        setEditForm(prev => ({ ...prev, bio: e.target.value }))
                      }
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-passion-500 transition-smooth resize-none"
                    />
                  ) : (
                    <p className="text-neutral-900">{user.bio || 'No bio yet'}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Location
                  </label>
                  {isEditing ? (
                    <LocationAutocomplete
                      value={editForm.location}
                      onChange={(value) => setEditForm(prev => ({ ...prev, location: value }))}
                      onLocationSelect={handleLocationSelect}
                      placeholder="Enter your location"
                    />
                  ) : (
                    <p className="text-neutral-900">{user.location}</p>
                  )}
                </div>

                {/* Age & Gender (read-only) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Age
                    </label>
                    <p className="text-neutral-900">{user.age}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Gender
                    </label>
                    <p className="text-neutral-900 capitalize">{user.gender}</p>
                  </div>
                </div>

                {/* Member Since */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Member Since
                  </label>
                  <p className="text-neutral-900">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </GlassCard>

            {/* Chat History */}
            <GlassCard variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">Recent Chats</h2>
                <span className="text-sm text-neutral-600">
                  {user.total_chats} total {user.total_chats === 1 ? 'chat' : 'chats'}
                </span>
              </div>

              {chats.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-neutral-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-neutral-600 mb-4">No chats yet</p>
                  <GlassButton
                    variant="passion"
                    size="md"
                    onClick={() => router.push('/discover')}
                  >
                    Start Chatting
                  </GlassButton>
                </div>
              ) : (
                <div className="space-y-3">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => router.push(`/chat/${chat.id}`)}
                      className="glass rounded-xl p-4 hover:bg-white/60 transition-smooth cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0">
                          {chat.fictional_user.profile_pictures?.[0] ? (
                            <img
                              src={chat.fictional_user.profile_pictures[0]}
                              alt={chat.fictional_user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-neutral-900 truncate">
                              {chat.fictional_user.name}
                            </h3>
                            {chat.fictional_user.is_featured && (
                              <span className="px-2 py-0.5 rounded-full bg-luxury-500 text-white text-xs font-semibold">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600">
                            {chat.message_count} {chat.message_count === 1 ? 'message' : 'messages'} · {chat.total_credits_spent} credits spent
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-neutral-500">
                            {chat.last_message_at ? formatRelativeTime(chat.last_message_at) : 'No messages'}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              chat.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : chat.status === 'closed'
                                ? 'bg-neutral-100 text-neutral-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {chat.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="space-y-6">
            {/* Credits Card */}
            <GlassCard variant="elevated" className="p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Credits</h3>
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-passion-600 mb-2">
                  {user.credits}
                </div>
                <p className="text-sm text-neutral-600 mb-4">Available Credits</p>
                <GlassButton
                  variant="passion"
                  size="md"
                  onClick={() => router.push('/credits')}
                  className="w-full"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Buy Credits
                </GlassButton>
              </div>
            </GlassCard>

            {/* Stats Card */}
            <GlassCard variant="elevated" className="p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Total Chats</span>
                  <span className="font-semibold text-neutral-900">{user.total_chats}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Messages Sent</span>
                  <span className="font-semibold text-neutral-900">{user.total_messages_sent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Total Spent</span>
                  <span className="font-semibold text-neutral-900">{user.total_spent} KES</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">User Tier</span>
                  <span className="font-semibold text-passion-600 capitalize">{user.user_tier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Loyalty Points</span>
                  <span className="font-semibold text-neutral-900">{user.loyalty_points}</span>
                </div>
              </div>
            </GlassCard>

            {/* Account Actions */}
            <GlassCard variant="elevated" className="p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Account Actions</h3>
              <div className="space-y-3">
                <GlassButton
                  variant="outline"
                  size="md"
                  onClick={() => router.push('/favorites')}
                  className="w-full justify-start"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  My Favorites
                </GlassButton>

                <GlassButton
                  variant="outline"
                  size="md"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Account
                </GlassButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <svg
              className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Warning: This action cannot be undone</h4>
              <p className="text-sm text-red-700">
                Deleting your account will:
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside mt-2 space-y-1">
                <li>Permanently delete your profile and data</li>
                <li>Close all active chats</li>
                <li>Anonymize your message history</li>
                <li>Process a refund for unused credits (if applicable)</li>
              </ul>
            </div>
          </div>

          <p className="text-neutral-700">
            Are you sure you want to delete your account? This action is permanent and cannot be reversed.
          </p>

          <div className="flex gap-3 justify-end pt-4">
            <GlassButton
              variant="outline"
              size="md"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="passion"
              size="md"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete My Account'
              )}
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
