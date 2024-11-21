import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element, allowedRoles }) => {
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        // Fetch user type from the backend
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          method: "GET",
          credentials: "include", // Include cookies for HttpOnly token
        });

        if (response.ok) {
          const data = await response.json();
          setUserType(data.userType);
        } else {
          console.error("Failed to fetch user type:", await response.json());
        }
      } catch (error) {
        console.error("Error fetching user type:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserType(); // Call the function to fetch user type
  }, [API_BASE_URL]);

  if (loading) {
    // Optional: Display a loading spinner while fetching
    return <div>Loading...</div>;
  }

  if (!userType || !allowedRoles.includes(userType)) {
    // Redirect to the login or logged-out page if unauthorized
    return <Navigate to="/ShutlLoggedOut" />;
  }

  return element; // Render the protected element if authorized
};

export default ProtectedRoute;
