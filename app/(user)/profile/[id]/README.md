# Profile View Page

## Overview

The profile view page (`/profile/[id]`) displays the full details of a fictional user profile. Users can view all profile information, browse through photos, and initiate a chat or add the profile to their favorites.

## Features

### ✅ Implemented Features

1. **Full Profile Display**
   - Name, age, gender, location
   - Occupation, education, relationship status
   - Bio with formatted text
   - All profile details from the database

2. **Photo Carousel**
   - Interactive image carousel with navigation
   - Swipe support for mobile devices
   - Image counter (e.g., "1 / 5")
   - Smooth transitions between photos

3. **Bio and Interests**
   - Full bio text with proper formatting
   - Interest tags displayed as chips
   - Personality traits displayed separately
   - Chat style indicator

4. **Action Buttons**
   - "Start Chat" button with duplicate prevention
   - Favorite/Unfavorite toggle with heart icon
   - Visual feedback for favorited state
   - Loading states during actions

5. **Error Handling**
   - Profile not found (404) handling
   - Inactive profile handling
   - Network error handling
   - User-friendly error messages

6. **UI/UX Features**
   - Back button for navigation
   - Featured badge for featured profiles
   - Online status indicator
   - Responsive layout (mobile, tablet, desktop)
   - Loading spinner during data fetch
   - Glassmorphism design system

## Requirements Mapping

### Requirement 3.1-3.5 (Fictional Profiles)

- ✅ **3.1**: Display full fictional profile with all details
- ✅ **3.2**: Show profile pictures (minimum 3, maximum 10)
- ✅ **3.3**: Display bio, interests, personality traits
- ✅ **3.4**: Handle profile not found errors
- ✅ **3.5**: Show featured profile badge

## API Integration

### GET /api/fictional-profiles/[id]

Fetches a single fictional profile by ID.

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "name": "string",
    "age": number,
    "gender": "male" | "female" | "other",
    "location": "string",
    "bio": "string",
    "profile_pictures": ["url1", "url2", ...],
    "interests": ["interest1", "interest2", ...],
    "personality_traits": ["trait1", "trait2", ...],
    "occupation": "string",
    "education": "string",
    "relationship_status": "string",
    "response_style": "flirty" | "romantic" | "friendly" | "intellectual" | "playful",
    "is_featured": boolean,
    "is_active": boolean,
    ...
  }
}
```

**Error Responses:**
- `404`: Profile not found or inactive
- `500`: Server error

## Component Structure

```
ProfileViewPage
├── Back Button
├── Left Column (Photos)
│   ├── Featured Badge (if featured)
│   ├── ProfileCarousel
│   └── Action Buttons
│       ├── Start Chat Button
│       └── Favorite Button
└── Right Column (Details)
    ├── Basic Info Card
    │   ├── Name & Age
    │   ├── Online Status
    │   ├── Location
    │   ├── Gender
    │   ├── Occupation
    │   ├── Education
    │   └── Relationship Status
    ├── About Me Card (Bio)
    ├── Interests Card
    ├── Personality Card
    └── Chat Style Card
```

## User Flow

1. User clicks on a profile card from the discover page
2. Navigate to `/profile/[id]`
3. Page fetches profile data from API
4. Display loading spinner while fetching
5. Show profile details with photo carousel
6. User can:
   - Browse through photos using carousel
   - Read full bio and details
   - Click "Start Chat" to initiate conversation
   - Click heart icon to favorite/unfavorite
   - Click back button to return to previous page

## Error States

### Profile Not Found
- Shows error icon and message
- "Back to Discover" button
- Occurs when profile doesn't exist or is deleted

### Profile Inactive
- Treated as "not found"
- Same error UI as profile not found

### Network Error
- Shows generic error message
- User can try refreshing the page

## Loading States

### Initial Load
- Full-page loading spinner
- "Loading profile..." message

### Chat Creation
- Button shows loading spinner
- "Starting Chat..." text
- Prevents multiple clicks

### Favorite Toggle
- Optimistic UI update
- Instant visual feedback
- Reverts on error

## Responsive Design

### Mobile (< 768px)
- Single column layout
- Photos on top, details below
- Full-width action buttons
- Touch-friendly carousel

### Tablet (768px - 1024px)
- Two-column layout
- Larger touch targets
- Optimized spacing

### Desktop (> 1024px)
- Two-column layout
- Hover effects on buttons
- Larger images and text

## Accessibility

- Semantic HTML structure
- ARIA labels on buttons
- Keyboard navigation support
- Alt text for images
- Focus indicators
- Screen reader friendly

## Performance

- Image optimization with Next.js Image
- Lazy loading for images
- Efficient re-renders with React hooks
- Minimal API calls
- Cached favorite state

## Future Enhancements

- [ ] Share profile functionality
- [ ] Report profile option
- [ ] View similar profiles
- [ ] Profile statistics (response rate, etc.)
- [ ] Video profile support
- [ ] Audio introduction clips
- [ ] Profile verification badge
- [ ] Last active timestamp

## Testing Checklist

- [x] Profile loads correctly with valid ID
- [x] 404 error shows for invalid ID
- [x] Photo carousel works (navigation, swipe)
- [x] Start Chat button creates chat and navigates
- [x] Favorite button toggles correctly
- [x] Back button navigates to previous page
- [x] Featured badge shows for featured profiles
- [x] Online status shows for active profiles
- [x] All profile fields display correctly
- [x] Responsive layout works on all screen sizes
- [x] Loading states show appropriately
- [x] Error states display user-friendly messages
