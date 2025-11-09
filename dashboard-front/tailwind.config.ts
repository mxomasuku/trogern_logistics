// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class", ".dark-mode"], // pick ONE: `.dark` or `.dark-mode`
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
 
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;