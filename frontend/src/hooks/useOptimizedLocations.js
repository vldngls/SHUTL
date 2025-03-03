// frontend/src/hooks/useOptimizedLocations.js
import { useMemo, useEffect, useRef, useState } from "react";

// Smoothing factor (alpha) for EMA - lower means more smoothing
const SMOOTHING_FACTOR = 0.3;
// Maximum time to predict location (in milliseconds)
const MAX_PREDICTION_TIME = 30000; // Reduced from 60000 to 30 seconds
// Update interval for predictions (in milliseconds)
const PREDICTION_INTERVAL = 1000; // 1 second

// Helper function to calculate new coordinates based on speed, heading and time
const predictNewPosition = (coordinates, speed, heading, timeDelta) => {
  if (!coordinates || !Array.isArray(coordinates) || speed <= 0) return null;

  // Convert speed from km/h to meters per second
  const speedMps = (speed * 1000) / 3600;

  // Calculate distance traveled in meters
  const distance = speedMps * (timeDelta / 1000);

  // Convert heading to radians (heading is in degrees clockwise from north)
  const headingRad = ((90 - heading) * Math.PI) / 180;

  // Current position
  const lat = coordinates[0];
  const lon = coordinates[1];

  // Earth's radius in meters
  const R = 6378137;

  // Calculate new position using haversine formula
  const dLat = (distance * Math.cos(headingRad)) / R;
  const dLon = (distance * Math.sin(headingRad)) / (R * Math.cos(lat * Math.PI / 180));

  // Convert back to degrees
  const newLat = lat + (dLat * 180 / Math.PI);
  const newLon = lon + (dLon * 180 / Math.PI);

  return [
    Number(newLat.toFixed(6)),
    Number(newLon.toFixed(6))
  ];
};

export const useOptimizedLocations = (locations) => {
  // Use useState instead of refs for values that should trigger re-renders
  const [optimizedLocations, setOptimizedLocations] = useState({});
  
  // Use refs for values that shouldn't trigger re-renders
  const previousValuesRef = useRef({});
  const predictionIntervalsRef = useRef({});
  const isProcessingRef = useRef(false);
  const mainIntervalRef = useRef(null);

  // Helper function for EMA smoothing
  const smoothValue = (newValue, previousValue, smoothingFactor = SMOOTHING_FACTOR) => {
    if (previousValue === undefined) return newValue;
    if (newValue === 0 && previousValue > 0) return previousValue * 0.8;
    return smoothingFactor * newValue + (1 - smoothingFactor) * previousValue;
  };

  // Process locations and update optimized state
  const processLocations = () => {
    if (isProcessingRef.current || !locations) return;
    
    isProcessingRef.current = true;
    
    try {
      const now = new Date();
      const updatedLocations = {};
      let hasChanges = false;
      
      Object.entries(locations).forEach(([id, data]) => {
        if (!data || !data.coordinates) return;
  
        const lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : now;
        const timeSinceUpdate = now - lastUpdate;
  
        // Get previous values for this shuttle
        const prevValues = previousValuesRef.current[id] || {};
  
        // Get raw values
        const rawSpeed = data.speed ?? 0;
        const rawHeading = data.heading ?? 0;
  
        // Apply smoothing
        const smoothedSpeed = smoothValue(rawSpeed, prevValues.speed);
        const smoothedHeading = smoothValue(rawHeading, prevValues.heading);
  
        // Store new smoothed values
        previousValuesRef.current[id] = {
          speed: smoothedSpeed,
          heading: smoothedHeading,
          lastKnownCoordinates: data.coordinates,
          lastUpdate: lastUpdate
        };
  
        let predictedCoordinates = data.coordinates;
        let isPredicted = false;
  
        // Start prediction after 5 seconds of no updates
        if (timeSinceUpdate > 5000 && timeSinceUpdate < MAX_PREDICTION_TIME && smoothedSpeed > 0) {
          predictedCoordinates = predictNewPosition(
            data.coordinates,
            smoothedSpeed,
            smoothedHeading,
            timeSinceUpdate
          );
          isPredicted = true;
        }
  
        // Create optimized data structure
        updatedLocations[id] = {
          coordinates: predictedCoordinates || data.coordinates,
          lastUpdate: lastUpdate,
          speed: smoothedSpeed,
          heading: smoothedHeading,
          isPredicted: isPredicted,
          status: timeSinceUpdate < 30000 ? 'active' : timeSinceUpdate < MAX_PREDICTION_TIME ? 'predicted' : 'offline'
        };
        
        // Check if this location has changed from previous optimized location
        const prevOptimized = optimizedLocations[id];
        if (!prevOptimized || 
            !prevOptimized.coordinates || 
            prevOptimized.coordinates[0] !== updatedLocations[id].coordinates[0] ||
            prevOptimized.coordinates[1] !== updatedLocations[id].coordinates[1] ||
            prevOptimized.speed !== updatedLocations[id].speed ||
            prevOptimized.heading !== updatedLocations[id].heading ||
            prevOptimized.isPredicted !== updatedLocations[id].isPredicted) {
          hasChanges = true;
        }
      });
      
      // Only update state if there are actual changes
      if (hasChanges) {
        setOptimizedLocations(updatedLocations);
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

  // Setup prediction updates
  useEffect(() => {
    // Process locations immediately
    processLocations();
    
    // Setup interval for continuous updates
    mainIntervalRef.current = setInterval(processLocations, PREDICTION_INTERVAL);
    
    // Cleanup function
    return () => {
      if (mainIntervalRef.current) {
        clearInterval(mainIntervalRef.current);
        mainIntervalRef.current = null;
      }
      
      // Clear all prediction intervals
      Object.values(predictionIntervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
      predictionIntervalsRef.current = {};
      
      // Clear references
      previousValuesRef.current = {};
    };
  }, [locations]);

  // Cleanup stale data periodically
  useEffect(() => {
    const cleanupStaleData = () => {
      const now = new Date();
      const updatedPrevValues = { ...previousValuesRef.current };
      let hasRemovals = false;
      
      // Remove entries older than MAX_PREDICTION_TIME
      Object.entries(updatedPrevValues).forEach(([id, data]) => {
        if (data.lastUpdate && (now - data.lastUpdate > MAX_PREDICTION_TIME)) {
          delete updatedPrevValues[id];
          hasRemovals = true;
          
          // Also clear any prediction intervals
          if (predictionIntervalsRef.current[id]) {
            clearInterval(predictionIntervalsRef.current[id]);
            delete predictionIntervalsRef.current[id];
          }
        }
      });
      
      if (hasRemovals) {
        previousValuesRef.current = updatedPrevValues;
        
        // Update optimized locations to remove stale entries
        setOptimizedLocations(prev => {
          const updated = { ...prev };
          Object.keys(prev).forEach(id => {
            if (!updatedPrevValues[id]) {
              delete updated[id];
            }
          });
          return updated;
        });
      }
    };
    
    // Run cleanup every minute
    const cleanupInterval = setInterval(cleanupStaleData, 60000);
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  return optimizedLocations;
};
