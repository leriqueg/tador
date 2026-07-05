/**
 * Seed script for CuentaGlobal (global chart of accounts).
 *
 * Reads the CSV from specs/foundation/plan-de-cuentas-seed.csv
 * and upserts ALL accounts using a two-pass approach:
 *
 * Pass 1: Upsert group-level accounts (esPostable === false).
 * Pass 2: Upsert postable accounts (esPostable === true).
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

interface CsvAccountEntry {
  codigo: string;
  nombre: string;
  esPostable: boolean;
  codigoPadre: string | null;
  naturaleza: string;
  clasificacion: string;
  legacyId: number | null;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsvAccounts(csvContent: string): CsvAccountEntry[] {
  const lines = csvContent.split('\n');
  const accounts: CsvAccountEntry[] = [];
  let headerFound = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Find header row
    if (!headerFound) {
      if (trimmed.startsWith('codigo,')) {
        headerFound = true;
      }
      continue;
    }

    const cols = parseCsvLine(trimmed);
    if (cols.length < 5) continue;

    const codigo = cols[0];
    const nombre = cols[1];
    const esPostable = cols[2].toLowerCase() === 'true';
    const codigoPadre = cols[3] || null;
    const naturaleza = cols[4] || '';
    const clasificacion = cols[5] || '';
    const legacyId = cols[6] ? parseInt(cols[6], 10) : null;

    accounts.push({
      codigo,
      nombre,
      esPostable,
      codigoPadre,
      naturaleza,
      clasificacion,
      legacyId,
    });
  }

  return accounts;
}

export async function main(): Promise<void> {
  const dataPath = resolve(
    __dirname,
    '../../../specs/foundation/plan-de-cuentas-seed.csv',
  );
  const raw = readFileSync(dataPath, 'utf-8');
  const accounts = parseCsvAccounts(raw);

  // -------------------------------------------------------------------------
  // Pass 1: Upsert group-level accounts
  // -------------------------------------------------------------------------

  const groupAccounts = accounts.filter((a) => !a.esPostable);

  console.log(
    `Pass 1: Seeding ${groupAccounts.length} group-level CuentaGlobal records...`,
  );

  for (const account of groupAccounts) {
    await prisma.cuentaGlobal.upsert({
      where: { codigo: account.codigo },
      update: {
        nombre: account.nombre,
        descripcion: account.nombre,
        esPostable: false,
        legacyId: account.legacyId,
      },
      create: {
        codigo: account.codigo,
        nombre: account.nombre,
        descripcion: account.nombre,
        esPostable: false,
        legacyId: account.legacyId,
      },
    });
  }

  console.log(`Pass 1 complete: ${groupAccounts.length} group records upserted.`);

  // -------------------------------------------------------------------------
  // Pass 2: Upsert postable accounts
  // -------------------------------------------------------------------------

  const postableAccounts = accounts.filter((a) => a.esPostable);

  console.log(
    `Pass 2: Seeding ${postableAccounts.length} postable CuentaGlobal records...`,
  );

  for (const account of postableAccounts) {
    // Resolve parentId by looking up the parent CuentaGlobal by codigo
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

    await prisma.cuentaGlobal.upsert({
      where: { codigo: account.codigo },
      update: {
        parentId,
        nombre: account.nombre,
        descripcion: account.nombre,
        esPostable: true,
        legacyId: account.legacyId,
      },
      create: {
        codigo: account.codigo,
        parentId,
        nombre: account.nombre,
        descripcion: account.nombre,
        esPostable: true,
        legacyId: account.legacyId,
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
