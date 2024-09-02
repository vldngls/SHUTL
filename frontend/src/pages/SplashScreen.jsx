import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SplashScreen.css'; // Update the import path

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/introOne');
    }, 3000); // Adjust the time as needed
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <h1 className="splash-text">SHUTL</h1>
    </div>
  );
}

export default SplashScreen;
