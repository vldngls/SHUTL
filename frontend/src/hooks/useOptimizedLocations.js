// frontend/src/hooks/useOptimizedLocations.js
import { useMemo, useEffect, useRef } from "react";

// Smoothing factor (alpha) for EMA - lower means more smoothing
const SMOOTHING_FACTOR = 0.3;
// Maximum time to predict location (in milliseconds)
const MAX_PREDICTION_TIME = 60000; // 1 minute
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
  const locationCache = useRef(new WeakMap());
  const cleanupTimeRef = useRef(null);
  const previousValuesRef = useRef({});
  const predictionIntervalsRef = useRef({});

  // Helper function for EMA smoothing
  const smoothValue = (newValue, previousValue, smoothingFactor = SMOOTHING_FACTOR) => {
    if (previousValue === undefined) return newValue;
    if (newValue === 0 && previousValue > 0) return previousValue * 0.8;
    return smoothingFactor * newValue + (1 - smoothingFactor) * previousValue;
  };

  // Setup prediction updates
  useEffect(() => {
    // Cleanup function to clear all prediction intervals
    const cleanupPredictions = () => {
      Object.values(predictionIntervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
      predictionIntervalsRef.current = {};
    };

    return cleanupPredictions;
  }, []);

  // Memoize and optimize locations data
  const optimizedLocations = useMemo(() => {
    if (!locations) return {};

    const now = new Date();
    return Object.entries(locations).reduce((acc, [id, data]) => {
      if (!data || !data.coordinates) return acc;

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

        // Setup continuous prediction updates
        if (!predictionIntervalsRef.current[id]) {
          predictionIntervalsRef.current[id] = setInterval(() => {
            const currentTime = new Date();
            const currentTimeSinceUpdate = currentTime - lastUpdate;

            if (currentTimeSinceUpdate < MAX_PREDICTION_TIME) {
              const newPredictedCoordinates = predictNewPosition(
                data.coordinates,
                smoothedSpeed,
                smoothedHeading,
                currentTimeSinceUpdate
              );

              if (newPredictedCoordinates) {
                acc[id] = {
                  ...acc[id],
                  coordinates: newPredictedCoordinates,
                  isPredicted: true
                };
              }
            } else {
              // Clear interval if we've reached max prediction time
              clearInterval(predictionIntervalsRef.current[id]);
              delete predictionIntervalsRef.current[id];
            }
          }, PREDICTION_INTERVAL);
        }
      }

      // Create optimized data structure
      acc[id] = {
        coordinates: predictedCoordinates || data.coordinates,
        lastUpdate: lastUpdate,
        speed: smoothedSpeed,
        heading: smoothedHeading,
        isPredicted: isPredicted,
        status: timeSinceUpdate < 30000 ? 'active' : timeSinceUpdate < MAX_PREDICTION_TIME ? 'predicted' : 'offline'
      };

      return acc;
    }, {});
  }, [locations]);

  // Cleanup stale data periodically
  useEffect(() => {
    const cleanup = () => {
      locationCache.current = new WeakMap();
      previousValuesRef.current = {};
      Object.values(predictionIntervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
      predictionIntervalsRef.current = {};
    };

    cleanupTimeRef.current = setInterval(cleanup, 300000); // Clean every 5 minutes

    return () => {
      if (cleanupTimeRef.current) {
        clearInterval(cleanupTimeRef.current);
      }
      Object.values(predictionIntervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, []);

  return optimizedLocations;
};
