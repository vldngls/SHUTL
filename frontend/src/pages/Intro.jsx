import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTokenFromCookies } from "../utils/tokenUtils"; // Import token utility
import "../css/Intro.css"; // Ensure this path is correct

const INTRO_CONTENT = [
  {
    id: 1,
    image: "intro1.png",
    title: "Shuttle Tracking for Camella Daang Hari",
    subtitle: "Never miss your shuttle.",
  },
  {
    id: 2,
    image: "intro2.png",
    title: "Prediction and consistency.",
    subtitle: "Shuttle tracking to help you manage your time and schedule",
  },
  {
    id: 3,
    image: "intro3.png",
    title: "Finance",
    subtitle: "Track every trip, every cent.",
  },
];

const IntroContent = ({ content, isAnimating }) => (
  <div className={`ShutlIntro-intro-content ${isAnimating ? "fade-out" : ""}`}>
    <img
      src={content.image}
      alt={`Intro ${content.id}`}
      className="ShutlIntro-intro-image"
    />
    <p>
      <b>{content.title}</b>
    </p>
    <p>
      <small>{content.subtitle}</small>
    </p>
  </div>
);

const PaginationDots = ({ currentIntro, onDotClick }) => (
  <div className="ShutlIntro-pagination-dots">
    {INTRO_CONTENT.map((intro) => (
      <span
        key={intro.id}
        className={`ShutlIntro-dot ${
          currentIntro === intro.id ? "active" : ""
        }`}
        onClick={() => onDotClick(intro.id)}
      />
    ))}
  </div>
);

const ShutlIntro = () => {
  const navigate = useNavigate();
  const [currentIntro, setCurrentIntro] = useState(1); // State to manage which intro is displayed
  const [isAnimating, setIsAnimating] = useState(false); // State for animation

  const handleTransition = (nextIntro) => {
    if (isAnimating) return;

    setIsAnimating(true);
    setTimeout(() => {
      if (typeof nextIntro === "function") {
        setCurrentIntro(nextIntro);
      } else {
        setCurrentIntro(nextIntro);
      }
      setIsAnimating(false);
    }, 500);
  };

  const handleNext = () => {
    if (isAnimating) return;

    if (currentIntro < 3) {
      handleTransition((prev) => prev + 1);
    } else {
      const token = getTokenFromCookies();
      navigate(token ? "/ShutlLoggedIn" : "/ShutlLoggedOut");
    }
  };

  const handleDotClick = (introNumber) => {
    if (isAnimating || introNumber === currentIntro) return;
    handleTransition(introNumber);
  };

  return (
    <div className="ShutlIntro-intro-container">
      <div className="ShutlIntro-content-wrapper">
        {INTRO_CONTENT.map(
          (content) =>
            currentIntro === content.id && (
              <IntroContent
                key={content.id}
                content={content}
                isAnimating={isAnimating}
              />
            )
        )}
      </div>

      <div className="ShutlIntro-controls">
        <PaginationDots
          currentIntro={currentIntro}
          onDotClick={handleDotClick}
        />
        <button
          onClick={handleNext}
          className="ShutlIntro-intro-button"
          disabled={isAnimating}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ShutlIntro;
