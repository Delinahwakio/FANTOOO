import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export interface ProfileCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

/**
 * ProfileCarousel Component
 * 
 * An image carousel for displaying multiple profile pictures.
 * Features navigation arrows, dot indicators, and swipe support.
 * 
 * @param images - Array of image URLs
 * @param alt - Alt text for images
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ProfileCarousel
 *   images={profile.profile_pictures}
 *   alt={profile.name}
 * />
 * ```
 */
export const ProfileCarousel: React.FC<ProfileCarouselProps> = ({
  images,
  alt,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className={cn('relative w-full aspect-[3/4] bg-neutral-200 rounded-xl', className)}>
        <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
          No images available
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full aspect-[3/4] group', className)}>
      {/* Main Image */}
      <div
        className="relative w-full h-full rounded-xl overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={currentIndex === 0}
        />
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-10',
              'glass-dark p-2 rounded-full',
              'opacity-0 group-hover:opacity-100 transition-smooth',
              'hover:scale-110 focus-ring'
            )}
            aria-label="Previous image"
          >
            <svg
              className="w-6 h-6 text-white"
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
          </button>

          <button
            onClick={goToNext}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-10',
              'glass-dark p-2 rounded-full',
              'opacity-0 group-hover:opacity-100 transition-smooth',
              'hover:scale-110 focus-ring'
            )}
            aria-label="Next image"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-smooth',
                'hover:scale-125 focus-ring',
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/75'
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 z-10 glass-dark px-3 py-1 rounded-full">
          <span className="text-white text-sm font-semibold">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
};
