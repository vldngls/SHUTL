import { apiRequest, getAuthHeaders } from "./index";

export const shuttleService = {
  getSummary: async () => {
    return await apiRequest("/shuttle/summary", {
      headers: getAuthHeaders(),
    });
  },

  getAssignments: async () => {
    return await apiRequest("/shuttle-assignments", {
      headers: getAuthHeaders(),
    });
  },
};
