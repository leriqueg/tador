/**
 * Seed script for CuentaGlobal (global chart of accounts).
 *
 * Reads the normalized legacy chart from specs/foundation/plan-de-cuentas-legacy.normalized.json
 * and upserts ALL accounts using a two-pass approach:
 *
 * Pass 1: Upsert the 27 group-level accounts (isGroup === true).
 * Pass 2: Upsert postable accounts that are default catalog candidates
 *         (isPostable === true && classification.defaultCatalogCandidate === true).
 *         These are shared expense/income categories (e.g. "Supermercado",
 *         "Farmacia", "Sueldo") that can be used directly in entry lines
 *         without requiring a CuentaUsuario wrapper.
 *
 * Each postable account is linked to its parent group via parentId.
 * The script is idempotent (upsert by codigo).
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
  classification: {
    defaultCatalogCandidate: boolean;
  };
}

export async function main(): Promise<void> {
  const dataPath = resolve(
    __dirname,
    '../../../specs/foundation/plan-de-cuentas-legacy.normalized.json',
  );
  const raw = readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw) as { accounts: LegacyAccountEntry[] };

  // -------------------------------------------------------------------------
  // Pass 1: Upsert group-level accounts (27 groups)
  // -------------------------------------------------------------------------

  const groupAccounts = data.accounts.filter(
    (a) => a.structure.isGroup === true,
  );

  console.log(
    `Pass 1: Seeding ${groupAccounts.length} group-level CuentaGlobal records...`,
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

  console.log(`Pass 1 complete: ${groupAccounts.length} group records upserted.`);

  // -------------------------------------------------------------------------
  // Pass 2: Upsert postable default-catalog accounts
  // -------------------------------------------------------------------------

  const postableAccounts = data.accounts.filter(
    (a) =>
      a.structure.isPostable === true &&
      a.classification.defaultCatalogCandidate === true,
  );

  console.log(
    `Pass 2: Seeding ${postableAccounts.length} postable CuentaGlobal records...`,
  );

  for (const account of postableAccounts) {
    // Resolve parentId by looking up the parent CuentaGlobal by codigo
    let parentId: string | null = null;
    if (account.structure.parentLegacyCode) {
      const parent = await prisma.cuentaGlobal.findUnique({
        where: { codigo: account.structure.parentLegacyCode },
        select: { id: true },
      });
      parentId = parent?.id ?? null;
      if (!parentId) {
        console.warn(
          `  Warning: parent ${account.structure.parentLegacyCode} not found for ${account.legacy.code} (${account.name})`,
        );
      }
    }

    await prisma.cuentaGlobal.upsert({
      where: { codigo: account.legacy.code },
      update: {
        parentId,
        nombre: account.name,
        descripcion: account.name,
        esPostable: true,
        legacyId: account.legacy.id,
        legacyCode: account.legacy.code,
      },
      create: {
        codigo: account.legacy.code,
        parentId,
        nombre: account.name,
        descripcion: account.name,
        esPostable: true,
        legacyId: account.legacy.id,
        legacyCode: account.legacy.code,
      },
    });
  }

  console.log(
    `Pass 2 complete: ${postableAccounts.length} postable records upserted.`,
  );

  const total = groupAccounts.length + postableAccounts.length;
  console.log(`Seed complete: ${total} total CuentaGlobal records.`);
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
