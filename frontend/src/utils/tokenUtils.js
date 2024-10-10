export const getTokenFromCookies = () => {
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    if (match) {
      return match[2]; // Return the token value from the cookie
    }
    return null; // Return null if no token is found
  };
  