export async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    // Try to get the most relevant location description
    const location = data.address;
    
    // Priority order for location description
    const locationPriority = [
      location.road,
      location.landmark,
      location.neighbourhood,
      location.suburb,
      location.city_district,
      location.city
    ];

    // Return the first available location description
    const locationDescription = locationPriority.find(item => item) || "Unknown location";
    return locationDescription;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return "Unknown location";
  }
} 