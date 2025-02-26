import { apiCall, getAuthHeaders } from "./index";

export const notificationService = {
  sendNotification: async (message, recipientType) => {
    return await apiCall("/notifications/send", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, recipientType }),
    });
  },
};
