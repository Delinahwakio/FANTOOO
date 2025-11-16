# Shared Utility Components

This directory contains reusable utility components used across the Fantooo platform. These components provide common functionality like location search, payment processing, image uploads, date selection, and search with debouncing.

## Components

### LocationAutocomplete

A location search component with Google Maps Places Autocomplete integration.

**Features:**
- Real-time location suggestions
- Geocoding to get coordinates
- Keyboard navigation (arrow keys, enter, escape)
- Debounced API calls (300ms)
- Click outside to close
- Loading states

**Usage:**
```tsx
import { LocationAutocomplete } from '@/lib/components/shared';

<LocationAutocomplete
  value={location}
  onChange={setLocation}
  onLocationSelect={(details) => {
    console.log('Selected:', details);
    // details: { address, latitude, longitude, placeId }
  }}
  label="Location"
  placeholder="Enter your location"
  error={locationError}
/>
```

**Props:**
- `value` - Current input value
- `onChange` - Callback when input changes
- `onLocationSelect` - Callback with full location details
- `label` - Input label
- `placeholder` - Input placeholder
- `error` - Error message
- `helperText` - Helper text
- `disabled` - Disable input
- `fullWidth` - Make input full width
- `apiKey` - Google Maps API key (optional)

**Requirements:** 2.1-2.5 (User Registration), 22.1-22.5 (Location Validation)

---

### PaymentModal

A modal for purchasing credits with Paystack integration.

**Features:**
- Credit package display with pricing
- Featured package highlighting
- Discount badges
- Bonus credits display
- Secure payment indicators
- Loading states during processing
- Responsive grid layout

**Usage:**
```tsx
import { PaymentModal } from '@/lib/components/shared';

const packages = [
  {
    id: '1',
    name: 'Starter',
    credits: 10,
    price: 100,
    currency: 'KES',
    bonusCredits: 0,
    isFeatured: false,
  },
  {
    id: '2',
    name: 'Popular',
    credits: 50,
    price: 450,
    currency: 'KES',
    badge: 'POPULAR',
    discountPercentage: 10,
    bonusCredits: 5,
    isFeatured: true,
  },
];

<PaymentModal
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  packages={packages}
  onPurchaseComplete={(credits) => {
    console.log('Purchased:', credits);
  }}
  onPurchaseError={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

**Props:**
- `isOpen` - Whether modal is open
- `onClose` - Callback when modal closes
- `packages` - Array of credit packages
- `onPurchaseComplete` - Callback on successful purchase
- `onPurchaseError` - Callback on payment error

**Requirements:** 5.1-5.5 (Credit System), 16.1-16.5 (Payment Idempotency)

---

### ImageUpload

A file upload component with image validation, preview, and drag-and-drop.

**Features:**
- Drag and drop support
- Multiple file upload
- Image preview with thumbnails
- File size validation
- Image dimension validation
- Format validation
- Remove uploaded images
- Loading states

**Usage:**
```tsx
import { ImageUpload } from '@/lib/components/shared';

<ImageUpload
  value={imageUrl}
  onChange={(file) => {
    if (file) {
      // Handle single file
      console.log('File:', file);
    }
  }}
  label="Profile Picture"
  maxSizeMB={5}
  minWidth={400}
  minHeight={400}
  acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
  preview
/>

// Multiple files
<ImageUpload
  value={imageUrls}
  onChange={(files) => {
    if (files) {
      // Handle multiple files
      console.log('Files:', files);
    }
  }}
  label="Profile Pictures"
  multiple
  maxFiles={10}
  maxSizeMB={5}
  minWidth={800}
  minHeight={800}
  preview
/>
```

**Props:**
- `value` - Current image URL(s) for preview
- `onChange` - Callback with selected file(s)
- `onError` - Callback on validation error
- `label` - Label text
- `helperText` - Helper text
- `error` - Error message
- `multiple` - Allow multiple files
- `maxFiles` - Max number of files (default: 10)
- `maxSizeMB` - Max file size in MB (default: 5)
- `acceptedFormats` - Accepted formats (default: jpeg, jpg, png, webp)
- `minWidth` - Min image width in pixels
- `minHeight` - Min image height in pixels
- `maxWidth` - Max image width in pixels
- `maxHeight` - Max image height in pixels
- `disabled` - Disable upload
- `preview` - Show image preview (default: true)

**Requirements:** 3.1-3.5 (Fictional Profiles)

---

### DatePicker

A custom date picker with calendar view and keyboard navigation.

**Features:**
- Calendar view with month navigation
- Keyboard navigation
- Min/max date constraints
- Today button
- Disabled dates styling
- Selected date highlighting
- Click outside to close

**Usage:**
```tsx
import { DatePicker } from '@/lib/components/shared';

<DatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  label="Birth Date"
  placeholder="Select your birth date"
  minDate={new Date('1900-01-01')}
  maxDate={new Date()}
  error={dateError}
/>
```

**Props:**
- `value` - Selected date
- `onChange` - Callback when date is selected
- `label` - Input label
- `placeholder` - Input placeholder
- `error` - Error message
- `helperText` - Helper text
- `disabled` - Disable picker
- `fullWidth` - Make picker full width
- `minDate` - Minimum selectable date
- `maxDate` - Maximum selectable date

**Requirements:** 2.1-2.5 (User Registration), 23.1-23.5 (Age Verification)

---

### SearchBar

A search input with debouncing, clear button, and keyboard shortcuts.

**Features:**
- Debounced search (configurable delay)
- Clear button
- Loading indicator during search
- Keyboard shortcuts (Escape to clear, Enter to search)
- Auto focus option
- Immediate onChange and debounced onSearch

**Usage:**
```tsx
import { SearchBar } from '@/lib/components/shared';

<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  onSearch={(query) => {
    // This is debounced
    console.log('Searching for:', query);
    fetchResults(query);
  }}
  placeholder="Search profiles..."
  debounceMs={300}
  showClearButton
  autoFocus
/>
```

**Props:**
- `value` - Current search value
- `onChange` - Callback on immediate change
- `onSearch` - Callback on debounced search
- `placeholder` - Input placeholder
- `label` - Input label
- `helperText` - Helper text
- `error` - Error message
- `disabled` - Disable input
- `fullWidth` - Make input full width (default: true)
- `debounceMs` - Debounce delay in ms (default: 500)
- `showClearButton` - Show clear button (default: true)
- `autoFocus` - Auto focus on mount

**Requirements:** Used across multiple features for filtering and search

---

## Design System Integration

All components follow the Fantooo design system:

- **Glassmorphism**: Uses `glass`, `glass-elevated` classes
- **Colors**: Passion (red), Luxury (purple), Trust (blue)
- **Typography**: Playfair Display for headings, Inter for body
- **Animations**: Smooth transitions, hover effects
- **Accessibility**: Focus rings, keyboard navigation, ARIA labels

## Testing

To test these components, you can create a demo page:

```tsx
import {
  LocationAutocomplete,
  PaymentModal,
  ImageUpload,
  DatePicker,
  SearchBar,
} from '@/lib/components/shared';

export default function SharedComponentsDemo() {
  // ... state management
  
  return (
    <div className="space-y-8 p-8">
      <LocationAutocomplete {...props} />
      <PaymentModal {...props} />
      <ImageUpload {...props} />
      <DatePicker {...props} />
      <SearchBar {...props} />
    </div>
  );
}
```

## Production Notes

### LocationAutocomplete
- Replace mock implementation with actual Google Maps Places API
- Add API key from environment variables
- Implement proper error handling for API failures
- Consider rate limiting for API calls

### PaymentModal
- Integrate with actual Paystack API
- Implement webhook handling for payment verification
- Add proper error handling and retry logic
- Store transaction records in database

### ImageUpload
- Implement actual file upload to storage (Supabase Storage)
- Add image optimization/compression
- Implement progress tracking for large files
- Add virus scanning for uploaded files

### DatePicker
- Consider using a library like `react-datepicker` for production
- Add localization support
- Implement time picker if needed

### SearchBar
- Optimize debounce timing based on use case
- Add search history/suggestions
- Implement analytics tracking for searches

## Dependencies

These components use:
- `@/lib/components/ui/*` - Base UI components
- `@/lib/utils/cn` - Class name utility
- React hooks for state management
- No external date/location libraries (can be added for production)

## Future Enhancements

1. **LocationAutocomplete**: Add recent searches, favorites
2. **PaymentModal**: Add promo code support, payment methods
3. **ImageUpload**: Add cropping, filters, batch upload
4. **DatePicker**: Add time selection, range selection
5. **SearchBar**: Add voice search, advanced filters
