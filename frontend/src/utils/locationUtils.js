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

// Change the function declaration to export it
export function calculateDistance(lat1, lon1, lat2, lon2) {
  // Handle the case where the function is called with arrays instead of separate parameters
  if (Array.isArray(lat1) && Array.isArray(lat2)) {
    // Format: calculateDistance([lat1, lon1], [lat2, lon2])
    const [lat1Value, lon1Value] = lat1;
    const [lat2Value, lon2Value] = lat2;
    return calculateDistance(lat1Value, lon1Value, lat2Value, lon2Value);
  }

  // Ensure all parameters are numbers
  lat1 = Number(lat1);
  lon1 = Number(lon1);
  lat2 = Number(lat2);
  lon2 = Number(lon2);

  // Check for invalid inputs
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    console.warn("Invalid parameters to calculateDistance:", {
      lat1,
      lon1,
      lat2,
      lon2,
    });
    return 0;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

// Helper function for converting degrees to radians
function toRad(degrees) {
  return (degrees * Math.PI) / 180;
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
