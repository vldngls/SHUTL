import { useRef, useEffect } from "react";
import { Marker } from "react-leaflet";
import { getLocationUpdateInterval } from "../utils/websocketService";

const MovingMarker = ({ position, icon, children }) => {
  const markerRef = useRef(null);
  const animationRef = useRef(null);
  const lastPosition = useRef(position);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const marker = markerRef.current;
    if (marker && position) {
      const currentPos = marker.getLatLng();

      // Only animate if we have a previous position and it's different
      if (
        currentPos &&
        (currentPos.lat !== position[0] || currentPos.lng !== position[1])
      ) {
        // Calculate distance to determine if we should animate
        const distance = Math.sqrt(
          Math.pow(currentPos.lat - position[0], 2) +
            Math.pow(currentPos.lng - position[1], 2)
        );

        // Don't animate if the distance is too large (likely a reconnection or first update)
        // or if the marker has the grayscale class (offline)
        const isOffline =
          icon &&
          icon.options &&
          icon.options.className &&
          icon.options.className.includes("grayscale");
        const isTooFar = distance > 0.01; // About 1km in coordinates

        if (isOffline || isTooFar) {
          // Just set the position without animation
          marker.setLatLng(position);
          console.log(
            `Skipping animation for ${isOffline ? "offline" : "distant"} marker`
          );
        } else {
          // Cancel any ongoing animation
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }

          // Get the update interval from websocketService or use default
          let duration = 3000;
          try {
            duration = getLocationUpdateInterval();
          } catch (error) {
            console.warn(
              "Could not get location update interval, using default"
            );
          }

          isAnimatingRef.current = true;
          const startTime = performance.now();
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
            } else {
              isAnimatingRef.current = false;
            }
          };

          animationRef.current = requestAnimationFrame(animate);
        }
      } else if (!currentPos) {
        // First position, just set it without animation
        marker.setLatLng(position);
      }

      lastPosition.current = position;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        isAnimatingRef.current = false;
      }
    };
  }, [position, icon]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
};

export default MovingMarker;
