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
        
        // Remove any existing token cookies first
        document.cookie = `token=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
        
        // Set cookie with proper attributes
        document.cookie = `token=${token}; path=/; max-age=86400; domain=${domain}; SameSite=Lax`;
        
        // Store in localStorage as fallback
        localStorage.setItem('token', token);
        
        // Store decoded data
        const decoded = decodeToken(token);
        if (decoded) {
            const userData = {
                userType: decoded.userType,
                email: decoded.email,
                id: decoded.id
            };
            
            // Store in sessionStorage for sensitive data
            sessionStorage.setItem('userData', JSON.stringify(userData));
            
            // Store individual fields in localStorage for convenience
            localStorage.setItem('userType', decoded.userType);
            localStorage.setItem('email', decoded.email);
            localStorage.setItem('user', JSON.stringify(userData));
        }
    } catch (error) {
        console.error('Error setting token:', error);
    }
};

export const removeToken = () => {
    try {
        const domain = window.location.hostname;
        
        // Remove cookie with proper attributes
        document.cookie = `token=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
        
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

export const refreshToken = async () => {
    try {
        const token = getTokenFromCookies();
        if (!token) return false;

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.ok) {
            const { token: newToken } = await response.json();
            setToken(newToken);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
};
  