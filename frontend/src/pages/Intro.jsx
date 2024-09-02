import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Intro.css'; // Ensure this path is correct

const ShutlIntro = () => {
  const navigate = useNavigate();
  const [currentIntro, setCurrentIntro] = useState(1); // State to manage which intro is displayed

  // Function to handle navigation between intros
  const handleNext = () => {
    if (currentIntro < 3) {
      setCurrentIntro(currentIntro + 1); // Move to the next intro
    } else {
      navigate('/ShutlLoggedOut'); // Navigate to the next page or wherever it needs to go after intro three
    }
  };

  return (
    <div className="intro-container">
      {currentIntro === 1 && (
        // Content for IntroOne
        <>
          <img src="intro1.png" alt="Intro 1" className="intro-image" />
          <p><b>Shuttle Tracking for Camella Daang Hari</b></p>
          <p><small>Never miss your shuttle.</small></p>
        </>
      )}
      {currentIntro === 2 && (
        // Content for IntroTwo
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          position: 'relative'
        }}>
          <img src="intro2.png" alt="Intro 2" style={{ width: '300px', height: 'auto' }} />
          <p>This is intro 2.</p>
        </div>
      )}
      {currentIntro === 3 && (
        // Content for IntroThree
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          position: 'relative'
        }}>
          <img src="intro3.png" alt="Intro 3" style={{ width: '300px', height: 'auto' }} />
          <p>This is intro 3.</p>
        </div>
      )}

      {/* Footer Section for navigation dots */}
      <div className="pagination-dots">
        <span
          className={`dot ${currentIntro === 1 ? 'active' : ''}`}
          onClick={() => setCurrentIntro(1)}
        />
        <span
          className={`dot ${currentIntro === 2 ? 'active' : ''}`}
          onClick={() => setCurrentIntro(2)}
        />
        <span
          className={`dot ${currentIntro === 3 ? 'active' : ''}`}
          onClick={() => setCurrentIntro(3)}
        />
      </div>

      {/* Button for navigation */}
      <button onClick={handleNext} className="intro-button">
        Next
      </button>
    </div>
  );
};

export default ShutlIntro;
