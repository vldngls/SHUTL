import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTokenFromCookies } from "../utils/tokenUtils"; // Import token utility
import "../css/Intro.css"; // Ensure this path is correct

const ShutlIntro = () => {
  const navigate = useNavigate();
  const [currentIntro, setCurrentIntro] = useState(1); // State to manage which intro is displayed
  const [isAnimating, setIsAnimating] = useState(false); // State for animation

  // Function to handle navigation between intros
  const handleNext = () => {
    if (isAnimating) return; // Prevent multiple clicks during animation
    setIsAnimating(true);

    setTimeout(() => {
      const token = getTokenFromCookies();
      if (currentIntro < 3) {
        setCurrentIntro(currentIntro + 1); // Move to the next intro
      } else {
        // After the last intro slide, navigate based on token availability
        if (token) {
          navigate("/ShutlLoggedIn"); // Navigate to logged-in page if token is found
        } else {
          navigate("/ShutlLoggedOut"); // Otherwise, navigate to login page
        }
      }
      setIsAnimating(false); // Reset animation state
    }, 500); // Match the duration of the fade-out animation
  };

  return (
    <div className="ShutlIntro-intro-container">
      {currentIntro === 1 && (
        <div className={`ShutlIntro-intro-content ${isAnimating ? "fade-out" : ""}`}>
          <img
            src="intro1.png"
            alt="Intro 1"
            className="ShutlIntro-intro-image"
          />
          <p>
            <b>Shuttle Tracking for Camella Daang Hari</b>
          </p>
          <p>
            <small>Never miss your shuttle.</small>
          </p>
        </div>
      )}
      {currentIntro === 2 && (
        <div className={`ShutlIntro-intro-content ${isAnimating ? "fade-out" : ""}`}>
          <img
            src="intro2.png"
            alt="Intro 2"
            className="ShutlIntro-intro-image"
          />
          <p>
            <b>Prediction and consistency.</b>
          </p>
          <p>
            <small>
              Shuttle tracking to help you manage your time and schedule
            </small>
          </p>
        </div>
      )}
      {currentIntro === 3 && (
        <div className={`ShutlIntro-intro-content ${isAnimating ? "fade-out" : ""}`}>
          <img
            src="intro3.png"
            alt="Intro 3"
            className="ShutlIntro-intro-image"
          />
          <p>
            <b>Finance</b>
          </p>
          <p>
            <small>Track every trip, every cent.</small>
          </p>
        </div>
      )}

      <div className="ShutlIntro-pagination-dots">
        <span
          className={`ShutlIntro-dot ${currentIntro === 1 ? "active" : ""}`}
          onClick={() => setCurrentIntro(1)}
        />
        <span
          className={`ShutlIntro-dot ${currentIntro === 2 ? "active" : ""}`}
          onClick={() => setCurrentIntro(2)}
        />
        <span
          className={`ShutlIntro-dot ${currentIntro === 3 ? "active" : ""}`}
          onClick={() => setCurrentIntro(3)}
        />
      </div>

      <button onClick={handleNext} className="ShutlIntro-intro-button" disabled={isAnimating}>
        Next
      </button>
    </div>
  );
};

export default ShutlIntro;
