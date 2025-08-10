// src/lib/theme.ts
export function getInitialDark(): boolean {
  try {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
  } catch {}
  return document.documentElement.classList.contains("dark");
}

export function setDark(on: boolean) {
  document.documentElement.classList.toggle("dark", on);
  try { localStorage.setItem("theme", on ? "dark" : "light"); } catch {}
}