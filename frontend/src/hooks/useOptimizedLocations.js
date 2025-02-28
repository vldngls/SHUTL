// frontend/src/hooks/useOptimizedLocations.js
import { useMemo, useEffect, useRef } from "react";

// Smoothing factor (alpha) for EMA - lower means more smoothing
const SMOOTHING_FACTOR = 0.3;

export const useOptimizedLocations = (locations) => {
  const locationCache = useRef(new WeakMap());
  const cleanupTimeRef = useRef(null);
  const previousValuesRef = useRef({}); // Store previous smoothed values

  // Helper function for EMA smoothing
  const smoothValue = (
    newValue,
    previousValue,
    smoothingFactor = SMOOTHING_FACTOR
  ) => {
    if (previousValue === undefined) return newValue;
    if (newValue === 0 && previousValue > 0) return previousValue * 0.8; // Gradual decrease instead of jump to 0
    return smoothingFactor * newValue + (1 - smoothingFactor) * previousValue;
  };

  // Memoize and optimize locations data
  const optimizedLocations = useMemo(() => {
    if (!locations) return {};

    return Object.entries(locations).reduce((acc, [id, data]) => {
      if (!data) return acc;

      // Check cache first
      if (locationCache.current.has(data)) {
        acc[id] = locationCache.current.get(data);
        return acc;
      }

      // Get previous values for this shuttle
      const prevValues = previousValuesRef.current[id] || {};

      // Get raw values
      const rawSpeed = data.metadata?.speed ?? data.speed ?? 0;
      const rawHeading = data.metadata?.heading ?? data.heading ?? 0;

      // Apply smoothing
      const smoothedSpeed = smoothValue(rawSpeed, prevValues.speed);
      const smoothedHeading = smoothValue(rawHeading, prevValues.heading);

      // Store new smoothed values
      previousValuesRef.current[id] = {
        speed: smoothedSpeed,
        heading: smoothedHeading,
      };

      // Create optimized data structure
      const optimized = {
        coordinates: data.coordinates || null,
        lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null,
        status: getShuttleStatus(id, data.lastUpdate),
        streetName: data.streetName || null,
        speed: smoothedSpeed,
        heading: smoothedHeading,
        accuracy: data.metadata?.accuracy ?? data.accuracy ?? 0,
      };

      // Only cache valid data
      if (optimized.coordinates) {
        locationCache.current.set(data, optimized);
      }
      acc[id] = optimized;
      return acc;
    }, {});
  }, [locations]);

  // Cleanup stale data periodically
  useEffect(() => {
    const cleanup = () => {
      locationCache.current = new WeakMap();
      previousValuesRef.current = {}; // Also clean up previous values
    };

    cleanupTimeRef.current = setInterval(cleanup, 300000); // Clean every 5 minutes

    return () => {
      if (cleanupTimeRef.current) {
        clearInterval(cleanupTimeRef.current);
      }
    };
  }, []);

  return optimizedLocations;
};

// Helper function to determine shuttle status
const getShuttleStatus = (shuttleId, lastUpdate) => {
  if (!lastUpdate) return "offline";

  try {
    const now = new Date();
    const lastUpdateTime = new Date(lastUpdate);
    const timeDiff = now - lastUpdateTime;

    if (timeDiff < 30 * 1000) {
      return "active";
    } else if (timeDiff < 5 * 60 * 1000) {
      return "idle";
    }
  } catch (error) {
    console.error(`Error calculating status for shuttle ${shuttleId}:`, error);
  }

  return "offline";
};
