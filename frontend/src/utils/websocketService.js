import { io } from "socket.io-client";
import { getTokenFromCookies, getUserTypeFromToken, getEmailFromToken } from "./tokenUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_URL = API_BASE_URL.replace("/api", "");

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Use a single socket instance for the entire application
let socket = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;
const CONNECTION_TIMEOUT = 15000;
const LOCATION_UPDATE_INTERVAL = 3000; // 3 seconds for standard updates
const STATIONARY_UPDATE_INTERVAL = 30000; // 30 seconds for stationary shuttles

// Use WeakMap to allow garbage collection of callbacks when components unmount
const eventListeners = new Map();

// More memory-efficient message queue with automatic cleanup
let messageQueue = [];
const MAX_QUEUE_SIZE = 50;
const QUEUE_CLEANUP_INTERVAL = 300000;

// More memory-efficient location queue
let locationQueue = [];
const MAX_LOCATION_QUEUE_SIZE = 10;

// Cleanup queues periodically
const cleanupQueues = () => {
  const now = Date.now();
  messageQueue = messageQueue.filter((msg) => now - msg.timestamp < 300000);
  locationQueue = locationQueue.filter((loc) => now - loc.timestamp < 60000);
};

// Start queue cleanup interval
const queueCleanupInterval = setInterval(cleanupQueues, QUEUE_CLEANUP_INTERVAL);

// Add to message queue with timestamp
export const addToMessageQueue = (message) => {
  if (messageQueue.length >= MAX_QUEUE_SIZE) {
    messageQueue.shift(); // Remove oldest message
  }
  messageQueue.push({ ...message, timestamp: Date.now() });
};

// Add to location queue with timestamp
export const addToLocationQueue = (locationData) => {
  if (locationQueue.length >= MAX_LOCATION_QUEUE_SIZE) {
    locationQueue.shift(); // Remove oldest location
  }
  locationQueue.push({ ...locationData, timestamp: Date.now() });
};

export const connectSocket = async () => {
  try {
    // If already connecting, wait for the connection
    if (isConnecting) {
      console.log("Socket connection already in progress, waiting...");
      return socket;
    }

    // If socket exists and is connected, return it
    if (socket && socket.connected) {
      console.log("Using existing socket connection");
      return socket;
    }

    // Get user data from token
    const token = getTokenFromCookies();
    if (!token) {
      console.error("No token found");
      return null;
    }

    const decoded = decodeToken(token);
    if (!decoded || !decoded.email) {
      console.error("Invalid token");
      return null;
    }

    // Get user data from localStorage as fallback
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userType = decoded.userType || userData.userType;
    const userId = userData._id;

    if (!userType) {
      console.error("Missing user type for socket connection");
      return null;
    }

    isConnecting = true;
    reconnectAttempts = 0;

    // Connect to socket with auth data
    const socketInstance = io(SOCKET_URL, {
      path: '/socket.io/',
      auth: {
        userType,
        email: decoded.email,
        userId
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    // Only log successful connection
    socketInstance.on("connect", () => {
      console.log("Socket connected successfully");
      isConnecting = false;
      reconnectAttempts = 0;
      // Process any queued messages after successful connection
      processQueuedMessages();
    });

    // Handle connection errors
    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      isConnecting = false;

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(() => {
          if (reconnectAttempts === 1 || reconnectAttempts === MAX_RECONNECT_ATTEMPTS) {
            console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          }
          socketInstance.connect();
        }, RECONNECT_DELAY * reconnectAttempts);
      } else {
        console.error("Max reconnection attempts reached");
        socket = null;
        isConnecting = false;
        reconnectAttempts = 0;
      }
    });

    // Set up error handling
    setupSocketErrorHandling(socketInstance);

    socket = socketInstance;
    return socketInstance;
  } catch (error) {
    console.error("Error connecting to socket:", error.message);
    isConnecting = false;
    return null;
  }
};

// Helper function to process queued messages
const processQueuedMessages = () => {
  // Process any queued messages
  while (messageQueue.length > 0) {
    const { event, data } = messageQueue.shift();
    socket.emit(event, data);
  }

  // Process any queued location updates
  while (locationQueue.length > 0) {
    const locationData = locationQueue.shift();
    socket.emit("shuttle_location", locationData);
  }
};

