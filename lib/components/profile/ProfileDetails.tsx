import React from 'react';
import { FictionalUser } from '@/lib/types/user';
import { ProfileCarousel } from './ProfileCarousel';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { cn } from '@/lib/utils/cn';

export interface ProfileDetailsProps {
  profile: FictionalUser;
  onChatClick?: (profileId: string) => void;
  onFavoriteClick?: (profileId: string) => void;
  onBackClick?: () => void;
  isFavorited?: boolean;
  showActions?: boolean;
  className?: string;
}

/**
 * ProfileDetails Component
 * 
 * Displays a full detailed view of a fictional user profile.
 * Includes image carousel, complete bio, interests, and personality traits.
 * 
 * @param profile - The fictional user profile data
 * @param onChatClick - Callback when chat button is clicked
 * @param onFavoriteClick - Callback when favorite button is clicked
 * @param onBackClick - Callback when back button is clicked
 * @param isFavorited - Whether the profile is favorited
 * @param showActions - Whether to show action buttons
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ProfileDetails
 *   profile={fictionalUser}
 *   onChatClick={handleChat}
 *   onFavoriteClick={handleFavorite}
 *   onBackClick={() => router.back()}
 *   isFavorited={false}
 *   showActions={true}
 * />
 * ```
 */
export const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  profile,
  onChatClick,
  onFavoriteClick,
  onBackClick,
  isFavorited = false,
  showActions = true,
  className,
}) => {
  const handleChatClick = () => {
    onChatClick?.(profile.id);
  };

  const handleFavoriteClick = () => {
    onFavoriteClick?.(profile.id);
  };

  return (
    <div className={cn('max-w-6xl mx-auto', className)}>
      {/* Back Button */}
      {onBackClick && (
        <button
          onClick={onBackClick}
          className="mb-6 flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-smooth"
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
          <span className="font-semibold">Back</span>
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Images */}
        <div className="space-y-4">
          <ProfileCarousel images={profile.profile_pictures} alt={profile.name} />
          
          {/* Featured Badge */}
          {profile.is_featured && (
            <div className="flex items-center justify-center gap-2 glass-elevated p-3 rounded-xl">
              <svg
                className="w-5 h-5 text-luxury-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-gradient-luxury font-bold">Featured Profile</span>
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Header */}
          <GlassCard variant="elevated">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
                  {profile.name}
                </h1>
                <div className="flex items-center gap-4 text-neutral-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {profile.age} years old
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {profile.location}
                  </span>
                </div>
              </div>

              {/* Online Status */}
              {profile.is_active && (
                <div className="flex items-center gap-2 glass px-3 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-neutral-700">Online</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-neutral-700 leading-relaxed">{profile.bio}</p>
            )}
          </GlassCard>

          {/* Basic Info */}
          <GlassCard variant="elevated">
            <h2 className="font-display text-2xl font-bold text-neutral-900 mb-4">
              About
            </h2>
            <div className="space-y-3">
              {profile.occupation && (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                  <span className="text-neutral-700">{profile.occupation}</span>
                </div>
              )}
              {profile.education && (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  <span className="text-neutral-700">{profile.education}</span>
                </div>
              )}
              {profile.relationship_status && (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-neutral-700">{profile.relationship_status}</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <GlassCard variant="elevated">
              <h2 className="font-display text-2xl font-bold text-neutral-900 mb-4">
                Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full bg-passion-50 text-passion-600 font-medium text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Personality Traits */}
          {profile.personality_traits && profile.personality_traits.length > 0 && (
            <GlassCard variant="elevated">
              <h2 className="font-display text-2xl font-bold text-neutral-900 mb-4">
                Personality
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.personality_traits.map((trait, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full bg-luxury-50 text-luxury-600 font-medium text-sm"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-4 sticky bottom-6 z-10">
              <GlassButton
                variant="passion"
                size="lg"
                fullWidth
                onClick={handleChatClick}
                className="shadow-passion-lg"
              >
                <svg
                  className="w-6 h-6 mr-2 inline"
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
              </GlassButton>

              {onFavoriteClick && (
                <GlassButton
                  variant={isFavorited ? 'passion' : 'outline'}
                  size="lg"
                  onClick={handleFavoriteClick}
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
