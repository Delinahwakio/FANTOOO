import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { GlassButton } from '@/lib/components/ui/GlassButton';

export interface ImageUploadProps {
  value?: string | string[];
  onChange: (files: File | File[] | null) => void;
  onError?: (error: string) => void;
  label?: string;
  helperText?: string;
  error?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  disabled?: boolean;
  className?: string;
  preview?: boolean;
}

/**
 * ImageUpload Component
 * 
 * A file upload component with image validation, preview, and drag-and-drop support.
 * 
 * @param value - Current image URL(s) for preview
 * @param onChange - Callback when files are selected
 * @param onError - Callback when validation fails
 * @param label - Label text
 * @param helperText - Helper text
 * @param error - Error message
 * @param multiple - Allow multiple file selection
 * @param maxFiles - Maximum number of files (for multiple)
 * @param maxSizeMB - Maximum file size in MB
 * @param acceptedFormats - Accepted file formats (e.g., ['image/jpeg', 'image/png'])
 * @param minWidth - Minimum image width in pixels
 * @param minHeight - Minimum image height in pixels
 * @param maxWidth - Maximum image width in pixels
 * @param maxHeight - Maximum image height in pixels
 * @param disabled - Disable upload
 * @param preview - Show image preview
 * 
 * @example
 * ```tsx
 * <ImageUpload
 *   value={imageUrl}
 *   onChange={(file) => setFile(file)}
 *   label="Profile Picture"
 *   maxSizeMB={5}
 *   minWidth={400}
 *   minHeight={400}
 *   preview
 * />
 * ```
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onError,
  label,
  helperText,
  error,
  multiple = false,
  maxFiles = 10,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  disabled = false,
  className,
  preview = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate image dimensions
  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        let isValid = true;
        let errorMsg = '';

        if (minWidth && img.width < minWidth) {
          isValid = false;
          errorMsg = `Image width must be at least ${minWidth}px`;
        } else if (minHeight && img.height < minHeight) {
          isValid = false;
          errorMsg = `Image height must be at least ${minHeight}px`;
        } else if (maxWidth && img.width > maxWidth) {
          isValid = false;
          errorMsg = `Image width must not exceed ${maxWidth}px`;
        } else if (maxHeight && img.height > maxHeight) {
          isValid = false;
          errorMsg = `Image height must not exceed ${maxHeight}px`;
        }

        if (!isValid && onError) {
          onError(errorMsg);
        }

        resolve(isValid);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        if (onError) {
          onError('Failed to load image');
        }
        resolve(false);
      };

      img.src = url;
    });
  };

  // Validate file
  const validateFile = async (file: File): Promise<boolean> => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      if (onError) {
        onError(`File type not supported. Accepted: ${acceptedFormats.join(', ')}`);
      }
      return false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      if (onError) {
        onError(`File size must not exceed ${maxSizeMB}MB`);
      }
      return false;
    }

    // Check image dimensions
    if (minWidth || minHeight || maxWidth || maxHeight) {
      const isValidDimensions = await validateImageDimensions(file);
      if (!isValidDimensions) {
        return false;
      }
    }

    return true;
  };

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);

      // Check max files
      if (multiple && fileArray.length > maxFiles) {
        if (onError) {
          onError(`Maximum ${maxFiles} files allowed`);
        }
        return;
      }

      // Validate all files
      const validFiles: File[] = [];
      for (const file of fileArray) {
        const isValid = await validateFile(file);
        if (isValid) {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      // Create preview URLs
      if (preview) {
        const urls = validFiles.map((file) => URL.createObjectURL(file));
        setPreviewUrls(urls);
      }

      // Call onChange
      if (multiple) {
        onChange(validFiles);
      } else {
        onChange(validFiles[0]);
      }
    },
    [multiple, maxFiles, maxSizeMB, acceptedFormats, onChange, onError, preview]
  );

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Handle click to open file dialog
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove image
  const handleRemove = (index: number) => {
    if (multiple) {
      const newUrls = previewUrls.filter((_, i) => i !== index);
      setPreviewUrls(newUrls);
      onChange(null);
    } else {
      setPreviewUrls([]);
      onChange(null);
    }
  };

  // Get preview images
  const getPreviewImages = (): string[] => {
    if (previewUrls.length > 0) {
      return previewUrls;
    }
    if (value) {
      return Array.isArray(value) ? value : [value];
    }
    return [];
  };

  const previewImages = getPreviewImages();

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-neutral-700">{label}</label>
      )}

      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'glass rounded-xl p-8 border-2 border-dashed transition-smooth cursor-pointer',
          isDragging && 'border-passion-500 bg-passion-50/50',
          !isDragging && 'border-neutral-300 hover:border-passion-400',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-passion-500'
        )}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <svg
            className={cn(
              'w-12 h-12 transition-smooth',
              isDragging ? 'text-passion-500' : 'text-neutral-400'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div className="text-center">
            <p className="text-neutral-700 font-medium">
              {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              {acceptedFormats.map((f) => f.split('/')[1].toUpperCase()).join(', ')} up to{' '}
              {maxSizeMB}MB
            </p>
            {(minWidth || minHeight) && (
              <p className="text-xs text-neutral-500 mt-1">
                Min dimensions: {minWidth}x{minHeight}px
              </p>
            )}
          </div>

          <GlassButton variant="outline" size="sm" type="button">
            Select {multiple ? 'Files' : 'File'}
          </GlassButton>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {/* Preview */}
      {preview && previewImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previewImages.map((url, index) => (
            <div key={index} className="relative group">
              <div className="glass rounded-lg overflow-hidden aspect-square">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                className="absolute top-2 right-2 bg-passion-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-smooth hover:bg-passion-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text / Error */}
      {(helperText || error) && (
        <p className={cn('text-sm', error ? 'text-passion-600' : 'text-neutral-500')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};
