import axios, { AxiosError } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,   // send/receive your `session` cookie
  timeout: 15000,
});

// Optional: central 401 logging (don’t hard-redirect here)
http.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      // e.g., you could emit an event or clear local caches
      // window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(err);
  }
);