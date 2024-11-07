import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getTokenFromCookies } from '../utils/tokenUtils';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = getTokenFromCookies();

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
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

    if (token) fetchUserType();
  }, [token]);

  if (loading) return null;  // Optional: Display a loading screen if needed

  if (!token || !userType || !allowedRoles.includes(userType)) {
    return <Navigate to="/ShutlLoggedOut" />;
  }

  return element;
};

export default ProtectedRoute;
