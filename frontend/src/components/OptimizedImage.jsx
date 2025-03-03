import React, { useState, useEffect, useRef, memo } from "react";
import imageOptimizer from "../utils/imageOptimizer";

/**
 * OptimizedImage Component
 *
 * A performance-optimized image component that implements:
 * - Lazy loading
 * - Responsive images
 * - Placeholder images
 * - Image compression
 * - Blur-up technique
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  style,
  sizes,
  loading = "lazy",
  quality = 0.8,
  placeholderColor = "#f0f0f0",
  onLoad,
  onError,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [placeholder, setPlaceholder] = useState(null);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Generate a placeholder or use a colored background
  useEffect(() => {
    let isMounted = true;

    const generatePlaceholder = async () => {
      try {
        // Generate a low-quality placeholder
        const placeholderUrl = await imageOptimizer.generatePlaceholder(src);
        if (isMounted) {
          setPlaceholder(placeholderUrl);
        }
      } catch (err) {
        if (isMounted) {
          // Use a colored placeholder on error
          setPlaceholder(
            imageOptimizer.generateColorPlaceholder(placeholderColor)
          );
        }
      }
    };

    generatePlaceholder();

    return () => {
      isMounted = false;
    };
  }, [src, placeholderColor]);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!imgRef.current || loaded) return;

    const handleIntersection = (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        // Load the actual image when it comes into view
        const img = imgRef.current;
        if (img) {
          img.src = src;
          // Disconnect the observer once the image is loading
          if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
          }
        }
      }
    };

    // Create an observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: "200px", // Start loading when image is 200px from viewport
      threshold: 0.01,
    });

    // Start observing the image
    observerRef.current.observe(imgRef.current);

    return () => {
      // Clean up the observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [src, loaded]);

  // Handle image load event
  const handleLoad = (e) => {
    setLoaded(true);
    if (onLoad) onLoad(e);
  };

  // Handle image error event
  const handleError = (e) => {
    setError(true);
    if (onError) onError(e);
  };

  // Determine the srcSet if sizes are provided
  const srcSet = sizes ? imageOptimizer.createSrcSet(sizes) : undefined;

  // Determine the best source based on screen size
  const bestSrc = sizes ? imageOptimizer.getResponsiveImageUrl(sizes) : src;

  // Combine styles
  const combinedStyle = {
    ...style,
    // Apply blur effect to placeholder while the main image is loading
    filter: !loaded && placeholder ? "blur(10px)" : "none",
    transition: "filter 0.3s ease-out",
    // Set background to placeholder
    backgroundImage:
      placeholder && !loaded ? "url(" + placeholder + ")" : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    // Hide the image until loaded if we have a placeholder
    opacity: placeholder && !loaded ? 0 : 1,
  };

  // If there's an error, show a fallback
  if (error) {
    return (
      <div
        className={className}
        style={{
          width: width || "100%",
          height: height || "200px",
          backgroundColor: placeholderColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontSize: "14px",
          ...style,
        }}
      >
        {alt || "Image failed to load"}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      alt={alt || ""}
      width={width}
      height={height}
      className={className}
      style={combinedStyle}
      onLoad={handleLoad}
      onError={handleError}
      loading={loading}
      srcSet={srcSet}
      sizes={sizes ? "100vw" : undefined}
      // Only set src directly if not using lazy loading via IntersectionObserver
      src={loading === "lazy" ? placeholder || bestSrc : bestSrc}
      {...props}
    />
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(OptimizedImage);
