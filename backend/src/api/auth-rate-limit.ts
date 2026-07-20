/**
 * Shared auth-surface rate-limit config (OWASP A07).
 * Integration tests raise the ceiling via VITEST.
 */

export const AUTH_RATE_LIMIT = {
  max: process.env.VITEST === 'true' ? 10_000 : 20,
  timeWindow: '1 minute' as const,
};
