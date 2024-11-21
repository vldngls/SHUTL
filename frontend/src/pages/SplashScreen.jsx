import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTokenFromCookies } from "../utils/tokenUtils";
import "../css/SplashScreen.css";

const SplashScreen = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const token = getTokenFromCookies();

    const handleNavigation = async () => {
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            const userType = data.userType;

            // Navigate based on user type
            if (userType === "Commuter") {
              navigate("/ShutlLoggedIn");
            } else if (userType === "Driver") {
              navigate("/DriverMain");
            } else if (userType === "Admin") {
              navigate("/AdministratorMain");
            } else if (userType === "Teller") {
              navigate("/TellerMain");
            }
          } else {
            navigate("/ShutlIntro"); // Invalid token, navigate to Intro
          }
        } catch (error) {
          console.error("Error verifying user:", error);
          navigate("/ShutlIntro"); // Error handling
        }
      } else {
        navigate("/ShutlIntro"); // No token, go to Intro
      }
    };

    // Delay navigation to allow splash animation to finish
    const timer = setTimeout(() => {
      handleNavigation();
    }, 3250); // Matches the animation duration

    return () => clearTimeout(timer); // Cleanup timeout on unmount
  }, [navigate, API_BASE_URL]);

  return (
    <div className="splash-container">
      <h1 className="splash-text">SHUTL.</h1>
    </div>
  );
};

export default SplashScreen;
