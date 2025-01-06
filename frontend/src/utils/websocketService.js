import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // Ensure this is the correct URL
let socket;

export const connectSocket = () => {
  if (!socket || socket.disconnected) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"], // Ensure WebSocket transport is used
      reconnection: true,        // Enable reconnection
      reconnectionAttempts: 5,   // Number of reconnection attempts
      reconnectionDelay: 1000,   // Initial delay for reconnection (1s)
      reconnectionDelayMax: 5000 // Max delay for reconnection (5s)
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

export const sendMessage = (message) => {
  if (socket && socket.connected) {
    socket.emit("message", message); // Emit the message to the server
  } else {
    console.warn("Socket is not connected. Message not sent:", message);
  }
};

export const subscribeToMessages = (callback) => {
  if (socket) {
    socket.on("message", callback);

    // Return an unsubscribe function to remove the listener
    return () => {
      socket.off("message", callback);
    };
  }

  return () => {}; // No-op if socket is not initialized
};
