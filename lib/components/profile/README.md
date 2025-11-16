# Profile Components

A collection of components for displaying fictional user profiles in the Fantooo platform.

## Components

### ProfileCard

A compact card component for displaying profile information in grids and lists.

**Features:**
- Profile image with hover effects
- Featured badge for premium profiles
- Online status indicator
- Basic info (name, age, location)
- Bio preview (2 lines max)
- Interest tags (first 3)
- Chat and favorite actions

**Usage:**
```tsx
import { ProfileCard } from '@/lib/components/profile';

<ProfileCard
  profile={fictionalUser}
  onChatClick={(id) => router.push(`/chat/${id}`)}
  onFavoriteClick={handleFavorite}
  isFavorited={false}
  showActions={true}
/>
```

### ProfileCarousel

An image carousel for displaying multiple profile pictures with navigation.

**Features:**
- Swipe support for mobile
- Navigation arrows (desktop)
- Dot indicators
- Image counter
- Keyboard navigation support

**Usage:**
```tsx
import { ProfileCarousel } from '@/lib/components/profile';

<ProfileCarousel
  images={profile.profile_pictures}
  alt={profile.name}
/>
```

### ProfileGrid

A responsive grid layout for displaying multiple profile cards.

**Features:**
- Responsive columns (1-4 based on screen size)
- Loading skeleton states
- Empty state with message
- Click handlers for profiles
- Favorite state management

**Usage:**
```tsx
import { ProfileGrid } from '@/lib/components/profile';

<ProfileGrid
  profiles={profiles}
  onChatClick={handleChat}
  onFavoriteClick={handleFavorite}
  onProfileClick={(id) => router.push(`/profile/${id}`)}
  favoritedIds={favorites}
  showActions={true}
  isLoading={isLoading}
  emptyMessage="No profiles match your filters"
/>
```

### ProfileDetails

A full-page detailed view of a profile with all information.

**Features:**
- Image carousel
- Complete bio and description
- All profile fields (occupation, education, relationship status)
- Interest tags
- Personality traits
- Featured badge
- Online status
- Sticky action buttons
- Back navigation

**Usage:**
```tsx
import { ProfileDetails } from '@/lib/components/profile';

<ProfileDetails
  profile={fictionalUser}
  onChatClick={handleChat}
  onFavoriteClick={handleFavorite}
  onBackClick={() => router.back()}
  isFavorited={false}
  showActions={true}
/>
```

## Design System Integration

All components use the Fantooo design system:

- **Colors**: Passion (primary), Luxury (premium), Trust (reliability)
- **Typography**: Playfair Display (headings), Inter (body)
- **Glass Effects**: Glassmorphism cards with blur and transparency
- **Animations**: Smooth transitions, hover effects, loading states
- **Responsive**: Mobile-first design with breakpoints

## Requirements Coverage

These components fulfill **Requirements 3.1-3.5 (Fictional Profiles)**:

- ✅ Display fictional profiles with rich details and media
- ✅ Show profile pictures (minimum 3, maximum 10)
- ✅ Display bio, interests, personality traits
- ✅ Featured profile indicators
- ✅ Online/active status
- ✅ Responsive grid layouts
- ✅ Interactive actions (chat, favorite)

## Accessibility

- Semantic HTML elements
- ARIA labels for icon buttons
- Keyboard navigation support
- Focus indicators
- Alt text for images
- Screen reader friendly

## Performance

- Next.js Image optimization
- Lazy loading for images
- Virtual scrolling ready (for large lists)
- Optimistic UI updates
- Loading skeletons
- Responsive image sizes

## Example Page Implementation

```tsx
// app/discover/page.tsx
'use client';

import { useState } from 'react';
import { ProfileGrid } from '@/lib/components/profile';
import { useRouter } from 'next/navigation';

export default function DiscoverPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Fetch profiles (example)
  const { data: profiles, isLoading } = useProfiles();
  
  const handleChat = (profileId: string) => {
    router.push(`/chat/new?profile=${profileId}`);
  };
  
  const handleFavorite = (profileId: string) => {
    setFavorites(prev => 
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };
  
  const handleProfileClick = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-8">
        Discover Profiles
      </h1>
      
      <ProfileGrid
        profiles={profiles}
        onChatClick={handleChat}
        onFavoriteClick={handleFavorite}
        onProfileClick={handleProfileClick}
        favoritedIds={favorites}
        isLoading={isLoading}
      />
    </div>
  );
}
```

## Testing

Components are designed to be easily testable:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileCard } from '@/lib/components/profile';

test('ProfileCard displays profile information', () => {
  const profile = {
    id: '1',
    name: 'Jane Doe',
    age: 25,
    location: 'Nairobi',
    bio: 'Test bio',
    profile_pictures: ['/test.jpg'],
    is_active: true,
    is_featured: false,
    // ... other fields
  };
  
  render(<ProfileCard profile={profile} />);
  
  expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  expect(screen.getByText('25')).toBeInTheDocument();
  expect(screen.getByText('Nairobi')).toBeInTheDocument();
});

test('ProfileCard calls onChatClick when chat button clicked', () => {
  const handleChat = jest.fn();
  
  render(
    <ProfileCard 
      profile={profile} 
      onChatClick={handleChat}
      showActions={true}
    />
  );
  
  fireEvent.click(screen.getByText('Chat'));
  expect(handleChat).toHaveBeenCalledWith(profile.id);
});
```
