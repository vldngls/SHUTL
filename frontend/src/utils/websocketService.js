import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_BASE_URL.replace("/api", "");

let socket = null;

export const connectSocket = () => {
  if (!socket || socket.disconnected) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Socket connected with ID:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }
  return socket;
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

export const sendMessage = (roomId, message) => {
  if (socket && socket.connected) {
    socket.emit("chat_message", { roomId, message });
  }
};

export const subscribeToMessages = (callback) => {
  if (socket) {
    socket.on("chat_message", callback);
  }
};

// Location-specific socket events
export const sendLocation = (locationData) => {
  if (!socket || !socket.connected) {
    console.warn("Cannot send location: socket not connected");
    return false;
  }

  console.log("Sending location data:", locationData);
  socket.emit("shuttle_location", locationData);
  return true;
};

export const subscribeToLocation = (callback) => {
  if (!socket) return;

  socket.on("shuttle_location", (data) => {
    console.log("Received shuttle location:", data);
    callback(data);
  });
};

export const joinShuttleTracking = (shuttleId) => {
  if (!socket || !socket.connected) {
    console.warn("Cannot join tracking: socket not connected");
    return;
  }

  console.log("Joining tracking for shuttle:", shuttleId);
  socket.emit("join_shuttle_tracking", shuttleId);
};
