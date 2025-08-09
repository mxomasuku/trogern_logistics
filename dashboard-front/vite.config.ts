import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import tailwindcss from "@tailwindcss/vite"


export default defineConfig({
  plugins: [react(), tailwindcss()],
   server: {
    host: '127.0.0.1', 
    port: 5173,        
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
