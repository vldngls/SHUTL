export const getTokenFromCookies = () => {
    try {
        // First try to get from cookies
        const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
        if (match) {
            return match[2];
        }

        // Fallback to localStorage for mobile devices
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            // If we found it in localStorage but not cookies, try to set the cookie
            setToken(storedToken);
            return storedToken;
        }

        return null;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
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
    try {
        // Get the current domain
        const domain = window.location.hostname;
        
        // Set cookie with all necessary attributes
        document.cookie = `token=${token}; path=/; max-age=86400; domain=${domain}; SameSite=None; Secure`;
        
        // Also store in localStorage as fallback
        localStorage.setItem('token', token);
        
        // Store user data from token
        try {
            const decoded = decodeToken(token);
            if (decoded) {
                const userData = {
                    userType: decoded.userType,
                    email: decoded.email,
                    id: decoded.id
                };
                
                // Store in localStorage
                localStorage.setItem('userType', decoded.userType);
                localStorage.setItem('email', decoded.email);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Also store in sessionStorage for sensitive data
                sessionStorage.setItem('userData', JSON.stringify(userData));
            }
        } catch (error) {
            console.error('Error storing token data:', error);
        }
    } catch (error) {
        console.error('Error setting token:', error);
    }
};

export const removeToken = () => {
    try {
        const domain = window.location.hostname;
        
        // Remove cookie with exact attributes matching the original cookie
        document.cookie = `token=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure`;
        
        // Also try with the specific domain shutl.justbecause.ph
        document.cookie = `token=; path=/; domain=shutl.justbecause.ph; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure`;
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
    } catch (error) {
        console.error('Error removing token:', error);
    }
};

export const validateToken = () => {
    try {
        const token = getTokenFromCookies();
        if (!token) return false;
        
        const decoded = decodeToken(token);
        if (!decoded) return false;
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            removeToken();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error validating token:', error);
        return false;
    }
};

export const decodeToken = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};
  