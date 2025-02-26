import { apiCall, getAuthHeaders } from "./index";

export const userService = {
  getActiveCounts: async () => {
    return await apiCall("/users/active-users", {
      headers: getAuthHeaders(),
    });
  },
};
