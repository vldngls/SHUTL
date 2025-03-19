// frontend/src/hooks/useOptimizedLocations.js
import { useEffect, useState } from "react";
import { calculateDistance, isWithinTerminalGeofence } from "../utils/locationUtils";

/**
 * Custom hook for optimizing shuttle location updates to prevent excessive re-renders.
 * This provides stable references to location objects.
 * 
 * @param {Object} rawLocations - Raw shuttle location data
 * @returns {Object} - Optimized location data with stable references
 */
export const useOptimizedLocations = (rawLocations = {}) => {
  const [optimizedLocations, setOptimizedLocations] = useState({});

  useEffect(() => {
    // Only update if we have actual data to work with
    if (!rawLocations || Object.keys(rawLocations).length === 0) {
      setOptimizedLocations({});
      return;
    }

    // Update the optimized locations by comparing with previous state
    setOptimizedLocations((prevOptimized) => {
      const nextOptimized = {};
      let hasChanges = false;

      // Process each shuttle location
      for (const [shuttleId, currentData] of Object.entries(rawLocations)) {
        const prevData = prevOptimized[shuttleId];

        // Skip if there's no actual data
        if (!currentData || !currentData.coordinates) continue;

        // Determine if we need to update this shuttle's data
        const needsUpdate = !prevData || 
          // Location changed
          prevData.coordinates[0] !== currentData.coordinates[0] ||
          prevData.coordinates[1] !== currentData.coordinates[1] ||
          // Status changed
          prevData.status !== currentData.status ||
          // Speed changed by more than 0.5 km/h
          Math.abs((prevData.speed || 0) - (currentData.speed || 0)) > 0.5 ||
          // Moving state changed
          prevData.isMoving !== currentData.isMoving ||
          // Offline state changed
          prevData.isExplicitlyOffline !== currentData.isExplicitlyOffline;

        if (needsUpdate) {
          hasChanges = true;
          nextOptimized[shuttleId] = {
            ...currentData,
            // Ensure lastUpdate is a Date object for consistency
            lastUpdate: currentData.lastUpdate instanceof Date 
              ? currentData.lastUpdate 
              : new Date(currentData.lastUpdate || Date.now())
          };
        } else {
          // Reuse the previous reference for stability
          nextOptimized[shuttleId] = prevData;
        }
      }

      // Check for removed shuttles
      for (const shuttleId of Object.keys(prevOptimized)) {
        if (!rawLocations[shuttleId]) {
          hasChanges = true;
        }
      }

      // Only return a new object reference if there were changes
      return hasChanges ? nextOptimized : prevOptimized;
    });
  }, [rawLocations]);

  return optimizedLocations;
};
