// frontend/src/hooks/useOptimizedLocations.js
import { useMemo, useEffect, useRef } from "react";

// Smoothing factor (alpha) for EMA - lower means more smoothing
const SMOOTHING_FACTOR = 0.3;
// Maximum time to predict location (in milliseconds)
const MAX_PREDICTION_TIME = 30000; // 30 seconds
// Update interval for predictions (in milliseconds)
const PREDICTION_INTERVAL = 1000; // 1 second

// Helper function to calculate new coordinates based on speed, heading and time
const predictNewPosition = (coordinates, speed, heading, timeDelta) => {
  if (!coordinates || speed <= 0) return coordinates;

  // Convert speed from km/h to meters per second
  const speedMps = (speed * 1000) / 3600;

  // Calculate distance traveled in meters
  const distance = speedMps * (timeDelta / 1000);

  // Convert heading to radians (heading is in degrees from north clockwise)
  const headingRad = ((90 - heading) * Math.PI) / 180;

  // Earth's radius in meters
  const R = 6378137;

  // Current position in radians
  const lat1 = (coordinates[1] * Math.PI) / 180;
  const lon1 = (coordinates[0] * Math.PI) / 180;

  // Calculate new position
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(headingRad)
  );

  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(headingRad) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );

  // Convert back to degrees
  return [(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI];
};

export const useOptimizedLocations = (locations) => {
  const locationCache = useRef(new WeakMap());
  const cleanupTimeRef = useRef(null);
  const previousValuesRef = useRef({}); // Store previous smoothed values
  const predictionIntervalsRef = useRef({}); // Store prediction interval timers

  // Helper function for EMA smoothing
  const smoothValue = (
    newValue,
    previousValue,
    smoothingFactor = SMOOTHING_FACTOR
  ) => {
    if (previousValue === undefined) return newValue;
    if (newValue === 0 && previousValue > 0) return previousValue * 0.8;
    return smoothingFactor * newValue + (1 - smoothingFactor) * previousValue;
  };

  // Setup prediction updates
  useEffect(() => {
    // Cleanup function to clear all prediction intervals
    const cleanupPredictions = () => {
      Object.values(predictionIntervalsRef.current).forEach((interval) => {
        clearInterval(interval);
      });
      predictionIntervalsRef.current = {};
    };

    return cleanupPredictions;
  }, []);

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

      const now = new Date();
      const lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : now;
      const timeSinceUpdate = now - lastUpdate;

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
        lastKnownCoordinates:
          data.coordinates || prevValues.lastKnownCoordinates,
        lastUpdate: lastUpdate,
      };

      // Predict position if signal is lost (status is idle or offline)
      let predictedCoordinates = data.coordinates;
      if (
        timeSinceUpdate > 5000 &&
        timeSinceUpdate < MAX_PREDICTION_TIME &&
        prevValues.speed > 0
      ) {
        predictedCoordinates = predictNewPosition(
          prevValues.lastKnownCoordinates,
          prevValues.speed,
          prevValues.heading,
          timeSinceUpdate
        );

        // Setup or update prediction interval
        if (predictionIntervalsRef.current[id]) {
          clearInterval(predictionIntervalsRef.current[id]);
        }
        predictionIntervalsRef.current[id] = setInterval(() => {
          const newNow = new Date();
          const newTimeSinceUpdate = newNow - lastUpdate;
          if (newTimeSinceUpdate < MAX_PREDICTION_TIME) {
            const newPredictedCoordinates = predictNewPosition(
              prevValues.lastKnownCoordinates,
              prevValues.speed,
              prevValues.heading,
              newTimeSinceUpdate
            );
            if (newPredictedCoordinates) {
              acc[id] = {
                ...acc[id],
                coordinates: newPredictedCoordinates,
                isPredicted: true,
              };
            }
          } else {
            clearInterval(predictionIntervalsRef.current[id]);
            delete predictionIntervalsRef.current[id];
          }
        }, PREDICTION_INTERVAL);
      }

      // Create optimized data structure
      const optimized = {
        coordinates: predictedCoordinates || data.coordinates || null,
        lastUpdate: lastUpdate,
        status: getShuttleStatus(id, data.lastUpdate),
        streetName: data.streetName || null,
        speed: smoothedSpeed,
        heading: smoothedHeading,
        accuracy: data.metadata?.accuracy ?? data.accuracy ?? 0,
        isPredicted: Boolean(
          predictedCoordinates && predictedCoordinates !== data.coordinates
        ),
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
      previousValuesRef.current = {};
      // Clear all prediction intervals
      Object.values(predictionIntervalsRef.current).forEach((interval) => {
        clearInterval(interval);
      });
      predictionIntervalsRef.current = {};
    };

    cleanupTimeRef.current = setInterval(cleanup, 300000); // Clean every 5 minutes

    return () => {
      if (cleanupTimeRef.current) {
        clearInterval(cleanupTimeRef.current);
      }
      // Clear all prediction intervals
      Object.values(predictionIntervalsRef.current).forEach((interval) => {
        clearInterval(interval);
      });
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
