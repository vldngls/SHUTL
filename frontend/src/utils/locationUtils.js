/**
 * Location-related utility functions for the SHUTL application
 */

// Terminal coordinates
export const TERMINAL_COORDINATES = {
  lat: 14.385586,
  lng: 120.978863,
  radius: 200 // meters
};

/**
 * Calculate distance between two coordinates in kilometers
 * @param {number} lat1 - First coordinate latitude
 * @param {number} lng1 - First coordinate longitude 
 * @param {number} lat2 - Second coordinate latitude
 * @param {number} lng2 - Second coordinate longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if coordinates are within the SOMO terminal geofence
 * @param {Array} coordinates - [latitude, longitude]
 * @returns {boolean} True if within the terminal geofence
 */
export const isWithinTerminalGeofence = (coordinates) => {
  if (!coordinates) return false;
  
  // Calculate distance between shuttle and terminal
  const distance = calculateDistance(
    coordinates[0],
    coordinates[1],
    TERMINAL_COORDINATES.lat,
    TERMINAL_COORDINATES.lng
  );
  
  // Convert radius from meters to kilometers for comparison
  const radiusInKm = TERMINAL_COORDINATES.radius / 1000;
  return distance <= radiusInKm;
};

/**
 * Get the shuttle status based on speed, location and movement
 * @param {number} speed - Speed in km/h
 * @param {Array} coordinates - [latitude, longitude]
 * @param {boolean} isMoving - Whether the shuttle is moving
 * @returns {string} Status description
 */
export const getShuttleStatus = (speed, coordinates, isMoving) => {
  // If offline, maintain that status
  if (speed === undefined || speed === null) return "Offline";
  
  // If moving, determine the traffic condition based on speed
  if (isMoving) {
    if (speed < 5) return "Slow Traffic";
    if (speed < 15) return "Normal";
    if (speed < 30) return "Fast";
    return "High Speed";
  }
  
  // Stationary shuttle - check if it's at the terminal
  if (speed < 0.8) {
    // Only show "At Terminal" if both stationary AND within geofence
    if (coordinates && isWithinTerminalGeofence(coordinates)) {
      return "At Terminal";
    }
    // If stationary but not at terminal, show "Stationary"
    return "Stationary";
  }
  
  // Default traffic status based on speed for non-moving shuttles
  if (speed < 5) return "Slow Traffic";
  if (speed < 15) return "Normal";
  if (speed < 30) return "Fast";
  return "High Speed";
};

/**
 * Smooth a shuttle's speed using exponential moving average
 * @param {number} rawSpeed - The new raw speed reading
 * @param {number|null} previousSpeed - The previous smoothed speed
 * @returns {number} The new smoothed speed
 */
export const smoothSpeed = (rawSpeed, previousSpeed) => {
  if (previousSpeed === null || previousSpeed === undefined) {
    return rawSpeed;
  }
  
  // If raw speed is 0 (or very close to 0), increase alpha to allow quicker transition to zero
  if (rawSpeed < 0.5) {
    // Use higher alpha (0.6) to transition to zero more quickly when stopped
    const smoothedSpeed = previousSpeed * 0.4 + rawSpeed * 0.6;
      
    // If smoothed speed is very low, just snap to zero to ensure vehicles can be fully stationary
    if (smoothedSpeed < 0.8) {
      return 0;
    }
    return smoothedSpeed;
  } 
  
  // Normal smoothing for non-zero speeds (0.3 = 30% new, 70% previous)
  const SMOOTHING_ALPHA = 0.3;
  return previousSpeed * (1 - SMOOTHING_ALPHA) + rawSpeed * SMOOTHING_ALPHA;
};

/**
 * Determine if a shuttle is moving based on speed and previous speed
 * @param {number} speed - Current smoothed speed
 * @param {number|null} previousSpeed - Previous smoothed speed
 * @returns {boolean} Whether the shuttle is moving
 */
export const isShuttleMoving = (speed, previousSpeed) => {
  if (previousSpeed === null || previousSpeed === undefined) {
    return speed > 3;
  }
  
  return speed > 3 || Math.abs(speed - previousSpeed) > 1;
};

/**
 * Process a location update for a shuttle
 * @param {object} data - The new location data
 * @param {object} prevShuttle - The previous shuttle data (or null if new)
 * @returns {object} The updated shuttle data
 */
