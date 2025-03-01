import { io } from "socket.io-client";
import { getCookie } from "./cookieUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_BASE_URL.replace("/api", "");

let socket = null;
let isConnecting = false;
let locationSubscribers = new Set();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;
const CONNECTION_TIMEOUT = 10000;
const LOCATION_UPDATE_INTERVAL = 3000; // 3 seconds

// Add message queue for handling disconnections
let messageQueue = [];
const MAX_QUEUE_SIZE = 100;
const QUEUE_CLEANUP_INTERVAL = 300000; // 5 minutes

// Add location queue for handling disconnections
let locationQueue = [];
const MAX_LOCATION_QUEUE_SIZE = 20; // Store up to 20 location updates (1 minute worth at 3s intervals)

export const addToMessageQueue = (message) => {
  if (messageQueue.length >= MAX_QUEUE_SIZE) {
    messageQueue.shift(); // Remove oldest message
  }
  messageQueue.push(message);
};

export const addToLocationQueue = (locationData) => {
  if (locationQueue.length >= MAX_LOCATION_QUEUE_SIZE) {
    locationQueue.shift(); // Remove oldest location
  }
  locationQueue.push(locationData);
};

export const connectSocket = () => {
  if (socket && socket.connected) {
    return Promise.resolve(socket);
  }

  if (isConnecting) {
    return new Promise((resolve, reject) => {
      const checkConnection = setInterval(() => {
        if (socket && socket.connected) {
          clearInterval(checkConnection);
          resolve(socket);
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkConnection);
        reject(new Error("Connection timeout while waiting for socket"));
      }, 5000);
    });
  }

  isConnecting = true;
  const token = getCookie("token");

  return new Promise((resolve, reject) => {
    try {
      if (!socket) {
        socket = io(SOCKET_URL, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
          reconnectionDelay: RECONNECT_DELAY,
          withCredentials: true,
          timeout: CONNECTION_TIMEOUT,
          auth: { token },
          extraHeaders: {
            Cookie: `token=${token}`,
          },
        });

        // Ensure consistent method availability
        if (!socket.off) {
          socket.off = function (event, listener) {
            if (listener) {
              this.removeListener(event, listener);
            } else {
              this.removeAllListeners(event);
            }
            return this;
          };
        }

        socket.on("connect", () => {
          console.log("Socket connected with ID:", socket.id);
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
            socket.emit("shuttle_location_update", locationData);
          }

          // Notify all location subscribers of successful connection
          locationSubscribers.forEach((callback) => {
            socket.on("shuttle_location", callback);
            socket.on("shuttle_location_update", callback);
          });

          resolve(socket);
        });

        socket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
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
              console.log(
                `Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
              );
              socket.connect();
            }, RECONNECT_DELAY * reconnectAttempts);
          }
        });

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          isConnecting = false;

          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(() => {
              console.log(
                `Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
              );
              socket.connect();
            }, RECONNECT_DELAY * reconnectAttempts);
          } else {
            console.error("Max reconnection attempts reached");
            socket = null;
            reconnectAttempts = 0;
            reject(new Error("Max reconnection attempts reached"));
          }
        });

        // Add ping/pong to check connection health
        setInterval(() => {
          if (socket && socket.connected) {
            socket.emit("ping");
          }
        }, 30000);

        socket.on("pong", () => {
          console.log("Received pong from server");
        });
      } else {
        if (socket.connected) {
          resolve(socket);
        } else {
          socket.connect();
          socket.once("connect", () => {
            resolve(socket);
          });
          socket.once("connect_error", (error) => {
            reject(error);
          });
        }
      }
    } catch (error) {
      console.error("Error creating socket connection:", error);
      isConnecting = false;
      reject(error);
    }
  });
};

export const disconnectSocket = () => {
  if (socket) {
    locationSubscribers.clear();
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    isConnecting = false;
    reconnectAttempts = 0;
  }
};

// Chat-specific socket events
export const joinChatRoom = async (roomId) => {
  try {
    const socketInstance = await connectSocket();
    socketInstance.emit("join_chat", roomId);
  } catch (error) {
    console.error("Failed to join chat room:", error);
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
    socketInstance.emit("message", message);
    return true;
  } catch (error) {
    console.error("Failed to send message:", error);
    addToMessageQueue({ event: "message", data: message });
    return false;
  }
};

export const subscribeToMessages = async (callback) => {
  try {
    const socketInstance = await connectSocket();
    socketInstance.on("message", callback);
    return () => {
      if (socketInstance) {
        socketInstance.off("message", callback);
      }
    };
  } catch (error) {
    console.error("Failed to subscribe to messages:", error);
    return () => {};
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

    socketInstance.emit("shuttle_location", sendData);
    socketInstance.emit("shuttle_location_update", sendData); // Broadcast to all listeners
    console.log("Location sent successfully:", sendData);
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

export const subscribeToLocationUpdates = async (callback) => {
  try {
    const socketInstance = await connectSocket();

    // Clear any existing location subscriptions for this callback
    socketInstance.off("shuttle_location", callback);
    socketInstance.off("shuttle_location_update", callback);

    // Set up new subscriptions
    socketInstance.on("shuttle_location", callback);
    socketInstance.on("shuttle_location_update", callback);

    // Add to subscribers set for reconnection handling
    locationSubscribers.add(callback);

    console.log("Successfully subscribed to location updates");

    // Return cleanup function
    return () => {
      locationSubscribers.delete(callback);
      if (socketInstance) {
        socketInstance.off("shuttle_location", callback);
        socketInstance.off("shuttle_location_update", callback);
      }
    };
  } catch (error) {
    console.error("Failed to subscribe to location updates:", error);
    return () => {};
  }
};

export const joinShuttleTracking = async (shuttleId) => {
  try {
    const socketInstance = await connectSocket();
    socketInstance.emit("join_shuttle_tracking", shuttleId);
    console.log(`Joined tracking for shuttle ${shuttleId}`);
    return true;
  } catch (error) {
    console.error(`Failed to join tracking for shuttle ${shuttleId}:`, error);
    return false;
  }
};

// Export the location update interval for consistency
export const getLocationUpdateInterval = () => LOCATION_UPDATE_INTERVAL;
