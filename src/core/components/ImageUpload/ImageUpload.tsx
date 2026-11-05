import React, { useState, useRef, useEffect, useId } from 'react';
import { UploadCloud, X, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ImageUploadProps, UploadedImage } from './types';

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  onError,
  multiple = false,
  maxFiles = 5,
  maxSizeInMB = 5,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/webp'],
  simulateProgress = true,
  simulationDurationMs = 800,
  label,
  helperText,
  error: propError,
  disabled = false,
  dropzoneText,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUrlsRef = useRef<Set<string>>(new Set());
  const inputId = useId();

  // Parse initial value to UploadedImage[]
  const parseValueToImages = (val?: string | string[] | UploadedImage | UploadedImage[]): UploadedImage[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map((item, idx) => {
        if (typeof item === 'string') {
          return {
            id: `img-${idx}-${item}`,
            name: `Image ${idx + 1}`,
            size: 0,
            type: 'image/jpeg',
            previewUrl: item,
            status: 'success',
            progress: 100,
          };
        }
        return item;
      });
    }
    if (typeof val === 'string') {
      return [
        {
          id: `img-0-${val}`,
          name: 'Image 1',
          size: 0,
          type: 'image/jpeg',
          previewUrl: val,
          status: 'success',
          progress: 100,
        },
      ];
    }
    return [val];
  };

  const [images, setImages] = useState<UploadedImage[]>(() => parseValueToImages(value));

  // Sync when controlled value changes externally
  useEffect(() => {
    if (value !== undefined) {
      setImages(parseValueToImages(value));
    }
  }, [value]);

  // Clean up ObjectURLs on unmount
  useEffect(() => {
    const urls = activeUrlsRef.current;
    return () => {
      if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
        urls.forEach((url) => {
          if (url.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(url);
            } catch {
              // Ignore
            }
          }
        });
      }
    };
  }, []);

  const reportError = (msg: string) => {
    setInternalError(msg);
    onError?.(msg);
  };

  const processFiles = (fileList: FileList | File[]) => {
    setInternalError(null);
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    if (!multiple && filesArray.length > 1) {
      reportError('Chỉ được chọn 1 hình ảnh');
      return;
    }

    if (multiple && images.length + filesArray.length > maxFiles) {
      reportError(`Chỉ được tải lên tối đa ${maxFiles} hình ảnh.`);
      return;
    }

    const validNewImages: UploadedImage[] = [];

    for (const file of filesArray) {
      // Format validation
      const formatValid =
        acceptedFormats.includes(file.type) ||
        /\.(jpe?g|png|webp)$/i.test(file.name);

      if (!formatValid) {
        reportError(`Định dạng file "${file.name}" không hợp lệ. Chỉ chấp nhận JPG, PNG hoặc WEBP.`);
        return;
      }

      // Size validation
      const maxBytes = maxSizeInMB * 1024 * 1024;
      if (file.size > maxBytes) {
        const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
        reportError(`File "${file.name}" vượt quá dung lượng tối đa ${maxSizeInMB}MB (${sizeInMb}MB).`);
        return;
      }

      let previewUrl = '';
      if (typeof URL !== 'undefined' && URL.createObjectURL) {
        try {
          previewUrl = URL.createObjectURL(file);
          activeUrlsRef.current.add(previewUrl);
        } catch {
          previewUrl = '';
        }
      }

      const imgId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const newImage: UploadedImage = {
        id: imgId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        status: simulateProgress ? 'uploading' : 'success',
        progress: simulateProgress ? 0 : 100,
      };

      // Generate base64 asynchronously
      if (typeof FileReader !== 'undefined') {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImage.base64 = reader.result as string;
          if (!newImage.previewUrl) {
            newImage.previewUrl = reader.result as string;
          }
          setImages((prev) =>
            prev.map((item) => (item.id === newImage.id ? { ...item, base64: reader.result as string } : item))
          );
        };
        reader.readAsDataURL(file);
      }

      validNewImages.push(newImage);
    }

    const nextImages = multiple ? [...images, ...validNewImages] : validNewImages;
    setImages(nextImages);
    onChange?.(nextImages);

    // Simulate upload progress
    if (simulateProgress) {
      const stepDuration = simulationDurationMs / 4;
      let currentProgress = 0;

      const interval = setInterval(() => {
        currentProgress += 25;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setImages((prev) => {
            const updated = prev.map((img) =>
              validNewImages.some((v) => v.id === img.id)
                ? { ...img, status: 'success' as const, progress: 100 }
                : img
            );
            onChange?.(updated);
            return updated;
          });
        } else {
          setImages((prev) =>
            prev.map((img) =>
              validNewImages.some((v) => v.id === img.id)
                ? { ...img, progress: currentProgress }
                : img
            )
          );
        }
      }, stepDuration);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer?.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    // reset input so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
    const removedImage = images.find((img) => img.id === id);
    if (removedImage && removedImage.previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(removedImage.previewUrl);
        activeUrlsRef.current.delete(removedImage.previewUrl);
      } catch {
        // Ignore
      }
    }

    const nextImages = images.filter((img) => img.id !== id);
    setImages(nextImages);
    if (removedImage) {
      onRemove?.(removedImage, nextImages);
    }
    onChange?.(nextImages);
  };

  const displayError = propError || internalError;
  const showDropzone = multiple ? images.length < maxFiles : images.length === 0;

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-content-main select-none">
          {label}
        </label>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        multiple={multiple}
        accept={acceptedFormats.join(',')}
        disabled={disabled}
        onChange={handleFileInputChange}
        className="sr-only"
        aria-label={label ? String(label) : 'Tải lên hình ảnh'}
      />

      {/* Dropzone Container */}
      {showDropzone && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label="Khu vực kéo thả và tải ảnh lên"
          className={cn(
            'w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-theme transition-all duration-200 cursor-pointer text-center select-none outline-none',
            isDragging
              ? 'border-primary bg-primary-subtle/30 ring-4 ring-primary/10 scale-[1.01]'
              : 'border-border-base bg-surface-subtle/20 hover:border-primary/50 hover:bg-surface-subtle/40',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
        >
          <div className="w-12 h-12 rounded-full bg-primary-subtle flex items-center justify-center text-primary mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-sm font-medium text-content-main">
            {dropzoneText || (
              <>
                <span className="text-primary font-semibold hover:underline">Nhấn để tải lên</span> hoặc kéo thả ảnh vào đây
              </>
            )}
          </p>

          <p className="text-xs text-content-muted mt-1">
            PNG, JPG, WEBP dung lượng tối đa {maxSizeInMB}MB
            {multiple && ` (tối đa ${maxFiles} ảnh)`}
          </p>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-theme border border-border-base bg-surface-card overflow-hidden aspect-square shadow-sm flex items-center justify-center"
            >
              <img
                src={img.previewUrl || img.base64}
                alt={img.name}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />

              {/* Progress Bar Overlay */}
              {img.status === 'uploading' && (
                <div className="absolute inset-x-2 bottom-2 bg-black/60 backdrop-blur-sm rounded-full p-1 z-10">
                  <div className="w-full bg-white/30 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-150 rounded-full"
                      style={{ width: `${img.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white block text-center mt-0.5 font-medium">
                    {img.progress || 0}%
                  </span>
                </div>
              )}

              {/* Delete Button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(img.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-status-danger hover:scale-110 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-status-danger cursor-pointer z-10"
                  aria-label={`Xóa ảnh ${img.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error & Helper Messages */}
      {displayError ? (
        <div role="alert" className="flex items-center gap-1.5 text-xs text-status-danger mt-1 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{displayError}</span>
        </div>
      ) : helperText ? (
        <p className="text-xs text-content-muted mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

ImageUpload.displayName = 'ImageUpload';
