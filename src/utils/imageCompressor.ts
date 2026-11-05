/**
 * HTML5 Canvas Client-Side Image Compressor Utility
 * Downscales images to <= 800px max dimension and compresses to WebP/JPEG (0.75)
 * to strictly preserve browser LocalStorage quota limits.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;      // default: 800
  maxHeight?: number;     // default: 800
  quality?: number;       // default: 0.75 (range 0.1 to 1.0)
  mimeType?: 'image/webp' | 'image/jpeg' | 'image/png'; // default: 'image/webp'
}

/**
 * Calculates byte size of a base64 Data URL string.
 */
export function estimateBase64Bytes(dataUrl: string): number {
  if (!dataUrl) return 0;
  const commaIndex = dataUrl.indexOf(',');
  const base64Str = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const padding = base64Str.endsWith('==') ? 2 : base64Str.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64Str.length * 3) / 4) - padding);
}

/**
 * Formats byte size into human readable string (e.g. "45.2 KB", "1.2 MB").
 */
export function formatByteSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Compresses an image File, Blob, or base64 data URL using HTML5 Canvas.
 * Resolves with the downscaled base64 Data URL.
 */
export async function compressImage(
  input: File | Blob | string,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.75,
    mimeType = 'image/webp',
  } = options;

  // SSR / Node environment guard
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    if (typeof input === 'string') return input;
    return 'data:image/webp;base64,mockCompressedImageSafeForSSR';
  }

  return new Promise((resolve, reject) => {
    let objectUrlToRevoke: string | null = null;
    let imageSrc = '';

    if (typeof input === 'string') {
      imageSrc = input;
    } else if (input instanceof Blob) {
      objectUrlToRevoke = URL.createObjectURL(input);
      imageSrc = objectUrlToRevoke;
    } else {
      return reject(new Error('Invalid image input: expected File, Blob, or Data URL string'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }

      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Downscale while preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to acquire 2D canvas context'));
        }

        // Enable high quality bicubic interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // For JPEG, fill background with white in case original was transparent PNG
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Attempt export with preferred mimeType
        let outputDataUrl = canvas.toDataURL(mimeType, quality);

        // If WebP was requested but browser fell back to PNG, re-export as JPEG for compact size
        if (mimeType === 'image/webp' && outputDataUrl.startsWith('data:image/png')) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          outputDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Clean up canvas GPU buffer
        canvas.width = 0;
        canvas.height = 0;

        resolve(outputDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
      reject(new Error('Failed to load image for compression'));
    };

    img.src = imageSrc;
  });
}
