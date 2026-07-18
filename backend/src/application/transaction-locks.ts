import { Prisma } from '@prisma/client';

/** Acquire a namespaced PostgreSQL transaction advisory lock. */
export async function lockTransactionKey(
  tx: Prisma.TransactionClient,
  key: string,
): Promise<void> {
  await tx.$queryRaw(
    Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text AS locked`,
  );
}
