import axios from "axios";
import { API_BASE_URL } from "../shared/constants/config";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if NOT verifying token
      if (!error.config.url.includes("/auth/profile")) {
        localStorage.removeItem("authToken");
        window.location.href = "/login";
      }
    } else if (
      error.response?.status === 403 &&
      error.response?.data?.blocked
    ) {
      // Handle broadcast blocking
      const broadcast = error.response.data.broadcast;

      // Store the blocking info in localStorage for the blocking page to display
      localStorage.setItem(
        "broadcastBlock",
        JSON.stringify({
          title: broadcast?.title || "Access Blocked",
          message:
            broadcast?.message ||
            "Access temporarily blocked by administrator.",
          expiresAt: broadcast?.expiresAt,
          timestamp: new Date().toISOString(),
        })
      );

      // Redirect to a blocking page
      window.location.href = "/blocked";
    }
    return Promise.reject(error);
  }
);

export default api;
