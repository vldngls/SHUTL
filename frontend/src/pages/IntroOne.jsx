import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Intro.css'; // Ensure this path is correct

const IntroOne = () => {
  const navigate = useNavigate();

  return (
    <div className="intro-container">
      <img src="intro1.png" alt="Intro" className="intro-image" />
      <p>This is intro 1.</p>
      <button
        onClick={() => navigate('/introTwo')}
        className="intro-button"
      >
        Next
      </button>
    </div>
  );
}

export default IntroOne;
