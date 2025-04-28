export const getTokenFromCookies = () => {
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    if (match) {
      return match[2]; // Return the token value from the cookie
    }
    return null; // Return null if no token is found
};

export const getUserTypeFromToken = () => {
    const token = getTokenFromCookies();
    if (!token) return null;
    
    try {
        const decoded = decodeToken(token);
        return decoded?.userType || null;
    } catch (error) {
        console.error('Error getting user type from token:', error);
        return null;
    }
};

export const getEmailFromToken = () => {
    const token = getTokenFromCookies();
    if (!token) return null;
    
    try {
        const decoded = decodeToken(token);
        return decoded?.email || null;
    } catch (error) {
        console.error('Error getting email from token:', error);
        return null;
    }
};

export const setToken = (token) => {
    // Set token with correct attributes for persistence and cross-site compatibility
    document.cookie = `token=${token}; path=/; max-age=86400; SameSite=None; Secure`;
    
    // Store user data from token
    try {
        const decoded = decodeToken(token);
        if (decoded) {
            if (decoded.userType) {
                localStorage.setItem('userType', decoded.userType);
            }
            if (decoded.email) {
                localStorage.setItem('email', decoded.email);
            }
            // Store full user data
            localStorage.setItem('user', JSON.stringify({
                userType: decoded.userType,
                email: decoded.email,
                id: decoded.id
            }));
        }
    } catch (error) {
        console.error('Error storing token data:', error);
    }
};

export const removeToken = () => {
    // Remove token with matching attributes
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    // Clear all related storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('email');
    localStorage.removeItem('notificationsEnabled');
    localStorage.removeItem('locationEnabled');
    sessionStorage.clear();
};

export const decodeToken = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};
  