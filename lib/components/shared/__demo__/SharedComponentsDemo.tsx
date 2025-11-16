'use client';

import React, { useState } from 'react';
import {
  LocationAutocomplete,
  PaymentModal,
  ImageUpload,
  DatePicker,
  SearchBar,
  type LocationDetails,
  type CreditPackage,
} from '@/lib/components/shared';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';

/**
 * Demo page showcasing all shared utility components
 */
export default function SharedComponentsDemo() {
  // LocationAutocomplete state
  const [location, setLocation] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationDetails | null>(null);

  // PaymentModal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchasedCredits, setPurchasedCredits] = useState<number | null>(null);

  // ImageUpload state
  const [singleImage, setSingleImage] = useState<File | null>(null);
  const [multipleImages, setMultipleImages] = useState<File[] | null>(null);
  const [imageError, setImageError] = useState('');

  // DatePicker state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // SearchBar state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);

  // Mock credit packages
  const creditPackages: CreditPackage[] = [
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
    {
      id: '3',
      name: 'Value Pack',
      credits: 100,
      price: 800,
      currency: 'KES',
      badge: 'BEST VALUE',
      discountPercentage: 20,
      bonusCredits: 15,
      isFeatured: false,
    },
    {
      id: '4',
      name: 'Premium',
      credits: 500,
      price: 3500,
      currency: 'KES',
      discountPercentage: 30,
      bonusCredits: 100,
      isFeatured: false,
    },
  ];

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // Mock search results
    if (query) {
      setSearchResults([
        `Result 1 for "${query}"`,
        `Result 2 for "${query}"`,
        `Result 3 for "${query}"`,
      ]);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-radial from-passion-50 via-luxury-50 to-trust-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-display text-5xl font-bold text-gradient-passion">
            Shared Utility Components
          </h1>
          <p className="text-neutral-600 text-lg">
            Reusable components for location, payment, images, dates, and search
          </p>
        </div>

        {/* LocationAutocomplete Demo */}
        <GlassCard variant="elevated">
          <h2 className="font-display text-3xl font-bold mb-4 text-neutral-900">
            LocationAutocomplete
          </h2>
          <p className="text-neutral-600 mb-6">
            Search for locations with Google Maps integration, geocoding, and keyboard navigation.
          </p>

          <div className="space-y-4">
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              onLocationSelect={(details) => {
                setSelectedLocation(details);
                console.log('Selected location:', details);
              }}
              label="Location"
              placeholder="Enter your location..."
              helperText="Start typing to see suggestions"
            />

            {selectedLocation && (
              <div className="glass p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Selected Location:</h3>
                <pre className="text-sm text-neutral-700">
                  {JSON.stringify(selectedLocation, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </GlassCard>

        {/* PaymentModal Demo */}
        <GlassCard variant="elevated">
          <h2 className="font-display text-3xl font-bold mb-4 text-neutral-900">
            PaymentModal
          </h2>
          <p className="text-neutral-600 mb-6">
            Purchase credits with Paystack integration, featuring package selection and secure payment.
          </p>

          <div className="space-y-4">
            <GlassButton
              variant="passion"
              size="lg"
              onClick={() => setShowPaymentModal(true)}
            >
              Open Payment Modal
            </GlassButton>

            {purchasedCredits && (
              <div className="glass p-4 rounded-lg">
                <p className="text-neutral-700">
                  ✅ Successfully purchased <strong>{purchasedCredits} credits</strong>!
                </p>
              </div>
            )}
          </div>

          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            packages={creditPackages}
            onPurchaseComplete={(credits) => {
              setPurchasedCredits(credits);
              console.log('Purchased credits:', credits);
            }}
            onPurchaseError={(error) => {
              console.error('Payment error:', error);
            }}
          />
        </GlassCard>

        {/* ImageUpload Demo */}
        <GlassCard variant="elevated">
          <h2 className="font-display text-3xl font-bold mb-4 text-neutral-900">
            ImageUpload
          </h2>
          <p className="text-neutral-600 mb-6">
            Upload images with validation, preview, and drag-and-drop support.
          </p>

          <div className="space-y-6">
            {/* Single Image Upload */}
            <div>
              <h3 className="font-semibold mb-3 text-neutral-800">Single Image Upload</h3>
              <ImageUpload
                onChange={(file) => {
                  setSingleImage(file as File);
                  setImageError('');
                  console.log('Single image:', file);
                }}
                onError={(error) => {
                  setImageError(error);
                  console.error('Image error:', error);
                }}
                label="Profile Picture"
                helperText="Upload a profile picture (max 5MB)"
                error={imageError}
                maxSizeMB={5}
                minWidth={400}
                minHeight={400}
                preview
              />
            </div>

            {/* Multiple Images Upload */}
            <div>
              <h3 className="font-semibold mb-3 text-neutral-800">Multiple Images Upload</h3>
              <ImageUpload
                onChange={(files) => {
                  setMultipleImages(files as File[]);
                  console.log('Multiple images:', files);
                }}
                label="Gallery Images"
                helperText="Upload up to 10 images (min 800x800px)"
                multiple
                maxFiles={10}
                maxSizeMB={5}
                minWidth={800}
                minHeight={800}
                preview
              />
            </div>
          </div>
        </GlassCard>

        {/* DatePicker Demo */}
        <GlassCard variant="elevated">
          <h2 className="font-display text-3xl font-bold mb-4 text-neutral-900">
            DatePicker
          </h2>
          <p className="text-neutral-600 mb-6">
            Select dates with calendar view, keyboard navigation, and date constraints.
          </p>

          <div className="space-y-4">
            <DatePicker
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                console.log('Selected date:', date);
              }}
              label="Birth Date"
              placeholder="Select your birth date"
              helperText="You must be 18 or older"
              minDate={new Date('1900-01-01')}
              maxDate={new Date()}
            />

            {selectedDate && (
              <div className="glass p-4 rounded-lg">
                <p className="text-neutral-700">
                  Selected: <strong>{selectedDate.toLocaleDateString()}</strong>
                </p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* SearchBar Demo */}
        <GlassCard variant="elevated">
          <h2 className="font-display text-3xl font-bold mb-4 text-neutral-900">
            SearchBar
          </h2>
          <p className="text-neutral-600 mb-6">
            Search with debouncing, clear button, and keyboard shortcuts (Escape to clear).
          </p>

          <div className="space-y-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search profiles..."
              label="Search"
              helperText="Search is debounced by 500ms"
              debounceMs={500}
              showClearButton
            />

            {searchResults.length > 0 && (
              <div className="glass p-4 rounded-lg space-y-2">
                <h3 className="font-semibold mb-2">Search Results:</h3>
                {searchResults.map((result, index) => (
                  <div key={index} className="text-neutral-700">
                    • {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Component Info */}
        <GlassCard variant="subtle">
          <h2 className="font-display text-2xl font-bold mb-4 text-neutral-900">
            Component Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
            <div>
              <h3 className="font-semibold mb-2">LocationAutocomplete</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Real-time suggestions</li>
                <li>Geocoding support</li>
                <li>Keyboard navigation</li>
                <li>Debounced API calls</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">PaymentModal</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Package selection</li>
                <li>Discount badges</li>
                <li>Secure payment</li>
                <li>Loading states</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ImageUpload</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Drag and drop</li>
                <li>Multiple files</li>
                <li>Validation</li>
                <li>Preview thumbnails</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">DatePicker</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Calendar view</li>
                <li>Date constraints</li>
                <li>Keyboard navigation</li>
                <li>Today button</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">SearchBar</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Debounced search</li>
                <li>Clear button</li>
                <li>Keyboard shortcuts</li>
                <li>Loading indicator</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
