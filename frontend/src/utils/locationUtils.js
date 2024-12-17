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

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

function toRad(degrees) {
  return degrees * (Math.PI/180);
} 