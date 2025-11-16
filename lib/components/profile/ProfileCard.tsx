import React from 'react';
import Image from 'next/image';
import { FictionalUser } from '@/lib/types/user';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { cn } from '@/lib/utils/cn';

export interface ProfileCardProps {
  profile: FictionalUser;
  onChatClick?: (profileId: string) => void;
  onFavoriteClick?: (profileId: string) => void;
  isFavorited?: boolean;
  showActions?: boolean;
  className?: string;
}

/**
 * ProfileCard Component
 * 
 * Displays a fictional user profile in a card format with image, basic info, and actions.
 * Used in profile grids and discovery pages.
 * 
 * @param profile - The fictional user profile data
 * @param onChatClick - Callback when chat button is clicked
 * @param onFavoriteClick - Callback when favorite button is clicked
 * @param isFavorited - Whether the profile is favorited
 * @param showActions - Whether to show action buttons
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ProfileCard
 *   profile={fictionalUser}
 *   onChatClick={(id) => router.push(`/chat/${id}`)}
 *   onFavoriteClick={handleFavorite}
 *   isFavorited={false}
 *   showActions={true}
 * />
 * ```
 */
export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onChatClick,
  onFavoriteClick,
  isFavorited = false,
  showActions = true,
  className,
}) => {
  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChatClick?.(profile.id);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteClick?.(profile.id);
  };

  return (
    <GlassCard
      variant="elevated"
      hover={showActions}
      className={cn('relative overflow-hidden group', className)}
    >
      {/* Featured Badge */}
      {profile.is_featured && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-gradient-luxury text-white text-xs font-bold px-3 py-1 rounded-full shadow-luxury">
            FEATURED
          </span>
        </div>
      )}

      {/* Profile Image */}
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden mb-4">
        <Image
          src={profile.profile_pictures[0]}
          alt={profile.name}
          fill
          className="object-cover transition-smooth group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Online Status */}
        {profile.is_active && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
            <span className="text-white text-sm font-semibold">Online</span>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-xl font-bold text-neutral-900">
            {profile.name}
          </h3>
          <span className="text-neutral-600 text-sm">{profile.age}</span>
        </div>

        <div className="flex items-center gap-2 text-neutral-600 text-sm">
          <svg
            className="w-4 h-4"
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
          <span className="truncate">{profile.location}</span>
        </div>

        {profile.bio && (
          <p className="text-neutral-700 text-sm line-clamp-2 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Tags */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {profile.interests.slice(0, 3).map((interest, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-full bg-passion-50 text-passion-600 font-medium"
              >
                {interest}
              </span>
            ))}
            {profile.interests.length > 3 && (
              <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-600 font-medium">
                +{profile.interests.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 mt-4">
          <GlassButton
            variant="passion"
            size="md"
            fullWidth
            onClick={handleChatClick}
            className="flex-1"
          >
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
            Chat
          </GlassButton>

          {onFavoriteClick && (
            <GlassButton
              variant={isFavorited ? 'passion' : 'outline'}
              size="md"
              onClick={handleFavoriteClick}
              className="px-3"
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className="w-5 h-5"
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
          )}
        </div>
      )}
    </GlassCard>
  );
};
