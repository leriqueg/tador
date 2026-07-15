/**
 * Prisma client singleton for the application.
 * Resolves DATABASE_URL from POSTGRES_* pieces before the client boots.
 * Always pins the URL in the constructor so dotenv/.env cannot retarget
 * an already-running Vitest worker to tador_dev.
 */

import { ensureDatabaseUrl } from './resolve-database-url.js';
import { PrismaClient } from '@prisma/client';

const databaseUrl = ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
