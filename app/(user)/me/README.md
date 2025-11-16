# User Profile Page (/me)

## Overview

The user profile page allows authenticated users to view and manage their account information, including profile details, chat history, credit balance, and account deletion.

## Features

### Profile Information
- **Display user details**: Username, display name, email, age, gender, location
- **Profile picture**: View and update profile picture
- **Bio**: Add or edit personal bio
- **Location**: Update location with geocoding validation
- **Member since**: Display account creation date

### Profile Editing
- **Edit mode**: Toggle between view and edit modes
- **Form validation**: Validate inputs before saving
- **Image upload**: Upload and preview profile pictures
- **Location autocomplete**: Search and select location with coordinates
- **Save/Cancel**: Save changes or cancel editing

### Chat History
- **Recent chats**: Display last 10 chats with fictional profiles
- **Chat details**: Show message count, credits spent, and last activity
- **Chat status**: Display active, closed, or other statuses
- **Quick access**: Click to navigate to chat

### Credit Balance
- **Current balance**: Display available credits
- **Buy credits**: Link to credits purchase page
- **Total spent**: Show lifetime spending

### Statistics
- **Total chats**: Number of chats initiated
- **Messages sent**: Total messages sent
- **User tier**: Current tier level (free, bronze, silver, gold, platinum)
- **Loyalty points**: Accumulated loyalty points

### Account Actions
- **Favorites**: Navigate to favorites page
- **Delete account**: GDPR-compliant account deletion with confirmation

## API Endpoints

### GET /api/users/me
Fetch current user profile.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "display_name": "John Doe",
    "email": "johndoe@fantooo.com",
    "age": 25,
    "gender": "male",
    "location": "Nairobi, Kenya",
    "bio": "Hello world",
    "profile_picture": "https://...",
    "credits": 100,
    "total_spent": 500,
    "user_tier": "silver",
    "total_chats": 5,
    "total_messages_sent": 50,
    "loyalty_points": 250,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### PATCH /api/users/me
Update user profile.

**Request:**
```json
{
  "display_name": "John Doe",
  "bio": "Updated bio",
  "location": "Nairobi, Kenya",
  "latitude": -1.286389,
  "longitude": 36.817223,
  "profile_picture": "https://..."
}
```

**Response:**
```json
{
  "user": { /* updated user object */ }
}
```

### DELETE /api/users/me
Delete user account (GDPR compliance).

**Response:**
```json
{
  "message": "Account deleted successfully",
  "refund_amount": 100
}
```

### GET /api/users/me/chats
Fetch user's chat history.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (optional)

**Response:**
```json
{
  "chats": [
    {
      "id": "uuid",
      "status": "active",
      "message_count": 10,
      "total_credits_spent": 50,
      "last_message_at": "2024-01-01T00:00:00Z",
      "fictional_user": {
        "id": "uuid",
        "name": "Jane",
        "profile_pictures": ["https://..."],
        "is_featured": true
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasMore": false
  }
}
```

## Components Used

- `GlassCard`: Container with glassmorphism effect
- `GlassButton`: Styled button component
- `GlassInput`: Form input component
- `LocationAutocomplete`: Location search with geocoding
- `ImageUpload`: Image upload with validation and preview
- `Modal`: Confirmation modal for account deletion

## Requirements Satisfied

### Requirement 2.1-2.5 (User Registration)
- Display user registration details
- Allow profile editing
- Validate location updates

### Requirement 14.1-14.5 (User Deletion)
- GDPR-compliant account deletion
- Archive user data
- Anonymize messages
- Calculate refund for unused credits
- Close active chats
- Confirmation modal with warnings

## User Flow

1. **View Profile**: User navigates to `/me` to view their profile
2. **Edit Profile**: Click "Edit Profile" to enter edit mode
3. **Update Fields**: Modify display name, bio, location, or profile picture
4. **Save Changes**: Click "Save Changes" to update profile
5. **View Chats**: Scroll down to see recent chat history
6. **Check Credits**: View credit balance in sidebar
7. **Delete Account**: Click "Delete Account" and confirm to permanently delete

## Security

- **Authentication required**: Only authenticated users can access
- **Authorization**: Users can only view/edit their own profile
- **Input validation**: All inputs are validated before saving
- **GDPR compliance**: Account deletion follows GDPR requirements
- **Confirmation modal**: Prevents accidental account deletion

## Future Enhancements

- [ ] Profile picture upload to storage (currently placeholder)
- [ ] Password change functionality
- [ ] Email change with verification
- [ ] Privacy settings management
- [ ] Notification preferences
- [ ] Export user data (GDPR)
- [ ] Account suspension appeal
- [ ] Two-factor authentication
