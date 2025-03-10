import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import "../css/DriverMessage.css";
import { FaPhoneAlt, FaArrowDown } from "react-icons/fa"; // Import the down arrow icon
import {
  connectSocket,
  joinChatRoom,
  leaveChatRoom,
  subscribeToMessages,
  sendMessage as socketSendMessage,
} from "../utils/websocketService";
import {
  getChatRooms,
  sendChatMessage,
  initializeChatRooms,
} from "../utils/chatService";
import { toast } from "react-hot-toast";

const DriverMessage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false); // Prevent duplicate sends
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isInitializing, setIsInitializing] = useState(true);
  const messageListRef = useRef(null);
  const lastMessageCountRef = useRef(messages.length);
  const socket = useRef(null);
  const cleanupRef = useRef(null);

  // Memoize quick replies to prevent unnecessary re-renders
  const quickReplies = useMemo(
    () => [
      "I'm on my way",
      "Running late",
      "Almost there",
      "At the location",
      "Send location",
    ],
    []
  );

  // Optimize initialization with useCallback
  const initializeChat = useCallback(async () => {
    try {
      console.log("Initializing chat in DriverMessage component");

      // Set a timeout to show loading state for at least 300ms to avoid flashing
      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 300));

      // Initialize socket connection
      const socketPromise = connectSocket();

      // Wait for both the minimum loading time and socket connection
      const [socketInstance] = await Promise.all([
        socketPromise,
        minLoadingTime,
      ]);

      if (!socketInstance) {
        console.error("Failed to connect socket");
        setConnectionStatus("disconnected");
        toast.error("Failed to connect to chat server");
        setIsInitializing(false);
        return;
      }

      console.log("Socket connected successfully in DriverMessage");
      socket.current = socketInstance;
      setIsConnected(true);
      setConnectionStatus("connected");

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      if (!token) {
        console.error("No token found");
        toast.error("Authentication error. Please log in again.");
        setIsInitializing(false);
        return;
      }

      // Try to get cached rooms first for immediate display
      const cachedRooms = localStorage.getItem("chatRooms");
      let globalRoom = null;

      if (cachedRooms) {
        try {
          const parsedRooms = JSON.parse(cachedRooms);
          if (parsedRooms && parsedRooms.length > 0) {
            console.log("Using cached chat rooms:", parsedRooms);
            setMessages(parsedRooms[0].messages || []);
            globalRoom = parsedRooms[0];
            setCurrentRoom(globalRoom._id);

            // Join the room
            await joinChatRoom(globalRoom._id);
            console.log("Joined global room from cache:", globalRoom._id);

            // We can finish initializing now and fetch fresh data in the background
            setIsInitializing(false);
          }
        } catch (error) {
          console.error("Error parsing cached rooms:", error);
        }
      }

      // Decode token in parallel with other operations
      let decodedToken;
      try {
        decodedToken = JSON.parse(atob(token.split(".")[1]));
        console.log("Decoded token:", decodedToken);
      } catch (error) {
        console.error("Error decoding token:", error);
        setIsInitializing(false);
        return;
      }

      // Fetch fresh rooms in the background
      getChatRooms(decodedToken.email, decodedToken.userType)
        .then((rooms) => {
          console.log("Fetched chat rooms:", rooms);

          if (rooms.length === 0) {
            console.log("No chat rooms found, initializing...");
            return initializeChatRooms().then(() =>
              getChatRooms(decodedToken.email, decodedToken.userType)
            );
          }
          return rooms;
        })
        .then((rooms) => {
          if (rooms.length > 0) {
            // Cache rooms for future use
            localStorage.setItem("chatRooms", JSON.stringify(rooms));

            setMessages(rooms[0].messages || []);
            globalRoom = rooms[0];
            setCurrentRoom(globalRoom._id);

            // Only join the room if we haven't already joined from cache
            if (!globalRoom || globalRoom._id !== rooms[0]._id) {
              joinChatRoom(rooms[0]._id);
              console.log("Joined global room:", rooms[0]._id);
            }

            // If we haven't finished initializing yet, do it now
            if (isInitializing) {
              setIsInitializing(false);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching chat rooms:", error);
          if (isInitializing) {
            setIsInitializing(false);
          }
        });

      // Set up message subscription with optimized duplicate detection
      const messageCleanup = await subscribeToMessages((message) => {
        console.log("Received message:", message);
        setMessages((prev) => {
          // Check if message already exists by comparing content, sender and timestamp
          const messageExists = prev.some(
            (m) =>
              m.content === message.content &&
              m.sender.email === message.sender.email &&
              Math.abs(
                new Date(m.timestamp).getTime() -
                  new Date(message.timestamp).getTime()
              ) < 1000 // Within 1 second
          );

          if (messageExists) {
            console.log("Duplicate message detected, ignoring");
            return prev;
          }

          const newMessages = [...prev, message];
          // Scroll to bottom after messages update
          setTimeout(scrollToBottom, 100);
          return newMessages;
        });
      });

      // Set up socket event listeners
      socketInstance.on("connect", () => {
        console.log("Socket connected in DriverMessage");
        setIsConnected(true);
        setConnectionStatus("connected");
        toast.success("Chat connection restored");

        // Rejoin the room after reconnection
        if (globalRoom && globalRoom._id) {
          joinChatRoom(globalRoom._id);
        }
      });

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected in DriverMessage");
        setIsConnected(false);
        setConnectionStatus("disconnected");
        toast.warning("Chat connection lost. Attempting to reconnect...");
      });

      socketInstance.on("reconnect", () => {
        console.log("Socket reconnected in DriverMessage");
        setIsConnected(true);
        setConnectionStatus("connected");
        toast.success("Chat connection restored");

        // Rejoin the room after reconnection
        if (globalRoom && globalRoom._id) {
          joinChatRoom(globalRoom._id);
        }
      });

      cleanupRef.current = () => {
        try {
          console.log("Cleaning up socket event listeners in DriverMessage");
          socketInstance.off("connect");
          socketInstance.off("disconnect");
          socketInstance.off("reconnect");
          if (messageCleanup) messageCleanup();
        } catch (error) {
          console.error("Error during socket cleanup:", error);
        }
      };

      // If we haven't already set isInitializing to false, do it now
      if (isInitializing) {
        setIsInitializing(false);
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
      toast.error("Failed to initialize chat. Please try again later.");
      setIsInitializing(false);
    }
  }, [isInitializing]);

  // Initialize chat on mount
  useEffect(() => {
    initializeChat();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      if (currentRoom) {
        leaveChatRoom(currentRoom);
      }
    };
  }, [initializeChat]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleSendClick = async () => {
    if (isSending || !newMessage.trim() || !currentRoom || !isConnected) return;

    try {
      setIsSending(true);
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      const decodedToken = JSON.parse(atob(token.split(".")[1]));

      const messageData = {
        sender: {
          email: decodedToken.email,
          userType: decodedToken.userType,
        },
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      console.log("Sending message:", messageData);

      // First send via HTTP to ensure database persistence
      await sendChatMessage(currentRoom, messageData);

      // Then send via socket for real-time updates to other users
      // Don't include roomId in the socket message as it's sent separately
      await socketSendMessage({
        ...messageData,
        roomId: currentRoom,
      });

      // Clear input immediately for better UX
      setNewMessage("");

      // Don't add to local state here - it will come back through the socket subscription
      // This prevents duplicates

      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
      const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;

      if (isScrolledToBottom || messages.length > lastMessageCountRef.current) {
        scrollToBottom();
      } else {
        setShowScrollButton(true);
      }

      lastMessageCountRef.current = messages.length;
    }
  }, [messages]);

  const handleScroll = () => {
    if (messageListRef.current) {
      const { scrollTop, clientHeight, scrollHeight } = messageListRef.current;
      const isScrolledToBottom =
        Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
      setShowScrollButton(!isScrolledToBottom);
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
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : null;
    const isOwnMessage =
      decodedToken && message.sender.email === decodedToken.email;

    return `DriverMessage-message-item ${
      isOwnMessage ? "driver-message" : "teller-message"
    }`;
  };

  const handleQuickReplyClick = async (replyText) => {
    if (!currentRoom || !isConnected) return;

    try {
      setIsSending(true);
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      const decodedToken = JSON.parse(atob(token.split(".")[1]));

      const messageData = {
        sender: {
          email: decodedToken.email,
          userType: decodedToken.userType,
        },
        content: replyText,
        timestamp: new Date().toISOString(),
      };

      console.log("Sending quick reply:", messageData);

      // First send via HTTP to ensure database persistence
      await sendChatMessage(currentRoom, messageData);

      // Then send via socket for real-time updates to other users
      await socketSendMessage({
        ...messageData,
        roomId: currentRoom,
      });

      // Don't add to local state here - it will come back through the socket subscription
      // This prevents duplicates

      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending quick reply:", error);
      toast.error("Failed to send quick reply. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Add this to your JSX where you want the quick replies to appear
  const renderQuickReplies = () => (
    <div className="DriverMessage-quick-replies">
      {quickReplies.map((reply, index) => (
        <button
          key={index}
          className="DriverMessage-quick-reply-button"
          onClick={() => handleQuickReplyClick(reply)}
          disabled={!isConnected || isSending}
        >
          {reply}
        </button>
      ))}
    </div>
  );

  // Render with loading state
  return (
    <div className="DriverMessage-driver-message-container">
      <div className="DriverMessage-driver-message-header">
        <span className="DriverMessage-header-title">
          Camella - Shuttle ID
          {connectionStatus !== "connected" && (
            <span className="connection-status">
              (
              {connectionStatus === "connecting"
                ? "Connecting..."
                : "Disconnected"}
              )
            </span>
          )}
        </span>
        <div className="DriverMessage-header-icons">
          <button
            className="DriverMessage-call-button"
            onClick={handleCallClick}
          >
            <FaPhoneAlt />
          </button>
        </div>
      </div>

      {isInitializing ? (
        <div className="DriverMessage-loading">
          <div className="DriverMessage-loading-spinner"></div>
          <div>Loading messages...</div>
        </div>
      ) : (
        <>
          <div
            className="DriverMessage-message-list"
            ref={messageListRef}
            onScroll={handleScroll}
          >
            {messages.length === 0 ? (
              <div className="DriverMessage-no-messages">
                No messages yet. Start a conversation!
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={getMessageClassName(message)}>
                  <div className="message-header">
                    <span className="sender-info">{message.sender.email}</span>
                    <span className="timestamp">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))
            )}
          </div>
          {renderQuickReplies()}
          {showScrollButton && (
            <button
              className="DriverMessage-scroll-button"
              onClick={scrollToBottom}
            >
              <FaArrowDown />
            </button>
          )}
        </>
      )}

      <div className="DriverMessage-message-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type your message..." : "Connecting..."}
          className="DriverMessage-message-input"
          disabled={!isConnected || isSending || isInitializing}
        />
        <button
          onClick={handleSendClick}
          className="DriverMessage-send-button"
          disabled={
            isSending ||
            !newMessage.trim() ||
            !currentRoom ||
            !isConnected ||
            isInitializing
          }
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default DriverMessage;
