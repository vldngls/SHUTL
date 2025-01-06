import React, { useState } from "react";
import "../css/DriverMessage.css";
import { FaPhoneAlt } from "react-icons/fa"; // Import only the call icon

const DriverMessage = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false); // Prevent duplicate sends

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

  return (
    <div className="DriverMessage-driver-message-container">
      <div className="DriverMessage-driver-message-header">
        <span className="DriverMessage-header-title">Camella - Shuttle ID</span>
        <div className="DriverMessage-header-icons">
          <button className="DriverMessage-call-button">
            <FaPhoneAlt />
          </button>
        </div>
      </div>
      <div className="DriverMessage-message-list">
        {messages.map((message, index) => (
          <div key={index} className="DriverMessage-message-item">
            <strong>{message.sender}:</strong> {message.text}
          </div>
        ))}
      </div>
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
