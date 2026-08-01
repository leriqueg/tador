/**
 * Seed script for CuentaGlobal (global chart of accounts).
 *
 * Reads backend/data/plan-de-cuentas/plan-de-cuentas-final-seed.json
 * Promote from admin: GET /api/admin/global-accounts/export/seed
 *
 * Idempotent upsert by `codigo`. Parents via `codigoPadre`, depth-ordered.
 * Extra JSON metadata is ignored. Compatible with legacy 0.4.0 seed files
 * and admin 0.5.0 exports.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseSeedDeprecatedAt,
  parseSeedReportRole,
  sortAccountsForSeed,
  type SeedAccountEntry,
} from '../../src/application/chart/chart-seed-format.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for catalogos seed');
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

interface SeedFile {
  schemaVersion?: string;
  accounts: SeedAccountEntry[];
}

export async function seedCuentaGlobalFromAccounts(
  accounts: SeedAccountEntry[],
): Promise<{ total: number }> {
  const ordered = sortAccountsForSeed(accounts);

  console.log(
    `Seeding ${ordered.length} CuentaGlobal records (depth-ordered)...`,
  );

  for (const account of ordered) {
    let parentId: string | null = null;
    if (account.codigoPadre) {
      const parent = await prisma.cuentaGlobal.findUnique({
        where: { codigo: account.codigoPadre },
        select: { id: true },
      });
      if (!parent) {
        console.warn(
          `  Warning: parent ${account.codigoPadre} not found for ${account.codigo} (${account.nombre})`,
        );
      }
      parentId = parent?.id ?? null;
    }

    const descripcion =
      account.descripcion && account.descripcion.trim().length > 0
        ? account.descripcion
        : account.nombre;
    const reportRole = parseSeedReportRole(account.reportRole);
    const deprecatedAt = parseSeedDeprecatedAt(account.deprecatedAt);

    await prisma.cuentaGlobal.upsert({
      where: { codigo: account.codigo },
      update: {
        parentId,
        nombre: account.nombre,
        descripcion,
        esPostable: account.esPostable,
        legacyId: account.legacyId,
        legacyCode: account.legacyCodigo,
        reportRole,
        deprecatedAt,
      },
      create: {
        codigo: account.codigo,
        parentId,
        nombre: account.nombre,
        descripcion,
        esPostable: account.esPostable,
        legacyId: account.legacyId,
        legacyCode: account.legacyCodigo,
        reportRole,
        deprecatedAt,
      },
    });
  }

  console.log(`Seed complete: ${ordered.length} total CuentaGlobal records.`);
  return { total: ordered.length };
}

export async function main(): Promise<void> {
  const dataPath = resolve(
    __dirname,
    '../../data/plan-de-cuentas/plan-de-cuentas-final-seed.json',
  );
  const raw = readFileSync(dataPath, 'utf-8');
  const seed: SeedFile = JSON.parse(raw);
  if (!Array.isArray(seed.accounts)) {
    throw new Error('Seed file missing accounts[]');
  }
  await seedCuentaGlobalFromAccounts(seed.accounts);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
