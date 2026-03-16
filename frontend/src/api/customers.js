import apiClient from "./client";

export const customersApi = {
  getCustomers: () => apiClient.get("/customers"),
  exportCustomers: () =>
    apiClient.get("/customers/export", { responseType: "blob" }),
};
