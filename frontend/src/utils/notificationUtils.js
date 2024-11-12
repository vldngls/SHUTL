export const fetchUserNotifications = async (token) => {
    try {
        const response = await fetch('/api/notifications/user', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};
