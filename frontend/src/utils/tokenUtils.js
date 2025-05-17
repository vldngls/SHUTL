export const getTokenFromCookies = () => {
    try {
        const cookies = document.cookie;
        if (!cookies) {
            console.warn('No cookies found');
            return null;
        }

        const tokenCookie = cookies
            .split(';')
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith('token='));

        if (!tokenCookie) {
            console.warn('No token cookie found');
            return null;
        }

        const token = tokenCookie.split('=')[1];
        if (!token) {
            console.warn('Empty token found');
            return null;
        }

        return token;
    } catch (error) {
        console.error('Error getting token from cookies:', error);
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

export const setTokenInCookies = (token) => {
    try {
        if (!token) {
            console.warn('Attempted to set empty token');
            return false;
        }

        // Set token with secure and httpOnly flags
        document.cookie = `token=${token}; path=/; secure; samesite=strict`;
        return true;
    } catch (error) {
        console.error('Error setting token in cookies:', error);
        return false;
    }
};

export const removeTokenFromCookies = () => {
    try {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
        return true;
    } catch (error) {
        console.error('Error removing token from cookies:', error);
        return false;
    }
};
  