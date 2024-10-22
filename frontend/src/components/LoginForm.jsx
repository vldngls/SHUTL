import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/LoginForm.css';
import RegisterForm from './RegisterForm';

const LoginForm = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/users/login', { // Make sure this URL matches your backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (response.ok) {
        const data = await response.json();
        document.cookie = `token=${data.token}; path=/; SameSite=Lax`; // Set the token as a cookie
  
        // Determine the user's type and redirect accordingly
        const userType = data.user.userType;
        if (userType === 'Commuter') {
          navigate('/ShutlLoggedIn');
        } else if (userType === 'Admin') {
          navigate('/AdministratorMain');
        } else if (userType === 'Teller') {
          navigate('/TellerMain');
        } else if (userType === 'Driver') {
          navigate('/DriverMain');
        }
  
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
          <h1 className="login-title">SHUTL</h1>
          <p className="login-subtitle">Welcome to SHUTL</p>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-input-group">
              <input
                className="login-input"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="login-input-group">
              <input
                className="login-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="login-button" type="submit">Login</button>
            {error && <div className="login-error">{error}</div>}
          </form>
          <p className="continue-with">or continue with</p>
          <button className="google-button">Google</button>
          <div className="login-footer">
            <span>Dont have an account? </span>
            <button
              className="signup-button"
              onClick={() => setIsRegistering(true)}
            >
              Sign up here.
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
