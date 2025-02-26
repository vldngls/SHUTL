// frontend/src/hooks/useOptimizedLocations.js
import { useMemo, useEffect, useRef } from "react";

export const useOptimizedLocations = (locations) => {
  const locationCache = useRef(new WeakMap());
  const cleanupTimeRef = useRef(null);

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

      // Create optimized data structure
      const optimized = {
        coordinates: data.coordinates || null,
        lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null,
        status: getShuttleStatus(id, data.lastUpdate),
        streetName: data.streetName || null,
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
