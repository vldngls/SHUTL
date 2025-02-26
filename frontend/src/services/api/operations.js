import { apiCall, getAuthHeaders } from "./index";

export const operationsService = {
  getOperationalHours: async () => {
    return await apiCall("/operational-hours", {
      headers: getAuthHeaders(),
    });
  },

  updateOperationalHours: async (operationalHours) => {
    return await apiCall("/operational-hours", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(operationalHours),
    });
  },
};
