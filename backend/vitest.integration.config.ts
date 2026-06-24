import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      DATABASE_URL: 'postgresql://tador:tador_dev_password@localhost:5432/tador_test',
      SESSION_SECRET: 'test-secret-for-integration-tests',
    },
  },
});
