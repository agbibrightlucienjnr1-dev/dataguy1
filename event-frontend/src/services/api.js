import axios from "axios";

// Read API URL from environment variables, falling back to development defaults
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * Fetch event details by slug
 */
export const getEventDetails = async (slug = "ai-video-masterclass") => {
  const response = await api.get(`/events/${slug}`);
  return response.data.data;
};

/**
 * Register for event & initialize Paystack
 */
export const registerForEvent = async ({
  slug = "ai-video-masterclass",
  fullName,
  phone,
  email,
  callbackUrl,
}) => {
  const response = await api.post(`/events/${slug}/register`, {
    fullName,
    phone,
    email,
    callbackUrl,
  });
  return response.data.data;
};

/**
 * Verify payment status by Paystack reference
 */
export const verifyEventPayment = async (reference) => {
  const response = await api.get(`/events/verify/${reference}`);
  return response.data.data;
};

export default api;
