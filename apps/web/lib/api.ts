import axios from "axios";
import { useAuthStore } from "@/store/auth-store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("duolar_csrf="))
    ?.split("=")[1];
  if (csrfToken) config.headers["X-CSRF-Token"] = decodeURIComponent(csrfToken);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
