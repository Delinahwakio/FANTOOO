import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export type MediaType = 'image' | 'video';

export interface MediaUploadProps {
  onUpload: (file: File, type: MediaType) => void | Promise<void>;
  acceptedTypes?: MediaType[];
  maxSizeInMB?: number;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  showPreview?: boolean;
}

/**
 * MediaUpload Component
 * 
 * A component for uploading images and videos with validation.
 * Supports drag-and-drop and file selection.
 * 
 * @param onUpload - Callback when file is selected
 * @param acceptedTypes - Array of accepted media types (default: ['image', 'video'])
 * @param maxSizeInMB - Maximum file size in MB (default: 10)
 * @param disabled - Disable upload
 * @param className - Additional CSS classes for container
 * @param buttonClassName - Additional CSS classes for button
 * @param showPreview - Show preview after selection (default: false)
 * 
 * @example
 * ```tsx
 * <MediaUpload
 *   onUpload={handleMediaUpload}
 *   acceptedTypes={['image']}
 *   maxSizeInMB={5}
 * />
 * ```
 */
export const MediaUpload = React.forwardRef<HTMLDivElement, MediaUploadProps>(
  (
    {
      onUpload,
      acceptedTypes = ['image', 'video'],
      maxSizeInMB = 10,
      disabled = false,
      className,
      buttonClassName,
      showPreview = false,
    },
    ref
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<MediaType | null>(null);

    // Build accept string for input
    const acceptString = acceptedTypes
      .map((type) => {
        if (type === 'image') return 'image/*';
        if (type === 'video') return 'video/*';
        return '';
      })
      .filter(Boolean)
      .join(',');

    const validateFile = (file: File): { valid: boolean; error?: string; type?: MediaType } => {
      // Check file type
      let mediaType: MediaType | null = null;
      if (file.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
      }

      if (!mediaType || !acceptedTypes.includes(mediaType)) {
        return {
          valid: false,
          error: `Please select a valid ${acceptedTypes.join(' or ')} file`,
        };
      }

      // Check file size
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > maxSizeInMB) {
        return {
          valid: false,
          error: `File size must be less than ${maxSizeInMB}MB`,
        };
      }

      return { valid: true, type: mediaType };
    };

    const handleFileSelect = async (file: File) => {
      setError(null);
      setPreview(null);
      setPreviewType(null);

      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      try {
        setIsUploading(true);

        // Show preview if enabled
        if (showPreview && validation.type) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreview(e.target?.result as string);
            setPreviewType(validation.type!);
          };
          reader.readAsDataURL(file);
        }

        await onUpload(file, validation.type!);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    };

    const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

    const clearPreview = () => {
      setPreview(null);
      setPreviewType(null);
      setError(null);
    };

    return (
      <div ref={ref} className={cn('relative', className)}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptString}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
          aria-label="Upload media"
        />

        {/* Upload Button */}
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled || isUploading}
          className={cn(
            'p-2 rounded-lg transition-smooth',
            'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900',
            'focus-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            buttonClassName
          )}
          aria-label="Upload media"
        >
          {isUploading ? (
            <svg
              className="w-5 h-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="absolute bottom-full mb-2 left-0 right-0 glass-elevated p-2 rounded-lg shadow-lg animate-slide-in-down">
            <div className="flex items-center gap-2 text-sm text-passion-600">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Preview */}
        {showPreview && preview && previewType && (
          <div className="absolute bottom-full mb-2 left-0 glass-elevated p-2 rounded-lg shadow-lg animate-scale-in">
            <div className="relative">
              {previewType === 'image' && (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
              {previewType === 'video' && (
                <video
                  src={preview}
                  className="w-32 h-32 object-cover rounded-lg"
                  controls
                />
              )}
              <button
                type="button"
                onClick={clearPreview}
                className="absolute -top-2 -right-2 p-1 bg-passion-500 text-white rounded-full hover:bg-passion-600 transition-smooth"
                aria-label="Clear preview"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MediaUpload.displayName = 'MediaUpload';
