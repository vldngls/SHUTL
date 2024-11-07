import jwt_decode from 'jwt-decode';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const token = getTokenFromCookies();
  let userType = null;

  if (token) {
    try {
      const decoded = jwt_decode(token);
      userType = decoded.userType;
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  if (!token || !userType || !allowedRoles.includes(userType)) {
    return <Navigate to="/ShutlLoggedOut" />;
  }

  return element;
};
