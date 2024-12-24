import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // Ensure this is the correct URL
let socket;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });
  }
  return socket;
};

export const sendMessage = (message) => {
  if (socket) {
    socket.emit("message", message); // Emit the message to the server
  }
};

export const subscribeToMessages = (callback) => {
  if (socket) {
    socket.on("message", callback); // Listen for messages from the server
  }
};
