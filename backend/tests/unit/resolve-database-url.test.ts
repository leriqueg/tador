import { afterEach, describe, expect, it } from 'vitest';
import {
  alignDatabaseUrlHost,
  ensureDatabaseUrl,
  resolveDatabasePieces,
} from '../../src/infrastructure/resolve-database-url.js';

describe('resolveDatabasePieces / ensureDatabaseUrl', () => {
  const original = { ...process.env };

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in original)) delete process.env[key];
    }
    Object.assign(process.env, original);
  });

  it('Vitest ignores compose POSTGRES_DB and uses tador_test', () => {
    process.env.VITEST = 'true';
    process.env.POSTGRES_DB = 'tador_dev';
    delete process.env.POSTGRES_TEST_DB;
    delete process.env.DATABASE_URL;

    expect(resolveDatabasePieces().database).toBe('tador_test');
  });

  it('non-Vitest uses POSTGRES_DB', () => {
    delete process.env.VITEST;
    process.env.POSTGRES_DB = 'tador_dev';

    expect(resolveDatabasePieces().database).toBe('tador_dev');
  });

  it('Vitest discards DATABASE_URL pointing at tador_dev', () => {
    process.env.VITEST = 'true';
    process.env.POSTGRES_DB = 'tador_dev';
    process.env.DATABASE_URL =
      'postgresql://tador:tador_dev_password@postgres:5432/tador_dev';
    delete process.env.POSTGRES_TEST_DB;

    const url = ensureDatabaseUrl();
    expect(url).toContain('/tador_test');
    expect(url).not.toContain('/tador_dev');
  });

  it('Compose POSTGRES_HOST rewrites localhost from mounted backend/.env', () => {
    delete process.env.VITEST;
    process.env.POSTGRES_HOST = 'postgres';
    process.env.POSTGRES_DB = 'tador_dev';
    process.env.DATABASE_URL =
      'postgresql://tador:tador_dev_password@localhost:5432/tador_dev';

    const url = ensureDatabaseUrl();
    expect(url).toContain('@postgres:5432/tador_dev');
    expect(url).not.toContain('@localhost');
  });

  it('alignDatabaseUrlHost keeps localhost when preferred host is localhost', () => {
    delete process.env.POSTGRES_HOST;
    const url = alignDatabaseUrlHost(
      'postgresql://tador:x@localhost:5432/tador_dev',
      'localhost',
    );
    expect(url).toContain('@localhost:5432/');
  });
});
