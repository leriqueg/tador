/**
 * Side-effect entry for Node CLI / Vitest: set DATABASE_URL before Prisma loads.
 * Usage: node --import ./scripts/ensure-database-url.mjs <cmd>
 *    or: import './ensure-database-url.mjs'
 */

import { existsSync } from 'node:fs';

function detectHost() {
  if (process.env.POSTGRES_HOST) return process.env.POSTGRES_HOST;
  if (process.env.PGHOST) return process.env.PGHOST;
  if (existsSync('/.dockerenv')) return 'postgres';
  return 'localhost';
}

function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const isVitest = process.env.VITEST === 'true' || process.env.VITEST === '1';
  const user = encodeURIComponent(
    process.env.POSTGRES_USER ?? process.env.PGUSER ?? 'tador',
  );
  const password = encodeURIComponent(
    process.env.POSTGRES_PASSWORD ??
      process.env.PGPASSWORD ??
      'tador_dev_password',
  );
  const host = detectHost();
  const port = process.env.POSTGRES_PORT ?? process.env.PGPORT ?? '5432';
  const database =
    process.env.POSTGRES_DB ??
    process.env.PGDATABASE ??
    (isVitest ? 'tador_test' : 'tador_dev');

  const url = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  process.env.DATABASE_URL = url;
  return url;
}

ensureDatabaseUrl();
