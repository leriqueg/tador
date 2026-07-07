import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Proxy target: in Docker compose this points to the backend service;
// locally it defaults to localhost:3000.
const PROXY_TARGET = process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true, // listen on 0.0.0.0 inside container
    watch: {
      usePolling: true, // needed for bind mounts on Windows/macOS
    },
    proxy: {
      '/auth': PROXY_TARGET,
      '/api': PROXY_TARGET,
    },
  },
})
