# Favorites Page

## Overview

The favorites page (`/favorites`) displays a grid of fictional profiles that the user has marked as favorites. It provides quick access to saved profiles with the ability to start chats or remove profiles from favorites.

## Features

### Core Functionality

1. **Display Favorited Profiles**
   - Shows all profiles the user has favorited
   - Uses the same ProfileGrid component as the discover page
   - Displays count of favorited profiles in the header

2. **Quick Chat Access**
   - Click "Chat" button to start a conversation
   - Duplicate chat prevention (reuses existing chat if available)
   - Loading overlay during chat creation
   - Automatic navigation to chat page

3. **Unfavorite Functionality**
   - Click heart icon to remove from favorites
   - Optimistic UI updates
   - Automatic list refresh after unfavorite
   - Visual feedback on action

4. **Empty State**
   - Beautiful empty state when no favorites
   - Call-to-action button to discover profiles
   - Helpful messaging to guide users

5. **Error Handling**
   - Displays error messages in a glass card
   - Graceful handling of API failures
   - User-friendly error messages

## User Flow

```
User visits /favorites
    ↓
Fetch user's favorite IDs from API
    ↓
Fetch profile details for favorited IDs
    ↓
Display profiles in grid
    ↓
User interactions:
    - Click profile → View profile details
    - Click chat → Start/resume chat
    - Click heart → Remove from favorites
```

## API Integration

### Endpoints Used

1. **GET /api/favorites**
   - Fetches list of favorited profile IDs
   - Used by `useFavorites` hook

2. **POST /api/favorites**
   - Adds or removes favorites
   - Action: 'add' or 'remove'

3. **GET /api/fictional-profiles?ids=id1,id2,id3**
   - Fetches profile details for specific IDs
   - Used to get full profile data for favorites

4. **POST /api/chats**
   - Creates or retrieves existing chat
   - Duplicate prevention built-in

## Components Used

- `ProfileGrid` - Displays profiles in responsive grid
- `ProfileCard` - Individual profile card with actions
- `GlassCard` - Glassmorphism card container
- `GlassButton` - Styled button component
- `useFavorites` - Hook for favorite management

## State Management

```typescript
const [profiles, setProfiles] = useState<FictionalUser[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [chatLoading, setChatLoading] = useState<string | null>(null);
const { favoriteIds, toggleFavorite, refetch } = useFavorites();
```

## Requirements Satisfied

This implementation satisfies **Requirement 3.1-3.5 (Fictional Profiles)**:

- ✅ Display grid of favorited fictional profiles
- ✅ Implement quick chat access with duplicate prevention
- ✅ Add unfavorite functionality with optimistic updates
- ✅ Handle empty state with helpful messaging
- ✅ Responsive design with glassmorphism styling
- ✅ Loading states and error handling

## Design System

The page follows the Fantooo design system:

- **Colors**: Passion, luxury, and trust gradient background
- **Typography**: Playfair Display for headings, Inter for body
- **Effects**: Glassmorphism cards with backdrop blur
- **Animations**: Smooth transitions and loading states
- **Responsive**: Mobile-first grid layout

## Navigation

- Back button to return to discover page
- Profile cards link to profile detail page
- Chat button navigates to chat page
- Empty state button links to discover page

## Performance Considerations

1. **Efficient Data Fetching**
   - Only fetches profiles for favorited IDs
   - No pagination needed (typically small list)
   - Refetches only when favorites change

2. **Optimistic Updates**
   - Immediate UI feedback on unfavorite
   - Reverts on error

3. **Loading States**
   - Skeleton loading for profiles
   - Loading overlay for chat creation
   - Prevents multiple simultaneous actions

## Future Enhancements

Potential improvements for future iterations:

1. Sort options (recently added, alphabetical, etc.)
2. Bulk actions (remove multiple favorites)
3. Share favorites list
4. Export favorites
5. Favorite collections/folders
6. Notes on favorite profiles

## Testing Checklist

- [ ] Empty state displays correctly
- [ ] Profiles load and display properly
- [ ] Chat button creates/retrieves chat correctly
- [ ] Unfavorite removes profile from list
- [ ] Back button navigates to discover
- [ ] Profile click navigates to profile page
- [ ] Error states display properly
- [ ] Loading states work correctly
- [ ] Responsive on mobile, tablet, desktop
- [ ] Glassmorphism effects render correctly
