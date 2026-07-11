/**
 * Test setup — resolve DB URL, ensure tador_test exists, migrate + seed.
 */

import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import {
  ensureDatabaseUrl,
  resolveDatabasePieces,
  withDatabaseName,
} from '../src/infrastructure/resolve-database-url.js';

ensureDatabaseUrl();

async function ensureDatabaseExists(): Promise<void> {
  const pieces = resolveDatabasePieces();
  const targetUrl = process.env.DATABASE_URL!;
  const adminUrl = withDatabaseName(targetUrl, 'postgres');
  const admin = new PrismaClient({
    datasources: { db: { url: adminUrl } },
  });

  try {
    const rows = await admin.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists`,
      pieces.database,
    );
    if (!rows[0]?.exists) {
      // CREATE DATABASE cannot run inside a transaction / parameterized identifier
      await admin.$executeRawUnsafe(
        `CREATE DATABASE "${pieces.database.replace(/"/g, '')}"`,
      );
    }
  } finally {
    await admin.$disconnect();
  }
}

const prisma = new PrismaClient();

beforeAll(async () => {
  await ensureDatabaseExists();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
    stdio: 'pipe',
  });

  execSync('npx tsx prisma/seed/catalogos.ts', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
    stdio: 'pipe',
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  await prisma.apunte.deleteMany();
  await prisma.session.deleteMany();
  await prisma.bookConfig.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
});