export const processShuttleLocationUpdate = (data, prevShuttle) => {
  // Extract speed data and other metadata
  const rawSpeed = data.speed || (data.metadata && data.metadata.speed) || 0;
  const heading = data.heading || (data.metadata && data.metadata.heading) || 0;
  const accuracy = data.accuracy || (data.metadata && data.metadata.accuracy) || 0;
  const isExplicitlyOffline = data.isExplicitlyOffline || false;
  
  // Apply speed smoothing using exponential moving average
  const smoothedSpeed = smoothSpeed(rawSpeed, prevShuttle?.speed);
  
  // Compare speed with previous speed to detect movement
  const isMoving = isShuttleMoving(smoothedSpeed, prevShuttle?.speed);
  
  // Calculate status based on location and movement
  const status = isExplicitlyOffline 
    ? "offline" 
    : getShuttleStatus(smoothedSpeed, data.coordinates, isMoving);
  
  return {
    coordinates: data.coordinates,
    timestamp: data.timestamp || new Date().toISOString(),
    lastUpdate: new Date(),
    metadata: data.metadata || {},
    rawSpeed: rawSpeed,
    speed: smoothedSpeed,
    heading: heading,
    accuracy: accuracy,
    isExplicitlyOffline: isExplicitlyOffline,
    isMoving: isMoving,
    status: status
  };
};

// Predefined locations for the service area
export const KNOWN_LOCATIONS = {
  // Format: "lat,lon": "location name"
  "14.371742,120.992025": "Lessandra Heights Clubhouse",
  "14.376042,120.990944": "Camella Cerritos Heights Clubhouse",
  "14.3723,120.992": "Daang Hari Road",
  "14.385152,120.9663488": "Molino Road",
  "14.385586,120.978863": "SOMO - A Vista Mall",
  "14.384981,120.979704": "SOMO Parking Entrance",
  "14.374463, 120.991615": "Lessandra Gate",
  // Add more known locations in your service area
};

// Cache for storing geocoded locations
const geocodeCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = "shutl_map_locations_cache";
const LAST_USED_KEY = "shutl_map_locations_last_used";
const MAX_CACHE_SIZE = 100; // Maximum number of locations to store

// Initialize cache from localStorage
const initializeCache = () => {
  try {
    const storedCache = localStorage.getItem(STORAGE_KEY);
    const storedLastUsed = localStorage.getItem(LAST_USED_KEY);

    if (storedCache) {
      const parsedCache = JSON.parse(storedCache);
      Object.entries(parsedCache).forEach(([key, value]) => {
        geocodeCache.set(key, value);
      });
    }

    // Initialize last used timestamps
    if (!storedLastUsed) {
      localStorage.setItem(LAST_USED_KEY, JSON.stringify({}));
    }
  } catch (error) {
    console.warn("Failed to load location cache from localStorage:", error);
  }
};

// Save cache to localStorage
const saveCache = () => {
  try {
    const cacheObject = {};
    geocodeCache.forEach((value, key) => {
      cacheObject[key] = value;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObject));
  } catch (error) {
    console.warn("Failed to save location cache to localStorage:", error);
  }
};

// Update last used timestamp for a location
export const updateLastUsed = (lat, lon) => {
  try {
    const roundedLat = Number(lat).toFixed(6);
    const roundedLon = Number(lon).toFixed(6);
    const cacheKey = `${roundedLat},${roundedLon}`;

    const storedLastUsed = localStorage.getItem(LAST_USED_KEY) || "{}";
    const lastUsed = JSON.parse(storedLastUsed);

    lastUsed[cacheKey] = Date.now();
    localStorage.setItem(LAST_USED_KEY, JSON.stringify(lastUsed));
  } catch (error) {
    console.warn("Failed to update last used timestamp:", error);
  }
};

// Helper function to find nearest known location
const findNearestKnownLocation = (lat, lon) => {
  let nearestLocation = null;
  let shortestDistance = Infinity;

  for (const [coords, name] of Object.entries(KNOWN_LOCATIONS)) {
    const [knownLat, knownLon] = coords.split(",").map(Number);
    const distance = calculateDistance(lat, lon, knownLat, knownLon);

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestLocation = name;
    }
  }

  // Only return if within 500 meters
  return shortestDistance <= 0.5 ? nearestLocation : null;
};

