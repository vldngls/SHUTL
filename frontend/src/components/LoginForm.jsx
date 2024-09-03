import React, { useState } from 'react';
import '../css/LoginForm.css';

const LoginForm = ({ onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (response.ok) {
                // Handle successful login (e.g., save token, redirect)
                console.log('Login successful', data);
                onClose(); // Close the modal after successful login
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred');
        }
    };

    return (
        <div className="overlay" onClick={onClose}>
            <div className="login-container" onClick={(e) => e.stopPropagation()}>
                <h2 className="login-title">Login</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-input-group">
                        <label className="login-label" htmlFor="username">Username</label>
                        <input
                            className="login-input"
                            type="text"
                            id="username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="login-input-group">
                        <label className="login-label" htmlFor="password">Password</label>
                        <input
                            className="login-input"
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="login-button" type="submit">Login</button>
                    {error && <div className="login-error">{error}</div>}
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
