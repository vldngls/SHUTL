// Utility to get the token from cookies
export const getTokenFromCookies = () => {
  const match = document.cookie.match(new RegExp("(^| )token=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

// Utility to set a token in cookies
export const setTokenToCookies = (token, maxAge = 3600) => {
  document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=None; Secure`;
};

// Utility to clear the token from cookies
export const clearTokenFromCookies = () => {
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";
};

// Utility to check if a token exists in cookies
export const isTokenInCookies = () => {
  return !!getTokenFromCookies();
};
