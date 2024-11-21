export const getTokenFromCookies = () => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; token=`);
    if (parts.length === 2) {
      return parts.pop().split(";").shift();
    }
    return null; // Return null if token cookie not found
  } catch (error) {
    console.error("Error retrieving token from cookies:", error);
    return null; // Return null if an error occurs
  }
};
