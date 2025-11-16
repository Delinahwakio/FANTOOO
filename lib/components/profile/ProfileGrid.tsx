import React from 'react';
import { FictionalUser } from '@/lib/types/user';
import { ProfileCard } from './ProfileCard';
import { cn } from '@/lib/utils/cn';

export interface ProfileGridProps {
  profiles: FictionalUser[];
  onChatClick?: (profileId: string) => void;
  onFavoriteClick?: (profileId: string) => void;
  onProfileClick?: (profileId: string) => void;
  favoritedIds?: string[];
  showActions?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * ProfileGrid Component
 * 
 * Displays a responsive grid of fictional user profile cards.
 * Handles loading states, empty states, and user interactions.
 * 
 * @param profiles - Array of fictional user profiles
 * @param onChatClick - Callback when chat button is clicked
 * @param onFavoriteClick - Callback when favorite button is clicked
 * @param onProfileClick - Callback when profile card is clicked
 * @param favoritedIds - Array of favorited profile IDs
 * @param showActions - Whether to show action buttons on cards
 * @param isLoading - Loading state
 * @param emptyMessage - Message to show when no profiles
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ProfileGrid
 *   profiles={profiles}
 *   onChatClick={handleChat}
 *   onFavoriteClick={handleFavorite}
 *   onProfileClick={handleProfileClick}
 *   favoritedIds={favorites}
 *   showActions={true}
 * />
 * ```
 */
export const ProfileGrid: React.FC<ProfileGridProps> = ({
  profiles,
  onChatClick,
  onFavoriteClick,
  onProfileClick,
  favoritedIds = [],
  showActions = true,
  isLoading = false,
  emptyMessage = 'No profiles found',
  className,
}) => {
  const handleProfileClick = (profileId: string) => {
    onProfileClick?.(profileId);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="glass-elevated rounded-2xl overflow-hidden animate-pulse"
          >
            <div className="w-full aspect-[3/4] bg-neutral-200" />
            <div className="p-6 space-y-3">
              <div className="h-6 bg-neutral-200 rounded w-3/4" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
              <div className="h-4 bg-neutral-200 rounded w-full" />
              <div className="h-4 bg-neutral-200 rounded w-5/6" />
              <div className="flex gap-2 pt-2">
                <div className="h-10 bg-neutral-200 rounded-xl flex-1" />
                <div className="h-10 w-10 bg-neutral-200 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="glass-elevated p-8 rounded-3xl text-center max-w-md">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="font-display text-2xl font-bold text-neutral-900 mb-2">
            {emptyMessage}
          </h3>
          <p className="text-neutral-600">
            Try adjusting your filters or check back later for new profiles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
        className
      )}
    >
      {profiles.map((profile) => (
        <div
          key={profile.id}
          onClick={() => handleProfileClick(profile.id)}
          className="cursor-pointer"
        >
          <ProfileCard
            profile={profile}
            onChatClick={onChatClick}
            onFavoriteClick={onFavoriteClick}
            isFavorited={favoritedIds.includes(profile.id)}
            showActions={showActions}
          />
        </div>
      ))}
    </div>
  );
};