// Helper function to set up socket error handling
const setupSocketErrorHandling = (
  socketInstance,
  connectionTimeout,
  resolve,
  reject
) => {
  socketInstance.on("disconnect", (reason) => {
    // Only log disconnections in development or for non-normal reasons
    if (import.meta.env.DEV || reason !== "transport close") {
      console.log("Socket disconnected:", reason);
    }
    isConnecting = false;

    if (
      reason === "io server disconnect" ||
      reason === "io client disconnect"
    ) {
      // Don't attempt to reconnect for intentional disconnections
      return;
    }

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      setTimeout(() => {
        // Reduce logging
        if (
          reconnectAttempts === 1 ||
          reconnectAttempts === MAX_RECONNECT_ATTEMPTS
        ) {
          console.log(
            `Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
          );
        }
        socketInstance.connect();
      }, RECONNECT_DELAY * reconnectAttempts);
    }
  });

  socketInstance.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    isConnecting = false;
    clearTimeout(connectionTimeout);

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      setTimeout(() => {
        // Reduce logging - only log first and last attempts
        if (
          reconnectAttempts === 1 ||
          reconnectAttempts === MAX_RECONNECT_ATTEMPTS
        ) {
          console.log(
            `Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
          );
        }
        socketInstance.connect();
      }, RECONNECT_DELAY * reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
      socket = null;
      reconnectAttempts = 0;
      reject(new Error("Max reconnection attempts reached"));
    }
  });

  // Add ping/pong to check connection health
  const pingInterval = setInterval(() => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit("ping");
    }
  }, 30000);

  // Store the ping interval for cleanup
  socketInstance.pingInterval = pingInterval;

  socketInstance.on("pong", () => {
    // Completely remove pong logging
  });
};

export const disconnectSocket = () => {
  if (socket) {
    // Clear event listeners but preserve critical ones
    for (const [event, callbacks] of eventListeners.entries()) {
      // Don't remove critical event listeners like pickup_request
      if (event !== 'pickup_request' && event !== 'shuttle_location' && event !== 'shuttle_location_update') {
        callbacks.forEach((callback) => {
          socket.off(event, callback);
        });
        // Only remove non-critical events from the map
        eventListeners.delete(event);
      }
    }

    // Keep the socket connection alive but mark as disconnected for the current component
    // Don't fully disconnect or clear the socket to allow other components to use it
    isConnecting = false;
    
    // Don't set socket to null or call removeAllListeners which would break event listening
    // This allows other components to still receive events like pickup_request
    
    // Clear ping interval if exists
    if (socket.pingInterval) {
      clearInterval(socket.pingInterval);
      socket.pingInterval = null;
    }
  }
};

// Improved event subscription with proper cleanup
export const subscribeToEvent = async (eventName, callback) => {
  try {
    const socket = await connectSocket();
    if (!socket) return null;

    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  } catch (error) {
    console.error(`Error subscribing to ${eventName}:`, error.message);
    return null;
  }
};

// Chat-specific socket events
export const joinChatRoom = async (roomId) => {
  try {
    const socketInstance = await connectSocket();
    // Reduce logging
    socketInstance.emit("join_room", roomId);
    socketInstance.emit("join_chat", roomId); // For backward compatibility
    return true;
  } catch (error) {
    console.error("Failed to join chat room:", error);
    return false;
  }
};

export const leaveChatRoom = async (roomId) => {
  try {
    const socketInstance = await connectSocket();
    socketInstance.emit("leave_chat", roomId);
  } catch (error) {
    console.error("Failed to leave chat room:", error);
  }
};

export const sendMessage = async (message) => {
  try {
    const socketInstance = await connectSocket();
    // Reduce logging
    socketInstance.emit("message", message);
    return true;
  } catch (error) {
    console.error("Failed to send message via socket:", error);
    // Add to queue for retry when connection is restored
    addToMessageQueue({ event: "message", data: message });
    return false;
  }
};

// Keep track of active message subscriptions to prevent duplicates
const activeMessageSubscriptions = new Set();

export const subscribeToMessages = async (callback) => {
  try {
    const socketInstance = await connectSocket();
    // Reduce logging

    // Generate a unique ID for this subscription
    const subscriptionId =
      Date.now().toString() + Math.random().toString(36).substr(2, 5);

    // Remove any existing message listeners to prevent duplicates
    if (activeMessageSubscriptions.size > 0) {
      // Reduce logging
      socketInstance.off("message");
      activeMessageSubscriptions.clear();
    }

    // Create a wrapper function to handle message deduplication
    const messageHandler = (message) => {
      // Add basic validation to prevent errors
      if (!message || typeof message !== "object") {
        console.warn("Received invalid message format:", message);
        return;
      }

      // Call the original callback
      callback(message);
    };

    // Add the new message listener
    socketInstance.on("message", messageHandler);
    activeMessageSubscriptions.add(subscriptionId);

    return () => {
      // Reduce logging
      socketInstance.off("message", messageHandler);
      activeMessageSubscriptions.delete(subscriptionId);
    };
  } catch (error) {
    console.error("Failed to subscribe to messages:", error);
    return () => {}; // Return empty cleanup function
  }
};

