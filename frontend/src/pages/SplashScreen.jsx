import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTokenFromCookies } from "../utils/tokenUtils";
import "../css/SplashScreen.css";

const SplashScreen = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Use API_BASE_URL from environment variables
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

            // Navigate based on userType
            if (userType === "Commuter") navigate("/ShutlLoggedIn");
            else if (userType === "Driver") navigate("/DriverMain");
            else if (userType === "Admin") navigate("/AdministratorMain");
            else if (userType === "Teller") navigate("/TellerMain");
          } else {
            navigate("/ShutlIntro"); // Navigate to intro if token is invalid
          }
        } catch (error) {
          console.error("Error fetching user type:", error);
          navigate("/ShutlIntro"); // Navigate to intro on error
        }
      } else {
        navigate("/ShutlIntro"); // No token, go to intro
      }
    };

    // Set a timer to display splash screen for a few seconds, then handle navigation
    const timer = setTimeout(() => {
      handleNavigation();
    }, 3250); // Adjust time if needed

    return () => clearTimeout(timer);
  }, [navigate, API_BASE_URL]);

  return (
    <div className="splash-container">
      <h1 className="splash-text">SHUTL</h1>
    </div>
  );
};

export default SplashScreen;
