import { io } from "socket.io-client";
import { getCookie } from "../utils/cookieUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_BASE_URL.replace('/api', '');

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const updateUserLocation = (setUserLocation, isLocationSharing) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);

        // Emit location to server if sharing is enabled
        if (isLocationSharing && socket) {
          socket.emit("shuttle_location", {
            coordinates: [latitude, longitude],
            shuttleId: "SHUTL001", // This should come from driver's auth data
          });
        }
      },
      (error) => {
        console.error("Error accessing location:", error);
        alert("Unable to retrieve your location. Please try again.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
};

export const startLocationSharing = (setIsLocationSharing) => {
  setIsLocationSharing(true);
};

export const stopLocationSharing = (setIsLocationSharing, locationUpdateInterval) => {
  setIsLocationSharing(false);
  if (locationUpdateInterval.current) {
    clearInterval(locationUpdateInterval.current);
    locationUpdateInterval.current = null;
  }
}; 