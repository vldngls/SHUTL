import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

const SOCKET_URL = API_BASE_URL;

export const connectSocket = () => {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      path: "/socket.io",
      withCredentials: true,
      autoConnect: true,
      forceNew: true
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully");
      resolve(socket);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      reject(error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        socket.connect();
      }
    });
  });
};

export const disconnectSocket = (socket) => {
  if (socket) {
    socket.disconnect();
  }
};

export const subscribeToEvent = (event, callback) => {
  return new Promise((resolve, reject) => {
    const socket = connectSocket();
    socket
      .then((socketInstance) => {
        socketInstance.on(event, callback);
        resolve(() => {
          socketInstance.off(event, callback);
          disconnectSocket(socketInstance);
        });
      })
      .catch((error) => {
        console.error(`Error subscribing to ${event}:`, error);
        reject(error);
      });
  });
}; 