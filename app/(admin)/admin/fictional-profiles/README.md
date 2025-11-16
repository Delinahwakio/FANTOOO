# Fictional Profiles Management Page

## Overview

Admin interface for creating, managing, and monitoring fictional profiles on the Fantooo platform. This page provides comprehensive CRUD operations, bulk import functionality, and performance metrics for all fictional profiles.

## Features

### 1. Profile Listing
- Grid view of all fictional profiles with images
- Search by name, bio, or location
- Filter by gender, active status, and featured status
- Pagination support
- Real-time active chat count display

### 2. Create Profile
- Form-based profile creation
- Profile picture validation (3-10 required)
- Age validation (18-100)
- Response style selection
- Personality guidelines and templates
- Featured profile toggle
- Active/inactive status control

### 3. Edit Profile
- Update all profile fields
- Maintain profile picture count validation
- Toggle featured status
- Update personality guidelines
- Modify response templates

### 4. Delete Profile
- Soft delete with validation
- Prevents deletion if active chats exist
- Shows active chat count before deletion
- Automatically closes idle chats
- Confirmation dialog

### 5. Bulk Import
- JSON-based bulk profile import
- Validation for all profiles
- Detailed error reporting
- Success count display

### 6. Featured Toggle
- Quick toggle for featured status
- Featured profiles have 1.5x message cost multiplier
- Visual indicator on profile cards

### 7. Performance Metrics
- Total chats per profile
- Total messages sent
- Average user rating
- Active chat count
- Revenue tracking

## API Endpoints

### GET /api/admin/fictional-profiles
Fetch all fictional profiles with admin details and active chat counts.

**Query Parameters:**
- `search` - Search term for name, bio, or location
- `gender` - Filter by gender (male, female, other)
- `isActive` - Filter by active status (true, false)
- `isFeatured` - Filter by featured status (true, false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "profiles": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "age": 25,
      "gender": "female",
      "location": "Nairobi",
      "bio": "...",
      "profile_pictures": ["url1", "url2", "url3"],
      "is_active": true,
      "is_featured": false,
      "total_chats": 150,
      "total_messages": 3500,
      "average_rating": 4.5,
      "active_chat_count": 3,
      "created_by_admin": { "name": "Admin Name" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```

### POST /api/admin/fictional-profiles
Create a new fictional profile.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "age": 25,
  "gender": "female",
  "location": "Nairobi",
  "bio": "Adventurous spirit...",
  "profile_pictures": ["url1", "url2", "url3"],
  "personality_traits": ["Adventurous", "Caring"],
  "interests": ["Travel", "Music"],
  "occupation": "Designer",
  "response_style": "friendly",
  "personality_guidelines": "Be warm and engaging...",
  "is_active": true,
  "is_featured": false
}
```

**Response:**
```json
{
  "profile": { /* created profile */ }
}
```

### PATCH /api/admin/fictional-profiles/[id]
Update an existing fictional profile.

**Request Body:** (partial update supported)
```json
{
  "name": "Jane Smith",
  "is_featured": true,
  "featured_until": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "profile": { /* updated profile */ }
}
```

### DELETE /api/admin/fictional-profiles/[id]
Soft delete a fictional profile.

**Validation:**
- Cannot delete if active chats exist
- Automatically closes idle chats
- Sets deleted_at timestamp

**Response:**
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

### POST /api/admin/fictional-profiles/bulk-import
Bulk import multiple fictional profiles.

**Request Body:**
```json
{
  "profiles": [
    {
      "name": "Jane Doe",
      "age": 25,
      "gender": "female",
      "location": "Nairobi",
      "bio": "...",
      "profile_pictures": ["url1", "url2", "url3"]
    },
    // ... more profiles
  ]
}
```

**Response:**
```json
{
  "success": true,
  "imported_count": 10,
  "profiles": [ /* imported profiles */ ]
}
```

**Error Response (validation failed):**
```json
{
  "error": "Validation failed for some profiles",
  "validation_errors": [
    {
      "index": 2,
      "errors": ["age is required", "profile_pictures must have between 3 and 10 items"]
    }
  ],
  "valid_count": 8,
  "invalid_count": 2
}
```

## Validation Rules

### Profile Pictures
- **Minimum:** 3 pictures required
- **Maximum:** 10 pictures allowed
- Enforced at database level with CHECK constraint
- Validated in API and UI

### Age
- **Minimum:** 18 years
- **Maximum:** 100 years
- Enforced at database level with CHECK constraint

### Required Fields
- name
- age
- gender
- location
- bio
- profile_pictures (array of 3-10 URLs)

### Optional Fields
- personality_traits (array)
- interests (array)
- occupation
- education
- relationship_status
- cover_photo
- response_style (flirty, romantic, friendly, intellectual, playful)
- response_templates (JSON object)
- personality_guidelines (text)
- tags (array)
- category
- max_concurrent_chats (default: 10)
- is_active (default: true)
- is_featured (default: false)
- featured_until (timestamp)

## Requirements Satisfied

### Requirement 3.1-3.5: Fictional Profile Management
✅ **3.1** - Minimum 3 profile pictures required (validated)
✅ **3.2** - Maximum 10 profile pictures allowed (validated)
✅ **3.3** - Active chats closed when profile deleted
✅ **3.4** - Users notified when profile deleted (via chat closure)
✅ **3.5** - Profile media validated (URL format, count)

## Security

- Admin authentication required
- Permission check: `manage_fictional_profiles`
- RLS policies enforce admin-only access
- Input validation on all fields
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized inputs)

## Performance Considerations

- Pagination for large profile lists
- Efficient queries with proper indexes
- Active chat count fetched in batch
- Image lazy loading
- Virtual scrolling for long lists (future enhancement)

## Usage

### Creating a Profile
1. Click "Create Profile" button
2. Fill in required fields (name, age, gender, location, bio)
3. Add 3-10 profile picture URLs
4. Optionally add personality traits, interests, guidelines
5. Set active/featured status
6. Click "Create Profile"

### Editing a Profile
1. Click "Edit" button on profile card
2. Modify desired fields
3. Click "Update Profile"

### Deleting a Profile
1. Ensure no active chats exist
2. Click "Delete" button
3. Confirm deletion in dialog
4. Profile is soft deleted

### Bulk Import
1. Click "Bulk Import" button
2. Paste JSON array of profiles
3. Ensure all profiles have required fields
4. Click "Import Profiles"
5. Review validation errors if any

### Toggling Featured Status
1. Click "Feature" button on profile card
2. Profile is immediately updated
3. Featured profiles show ⭐ badge

## Future Enhancements

- [ ] Image upload directly from UI (vs. URL input)
- [ ] Profile preview before creation
- [ ] Duplicate profile detection
- [ ] Profile analytics dashboard
- [ ] Export profiles to JSON
- [ ] Profile templates
- [ ] Batch operations (activate/deactivate multiple)
- [ ] Profile versioning/history
- [ ] A/B testing for profile variations
