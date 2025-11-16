'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FictionalUser } from '@/lib/types/user';
import { ProfileGrid } from '@/lib/components/profile/ProfileGrid';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { useFavorites } from '@/lib/hooks/useFavorites';

export default function FavoritesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<FictionalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState<string | null>(null);
  
  const { favoriteIds, toggleFavorite, refetch } = useFavorites();

  // Fetch favorited profiles
  useEffect(() => {
    fetchFavoriteProfiles();
  }, [favoriteIds]);

  const fetchFavoriteProfiles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If no favorites, set empty array and return
      if (favoriteIds.length === 0) {
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      // Fetch profiles for favorited IDs
      const params = new URLSearchParams({
        ids: favoriteIds.join(','),
      });

      const response = await fetch(`/api/fictional-profiles?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorite profiles');
      }

      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (err) {
      console.error('Error fetching favorite profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat click with duplicate prevention
  const handleChatClick = async (profileId: string) => {
    try {
      setChatLoading(profileId);

      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fictional_user_id: profileId,
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
    } finally {
      setChatLoading(null);
    }
  };

  // Handle unfavorite click
  const handleFavoriteClick = async (profileId: string) => {
    try {
      await toggleFavorite(profileId);
      // Refetch to update the list
      await refetch();
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite');
    }
  };

  // Handle profile click
  const handleProfileClick = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };

  // Handle back to discover
  const handleBackToDiscover = () => {
    router.push('/discover');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleBackToDiscover}
              className="p-2 rounded-xl hover:bg-white/50 transition-smooth"
              aria-label="Back to discover"
            >
              <svg
                className="w-6 h-6 text-neutral-700"
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
            </button>
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-neutral-900">
                My Favorites
              </h1>
              <p className="text-lg text-neutral-600 mt-2">
                {favoriteIds.length} {favoriteIds.length === 1 ? 'profile' : 'profiles'} saved
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <GlassCard variant="elevated" className="p-6 mb-8 border-2 border-red-200">
            <div className="flex items-center gap-3 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Empty State */}
        {!isLoading && favoriteIds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <GlassCard variant="elevated" className="p-12 text-center max-w-lg">
              <div className="mb-6">
                <svg
                  className="w-24 h-24 mx-auto text-neutral-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">
                No Favorites Yet
              </h2>
              <p className="text-neutral-600 mb-6 text-lg">
                Start exploring profiles and save your favorites for quick access later.
              </p>
              <GlassButton
                variant="passion"
                size="lg"
                onClick={handleBackToDiscover}
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Discover Profiles
              </GlassButton>
            </GlassCard>
          </div>
        )}

        {/* Profile Grid */}
        {favoriteIds.length > 0 && (
          <ProfileGrid
            profiles={profiles}
            onChatClick={handleChatClick}
            onFavoriteClick={handleFavoriteClick}
            onProfileClick={handleProfileClick}
            favoritedIds={favoriteIds}
            showActions={true}
            isLoading={isLoading}
            emptyMessage="Unable to load favorite profiles"
          />
        )}
      </div>

      {/* Chat Loading Overlay */}
      {chatLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <GlassCard variant="elevated" className="p-8 text-center">
            <svg
              className="animate-spin h-12 w-12 mx-auto mb-4 text-passion-600"
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
            <p className="text-lg font-medium text-neutral-900">Starting chat...</p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
