export const getTokenFromCookies = () => {
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    if (match) {
      return match[2]; // Return the token value from the cookie
    }
    return null; // Return null if no token is found
};

export const setToken = (token) => {
    document.cookie = `token=${token}; path=/; SameSite=Lax; Secure; max-age=86400`;
};

export const removeToken = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

export const decodeToken = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};
  