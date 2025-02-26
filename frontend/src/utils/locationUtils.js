// Cache for storing geocoded locations and their timestamps
const geocodeCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const REQUEST_DELAY = 1000; // 1 second between requests
let lastRequestTime = 0;

export async function reverseGeocode(lat, lon) {
  const cacheKey = `${lat},${lon}`;
  const now = Date.now();

  // Check cache first with a longer duration
  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_DURATION) {
      return cached.value;
    }
  }

  // Return coordinates immediately if we made a request recently
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }

  try {
    lastRequestTime = now;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "SHUTL-App/1.0 (your@email.com)", // Replace with your contact email
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

    // Cache the result
    geocodeCache.set(cacheKey, {
      value: locationDescription,
      timestamp: now,
    });

    return locationDescription;
  } catch (error) {
    console.warn("Geocoding failed, using coordinates:", error);

    // Use cached value if available, regardless of age
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey).value;
    }

    // Return coordinates as fallback
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }
}

// Cache management functions
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

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