export async function reverseGeocode(lat, lon) {
  const roundedLat = Number(lat).toFixed(6);
  const roundedLon = Number(lon).toFixed(6);
  const cacheKey = `${roundedLat},${roundedLon}`;
  const now = Date.now();

  // Initialize cache if needed
  if (geocodeCache.size === 0) {
    initializeCache();
  }

  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_DURATION) {
      // Update last used timestamp
      updateLastUsed(roundedLat, roundedLon);
      return cached.value;
    }
  }

  // Check predefined locations
  const exactLocation = KNOWN_LOCATIONS[cacheKey];
  if (exactLocation) {
    const cacheEntry = {
      value: exactLocation,
      timestamp: now,
    };
    geocodeCache.set(cacheKey, cacheEntry);
    updateLastUsed(roundedLat, roundedLon);
    saveCache();
    return exactLocation;
  }

  // Find nearest known location
  const nearestLocation = findNearestKnownLocation(lat, lon);
  if (nearestLocation) {
    const locationDescription = `Near ${nearestLocation}`;
    const cacheEntry = {
      value: locationDescription,
      timestamp: now,
    };
    geocodeCache.set(cacheKey, cacheEntry);
    updateLastUsed(roundedLat, roundedLon);
    saveCache();
    return locationDescription;
  }

  // If no known location found, try OpenStreetMap with fallback
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "SHUTL-App/1.0 (vldngls.0418@gmail.com)",
          "Accept-Language": "en",
        },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const location = data.address;
    const locationPriority = [
      location.road,
      location.landmark,
      location.neighbourhood,
      location.suburb,
      location.city_district,
      location.city,
    ];

    const locationDescription =
      locationPriority.find((item) => item) || "Unknown location";

    // Cache successful result
    const cacheEntry = {
      value: locationDescription,
      timestamp: now,
    };
    geocodeCache.set(cacheKey, cacheEntry);
    updateLastUsed(roundedLat, roundedLon);

    // Check if cache is too large and clean up if needed
    if (geocodeCache.size > MAX_CACHE_SIZE) {
      cleanupUnusedLocations();
    }

    saveCache();
    return locationDescription;
  } catch (error) {
    console.warn("Geocoding failed:", error);

    // Return coordinates with area description if possible
    const areaDesc = getAreaDescription(lat, lon);
    return areaDesc || `${roundedLat}, ${roundedLon}`;
  }
}

// Helper function to get general area description based on coordinates
function getAreaDescription(lat, lon) {
  // Add logic to return general area names based on coordinate ranges
  // Example:
  if (lat >= 14.37 && lat <= 14.39 && lon >= 120.96 && lon <= 120.99) {
    return "Bacoor Area";
  }
  // Add more area definitions as needed
  return null;
}

export const clearGeocodeCache = () => {
  geocodeCache.clear();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LAST_USED_KEY);
};

export const cleanupExpiredCache = () => {
  const now = Date.now();
  let hasChanges = false;

  for (const [key, data] of geocodeCache.entries()) {
    if (now - data.timestamp > CACHE_DURATION) {
      geocodeCache.delete(key);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    saveCache();
  }
};

// Clean up locations that haven't been used recently
export const cleanupUnusedLocations = () => {
  try {
    const storedLastUsed = localStorage.getItem(LAST_USED_KEY);
    if (!storedLastUsed) return;

    const lastUsed = JSON.parse(storedLastUsed);
    const entries = Object.entries(lastUsed);

    // Sort by last used timestamp (oldest first)
    entries.sort((a, b) => a[1] - b[1]);

    // Remove oldest 20% of entries
    const removeCount = Math.ceil(entries.length * 0.2);
    const keysToRemove = entries.slice(0, removeCount).map((entry) => entry[0]);

    // Remove from cache and last used
    keysToRemove.forEach((key) => {
      geocodeCache.delete(key);
      delete lastUsed[key];
    });

    // Save updated data
    localStorage.setItem(LAST_USED_KEY, JSON.stringify(lastUsed));
    saveCache();

    console.log(`Cleaned up ${keysToRemove.length} unused map locations`);
  } catch (error) {
    console.warn("Failed to clean up unused locations:", error);
  }
};

// Initialize cache when module loads
initializeCache();

// Set up periodic cleanup
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
setInterval(() => {
  cleanupExpiredCache();
  if (geocodeCache.size > MAX_CACHE_SIZE * 0.8) {
    cleanupUnusedLocations();
  }
}, CLEANUP_INTERVAL);
