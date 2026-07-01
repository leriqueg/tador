/**
 * Seed script for CuentaGlobal (global chart of accounts).
 *
 * Reads the normalized legacy chart from specs/foundation/plan-de-cuentas-legacy.normalized.json
 * and upserts the 27 group-level accounts. Only groups (isGroup: true) are seeded;
 * postable leaf accounts are excluded — they will be managed per-user.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

interface LegacyAccountEntry {
  legacy: {
    id: number;
    code: string;
  };
  name: string;
  structure: {
    isGroup: boolean;
    isPostable: boolean;
    parentLegacyCode: string | null;
  };
}

export async function main(): Promise<void> {
  const dataPath = resolve(
    __dirname,
    '../../../specs/foundation/plan-de-cuentas-legacy.normalized.json',
  );
  const raw = readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw) as { accounts: LegacyAccountEntry[] };

  const groupAccounts = data.accounts.filter(
    (a) => a.structure.isGroup === true,
  );

  console.log(
    `Seeding ${groupAccounts.length} group-level CuentaGlobal records...`,
  );

  for (const account of groupAccounts) {
    await prisma.cuentaGlobal.upsert({
      where: { codigo: account.legacy.code },
      update: {
        nombre: account.name,
        descripcion: account.name,
        esPostable: account.structure.isPostable,
        legacyId: account.legacy.id,
        legacyCode: account.legacy.code,
      },
      create: {
        codigo: account.legacy.code,
        nombre: account.name,
        descripcion: account.name,
        esPostable: account.structure.isPostable,
        legacyId: account.legacy.id,
        legacyCode: account.legacy.code,
      },
    });
  }

  console.log(`Seed complete: ${groupAccounts.length} CuentaGlobal records.`);
}

// Direct execution
main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
