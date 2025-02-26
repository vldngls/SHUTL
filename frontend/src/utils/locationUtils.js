// Predefined locations for the service area
const KNOWN_LOCATIONS = {
  // Format: "lat,lon": "location name"
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

  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_DURATION) {
      return cached.value;
    }
  }

  // Check predefined locations
  const exactLocation = KNOWN_LOCATIONS[cacheKey];
  if (exactLocation) {
    geocodeCache.set(cacheKey, {
      value: exactLocation,
      timestamp: now,
    });
    return exactLocation;
  }

  // Find nearest known location
  const nearestLocation = findNearestKnownLocation(lat, lon);
  if (nearestLocation) {
    const locationDescription = `Near ${nearestLocation}`;
    geocodeCache.set(cacheKey, {
      value: locationDescription,
      timestamp: now,
    });
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
    geocodeCache.set(cacheKey, {
      value: locationDescription,
      timestamp: now,
    });

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
};

export const cleanupExpiredCache = () => {
  const now = Date.now();
  for (const [key, data] of geocodeCache.entries()) {
    if (now - data.timestamp > CACHE_DURATION) {
      geocodeCache.delete(key);
    }
  }
};
