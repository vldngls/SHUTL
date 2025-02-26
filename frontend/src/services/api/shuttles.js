import { apiCall, getAuthHeaders } from "./index";

export const shuttleService = {
  getSummary: async () => {
    return await apiCall("/shuttle/summary", {
      headers: getAuthHeaders(),
    });
  },

  getAssignments: async () => {
    return await apiCall("/shuttle-assignments", {
      headers: getAuthHeaders(),
    });
  },
};
