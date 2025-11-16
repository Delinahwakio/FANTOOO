'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FictionalUser } from '@/lib/types/user';
import { ProfileGrid } from '@/lib/components/profile/ProfileGrid';
import { SearchBar } from '@/lib/components/shared/SearchBar';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { useFavorites } from '@/lib/hooks/useFavorites';

interface FilterState {
  search: string;
  gender: string;
  minAge: string;
  maxAge: string;
  location: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<FictionalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [chatLoading, setChatLoading] = useState<string | null>(null);
  
  const { favoriteIds, toggleFavorite, isFavorited } = useFavorites();
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    gender: '',
    minAge: '',
    maxAge: '',
    location: '',
  });

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch profiles
  const fetchProfiles = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.minAge) params.append('minAge', filters.minAge);
      if (filters.maxAge) params.append('maxAge', filters.maxAge);
      if (filters.location) params.append('location', filters.location);

      const response = await fetch(`/api/fictional-profiles?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }

      const data = await response.json();

      if (append) {
        setProfiles(prev => [...prev, ...data.profiles]);
      } else {
        setProfiles(data.profiles);
      }

      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, pagination.limit]);

  // Initial load
  useEffect(() => {
    fetchProfiles(1, false);
  }, [filters]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !isLoadingMore) {
          fetchProfiles(pagination.page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [pagination.hasMore, pagination.page, isLoadingMore, fetchProfiles]);

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

  // Handle favorite click
  const handleFavoriteClick = async (profileId: string) => {
    try {
      await toggleFavorite(profileId);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite');
    }
  };

  // Handle profile click
  const handleProfileClick = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };

  // Handle filter change
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      gender: '',
      minAge: '',
      maxAge: '',
      location: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-neutral-900 mb-2">
                Discover
              </h1>
              <p className="text-lg text-neutral-600">
                Find someone special to chat with
              </p>
            </div>
            <GlassButton
              variant="outline"
              size="md"
              onClick={() => router.push('/favorites')}
              className="flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="hidden sm:inline">Favorites</span>
              {favoriteIds.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-passion-500 text-white text-xs font-semibold">
                  {favoriteIds.length}
                </span>
              )}
            </GlassButton>
          </div>
        </div>

        {/* Search and Filters */}
        <GlassCard variant="elevated" className="mb-8 p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <SearchBar
              value={filters.search}
              onChange={(value) => handleFilterChange('search', value)}
              placeholder="Search by name, location, or interests..."
              showClearButton
            />

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <GlassButton
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </GlassButton>

              {hasActiveFilters && (
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All
                </GlassButton>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-neutral-200">
                {/* Gender Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-300 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-passion-500 transition-smooth"
                  >
                    <option value="">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Min Age Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Min Age
                  </label>
                  <input
                    type="number"
                    value={filters.minAge}
                    onChange={(e) => handleFilterChange('minAge', e.target.value)}
                    placeholder="18"
                    min="18"
                    max="100"
                    className="w-full px-4 py-2 rounded-xl border border-neutral-300 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-passion-500 transition-smooth"
                  />
                </div>

                {/* Max Age Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Max Age
                  </label>
                  <input
                    type="number"
                    value={filters.maxAge}
                    onChange={(e) => handleFilterChange('maxAge', e.target.value)}
                    placeholder="100"
                    min="18"
                    max="100"
                    className="w-full px-4 py-2 rounded-xl border border-neutral-300 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-passion-500 transition-smooth"
                  />
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="City or country"
                    className="w-full px-4 py-2 rounded-xl border border-neutral-300 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-passion-500 transition-smooth"
                  />
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Results Count */}
        {!isLoading && (
          <div className="mb-4 text-neutral-600">
            {pagination.total} {pagination.total === 1 ? 'profile' : 'profiles'} found
          </div>
        )}

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

        {/* Profile Grid */}
        <ProfileGrid
          profiles={profiles}
          onChatClick={handleChatClick}
          onFavoriteClick={handleFavoriteClick}
          onProfileClick={handleProfileClick}
          favoritedIds={favoriteIds}
          showActions={true}
          isLoading={isLoading}
          emptyMessage={
            hasActiveFilters
              ? 'No profiles match your filters'
              : 'No profiles available'
          }
        />

        {/* Loading More Indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-3 text-passion-600">
              <svg
                className="animate-spin h-6 w-6"
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
              <span className="font-medium">Loading more profiles...</span>
            </div>
          </div>
        )}

        {/* Infinite Scroll Observer Target */}
        <div ref={observerTarget} className="h-4" />

        {/* End of Results */}
        {!isLoading && !isLoadingMore && !pagination.hasMore && profiles.length > 0 && (
          <div className="text-center py-8 text-neutral-500">
            <p>You've reached the end of the list</p>
          </div>
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
