import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <h1>404</h1>
      <h2>Oops! Page Not Found</h2>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <button onClick={() => navigate(-1)} className="back-button">
        Go Back
      </button>
    </div>
  );
};

export default NotFound; 