import { useRef, useEffect } from "react";
import { Marker } from "react-leaflet";

const MovingMarker = ({ position, icon, children }) => {
  const markerRef = useRef(null);
  const animationRef = useRef(null);
  const lastPosition = useRef(position);

  useEffect(() => {
    const marker = markerRef.current;
    if (marker && position) {
      const currentPos = marker.getLatLng();

      if (
        currentPos &&
        (currentPos.lat !== position[0] || currentPos.lng !== position[1])
      ) {
        // Cancel any ongoing animation
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        const startTime = performance.now();
        const duration = 3000; // Match the update interval
        const startLat = currentPos.lat;
        const startLng = currentPos.lng;
        const endLat = position[0];
        const endLng = position[1];

        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease the animation using quadratic easing
          const easeProgress =
            progress < 0.5
              ? 2 * progress * progress
              : -1 + (4 - 2 * progress) * progress;

          const newLat = startLat + (endLat - startLat) * easeProgress;
          const newLng = startLng + (endLng - startLng) * easeProgress;

          marker.setLatLng([newLat, newLng]);

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      } else if (!currentPos) {
        // First position, just set it without animation
        marker.setLatLng(position);
      }

      lastPosition.current = position;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
};

export default MovingMarker;
