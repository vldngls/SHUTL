// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import '../css/LoginForm.css';
import RegisterForm from './RegisterForm';

// eslint-disable-next-line react/prop-types
const LoginForm = ({ onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/users/login', { // Ensure correct URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Login successful', data);
                onClose(); // Close the modal after successful login
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred');
        }
    };

    return (
        <div className="overlay" onClick={onClose}>
            {isRegistering ? (
                <RegisterForm onClose={onClose} />
            ) : (
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
                    <div className="login-footer">
                        <span>Dont have an account?</span>
                        <button
                            className="create-account-button"
                            onClick={() => setIsRegistering(true)}
                        >
                            Create New Account
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginForm;
