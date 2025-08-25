// config.ts
const apiBase =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_BASE ?? // optional fallback if you ever set this
  '';

if (!apiBase) {
  // fail fast so you notice at build/test time
  throw new Error('VITE_API_BASE_URL is not set');
}

export const API_BASE = String(apiBase).replace(/\/+$/, '');