import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/introOne');
    }, 3000); // Adjust the time as needed
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      transition: 'opacity 1s',
    }}>
      <h1>SHUTL.</h1>
    </div>
  );
}

export default SplashScreen;
