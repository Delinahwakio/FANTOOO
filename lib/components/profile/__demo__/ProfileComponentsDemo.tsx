'use client';

import React, { useState } from 'react';
import { ProfileCard, ProfileCarousel, ProfileGrid, ProfileDetails } from '@/lib/components/profile';
import { FictionalUser } from '@/lib/types/user';

/**
 * Demo component showcasing all profile components
 * This file demonstrates how to use the profile components
 */

// Sample data
const sampleProfile: FictionalUser = {
  id: '1',
  name: 'Amara Johnson',
  age: 26,
  gender: 'female',
  location: 'Nairobi, Kenya',
  bio: 'Adventure seeker and coffee enthusiast. Love exploring new places and meeting interesting people. Always up for a good conversation!',
  personality_traits: ['Adventurous', 'Outgoing', 'Creative', 'Empathetic'],
  interests: ['Travel', 'Photography', 'Coffee', 'Music', 'Art', 'Hiking'],
  occupation: 'Marketing Manager',
  education: 'Bachelor of Arts in Communications',
  relationship_status: 'Single',
  profile_pictures: [
    '/images/sample-profile-1.jpg',
    '/images/sample-profile-2.jpg',
    '/images/sample-profile-3.jpg',
    '/images/sample-profile-4.jpg',
  ],
  response_style: 'friendly',
  total_chats: 150,
  total_messages: 3500,
  average_rating: 4.8,
  total_revenue: 25000,
  conversion_rate: 75,
  is_active: true,
  is_featured: true,
  max_concurrent_chats: 5,
  popularity_score: 95,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

const sampleProfiles: FictionalUser[] = [
  sampleProfile,
  {
    ...sampleProfile,
    id: '2',
    name: 'Sofia Martinez',
    age: 24,
    location: 'Mombasa, Kenya',
    is_featured: false,
    interests: ['Dancing', 'Cooking', 'Fashion'],
  },
  {
    ...sampleProfile,
    id: '3',
    name: 'Zara Williams',
    age: 28,
    location: 'Kisumu, Kenya',
    is_featured: false,
    interests: ['Reading', 'Yoga', 'Meditation'],
  },
  {
    ...sampleProfile,
    id: '4',
    name: 'Lila Anderson',
    age: 25,
    location: 'Nakuru, Kenya',
    is_featured: true,
    interests: ['Fitness', 'Nutrition', 'Sports'],
  },
];

export default function ProfileComponentsDemo() {
  const [view, setView] = useState<'card' | 'carousel' | 'grid' | 'details'>('grid');
  const [favorites, setFavorites] = useState<string[]>(['1']);

  const handleChat = (profileId: string) => {
    console.log('Chat clicked for profile:', profileId);
    alert(`Starting chat with profile ${profileId}`);
  };

  const handleFavorite = (profileId: string) => {
    setFavorites((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleProfileClick = (profileId: string) => {
    console.log('Profile clicked:', profileId);
    setView('details');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-5xl font-bold text-gradient-passion mb-4">
            Profile Components Demo
          </h1>
          <p className="text-neutral-700 text-lg">
            Explore all profile components for the Fantooo platform
          </p>
        </div>

        {/* View Selector */}
        <div className="glass-elevated p-4 rounded-2xl mb-8 flex gap-4 flex-wrap">
          <button
            onClick={() => setView('card')}
            className={`px-6 py-2 rounded-xl font-semibold transition-smooth ${
              view === 'card'
                ? 'bg-gradient-passion text-white shadow-passion'
                : 'glass hover:glass-elevated'
            }`}
          >
            Single Card
          </button>
          <button
            onClick={() => setView('carousel')}
            className={`px-6 py-2 rounded-xl font-semibold transition-smooth ${
              view === 'carousel'
                ? 'bg-gradient-passion text-white shadow-passion'
                : 'glass hover:glass-elevated'
            }`}
          >
            Carousel
          </button>
          <button
            onClick={() => setView('grid')}
            className={`px-6 py-2 rounded-xl font-semibold transition-smooth ${
              view === 'grid'
                ? 'bg-gradient-passion text-white shadow-passion'
                : 'glass hover:glass-elevated'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('details')}
            className={`px-6 py-2 rounded-xl font-semibold transition-smooth ${
              view === 'details'
                ? 'bg-gradient-passion text-white shadow-passion'
                : 'glass hover:glass-elevated'
            }`}
          >
            Full Details
          </button>
        </div>

        {/* Component Display */}
        <div className="animate-fade-in">
          {view === 'card' && (
            <div className="max-w-sm mx-auto">
              <h2 className="font-display text-3xl font-bold mb-6 text-center">
                ProfileCard Component
              </h2>
              <ProfileCard
                profile={sampleProfile}
                onChatClick={handleChat}
                onFavoriteClick={handleFavorite}
                isFavorited={favorites.includes(sampleProfile.id)}
                showActions={true}
              />
            </div>
          )}

          {view === 'carousel' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="font-display text-3xl font-bold mb-6 text-center">
                ProfileCarousel Component
              </h2>
              <ProfileCarousel
                images={sampleProfile.profile_pictures}
                alt={sampleProfile.name}
              />
              <p className="text-center text-neutral-600 mt-4">
                Use arrow keys or swipe to navigate
              </p>
            </div>
          )}

          {view === 'grid' && (
            <div>
              <h2 className="font-display text-3xl font-bold mb-6 text-center">
                ProfileGrid Component
              </h2>
              <ProfileGrid
                profiles={sampleProfiles}
                onChatClick={handleChat}
                onFavoriteClick={handleFavorite}
                onProfileClick={handleProfileClick}
                favoritedIds={favorites}
                showActions={true}
              />
            </div>
          )}

          {view === 'details' && (
            <div>
              <h2 className="font-display text-3xl font-bold mb-6 text-center">
                ProfileDetails Component
              </h2>
              <ProfileDetails
                profile={sampleProfile}
                onChatClick={handleChat}
                onFavoriteClick={handleFavorite}
                onBackClick={() => setView('grid')}
                isFavorited={favorites.includes(sampleProfile.id)}
                showActions={true}
              />
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="glass-elevated p-6 rounded-2xl mt-8">
          <h3 className="font-display text-2xl font-bold mb-4">Component Info</h3>
          <div className="space-y-2 text-neutral-700">
            <p>
              <strong>Current View:</strong> {view}
            </p>
            <p>
              <strong>Favorited Profiles:</strong> {favorites.length}
            </p>
            <p>
              <strong>Total Profiles:</strong> {sampleProfiles.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
