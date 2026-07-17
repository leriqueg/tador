/**
 * Test setup — resolve DB URL, ensure tador_test exists, migrate + seed.
 *
 * Hard rules:
 * - Only ever touch POSTGRES_TEST_DB (default tador_test).
 * - Prisma clients are constructed with an explicit datasources URL (never
 *   rely on Prisma silently reloading backend/.env → tador_dev).
 * - afterEach refuses to wipe unless current_database() matches.
 */

import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import {
  ensureDatabaseUrl,
  resolveDatabasePieces,
  withDatabaseName,
} from '../src/infrastructure/resolve-database-url.js';

process.env.VITEST = 'true';

const ALLOWED_TEST_DB = process.env.POSTGRES_TEST_DB ?? 'tador_test';
const databaseUrl = ensureDatabaseUrl();

function databaseNameFromUrl(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return '';
  }
}

function assertSafeTestDatabase(label: string): void {
  const fromUrl = databaseNameFromUrl(process.env.DATABASE_URL ?? databaseUrl);
  const fromPieces = resolveDatabasePieces().database;
  if (fromUrl !== ALLOWED_TEST_DB || fromPieces !== ALLOWED_TEST_DB) {
    throw new Error(
      `[${label}] Refusing DB ops against url="${fromUrl}" pieces="${fromPieces}". ` +
        `Expected "${ALLOWED_TEST_DB}".`,
    );
  }
}

function createPinnedClient(url: string): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url } },
  });
}

async function assertConnectedToTestDb(
  client: PrismaClient,
  label: string,
): Promise<void> {
  const rows = await client.$queryRawUnsafe<Array<{ current_database: string }>>(
    'SELECT current_database()',
  );
  const current = rows[0]?.current_database;
  if (current !== ALLOWED_TEST_DB) {
    throw new Error(
      `[${label}] Prisma connected to "${current}", expected "${ALLOWED_TEST_DB}". Aborting cleanup.`,
    );
  }
}

async function ensureDatabaseExists(): Promise<void> {
  assertSafeTestDatabase('ensureDatabaseExists');
  const pieces = resolveDatabasePieces();
  const adminUrl = withDatabaseName(databaseUrl, 'postgres');
  const admin = createPinnedClient(adminUrl);

  try {
    const rows = await admin.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists`,
      pieces.database,
    );
    if (!rows[0]?.exists) {
      await admin.$executeRawUnsafe(
        `CREATE DATABASE "${pieces.database.replace(/"/g, '')}"`,
      );
    }
  } finally {
    await admin.$disconnect();
  }
}

assertSafeTestDatabase('setup-module');
const prisma = createPinnedClient(databaseUrl);

beforeAll(async () => {
  await ensureDatabaseExists();
  await assertConnectedToTestDb(prisma, 'beforeAll');

  // eslint-disable-next-line no-console
  console.info(`[vitest] integration DB = ${ALLOWED_TEST_DB} (${databaseUrl.replace(/:[^:@/]+@/, ':***@')})`);

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl, VITEST: 'true' },
    stdio: 'pipe',
  });

  execSync('npx tsx prisma/seed/catalogos.ts', {
    env: { ...process.env, DATABASE_URL: databaseUrl, VITEST: 'true' },
    stdio: 'pipe',
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  assertSafeTestDatabase('afterEach');
  await assertConnectedToTestDb(prisma, 'afterEach');
  await prisma.apunte.deleteMany();
  await prisma.session.deleteMany();
  await prisma.bookConfig.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
});
