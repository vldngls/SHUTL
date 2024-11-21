import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/SplashScreen.css";

const SplashScreen = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const handleNavigation = async () => {
      try {
        // Send request to backend to verify token and get user type
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          method: "GET",
          credentials: "include", // Include HttpOnly cookies in the request
        });

        if (response.ok) {
          const data = await response.json();
          console.log("User data:", data); // Debugging
          const userType = data.userType;

          // Navigate based on user type
          switch (userType) {
            case "Commuter":
              navigate("/ShutlLoggedIn");
              break;
            case "Driver":
              navigate("/DriverMain");
              break;
            case "Admin":
              navigate("/AdministratorMain");
              break;
            case "Teller":
              navigate("/TellerMain");
              break;
            default:
              console.warn("Unknown userType:", userType);
              navigate("/ShutlIntro");
          }
        } else {
          console.warn("Token invalid or user not authenticated. Redirecting to intro...");
          navigate("/ShutlIntro");
        }
      } catch (error) {
        console.error("Error during navigation:", error);
        navigate("/ShutlIntro"); // Redirect to intro on error
      }
    };

    // Display splash screen for a short duration before handling navigation
    const timer = setTimeout(() => {
      handleNavigation();
    }, 3250); // 3.25 seconds delay for splash screen

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, [navigate, API_BASE_URL]);

  return (
    <div className="splash-container">
      <h1 className="splash-text">SHUTL</h1>
    </div>
  );
};

export default SplashScreen;
