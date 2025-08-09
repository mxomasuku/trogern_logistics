import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE } from "@/lib/config";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  credentials: "include",                 // <-- send cookies always
  prepareHeaders: (headers) => {
    // OPTIONAL: include CSRF header if your backend sets a non-httpOnly XSRF cookie
    const csrf = (document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1]);
    if (csrf) headers.set("x-csrf-token", csrf);
    return headers;
  },
});

/** Wrap baseQuery to catch 401s globally */
const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const res = await rawBaseQuery(args, api, extraOptions);

  // If session is invalid/expired, clear cached "me" and bounce to login
  if (res.error && (res.error as any).status === 401) {
    api.dispatch({ type: "auth/unauthorized" }); // no-op reducer is fine
    if (typeof window !== "undefined") {
      const here = window.location.pathname + window.location.search;
      const to = "/login" + (here && here !== "/" ? `?from=${encodeURIComponent(here)}` : "");
      window.location.replace(to);
    }
  }
  return res;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Me", "Driver", "Vehicle", "Service"],
  endpoints: () => ({}),
});