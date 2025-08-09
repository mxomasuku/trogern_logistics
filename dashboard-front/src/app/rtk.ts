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

  if (res.error && (res.error as any).status === 401) {
    // Save intended destination WITHOUT polluting the URL
    try {
      const here = window.location.pathname + window.location.search;
      // keep it sane in size
      sessionStorage.setItem('postLoginRedirect', here.slice(0, 2048));
    } catch { /* ignore storage errors */ }

    // clean redirect (no big query string)
    window.location.replace('/login');
  }

  return res;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me', 'Driver', 'Vehicle', 'Service'],
  endpoints: () => ({}),
});