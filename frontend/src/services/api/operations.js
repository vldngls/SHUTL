import { apiRequest, getAuthHeaders } from "./index";

export const operationsService = {
  getOperationalHours: async () => {
    return await apiRequest("/operational-hours", {
      headers: getAuthHeaders(),
    });
  },

  updateOperationalHours: async (operationalHours) => {
    return await apiRequest("/operational-hours", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(operationalHours),
    });
  },
};
