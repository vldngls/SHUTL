// frontend/src/components/Chatbox.jsx
import React, { useState } from 'react';
import '../css/Chatbox.css'; // Optional: add a CSS file for styling

const Chatbox = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const handleSendMessage = () => {
        if (input.trim()) {
            const newMessage = { text: input, sender: 'user' };
            setMessages((prevMessages) => [...prevMessages, newMessage]);
            setInput('');

            // Simulate a bot response
            const botResponse = { text: `Bot: You said "${input}"`, sender: 'bot' };
            setMessages((prevMessages) => [...prevMessages, botResponse]);
        }
    };

    return (
        <div className="chatbox">
            <div className="chatbox-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`chatbox-message ${message.sender}`}>
                        {message.text}
                    </div>
                ))}
            </div>
            <div className="chatbox-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default Chatbox;
