import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { defineConfig } from 'vitest/config';
import { ensureDatabaseUrl } from './src/infrastructure/resolve-database-url';

/**
 * Integration tests hit real Postgres via Prisma + Fastify inject.
 *
 * Env precedence:
 * 1. Force VITEST + load backend/.env.test (override pieces)
 * 2. Discard any DATABASE_URL that points at tador_dev / postgres
 * 3. ensureDatabaseUrl() → tador_test
 *
 * Never uses backend/.env (tador_dev) for cleanup targets.
 */
process.env.VITEST = 'true';

const root = dirname(fileURLToPath(import.meta.url));
const envTestPath = resolve(root, '.env.test');
if (existsSync(envTestPath)) {
  // override: true → win over leaked shell/Compose POSTGRES_DB / DATABASE_URL
  loadDotenv({ path: envTestPath, override: true });
} else {
  console.warn(
    `[vitest] missing ${envTestPath} — copy .env.test.example → .env.test`,
  );
}

// Drop forbidden URLs after dotenv (e.g. a DATABASE_URL=…/tador_dev export)
if (process.env.DATABASE_URL) {
  try {
    const name = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '');
    if (name === 'tador_dev' || name === 'postgres' || name === '') {
      delete process.env.DATABASE_URL;
    }
  } catch {
    delete process.env.DATABASE_URL;
  }
}

const databaseUrl = ensureDatabaseUrl();
const testDb = process.env.POSTGRES_TEST_DB ?? 'tador_test';

if (!databaseUrl.includes(`/${testDb}`)) {
  throw new Error(
    `[vitest] Refusing to start integration tests: DATABASE_URL must target ${testDb}, got ${databaseUrl}`,
  );
}

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
      DATABASE_URL: databaseUrl,
      SESSION_SECRET:
        process.env.SESSION_SECRET ?? 'test-secret-for-integration-tests',
      PORT: '0',
      VITEST: 'true',
      POSTGRES_TEST_DB: testDb,
      // Prevent Compose POSTGRES_DB from surviving into workers
      POSTGRES_DB: testDb,
    },
  },
});
