import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '@/lib/config';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const csrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
    if (csrf) headers.set('x-csrf-token', csrf);
    return headers;
  },
});

const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extra) => {
  const res = await rawBaseQuery(args, api, extra);

  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const isOnLoginPage = path === "/login";

  // figure out the request URL
  const url =
    typeof args === "string" ? args :
    typeof args === "object" && "url" in args ? (args as any).url :
    "";

  const isAuthLogin = typeof url === "string" && url.includes("/auth/login");

  if (res.error && (res.error as any).status === 401 && !isOnLoginPage && !isAuthLogin) {
    try {
      const here = window.location.pathname + window.location.search;
      sessionStorage.setItem("postLoginRedirect", here.slice(0, 2048));
    } catch {}
    window.location.replace("/login"); // still hard reload, but never from the login call itself
  }

  return res;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me', 'Driver', 'Vehicle', 'Service'],
  endpoints: () => ({}),
});