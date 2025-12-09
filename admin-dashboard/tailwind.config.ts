import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Navy Graphite Blue
        navy: {
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#829ab1",
          500: "#627d98",
          600: "#486581",
          700: "#334e68",
          800: "#243b53",
          900: "#0A2A43", // Primary brand color
          950: "#061a2b",
        },
        // Secondary - Electric Blue
        electric: {
          50: "#e6f3ff",
          100: "#cce7ff",
          200: "#99ceff",
          300: "#66b6ff",
          400: "#339dff",
          500: "#1473E6", // Secondary brand color
          600: "#0d5cb8",
          700: "#0a458a",
          800: "#062e5c",
          900: "#03172e",
        },
        // Support Colors
        success: {
          50: "#e6f7ed",
          100: "#c2ebd2",
          200: "#9adfb5",
          300: "#6fd397",
          400: "#4ac77e",
          500: "#1FAA59", // Success
          600: "#188947",
          700: "#126836",
          800: "#0b4724",
          900: "#052612",
        },
        warning: {
          50: "#fff8e6",
          100: "#ffedbb",
          200: "#ffe28f",
          300: "#ffd764",
          400: "#ffcc38",
          500: "#FFB020", // Warning
          600: "#cc8d1a",
          700: "#996a13",
          800: "#66470d",
          900: "#332306",
        },
        error: {
          50: "#fce8e8",
          100: "#f8c5c5",
          200: "#f39f9f",
          300: "#ed7979",
          400: "#e85858",
          500: "#D64545", // Error
          600: "#ab3737",
          700: "#802929",
          800: "#561c1c",
          900: "#2b0e0e",
        },
        info: {
          50: "#e8f4fa",
          100: "#c5e4f2",
          200: "#9fd3ea",
          300: "#79c1e1",
          400: "#58b2d9",
          500: "#4DA8DA", // Info
          600: "#3e86ae",
          700: "#2e6583",
          800: "#1f4357",
          900: "#0f222c",
        },
        // Neutrals
        neutral: {
          50: "#F8FAFC", // Off-white background
          100: "#f1f5f9",
          200: "#E2E8F0", // Light outline/border
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#334155", // Secondary text
          700: "#1E293B", // Dark text
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "card-hover":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        modal:
          "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
