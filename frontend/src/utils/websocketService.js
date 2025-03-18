import { io } from "socket.io-client";
import { getCookie } from "./cookieUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_URL = API_BASE_URL.replace("/api", "");

// Use a single socket instance for the entire application
let socket = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;
const CONNECTION_TIMEOUT = 15000; // Increased from 10000 to 15000
const LOCATION_UPDATE_INTERVAL = 3000; // 3 seconds

// Use WeakMap to allow garbage collection of callbacks when components unmount
const eventListeners = new Map();

// More memory-efficient message queue with automatic cleanup
let messageQueue = [];
const MAX_QUEUE_SIZE = 50; // Reduced from 100
const QUEUE_CLEANUP_INTERVAL = 300000; // 5 minutes

// More memory-efficient location queue
let locationQueue = [];
const MAX_LOCATION_QUEUE_SIZE = 10; // Reduced from 20

// Cleanup queues periodically
const cleanupQueues = () => {
  const now = Date.now();
  // Remove messages older than 5 minutes
  messageQueue = messageQueue.filter((msg) => now - msg.timestamp < 300000);
  // Remove locations older than 1 minute
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

export const connectSocket = () => {
  return new Promise((resolve, reject) => {
    try {
      const token = getCookie('token');
      if (!token) {
        reject(new Error('No authentication token found'));
        return;
      }

      if (socket?.connected) {
        resolve(socket);
        return;
      }

      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY,
        timeout: CONNECTION_TIMEOUT,
        auth: {
          token: token
        },
        withCredentials: true,
      });

      socket.on("connect", () => {
        console.log("Socket connected successfully");
        isConnecting = false;
        reconnectAttempts = 0;
        
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
        
        resolve(socket);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        isConnecting = false;
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          setTimeout(() => {
            socket.connect();
          }, RECONNECT_DELAY);
        } else {
          reject(error);
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        if (reason === "io server disconnect") {
          socket.connect();
        }
      });
    } catch (error) {
      console.error("Error in socket connection:", error);
      reject(error);
    }
  });
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
    // Clear all event listeners
    for (const [event, callbacks] of eventListeners.entries()) {
      callbacks.forEach((callback) => {
        socket.off(event, callback);
      });
    }

    // Clear all event listeners and maps
    eventListeners.clear();

    // Clear the ping interval
    if (socket.pingInterval) {
      clearInterval(socket.pingInterval);
      socket.pingInterval = null;
    }

    // Disconnect the socket
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    isConnecting = false;
    reconnectAttempts = 0;

    // Clear queue cleanup interval
    clearInterval(queueCleanupInterval);
  }
};

// Improved event subscription with proper cleanup
export const subscribeToEvent = async (event, callback) => {
  try {
    const socketInstance = await connectSocket();

    // Store callback in our map for reconnection handling
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event).add(callback);

    // Add the actual listener
    socketInstance.on(event, callback);

    // Return cleanup function
    return () => {
      if (socketInstance) {
        socketInstance.off(event, callback);
      }

      // Remove from our tracking map
      if (eventListeners.has(event)) {
        eventListeners.get(event).delete(callback);
        if (eventListeners.get(event).size === 0) {
          eventListeners.delete(event);
        }
      }
    };
  } catch (error) {
    console.error(`Failed to subscribe to ${event}:`, error);
    return () => {};
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

    // Ensure timestamp is included
    const sendData = {
      ...locationData,
      timestamp: locationData.timestamp || new Date().toISOString(),
    };

    console.log("Websocket sending location data:", {
      shuttleId: sendData.shuttleId,
      coordinates: sendData.coordinates,
      speed: sendData.metadata?.speed,
      heading: sendData.metadata?.heading,
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
        callback(data);
      }
    });

    socketInstance.on("shuttle_location_update", (data) => {
      console.log("Received shuttle_location_update:", data);
      if (data && data.coordinates) {
        callback(data);
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
    console.error(`Failed to join tracking for shuttle ${shuttleId}:`, error);
    return false;
  }
};

// Export the location update interval for consistency
export const getLocationUpdateInterval = () => {
  return LOCATION_UPDATE_INTERVAL || 5000; // Default to 5 seconds if not defined
};

// Add a cleanup function for application shutdown
export const cleanupSocketService = () => {
  disconnectSocket();
  messageQueue = [];
  locationQueue = [];
  clearInterval(queueCleanupInterval);
};
