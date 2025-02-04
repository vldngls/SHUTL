import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = API_BASE_URL.replace('/api', '');

let socket = null;

const getAuthHeaders = () => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const initializeChat = (SOCKET_URL) => {
  if (!socket) {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token }
    });
  }
  return socket;
};

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

export const sendChatMessage = async (roomId, message) => {
  console.log('Attempting to send message:', { roomId, message });
  
  try {
    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        roomId,
        message
      })
    });

    console.log('Response status:', response.status);
    const responseData = await response.json();
    console.log('Response data:', responseData);

    if (!response.ok) {
      throw new Error(`Failed to send message: ${responseData.error || 'Unknown error'}`);
    }

    return responseData;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getChatRooms = async (email, role) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chat/rooms?email=${email}&role=${role}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch chat rooms');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    throw error;
  }
};

export const initializeChatRooms = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/initialize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to initialize chat rooms');
    }

    return await response.json();
  } catch (error) {
    console.error('Error initializing chat rooms:', error);
    throw error;
  }
}; 