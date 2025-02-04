import React, { useState, useEffect, useRef } from "react";
import "../css/DriverMessage.css";
import { FaPhoneAlt, FaArrowDown } from "react-icons/fa"; // Import the down arrow icon

const DriverMessage = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false); // Prevent duplicate sends
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messageListRef = useRef(null);
  const lastMessageCountRef = useRef(messages.length);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleSendClick = () => {
    if (isSending) return; // Prevent duplicate sends

    if (newMessage.trim() !== "") {
      setIsSending(true);
      console.log("Sending message:", newMessage);
      onSendMessage(newMessage); // Call the parent-provided handler to send the message
      setNewMessage(""); // Clear the input field after sending

      // Reset the isSending flag after a short delay
      setTimeout(() => setIsSending(false), 300);
    }
  };

  const handleQuickReplyClick = (reply) => {
    if (isSending) return; // Prevent duplicate sends

    setIsSending(true);
    console.log("Quick reply sent:", reply);
    onSendMessage(reply); // Call the handler with the quick reply text

    // Reset the isSending flag after a short delay
    setTimeout(() => setIsSending(false), 300);
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
          <div key={index} className={`DriverMessage-message-item ${message.sender === "Teller" ? "teller-message" : "driver-message"}`}>
            <strong>{message.sender}:</strong> {message.text}
          </div>
        ))}
      </div>
      {showScrollButton && (
        <button className="DriverMessage-scroll-button" onClick={scrollToBottom}>
          <FaArrowDown />
        </button>
      )}
      <div className="DriverMessage-quick-replies">
        <button
          className="DriverMessage-quick-reply-button"
          onClick={() => handleQuickReplyClick("Full passenger")}
        >
          Full passenger
        </button>
        <button
          className="DriverMessage-quick-reply-button"
          onClick={() => handleQuickReplyClick("Send location")}
        >
          Send location
        </button>
        <button
          className="DriverMessage-quick-reply-button"
          onClick={() => handleQuickReplyClick("Emergency")}
        >
          Emergency
        </button>
      </div>
      <div className="DriverMessage-message-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="DriverMessage-message-input"
        />
        <button onClick={handleSendClick} className="DriverMessage-send-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default DriverMessage;
