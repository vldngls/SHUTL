import React, { useState } from 'react';
import '../css/DriverMessage.css';
import { FaPhoneAlt } from 'react-icons/fa'; // Import only the call icon

const DriverMessage = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleSendClick = () => {
    if (newMessage.trim() !== '') {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleQuickReplyClick = (reply) => {
    onSendMessage(reply);
  };

  return (
    <div className="driver-message-container">
      <div className="driver-message-header">
        <span className="header-title">Camella - Shuttle ID</span>
        <div className="header-icons">
          <button className="call-button">
            <FaPhoneAlt />
          </button>
        </div>
      </div>
      <div className="message-list">
        {messages.map((message, index) => (
          <div key={index} className="message-item">
            <strong>{message.driver}:</strong> {message.text}
          </div>
        ))}
      </div>
      <div className="quick-replies">
        <button className="quick-reply-button" onClick={() => handleQuickReplyClick('Full passenger')}>Full passenger</button>
        <button className="quick-reply-button" onClick={() => handleQuickReplyClick('Send location')}>Send location</button>
        <button className="quick-reply-button" onClick={() => handleQuickReplyClick('Emergency')}>Emergency</button>
      </div>
      <div className="message-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="message-input"
        />
        <button onClick={handleSendClick} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default DriverMessage;
