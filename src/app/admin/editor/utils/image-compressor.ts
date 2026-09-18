// src/app/admin/editor/utils/image-compressor.ts
import imageCompression from 'browser-image-compression';

interface CompressOptions {
  maxWidth: number;
  quality: number;
  /** Size budget in MB. Defaults to 0.1 (~100KB) when omitted. */
  maxSizeMB?: number;
}

/**
 * Compresses an image file in the browser before uploading.
 * Skips compression for GIF files.
 * @param file The original image file.
 * @param options The compression options (maxWidth and quality).
 * @returns The compressed image as a File object (or the original if it's a GIF).
 */
export async function compressImage(file: File, options: CompressOptions): Promise<File> {
  // --- MODIFICATION ---
  // If it's a GIF, skip compression and return the original file
  if (file.type === 'image/gif') {
    console.log('Skipping compression for GIF file.');
    return file;
  }
  // --- END MODIFICATION ---

  // Target size in MB (default 100KB = 0.1MB; callers with fine
  // detail such as banner text can pass a higher budget).
  const targetSizeMB = options.maxSizeMB ?? 0.1;
  
  const compressionOptions = {
    maxSizeMB: targetSizeMB,
    maxWidthOrHeight: options.maxWidth,
    useWebWorker: true,
    initialQuality: options.quality,
    fileType: 'image/webp', // This will now only apply to non-GIFs
    maxIteration: 10, 
    alwaysKeepResolution: false,
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    
    // Additional check: if still too large, apply more aggressive compression
    if (compressedFile.size > targetSizeMB * 1024 * 1024) {
      console.warn('Image still larger than target, applying aggressive compression');
      
      const aggressiveOptions = {
        maxSizeMB: targetSizeMB,
        maxWidthOrHeight: Math.min(options.maxWidth, 1200),
        useWebWorker: true,
        initialQuality: Math.min(options.quality, 0.7),
        fileType: 'image/webp',
        maxIteration: 15,
      };
      
      const aggressivelyCompressed = await imageCompression(file, aggressiveOptions);
      console.log(`Aggressive compression: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(aggressivelyCompressed.size / 1024 / 1024).toFixed(2)}MB`);
      return aggressivelyCompressed;
    }
    
    console.log(`Compressed image from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // If compression fails, try a simpler approach as fallback
    return await fallbackCompression(file, options);
  }
}

// Fallback method using canvas if browser-image-compression fails
async function fallbackCompression(file: File, options: CompressOptions): Promise<File> {
  // This fallback will also not be called for GIFs due to the check above
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let { width, height } = img;
      if (width > options.maxWidth) {
        height = (height * options.maxWidth) / width;
        width = options.maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file); 
            }
          },
          'image/webp',
          options.quality
        );
      } else {
        resolve(file);
      }
    };
    
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}