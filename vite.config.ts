import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Puerto 3000: es el origen que la API acepta por defecto (FRONTEND_ORIGINS).
// El proxy manda /api al backend local, así la cookie de refresh queda en el
// mismo origen durante desarrollo.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': { target: process.env.API_PROXY ?? 'http://localhost:8000', changeOrigin: true },
      '/socket.io': { target: process.env.API_PROXY ?? 'http://localhost:8000', ws: true, changeOrigin: true },
    },
  },
})
