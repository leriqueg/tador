import { defineConfig } from 'vitest/config';
import { ensureDatabaseUrl } from './src/infrastructure/resolve-database-url';

/**
 * Integration tests hit real Postgres via Prisma + Fastify inject.
 * DATABASE_URL is assembled from POSTGRES_* (Docker → host `postgres`,
 * host machine / CI → `localhost`) unless already set.
 */
process.env.VITEST = 'true';
ensureDatabaseUrl();

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'tests/unit/**'],
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 30000,
    hookTimeout: 60000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL!,
      SESSION_SECRET: 'test-secret-for-integration-tests',
      PORT: '0',
      VITEST: 'true',
    },
  },
});
