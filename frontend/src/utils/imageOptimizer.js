/**
 * Image Optimization Utility
 *
 * This utility provides tools for optimizing images in the application,
 * including lazy loading, responsive images, and image compression.
 */

// Configuration
const DEFAULT_QUALITY = 0.8; // 80% quality for compressed images
const DEFAULT_MAX_WIDTH = 1200; // Maximum width for resized images
const DEFAULT_PLACEHOLDER_COLOR = "#f0f0f0"; // Light gray placeholder

// Cache for optimized images
const imageCache = new Map();

/**
 * Compress an image to reduce file size
 * @param {File|Blob|string} image - Image file, blob, or URL
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} Compressed image blob
 */
export const compressImage = async (image, options = {}) => {
  const {
    quality = DEFAULT_QUALITY,
    maxWidth = DEFAULT_MAX_WIDTH,
    format = "webp", // Prefer WebP for better compression
  } = options;

  // Check if we have a cached version
  const cacheKey =
    typeof image === "string"
      ? image
      : image instanceof File
      ? image.name
      : URL.createObjectURL(image);

  const cacheKeyWithOptions = `${cacheKey}_${quality}_${maxWidth}_${format}`;

  if (imageCache.has(cacheKeyWithOptions)) {
    return imageCache.get(cacheKeyWithOptions);
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Create an image element
      const img = new Image();

      // Handle loading the image
      img.onload = () => {
        // Create a canvas element
        const canvas = document.createElement("canvas");

        // Calculate dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw the image on the canvas
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to the desired format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // Cache the result
            imageCache.set(cacheKeyWithOptions, blob);

            // Clean up
            URL.revokeObjectURL(img.src);

            resolve(blob);
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      // Set the source of the image
      if (typeof image === "string") {
        img.src = image;
      } else if (image instanceof File || image instanceof Blob) {
        img.src = URL.createObjectURL(image);
      } else {
        reject(new Error("Invalid image format"));
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate a low-quality placeholder for an image
 * @param {string} src - Image URL
 * @returns {Promise<string>} Data URL for the placeholder
 */
export const generatePlaceholder = async (src) => {
  // Check if we have a cached version
  const cacheKey = `placeholder_${src}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Create a tiny thumbnail
      const canvas = document.createElement("canvas");
      canvas.width = 20; // Very small dimensions
      canvas.height = Math.floor(20 * (img.height / img.width));

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to data URL with very low quality
      const dataUrl = canvas.toDataURL("image/jpeg", 0.1);

      // Cache the result
      imageCache.set(cacheKey, dataUrl);

      // Clean up
      URL.revokeObjectURL(img.src);

      resolve(dataUrl);
    };

    img.onerror = () => {
      // Return a colored placeholder on error
      resolve(generateColorPlaceholder());
    };

    img.src = src;
  });
};

/**
 * Generate a colored placeholder
 * @param {string} color - Placeholder color
 * @returns {string} Data URL for the colored placeholder
 */
export const generateColorPlaceholder = (color = DEFAULT_PLACEHOLDER_COLOR) => {
  // Create a 1x1 pixel canvas with the specified color
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);

  return canvas.toDataURL();
};

/**
 * Get appropriate image size based on screen width
 * @param {Object} sizes - Available image sizes
 * @returns {string} Best image URL for current screen
 */
export const getResponsiveImageUrl = (sizes) => {
  const screenWidth = window.innerWidth;

  if (screenWidth <= 480 && sizes.small) {
    return sizes.small;
  } else if (screenWidth <= 768 && sizes.medium) {
    return sizes.medium;
  } else if (screenWidth <= 1200 && sizes.large) {
    return sizes.large;
  } else {
    return sizes.original || sizes.large || sizes.medium || sizes.small;
  }
};

/**
 * Create a srcset string for responsive images
 * @param {Object} sizes - Available image sizes with width info
 * @returns {string} srcset attribute string
 */
export const createSrcSet = (sizes) => {
  return Object.entries(sizes)
    .map(([key, { url, width }]) => `${url} ${width}w`)
    .join(", ");
};

/**
 * Clean up resources used by the image optimizer
 */
export const cleanupImageOptimizer = () => {
  // Revoke any object URLs in the cache
  for (const [key, value] of imageCache.entries()) {
    if (typeof value === "string" && value.startsWith("blob:")) {
      URL.revokeObjectURL(value);
    }
  }

  // Clear the cache
  imageCache.clear();
};

// Export a default object for easier imports
export default {
  compressImage,
  generatePlaceholder,
  generateColorPlaceholder,
  getResponsiveImageUrl,
  createSrcSet,
  cleanupImageOptimizer,
};
