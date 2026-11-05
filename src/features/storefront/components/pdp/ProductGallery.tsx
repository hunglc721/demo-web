import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ProductGalleryProps {
  images: string[];
  selectedVariantImage?: string;
  productName: string;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80';

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images: initialImages,
  selectedVariantImage,
  productName,
}) => {
  // Ensure we always have at least one valid image
  const galleryImages = useMemo(() => {
    const baseImages = initialImages && initialImages.length > 0 ? initialImages : [FALLBACK_IMAGE];
    if (selectedVariantImage && !baseImages.includes(selectedVariantImage)) {
      return [...baseImages, selectedVariantImage];
    }
    return baseImages;
  }, [initialImages, selectedVariantImage]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Sync with selected variant image
  useEffect(() => {
    if (selectedVariantImage) {
      const idx = galleryImages.indexOf(selectedVariantImage);
      if (idx !== -1) {
        setActiveIndex(idx);
      }
    }
  }, [selectedVariantImage, galleryImages]);

  const currentImage = imgErrors[activeIndex]
    ? FALLBACK_IMAGE
    : galleryImages[activeIndex] || FALLBACK_IMAGE;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomCoords({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % galleryImages.length);
  };

  return (
    <div className="space-y-4 select-none">
      {/* 1. Main Display with Hover Zoom */}
      <div
        ref={imageContainerRef}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setLightboxOpen(true)}
        className="relative aspect-square w-full rounded-2xl overflow-hidden bg-surface-subtle border border-border-base cursor-zoom-in group shadow-sm"
      >
        <img
          src={currentImage}
          alt={productName}
          onError={() => setImgErrors((prev) => ({ ...prev, [activeIndex]: true }))}
          className={cn(
            'w-full h-full object-cover object-center transition-transform duration-200',
            isZooming ? 'scale-150 origin-center' : 'scale-100'
          )}
          style={
            isZooming
              ? {
                  transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                }
              : undefined
          }
        />

        {/* Lightbox Trigger Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(true);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-surface-card/85 backdrop-blur-md border border-border-base text-content-main hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          title="Xem phóng to ảnh"
          aria-label="Phóng to ảnh"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Arrows for multi-images */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-surface-card/85 backdrop-blur-md border border-border-base text-content-main hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-surface-card/85 backdrop-blur-md border border-border-base text-content-main hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              aria-label="Ảnh tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* 2. Thumbnail Strip */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'relative w-16 h-16 sm:w-20 sm:h-20 rounded-theme overflow-hidden border-2 transition-all flex-shrink-0 bg-surface-subtle',
                activeIndex === idx
                  ? 'border-primary ring-2 ring-primary/30 shadow'
                  : 'border-border-base hover:border-primary/50 opacity-70 hover:opacity-100'
              )}
            >
              <img
                src={imgErrors[idx] ? FALLBACK_IMAGE : img}
                alt={`${productName} thumbnail ${idx + 1}`}
                onError={() => setImgErrors((prev) => ({ ...prev, [idx]: true }))}
                className="w-full h-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}

      {/* 3. Lightbox Modal Dialog */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-rose-400 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-7 h-7" />
            </button>

            {/* Large Image */}
            <img
              src={currentImage}
              alt={productName}
              className="max-h-[80vh] w-auto max-w-full rounded-theme object-contain shadow-2xl"
            />

            {/* Thumbnail switcher in lightbox */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-full py-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      'w-12 h-12 rounded overflow-hidden border-2 transition-all flex-shrink-0',
                      activeIndex === idx
                        ? 'border-primary scale-110 shadow-lg'
                        : 'border-white/20 opacity-50 hover:opacity-100'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductGallery;
