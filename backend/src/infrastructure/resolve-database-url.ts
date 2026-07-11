/**
 * Resolve DATABASE_URL before Prisma Client or CLI reads it.
 *
 * Prefer an explicit DATABASE_URL when already set (CI, one-off overrides).
 * Otherwise assemble from atomic Postgres pieces so the same .env works
 * in Docker (host `postgres`) and on the host machine (host `localhost`).
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

  return {
    user: process.env.POSTGRES_USER ?? process.env.PGUSER ?? 'tador',
    password:
      process.env.POSTGRES_PASSWORD ??
      process.env.PGPASSWORD ??
      'tador_dev_password',
    host: detectPostgresHost(),
    port: process.env.POSTGRES_PORT ?? process.env.PGPORT ?? '5432',
    database:
      process.env.POSTGRES_DB ??
      process.env.PGDATABASE ??
      (isVitest ? 'tador_test' : 'tador_dev'),
  };
}

export function buildDatabaseUrl(pieces: DatabaseUrlPieces = resolveDatabasePieces()): string {
  const user = encodeURIComponent(pieces.user);
  const password = encodeURIComponent(pieces.password);
  return `postgresql://${user}:${password}@${pieces.host}:${pieces.port}/${pieces.database}`;
}

/**
 * Ensures process.env.DATABASE_URL is set. Returns the effective URL.
 * Idempotent: does not overwrite an existing DATABASE_URL.
 */
export function ensureDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0) {
    return process.env.DATABASE_URL;
  }

  const url = buildDatabaseUrl();
  process.env.DATABASE_URL = url;
  return url;
}

/** Swap only the database name in an existing Postgres URL (for admin CREATE DATABASE). */
export function withDatabaseName(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}
