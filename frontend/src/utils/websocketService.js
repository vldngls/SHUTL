import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_BASE_URL.replace('/api', '');

let socket = null;

export const connectSocket = () => {
  if (!socket || socket.disconnected) {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
      auth: { token }
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
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
  if (socket && socket.connected) {
    socket.emit("shuttle_location", locationData);
  }
};

export const subscribeToLocation = (callback) => {
  if (socket) {
    socket.on("shuttle_location", callback);
  }
};

