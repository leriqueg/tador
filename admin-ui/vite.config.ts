import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'

// Proxy target: in Docker compose this points to the backend service;
// locally it defaults to localhost:3000.
const PROXY_TARGET = process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000'

/** Proxy admin API paths; never steal browser document navigations from the SPA. */
function apiProxy(): ProxyOptions {
  return {
    target: PROXY_TARGET,
    changeOrigin: true,
    bypass(req) {
      const accept = req.headers.accept ?? ''
      if (accept.includes('text/html')) {
        return '/index.html'
      }
    },
  }
}

/** Public path prefix behind nginx (e.g. `/admin-ui/`). Default `/` for direct Vite access. */
function viteBase(): string {
  const raw = process.env.VITE_BASE_PATH ?? '/'
  if (raw === '/' || raw === '') return '/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

export default defineConfig({
  base: viteBase(),
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: ['admin-ui', 'localhost', '127.0.0.1', 'gateway'],
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api/admin': apiProxy(),
      '/health': apiProxy(),
    },
  },
})
