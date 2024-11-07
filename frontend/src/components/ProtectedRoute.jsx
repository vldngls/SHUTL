import React from 'react';
import { Navigate } from 'react-router-dom';
import { getTokenFromCookies } from '../utils/tokenUtils';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const token = getTokenFromCookies();
  const user = token ? JSON.parse(atob(token.split('.')[1])) : null; // Decode token to get user info
  
  const userType = user?.userType;

  // Check if the user's role is allowed
  if (!token || !userType || !allowedRoles.includes(userType)) {
    return <Navigate to="/ShutlLoggedOut" />;
  }

  return element;
};

export default ProtectedRoute;
