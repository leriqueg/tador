import { defineConfig } from 'vitest/config';

/**
 * Default `vitest` / `npm test` without a config flag.
 * MUST NOT run integration DB tests (those wipe user rows via afterEach).
 * Use vitest.integration.config.ts or `npm run test:integration`.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: [],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
