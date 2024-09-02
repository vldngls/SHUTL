import React from 'react';
import { useNavigate } from 'react-router-dom';

const IntroTwo = () => {
    const navigate = useNavigate();
  
    return (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        position: 'relative'
      }}>
        <img src="your-image-url.jpg" alt="Intro" style={{ width: '300px', height: 'auto' }} />
        <p>This is intro 2.</p>
        <button
          onClick={() => navigate('/introThree')}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            padding: '10px 20px',
          }}
        >
          Next
        </button>
      </div>
  );
}

export default IntroTwo;
