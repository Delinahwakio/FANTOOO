'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FictionalUser } from '@/lib/types/user';
import { ProfileCarousel } from '@/lib/components/profile/ProfileCarousel';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { useFavorites } from '@/lib/hooks/useFavorites';

export default function ProfileViewPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;
  
  const [profile, setProfile] = useState<FictionalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFavorited = favoriteIds.includes(profileId);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/fictional-profiles/${profileId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Profile not found');
          } else {
            setError('Failed to load profile');
          }
          return;
        }

        const data = await response.json();
        setProfile(data.profile);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  // Handle chat click with duplicate prevention
  const handleStartChat = async () => {
    if (!profile) return;

    try {
      setChatLoading(true);

      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fictional_user_id: profile.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create chat');
      }

      const data = await response.json();
      
      // Navigate to chat
      router.push(`/chat/${data.chat.id}`);
    } catch (err) {
      console.error('Error creating chat:', err);
      alert(err instanceof Error ? err.message : 'Failed to start chat');
      setChatLoading(false);
    }
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    try {
      await toggleFavorite(profileId);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50 flex items-center justify-center">
        <GlassCard variant="elevated" className="p-8">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-neutral-600">Loading profile...</p>
        </GlassCard>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <GlassCard variant="elevated" className="p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-neutral-400"
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
            <h2 className="font-display text-2xl font-bold text-neutral-900 mb-2">
              {error || 'Profile Not Found'}
            </h2>
            <p className="text-neutral-600 mb-6">
              The profile you're looking for doesn't exist or is no longer available.
            </p>
            <GlassButton
              variant="passion"
              size="lg"
              onClick={() => router.push('/discover')}
            >
              Back to Discover
            </GlassButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-smooth"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Photos */}
          <div>
            <GlassCard variant="elevated" className="p-6">
              {/* Featured Badge */}
              {profile.is_featured && (
                <div className="mb-4">
                  <span className="inline-block bg-gradient-luxury text-white text-sm font-bold px-4 py-2 rounded-full shadow-luxury">
                    ⭐ FEATURED PROFILE
                  </span>
                </div>
              )}

              {/* Photo Carousel */}
              <ProfileCarousel
                images={profile.profile_pictures}
                alt={profile.name}
              />

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <GlassButton
                  variant="passion"
                  size="lg"
                  fullWidth
                  onClick={handleStartChat}
                  disabled={chatLoading}
                  className="flex-1"
                >
                  {chatLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Starting Chat...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2 inline"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      Start Chat
                    </>
                  )}
                </GlassButton>

                <GlassButton
                  variant={isFavorited ? 'passion' : 'outline'}
                  size="lg"
                  onClick={handleFavoriteToggle}
                  className="px-6"
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg
                    className="w-6 h-6"
                    fill={isFavorited ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </GlassButton>
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Profile Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <GlassCard variant="elevated" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="font-display text-4xl font-bold text-neutral-900 mb-1">
                    {profile.name}
                  </h1>
                  <p className="text-xl text-neutral-600">{profile.age} years old</p>
                </div>
                
                {profile.is_active && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-green-700">Online</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {/* Location */}
                <div className="flex items-center gap-3 text-neutral-700">
                  <svg
                    className="w-5 h-5 text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-lg">{profile.location}</span>
                </div>

                {/* Gender */}
                <div className="flex items-center gap-3 text-neutral-700">
                  <svg
                    className="w-5 h-5 text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-lg capitalize">{profile.gender}</span>
                </div>

                {/* Occupation */}
                {profile.occupation && (
                  <div className="flex items-center gap-3 text-neutral-700">
                    <svg
                      className="w-5 h-5 text-neutral-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-lg">{profile.occupation}</span>
                  </div>
                )}

                {/* Education */}
                {profile.education && (
                  <div className="flex items-center gap-3 text-neutral-700">
                    <svg
                      className="w-5 h-5 text-neutral-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <span className="text-lg">{profile.education}</span>
                  </div>
                )}

                {/* Relationship Status */}
                {profile.relationship_status && (
                  <div className="flex items-center gap-3 text-neutral-700">
                    <svg
                      className="w-5 h-5 text-neutral-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="text-lg capitalize">{profile.relationship_status}</span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Bio */}
            {profile.bio && (
              <GlassCard variant="elevated" className="p-6">
                <h2 className="font-display text-2xl font-bold text-neutral-900 mb-4">
                  About Me
                </h2>
                <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </GlassCard>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <GlassCard variant="elevated" className="p-6">
                <h2 className="font-display text-2xl font-bold text-neutral-900 mb-4">
                  Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-full bg-passion-50 text-passion-700 font-medium text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Personality Traits */}
            {profile.personality_traits && profile.personality_traits.length > 0 && (
              <GlassCard variant="elevated" className="p-6">
                <h2 className="font-display text-2xl font-bold text-neutral-900 mb-4">
                  Personality
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.personality_traits.map((trait, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-full bg-luxury-50 text-luxury-700 font-medium text-sm"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Response Style */}
            {profile.response_style && (
              <GlassCard variant="elevated" className="p-6">
                <h2 className="font-display text-2xl font-bold text-neutral-900 mb-4">
                  Chat Style
                </h2>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-trust-100">
                    <svg
                      className="w-6 h-6 text-trust-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-neutral-900 capitalize">
                      {profile.response_style}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Communication style
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
