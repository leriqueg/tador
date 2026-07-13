import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { ProxyOptions } from 'vite'

// Proxy target: in Docker compose this points to the backend service;
// locally it defaults to localhost:3000.
const PROXY_TARGET = process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000'

/** Proxy API paths; never steal browser document navigations from the SPA. */
function apiProxy(): ProxyOptions {
  return {
    target: PROXY_TARGET,
    changeOrigin: true,
    bypass(req) {
      const accept = req.headers.accept ?? ''
      const url = req.url ?? ''
      // Dev admin HTML must reach the backend, not the SPA fallback
      if (url.startsWith('/api/dev/')) {
        return undefined
      }
      if (accept.includes('text/html')) {
        return '/index.html'
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true, // listen on 0.0.0.0 inside container
    watch: {
      usePolling: true, // needed for bind mounts on Windows/macOS
    },
    proxy: {
      // Auth + book live at top-level paths (not under /api)
      '/auth': apiProxy(),
      '/book': apiProxy(),
      // Remaining backend surface
      '/api': apiProxy(),
      '/health': apiProxy(),
    },
  },
})
