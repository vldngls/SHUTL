import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTokenFromCookies } from "../utils/tokenUtils";
import "../css/Intro.css";

const ShutlIntro = () => {
  const navigate = useNavigate();
  const [currentIntro, setCurrentIntro] = useState(1);

  useEffect(() => {
    const token = getTokenFromCookies();
    console.log("All cookies:", document.cookie); // Log all cookies
    console.log("Token found in cookies:", token); // Log the token

    if (token) {
      navigate("/ShutlLoggedIn");
    } else {
      navigate("/ShutlLoggedOut");
    }
  }, [navigate]);

  const handleNext = () => {
    const token = getTokenFromCookies();
    console.log("Token on Next button click:", token); // Log token on click

    if (currentIntro < 3) {
      setCurrentIntro(currentIntro + 1);
    } else {
      if (token) {
        navigate("/ShutlLoggedIn");
      } else {
        navigate("/ShutlLoggedOut");
      }
    }
  };

  return (
    <div className="ShutlIntro-intro-container">
      {currentIntro === 1 && (
        <>
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
        </>
      )}
      {currentIntro === 2 && (
        <div className="ShutlIntro-intro-content">
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
              Shuttle tracking to help you manage your time and schedule.
            </small>
          </p>
        </div>
      )}
      {currentIntro === 3 && (
        <div className="ShutlIntro-intro-content">
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

      <button onClick={handleNext} className="ShutlIntro-intro-button">
        Next
      </button>
    </div>
  );
};

export default ShutlIntro;
