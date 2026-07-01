/**
 * Test setup — run migrations on test database before all tests.
 */

import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Run migrations on test database
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
    stdio: 'pipe',
  });

  // Seed global chart of accounts (cuentas_globales)
  execSync('npx tsx prisma/seed/catalogos.ts', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
    stdio: 'pipe',
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up all data after each test
  await prisma.session.deleteMany();
  await prisma.bookConfig.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
});