// Location-specific socket events
export const sendLocation = async (locationData) => {
  try {
    const socketInstance = await connectSocket();

    // Ensure timestamp is included and speed is at root level
    const sendData = {
      ...locationData,
      timestamp: locationData.timestamp || new Date().toISOString(),
      speed: locationData.speed || locationData.metadata?.speed || 0,
      heading: locationData.heading || locationData.metadata?.heading || 0,
      accuracy: locationData.accuracy || locationData.metadata?.accuracy || 0
    };

    console.log("Websocket sending location data:", {
      shuttleId: sendData.shuttleId,
      coordinates: sendData.coordinates,
      speed: sendData.speed,
      heading: sendData.heading,
      timestamp: sendData.timestamp,
    });

    socketInstance.emit("shuttle_location", sendData);
    return true;
  } catch (error) {
    console.error("Failed to send location:", error);
    // Queue the location update for when connection is restored
    addToLocationQueue({
      ...locationData,
      timestamp: locationData.timestamp || new Date().toISOString(),
    });
    return false;
  }
};

// Location-specific socket events
export const subscribeToLocationUpdates = async (callback) => {
  try {
    const socketInstance = await connectSocket();

    // Listen for both types of location updates
    socketInstance.on("shuttle_location", (data) => {
      console.log("Received shuttle_location:", data);
      if (data && data.coordinates) {
        // Ensure speed and heading are at the root level
        const processedData = {
          ...data,
          speed: data.speed || data.metadata?.speed || 0,
          heading: data.heading || data.metadata?.heading || 0,
          accuracy: data.accuracy || data.metadata?.accuracy || 0
        };
        console.log("Processed location data:", processedData);
        callback(processedData);
      }
    });

    socketInstance.on("shuttle_location_update", (data) => {
      console.log("Received shuttle_location_update:", data);
      if (data && data.coordinates) {
        // Ensure speed and heading are at the root level
        const processedData = {
          ...data,
          speed: data.speed || data.metadata?.speed || 0,
          heading: data.heading || data.metadata?.heading || 0,
          accuracy: data.accuracy || data.metadata?.accuracy || 0
        };
        console.log("Processed location data:", processedData);
        callback(processedData);
      }
    });

    // Also listen for speed updates
    socketInstance.on("speed_update", (data) => {
      if (data && data.speed !== undefined) {
        callback({ ...data, type: "speed" });
      }
    });

    // Return cleanup function
    return () => {
      if (socketInstance) {
        socketInstance.off("shuttle_location");
        socketInstance.off("shuttle_location_update");
        socketInstance.off("speed_update");
      }
    };
  } catch (error) {
    console.error("Failed to subscribe to location updates:", error);
    return () => {}; // Return empty cleanup function
  }
};

export const joinShuttleTracking = async (shuttleId) => {
  try {
    const socketInstance = await connectSocket();
    socketInstance.emit("join_shuttle_tracking", shuttleId);
    // Reduce logging
    return true;
  } catch (error) {
    console.error("Error joining shuttle tracking:", error.message);
    return false;
  }
};

// Export the intervals for use in other components
export const getLocationUpdateInterval = () => LOCATION_UPDATE_INTERVAL;
export const getStationaryUpdateInterval = () => STATIONARY_UPDATE_INTERVAL;

// Add a cleanup function for application shutdown
export const cleanupSocketService = () => {
  if (socket) {
    // For complete application shutdown, we can fully disconnect
    
    // Clear all event listeners without preserving any
    for (const [event, callbacks] of eventListeners.entries()) {
      callbacks.forEach((callback) => {
        socket.off(event, callback);
      });
    }
    
    // Clear all event listeners and maps
    eventListeners.clear();
    
    // Fully disconnect the socket
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    isConnecting = false;
    reconnectAttempts = 0;
  }
  
  // Clear message queues
  messageQueue = [];
  locationQueue = [];
  
  // Clear queue cleanup interval
  clearInterval(queueCleanupInterval);
};
