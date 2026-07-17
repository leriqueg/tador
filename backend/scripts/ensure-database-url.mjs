/**
 * Side-effect entry for Node CLI: set DATABASE_URL before Prisma loads.
 * Usage: node --import ./scripts/ensure-database-url.mjs <cmd>
 *    or: import './ensure-database-url.mjs'
 *
 * Compose sets POSTGRES_HOST=postgres. A mounted backend/.env with
 * DATABASE_URL=@localhost must be rewritten — containers cannot use localhost.
 */

import { existsSync } from 'node:fs';

function detectHost() {
  if (process.env.POSTGRES_HOST) return process.env.POSTGRES_HOST;
  if (process.env.PGHOST) return process.env.PGHOST;
  if (existsSync('/.dockerenv')) return 'postgres';
  return 'localhost';
}

function databaseNameFromUrl(url) {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return '';
  }
}

function isLoopback(host) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function alignHost(url, preferredHost) {
  try {
    const parsed = new URL(url);
    if (process.env.POSTGRES_HOST && parsed.hostname !== process.env.POSTGRES_HOST) {
      parsed.hostname = process.env.POSTGRES_HOST;
      return parsed.toString();
    }
    if (isLoopback(parsed.hostname) && !isLoopback(preferredHost)) {
      parsed.hostname = preferredHost;
      return parsed.toString();
    }
    return url;
  } catch {
    return null;
  }
}

function ensureDatabaseUrl() {
  const isVitest = process.env.VITEST === 'true' || process.env.VITEST === '1';
  const preferredHost = detectHost();

  if (process.env.DATABASE_URL) {
    const name = databaseNameFromUrl(process.env.DATABASE_URL);
    if (
      isVitest &&
      (name === 'tador_dev' || name === 'postgres' || name === '')
    ) {
      delete process.env.DATABASE_URL;
    } else {
      const aligned = alignHost(process.env.DATABASE_URL, preferredHost);
      if (aligned) {
        process.env.DATABASE_URL = aligned;
        return aligned;
      }
      delete process.env.DATABASE_URL;
    }
  }

  const user = encodeURIComponent(
    process.env.POSTGRES_USER ?? process.env.PGUSER ?? 'tador',
  );
  const password = encodeURIComponent(
    process.env.POSTGRES_PASSWORD ??
      process.env.PGPASSWORD ??
      'tador_dev_password',
  );
  const host = preferredHost;
  const port = process.env.POSTGRES_PORT ?? process.env.PGPORT ?? '5432';
  const database = isVitest
    ? (process.env.POSTGRES_TEST_DB ?? 'tador_test')
    : (process.env.POSTGRES_DB ?? process.env.PGDATABASE ?? 'tador_dev');

  const url = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  process.env.DATABASE_URL = url;
  return url;
}

ensureDatabaseUrl();
