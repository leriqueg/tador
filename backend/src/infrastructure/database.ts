/**
 * Prisma client singleton for the application.
 * Resolves DATABASE_URL from POSTGRES_* pieces before the client boots.
 */

import { ensureDatabaseUrl } from './resolve-database-url.js';
import { PrismaClient } from '@prisma/client';

ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
