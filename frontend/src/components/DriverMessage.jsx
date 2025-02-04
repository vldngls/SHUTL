import React, { useState, useEffect, useRef } from "react";
import "../css/DriverMessage.css";
import { FaPhoneAlt, FaArrowDown } from "react-icons/fa"; // Import the down arrow icon
import { connectSocket, joinChatRoom, leaveChatRoom } from "../utils/websocketService";
import { getChatRooms, sendChatMessage, initializeChatRooms } from "../utils/chatService";

const DriverMessage = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false); // Prevent duplicate sends
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const messageListRef = useRef(null);
  const lastMessageCountRef = useRef(messages.length);
  const socket = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const SOCKET_URL = API_BASE_URL.replace("/api", "");
  const [userRole, setUserRole] = useState("Driver");

  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (!socket.current) {
          socket.current = connectSocket();
        }

        const token = document.cookie.split("; ").find(row => row.startsWith("token="))?.split("=")[1];
        if (!token) {
          console.error("No token found");
          return;
        }

        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        console.log("Decoded token:", decodedToken);
        
        let rooms = await getChatRooms(decodedToken.email, decodedToken.userType);
        console.log("Fetched chat rooms:", rooms);
        
        if (rooms.length === 0) {
          console.log("No chat rooms found, initializing...");
          await initializeChatRooms();
          rooms = await getChatRooms(decodedToken.email, decodedToken.userType);
        }
        
        if (rooms.length > 0) {
          const globalRoom = rooms[0];
          setChatRooms([globalRoom]);
          setCurrentRoom(globalRoom._id);
          setMessages(globalRoom.messages || []);
          
          socket.current.emit('join_room', globalRoom._id);
          console.log("Joined global room:", globalRoom._id);
        }

        // Remove any existing listeners before adding a new one
        socket.current.off("chat_message");
        
        // Add new message listener
        socket.current.on("chat_message", (message) => {
          console.log("Received message:", message);
          setMessages(prev => {
            // Check if message already exists
            const messageExists = prev.some(m => 
              m.content === message.content && 
              m.sender.email === message.sender.email &&
              new Date(m.timestamp).getTime() === new Date(message.timestamp).getTime()
            );
            if (messageExists) {
              return prev;
            }
            const newMessages = [...prev, message];
            // Scroll to bottom after messages update
            setTimeout(() => scrollToBottom(), 100);
            return newMessages;
          });
        });

      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    initializeChat();

    return () => {
      if (socket.current) {
        socket.current.off("chat_message");
        if (currentRoom) {
          socket.current.emit('leave_room', currentRoom);
        }
      }
    };
  }, []);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setUserRole(decodedToken.role);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleSendClick = async () => {
    if (isSending || !newMessage.trim() || !currentRoom) return;

    try {
      setIsSending(true);
      const token = document.cookie.split("; ").find(row => row.startsWith("token="))?.split("=")[1];
      const decodedToken = JSON.parse(atob(token.split(".")[1]));

      const messageData = {
        sender: {
          email: decodedToken.email,
          userType: decodedToken.userType
        },
        content: newMessage.trim(),
        timestamp: new Date()
      };

      // First save to database
      await sendChatMessage(currentRoom, messageData);
      
      // Then emit socket event - this will trigger the chat_message event for all clients including sender
      socket.current.emit('chat_message', {
        roomId: currentRoom,
        message: messageData
      });

      // Clear input but don't update messages - let the socket event handle that
      setNewMessage("");
      
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  // Function to handle the call action
  const handleCallClick = () => {
    const phoneNumber = "1234567890"; // Replace with the actual phone number
    window.location.href = `tel:${phoneNumber}`; // Initiates a phone call
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;

      if (messages.length > lastMessageCountRef.current) {
        setShowScrollButton(true);
      }

      lastMessageCountRef.current = messages.length;
    }
  }, [messages]);

  const handleScroll = () => {
    if (messageListRef.current) {
      const { scrollTop, clientHeight, scrollHeight } = messageListRef.current;
      setShowScrollButton(scrollTop + clientHeight < scrollHeight);
    }
  };

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      setShowScrollButton(false);
    }
  };

  // Add this function to determine message style
  const getMessageClassName = (message) => {
    const token = document.cookie.split("; ").find(row => row.startsWith("token="))?.split("=")[1];
    const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : null;
    const isOwnMessage = decodedToken && message.sender.email === decodedToken.email;
    
    return `DriverMessage-message-item ${isOwnMessage ? 'driver-message' : 'teller-message'}`;
  };

  const handleQuickReplyClick = async (replyText) => {
    if (!currentRoom) return;

    try {
      const token = document.cookie.split("; ").find(row => row.startsWith("token="))?.split("=")[1];
      const decodedToken = JSON.parse(atob(token.split(".")[1]));

      const messageData = {
        sender: {
          email: decodedToken.email,
          userType: decodedToken.userType
        },
        content: replyText,
        timestamp: new Date()
      };

      // Save to database
      await sendChatMessage(currentRoom, messageData);
      
      // Emit socket event
      socket.current.emit('chat_message', {
        roomId: currentRoom,
        message: messageData
      });

    } catch (error) {
      console.error("Error sending quick reply:", error);
    }
  };

  // Quick reply options
  const quickReplies = [
    "I'm on my way",
    "Running late",
    "Almost there",
    "At the location",
    "Send location"
  ];

  // Add this to your JSX where you want the quick replies to appear
  const renderQuickReplies = () => (
    <div className="DriverMessage-quick-replies">
      {quickReplies.map((reply, index) => (
        <button
          key={index}
          className="DriverMessage-quick-reply-button"
          onClick={() => handleQuickReplyClick(reply)}
        >
          {reply}
        </button>
      ))}
    </div>
  );

  return (
    <div className="DriverMessage-driver-message-container">
      <div className="DriverMessage-driver-message-header">
        <span className="DriverMessage-header-title">Camella - Shuttle ID</span>
        <div className="DriverMessage-header-icons">
          <button className="DriverMessage-call-button" onClick={handleCallClick}>
            <FaPhoneAlt />
          </button>
        </div>
      </div>
      <div className="DriverMessage-message-list" ref={messageListRef} onScroll={handleScroll}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={getMessageClassName(message)}
          >
            <div className="message-header">
              <span className="sender-info">
                {message.sender.email}
              </span>
              <span className="timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
      </div>
      {renderQuickReplies()}
      {showScrollButton && (
        <button className="DriverMessage-scroll-button" onClick={scrollToBottom}>
          <FaArrowDown />
        </button>
      )}
      <div className="DriverMessage-message-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="DriverMessage-message-input"
        />
        <button 
          onClick={handleSendClick} 
          className="DriverMessage-send-button"
          disabled={isSending || !newMessage.trim() || !currentRoom}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default DriverMessage;
