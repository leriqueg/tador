/**
 * Resolve DATABASE_URL before Prisma Client or CLI reads it.
 *
 * Compose injects POSTGRES_* (including POSTGRES_HOST=postgres).
 * Host tools often have backend/.env with DATABASE_URL=…@localhost….
 * When both exist, the runtime host (POSTGRES_HOST / /.dockerenv) MUST win —
 * containers cannot reach Postgres via localhost.
 *
 * Host detection: POSTGRES_HOST / PGHOST → /.dockerenv → localhost.
 */

import { existsSync } from 'node:fs';

export type DatabaseUrlPieces = {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
};

export function detectPostgresHost(): string {
  if (process.env.POSTGRES_HOST) return process.env.POSTGRES_HOST;
  if (process.env.PGHOST) return process.env.PGHOST;
  if (existsSync('/.dockerenv')) return 'postgres';
  return 'localhost';
}

export function resolveDatabasePieces(): DatabaseUrlPieces {
  const isVitest = process.env.VITEST === 'true' || process.env.VITEST === '1';

  // Vitest MUST never inherit compose POSTGRES_DB=tador_dev — afterEach wipes users.
  // Override only via DATABASE_URL (ensureDatabaseUrl) or POSTGRES_TEST_DB.
  const database = isVitest
    ? (process.env.POSTGRES_TEST_DB ?? 'tador_test')
    : (process.env.POSTGRES_DB ?? process.env.PGDATABASE ?? 'tador_dev');

  return {
    user: process.env.POSTGRES_USER ?? process.env.PGUSER ?? 'tador',
    password:
      process.env.POSTGRES_PASSWORD ??
      process.env.PGPASSWORD ??
      'tador_dev_password',
    host: detectPostgresHost(),
    port: process.env.POSTGRES_PORT ?? process.env.PGPORT ?? '5432',
    database,
  };
}

export function buildDatabaseUrl(pieces: DatabaseUrlPieces = resolveDatabasePieces()): string {
  const user = encodeURIComponent(pieces.user);
  const password = encodeURIComponent(pieces.password);
  return `postgresql://${user}:${password}@${pieces.host}:${pieces.port}/${pieces.database}`;
}

function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

/**
 * Rewrite host in DATABASE_URL when runtime wants a different host
 * (Compose POSTGRES_HOST=postgres vs mounted backend/.env localhost).
 */
export function alignDatabaseUrlHost(
  url: string,
  preferredHost: string = detectPostgresHost(),
): string {
  try {
    const parsed = new URL(url);
    const currentHost = parsed.hostname;

    if (process.env.POSTGRES_HOST && currentHost !== process.env.POSTGRES_HOST) {
      parsed.hostname = process.env.POSTGRES_HOST;
      return parsed.toString();
    }

    if (isLoopbackHost(currentHost) && !isLoopbackHost(preferredHost)) {
      parsed.hostname = preferredHost;
      return parsed.toString();
    }

    return url;
  } catch {
    return buildDatabaseUrl();
  }
}

/**
 * Ensures process.env.DATABASE_URL is set. Returns the effective URL.
 * Idempotent for safe URLs. Under Vitest, discards known app/dev DB names
 * so integration cleanup never hits tador_dev.
 */
export function ensureDatabaseUrl(): string {
  const isVitest = process.env.VITEST === 'true' || process.env.VITEST === '1';

  if (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0) {
    if (isVitest && isForbiddenDatabaseForVitest(process.env.DATABASE_URL)) {
      delete process.env.DATABASE_URL;
    } else {
      const aligned = alignDatabaseUrlHost(process.env.DATABASE_URL);
      process.env.DATABASE_URL = aligned;
      return aligned;
    }
  }

  const url = buildDatabaseUrl();
  process.env.DATABASE_URL = url;
  return url;
}

/** App/dev database names that must never be wiped by Vitest afterEach. */
function isForbiddenDatabaseForVitest(url: string): boolean {
  try {
    const name = new URL(url).pathname.replace(/^\//, '');
    return name === 'tador_dev' || name === 'postgres' || name === '';
  } catch {
    return true;
  }
}

/** Swap only the database name in an existing Postgres URL (for admin CREATE DATABASE). */
export function withDatabaseName(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}
