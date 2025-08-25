// src/lib/config.ts
export const API_BASE = (() => {
  const raw =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (import.meta.env.VITE_API_BASE as string | undefined);

  if (!raw) {
    // Optional: pick a safe default or loudly fail
    console.warn(
      'VITE_API_BASE_URL not set at build time; defaulting to window.location.origin'
    );
    return window.location.origin;
  }
  return raw.replace(/\/+$/, '');
})();