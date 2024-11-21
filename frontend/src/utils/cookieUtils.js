export const getCookie = (name) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(";").shift();
    }
    return null; // Return null if cookie not found
  } catch (error) {
    console.error(`Error getting cookie "${name}":`, error);
    return null; // Return null if there's an error
  }
};
