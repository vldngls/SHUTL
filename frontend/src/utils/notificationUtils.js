export const fetchUserNotifications = async (token, retries = 3) => {
  try {
    const response = await fetch("/api/notifications/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      console.warn("Retrying fetch notifications...", retries);
      return fetchUserNotifications(token, retries - 1);
    }
    console.error("Error fetching notifications:", error);
    return [];
  }
};
