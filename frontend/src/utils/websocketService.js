import { io } from "socket.io-client";
import { getCookie } from "./cookieUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_BASE_URL.replace("/api", "");

let socket = null;

// Add message queue for handling disconnections
let messageQueue = [];
const MAX_QUEUE_SIZE = 100;
const QUEUE_CLEANUP_INTERVAL = 300000; // 5 minutes

export const addToMessageQueue = (message) => {
  if (messageQueue.length >= MAX_QUEUE_SIZE) {
    messageQueue.shift(); // Remove oldest message
  }
  messageQueue.push(message);
};

export const connectSocket = () => {
  if (!socket) {
    const token = getCookie("token");

    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
      timeout: 10000, // 10 second connection timeout
      auth: { token }, // Send token in auth
      extraHeaders: {
        Cookie: `token=${token}`, // Also send token as cookie
      },
    });

    // Add message queue cleanup
    setInterval(() => {
      if (messageQueue.length > 0) {
        messageQueue = [];
      }
    }, QUEUE_CLEANUP_INTERVAL);

    socket.on("connect", () => {
      console.log("Socket connected with ID:", socket.id);

      // Process location updates first
      const locationUpdates = messageQueue.filter(
        (msg) => msg.event === "shuttle_location"
      );
      const otherMessages = messageQueue.filter(
        (msg) => msg.event !== "shuttle_location"
      );

      // Only process recent location updates
      const now = Date.now();
      locationUpdates.forEach((msg) => {
        if (now - msg.queuedAt < 10000) {
          // Only send if less than 10 seconds old
          socket.emit(msg.event, {
            ...msg.data,
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Process other messages
      otherMessages.forEach((msg) => {
        socket.emit(msg.event, msg.data);
      });

      // Clear the queue
      messageQueue = [];
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setTimeout(() => {
        connectSocket();
      }, 1000);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setTimeout(() => {
        connectSocket();
      }, 1000);
    });

    // Add memory monitoring
    socket.on("message", (data) => {
      addToMessageQueue(data);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Chat-specific socket events
export const joinChatRoom = (roomId) => {
  if (socket) {
    socket.emit("join_chat", roomId);
  }
};

export const leaveChatRoom = (roomId) => {
  if (socket) {
    socket.emit("leave_chat", roomId);
  }
};

export const sendMessage = (message) => {
  if (!socket || !socket.connected) {
    socket = connectSocket();
  }
  socket.emit("message", message);
};

export const subscribeToMessages = (callback) => {
  if (!socket || !socket.connected) {
    socket = connectSocket();
  }
  socket.on("message", callback);
};

// Location-specific socket events
export const sendLocation = async (locationData) => {
  if (!socket) {
    socket = connectSocket();
  }

  return new Promise((resolve) => {
    const sendData = {
      ...locationData,
      timestamp: new Date().toISOString(),
    };

    const emitLocation = () => {
      console.log("Emitting location data:", sendData);
      socket.emit("shuttle_location", sendData);
    };

    if (socket.connected) {
      emitLocation();
      resolve(true);
    } else {
      console.log("Socket disconnected, attempting immediate reconnect");

      // Store in queue with timestamp
      messageQueue.push({
        event: "shuttle_location",
        data: sendData,
        queuedAt: Date.now(),
      });

      // Attempt immediate reconnection
      socket.connect();

      // Handle reconnection
      socket.once("connect", () => {
        console.log("Socket reconnected, sending queued locations");
        // Process queue, only sending recent locations
        const now = Date.now();
        while (messageQueue.length > 0) {
          const msg = messageQueue.shift();
          if (now - msg.queuedAt < 10000) {
            // Only send if less than 10 seconds old
            socket.emit(msg.event, {
              ...msg.data,
              timestamp: new Date().toISOString(), // Fresh timestamp
            });
          }
        }
        resolve(true);
      });

      // Set timeout for the reconnection attempt
      setTimeout(() => {
        if (!socket.connected) {
          console.log("Reconnection attempt timed out");
          resolve(false);
        }
      }, 3000);
    }
  });
};

export const subscribeToLocationUpdates = (callback) => {
  if (!socket || !socket.connected) {
    socket = connectSocket();
  }

  // Remove any existing listeners
  socket.off("shuttle_location");
  socket.off("shuttle_location_update");

  // Listen for both initial locations and updates
  socket.on("shuttle_location", (data) => {
    console.log("Received initial shuttle location:", data);
    callback(data);
  });

  socket.on("shuttle_location_update", (data) => {
    console.log("Received shuttle location update:", data);
    callback(data);
  });
};

export const joinShuttleTracking = (shuttleId) => {
  if (!socket || !socket.connected) {
    socket = connectSocket();
  }

  console.log("Joining tracking for shuttle:", shuttleId);
  socket.emit("join_shuttle_tracking", shuttleId);
};
