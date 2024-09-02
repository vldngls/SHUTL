import React, { useEffect, useState } from 'react';

const SplashScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 3000); // Adjust the time as needed
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      transition: 'opacity 1s',
      opacity: show ? 1 : 0,
    }}>
      <h1>SHUTL.</h1>
    </div>
  );
}

export default SplashScreen;
