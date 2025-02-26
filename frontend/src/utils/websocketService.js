import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_BASE_URL.replace("/api", "");

let socket = null;

// Add message queue for handling disconnections
const messageQueue = [];

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
      timeout: 10000, // 10 second connection timeout
    });

    socket.on("connect", () => {
      console.log("Socket connected with ID:", socket.id);
      // Emit any queued messages
      while (messageQueue.length > 0) {
        const { event, data } = messageQueue.shift();
        socket.emit(event, data);
      }
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
    if (socket.connected) {
      console.log("Socket connected, sending location data:", locationData);
      socket.emit("shuttle_location", locationData);
      resolve(true);
    } else {
      console.log("Socket disconnected, queuing location update");
      messageQueue.push({ event: "shuttle_location", data: locationData });

      // Attempt reconnection
      socket.connect();

      // Set a timeout for the connection attempt
      setTimeout(() => {
        if (!socket.connected) {
          console.log("Connection attempt timed out, using fallback");
          resolve(false);
        }
      }, 5000);

      // Handle successful connection
      socket.once("connect", () => {
        console.log("Socket reconnected, sending queued location");
        resolve(true);
      });
    }
  });
};

export const subscribeToLocationUpdates = (callback) => {
  if (!socket || !socket.connected) {
    socket = connectSocket();
  }

  socket.off("shuttle_location_update");

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
