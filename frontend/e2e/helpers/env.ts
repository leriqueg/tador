/**
 * E2E URLs — host defaults vs Docker compose DNS.
 *
 * Host:   localhost:5173 / localhost:3000  (make test-e2e-host)
 * Docker: frontend:5173 / backend:3000    (make test-e2e — set via compose)
 */
export const FRONTEND_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
export const BACKEND_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000';
