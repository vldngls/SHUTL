import { apiRequest, getAuthHeaders } from "./index";

export const userService = {
  getActiveCounts: async () => {
    return await apiRequest("/users/active-users", {
      headers: getAuthHeaders(),
    });
  },
};
