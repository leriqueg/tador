/**
 * Demo / legacy migration for migrations/test20260719.
 *
 * Guarded: refuses production unless DEMO_SEED_ENABLED=true and NODE_ENV!==production.
 *
 * Steps:
 *  1. Create (or reuse) demo users from env
 *  2. Provision CuentaUsuario from account-map.approved.json
 *  3. Expand CSV asientos to double-entry lines and post via AccountingService
 *  4. Create Apunte (no template) per asiento
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import Decimal from 'decimal.js';

import { prisma } from '../../../src/infrastructure/database.js';
import { createArgon2PasswordHasher } from '../../../src/infrastructure/services/argon2-password-hasher.js';
import { createUserRepository } from '../../../src/infrastructure/repositories/user-repo.js';
import { createBookRepository } from '../../../src/infrastructure/repositories/book-repo.js';
import { createAccountRepository } from '../../../src/infrastructure/repositories/account-repo.js';
import { createJournalStore } from '../../../src/infrastructure/repositories/journal-store.js';
import {
  createAccountingService,
  type CreateEntryLineInput,
} from '../../../src/application/accounting-service.js';
import { autoAsignarCodigo } from '../../../src/application/account-codigo.js';
import type { BookMode } from '../../../src/domain/book.js';
import type { TipoCuenta } from '../../../src/domain/cuenta-usuario.js';
import type { TipoEntidad } from '../../../src/domain/entidad.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Guards & paths
// ---------------------------------------------------------------------------

function assertDemoGuard(): void {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const enabled = process.env.DEMO_SEED_ENABLED === 'true';
  if (nodeEnv === 'production' || !enabled) {
    throw new Error(
      `Refusing migration: NODE_ENV=${nodeEnv}, DEMO_SEED_ENABLED=${process.env.DEMO_SEED_ENABLED}. ` +
        `Set DEMO_SEED_ENABLED=true and use a non-production NODE_ENV.`,
    );
  }
}

function resolveMigrateDir(): string {
  if (process.env.MIGRATE_DATA_DIR) {
    return process.env.MIGRATE_DATA_DIR;
  }
  // Host: repo/migrations/test20260719 ; Docker: /migrations/test20260719
  const candidates = [
    '/migrations/test20260719',
    resolve(__dirname, '../../../../migrations/test20260719'),
    resolve(process.cwd(), '../migrations/test20260719'),
    resolve(process.cwd(), 'migrations/test20260719'),
  ];
  for (const c of candidates) {
    if (existsSync(resolve(c, 'test20260719.csv'))) return c;
  }
  throw new Error(
    `Cannot find migrations/test20260719 (tried: ${candidates.join(', ')})`,
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DemoUserEnv {
  name: string;
  email: string;
  password: string;
  mode: BookMode;
}

interface AccountResolution {
  kind: 'cuenta_usuario' | 'cuenta_global';
  nombre?: string;
  codigo?: string;
  parentCodigo?: string;
  tipoCuenta?: TipoCuenta;
  entidadTipo?: TipoEntidad | null;
  entidadNombre?: string | null;
  clasificacion: string;
  legacyMadre?: string;
}

interface AccountMapEntry {
  legacyCodigo: string;
  role: 'bal' | 'pyg';
  resolution: AccountResolution;
}

interface AccountMapFile {
  accounts: AccountMapEntry[];
}

interface CsvRow {
  oid: string;
  tipo_asiento: string;
  asiento_simple: string;
  asiento_tipo: string;
  movimiento_id: string;
  Descripcion: string;
  Importe: string;
  fecha: string;
  codigo_cuenta_pyg: string;
  codigo_cuenta_bal: string;
}

interface ExpandedLine {
  legacyCodigo: string;
  role: 'bal' | 'pyg';
  debito: Decimal;
  credito: Decimal;
}

interface ExpandedAsiento {
  asientoSimple: string;
  tipoAsiento: string;
  fecha: Date;
  concepto: string;
  lines: ExpandedLine[];
  amount: Decimal;
  createApunte: boolean;
}

// ---------------------------------------------------------------------------
// CSV parse (semicolon, no external dep)
// ---------------------------------------------------------------------------

function parseSemicolonCsv(raw: string): CsvRow[] {
  const text = raw.replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(';').map((h) => h.trim());
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = (cols[j] ?? '').trim();
    }
    rows.push(obj as unknown as CsvRow);
  }
  return rows;
}

function parseFecha(value: string): Date {
  const [d, m, y] = value.split('/').map((p) => Number(p));
  if (!d || !m || !y) throw new Error(`Invalid fecha: ${value}`);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function nullish(code: string): string | null {
  if (!code || code === 'NULL') return null;
  return code;
}

// ---------------------------------------------------------------------------
// Signed amount → D/C (legacy convention: positive = debit, negative = credit)
// ---------------------------------------------------------------------------

function signedToDC(delta: Decimal): { debito: Decimal; credito: Decimal } {
  const zero = new Decimal(0);
  if (delta.isZero()) return { debito: zero, credito: zero };
  if (delta.isPositive()) return { debito: delta, credito: zero };
  return { debito: zero, credito: delta.abs() };
}

function netLines(lines: ExpandedLine[]): ExpandedLine[] {
  const map = new Map<
    string,
    { role: 'bal' | 'pyg'; debito: Decimal; credito: Decimal }
  >();
  for (const line of lines) {
    const key = `${line.role}:${line.legacyCodigo}`;
    const cur = map.get(key) ?? {
      role: line.role,
      debito: new Decimal(0),
      credito: new Decimal(0),
    };
    cur.debito = cur.debito.plus(line.debito);
    cur.credito = cur.credito.plus(line.credito);
    map.set(key, cur);
  }

  const out: ExpandedLine[] = [];
  for (const [key, v] of map) {
    const net = v.debito.minus(v.credito);
    if (net.isZero()) continue;
    const legacyCodigo = key.slice(key.indexOf(':') + 1);
    if (net.isPositive()) {
      out.push({
        legacyCodigo,
        role: v.role,
        debito: net,
        credito: new Decimal(0),
      });
    } else {
      out.push({
        legacyCodigo,
        role: v.role,
        debito: new Decimal(0),
        credito: net.abs(),
      });
    }
  }
  return out;
}

function expandAsiento(tipo: string, rows: CsvRow[]): ExpandedAsiento {
  const concepto = rows[0].Descripcion.split('{')[0].trim();
  const fecha = parseFecha(rows[0].fecha);
  const asientoSimple = rows[0].asiento_simple;
  const raw: ExpandedLine[] = [];

  if (tipo === 'traspaso') {
    for (const r of rows) {
      const bal = nullish(r.codigo_cuenta_bal);
      if (!bal) throw new Error(`traspaso ${asientoSimple}: missing bal`);
      raw.push({
        legacyCodigo: bal,
        role: 'bal',
        ...signedToDC(new Decimal(r.Importe)),
      });
    }
  } else if (tipo === 'directo') {
    const r = rows[0];
    const bal = nullish(r.codigo_cuenta_bal);
    const pyg = nullish(r.codigo_cuenta_pyg);
    if (!bal || !pyg) {
      throw new Error(`directo ${asientoSimple}: need bal+pyg`);
    }
    if (r.asiento_tipo !== 'egreso' && r.asiento_tipo !== 'ingreso') {
      throw new Error(
        `directo ${asientoSimple}: unexpected asiento_tipo ${r.asiento_tipo}`,
      );
    }
    const importe = new Decimal(r.Importe);
    // Directo: one signed importe drives BAL; PYG is the opposite signed leg.
    // egreso I<0 → Dr expense / Cr asset; ingreso I>0 → Dr asset / Cr income.
    const balSigned = importe;
    const pygSigned = importe.negated();
    raw.push({ legacyCodigo: pyg, role: 'pyg', ...signedToDC(pygSigned) });
    raw.push({ legacyCodigo: bal, role: 'bal', ...signedToDC(balSigned) });
  } else if (tipo === 'bypass') {
    for (const r of rows) {
      if (r.asiento_tipo === 'egreso' || r.asiento_tipo === 'ingreso') {
        const bal = nullish(r.codigo_cuenta_bal);
        const pyg = nullish(r.codigo_cuenta_pyg);
        if (!bal || !pyg) {
          throw new Error(`bypass ${asientoSimple}: pyg line missing accounts`);
        }
        const importe = new Decimal(r.Importe);
        const balSigned = importe;
        const pygSigned = importe.negated();
        raw.push({ legacyCodigo: pyg, role: 'pyg', ...signedToDC(pygSigned) });
        raw.push({ legacyCodigo: bal, role: 'bal', ...signedToDC(balSigned) });
      } else if (r.asiento_tipo === 'traspaso') {
        const bal = nullish(r.codigo_cuenta_bal);
        if (!bal) {
          throw new Error(`bypass ${asientoSimple}: traspaso missing bal`);
        }
        raw.push({
          legacyCodigo: bal,
          role: 'bal',
          ...signedToDC(new Decimal(r.Importe)),
        });
      } else {
        throw new Error(
          `bypass ${asientoSimple}: unexpected asiento_tipo ${r.asiento_tipo}`,
        );
      }
    }
  } else {
    throw new Error(`Unknown tipo_asiento ${tipo} on ${asientoSimple}`);
  }

  const lines = netLines(raw);
  if (lines.length < 2) {
    throw new Error(
      `Asiento ${asientoSimple} expanded to ${lines.length} lines (need ≥2)`,
    );
  }

  const debit = lines.reduce((s, l) => s.plus(l.debito), new Decimal(0));
  const credit = lines.reduce((s, l) => s.plus(l.credito), new Decimal(0));
  if (!debit.equals(credit)) {
    throw new Error(
      `Asiento ${asientoSimple} unbalanced after expand: D=${debit} C=${credit}`,
    );
  }

  return {
    asientoSimple,
    tipoAsiento: tipo,
    fecha,
    concepto,
    lines,
    amount: debit,
    createApunte: true,
  };
}

// ---------------------------------------------------------------------------
// Env users
// ---------------------------------------------------------------------------

function loadDemoUsers(): DemoUserEnv[] {
  const users: DemoUserEnv[] = [
    {
      name: process.env.DEMO_USER_HOGAR_NAME ?? 'Usuario Hogar',
      email: process.env.DEMO_USER_HOGAR_EMAIL ?? '',
      password: process.env.DEMO_USER_HOGAR_PASSWORD ?? '',
      mode: (process.env.DEMO_USER_HOGAR_MODE ?? 'hogar').toLowerCase() as BookMode,
    },
    {
      name: process.env.DEMO_USER_PRO_NAME ?? 'Usuario Pro',
      email: process.env.DEMO_USER_PRO_EMAIL ?? '',
      password: process.env.DEMO_USER_PRO_PASSWORD ?? '',
      mode: (process.env.DEMO_USER_PRO_MODE ?? 'pro').toLowerCase() as BookMode,
    },
  ];
  for (const u of users) {
    if (!u.email || !u.password) {
      throw new Error('Demo user email/password missing from env');
    }
    if (u.password.length < 8) {
      throw new Error(`Password for ${u.email} must be ≥8 characters`);
    }
    if (u.mode !== 'hogar' && u.mode !== 'pro') {
      throw new Error(`Invalid mode for ${u.email}: ${u.mode}`);
    }
  }
  return users;
}

// ---------------------------------------------------------------------------
// Provisioning
// ---------------------------------------------------------------------------

async function ensureUser(demo: DemoUserEnv): Promise<{
  userId: string;
  bookId: string;
}> {
  const users = createUserRepository();
  const books = createBookRepository();
  const hasher = createArgon2PasswordHasher();

  let user = await users.findByEmail(demo.email);
  if (!user) {
    const passwordHash = await hasher.hash(demo.password);
    user = await users.create({ email: demo.email, passwordHash });
    await books.create(user.id);
  }

  user.fullName = demo.name;
  user.verifiedAt = user.verifiedAt ?? new Date();
  await users.update(user);

  const book = await books.findByUserId(user.id);
  if (!book) throw new Error(`Book missing for ${demo.email}`);

  await books.upsertConfig(book.id, {
    mode: demo.mode,
    currency: 'USD',
    timeZone: 'America/Guayaquil',
    locale: 'es-EC',
    onboardingCompletedAt: new Date(),
  });

  return { userId: user.id, bookId: book.id };
}

async function provisionAccounts(
  userId: string,
  map: AccountMapFile,
): Promise<Map<string, { kind: 'user' | 'global'; id: string }>> {
  const accounts = createAccountRepository();
  const resolved = new Map<string, { kind: 'user' | 'global'; id: string }>();

  for (const entry of map.accounts) {
    const res = entry.resolution;
    if (res.kind === 'cuenta_global') {
      const codigo = res.codigo!;
      const global = await prisma.cuentaGlobal.findUnique({
        where: { codigo },
        select: { id: true, esPostable: true },
      });
      if (!global) throw new Error(`CuentaGlobal ${codigo} not found (seed?)`);
      if (!global.esPostable) {
        throw new Error(`CuentaGlobal ${codigo} is not postable`);
      }
      resolved.set(entry.legacyCodigo, { kind: 'global', id: global.id });
      continue;
    }

    // cuenta_usuario
    const parent = await prisma.cuentaGlobal.findUnique({
      where: { codigo: res.parentCodigo! },
      select: { id: true },
    });
    if (!parent) {
      throw new Error(
        `Parent group ${res.parentCodigo} missing for legacy ${entry.legacyCodigo}`,
      );
    }

    let entidadId: string | null = null;
    if (res.entidadTipo && res.entidadNombre) {
      const existingEnt = await prisma.entidad.findUnique({
        where: {
          userId_nombre: { userId, nombre: res.entidadNombre },
        },
      });
      if (existingEnt) {
        entidadId = existingEnt.id;
      } else {
        const created = await prisma.entidad.create({
          data: {
            userId,
            nombre: res.entidadNombre,
            tipo: res.entidadTipo,
            capabilities: [],
          },
        });
        entidadId = created.id;
      }
    }

    const existing = await prisma.cuentaUsuario.findFirst({
      where: {
        userId,
        nombre: res.nombre!,
        globalId: parent.id,
      },
    });
    if (existing) {
      // Migration without opening balances: allow temporary negative natural balance.
      if (existing.enforceNonNegativeBalance) {
        await prisma.cuentaUsuario.update({
          where: { id: existing.id },
          data: { enforceNonNegativeBalance: false },
        });
      }
      resolved.set(entry.legacyCodigo, { kind: 'user', id: existing.id });
      continue;
    }

    const codigo = await autoAsignarCodigo(accounts, parent.id, userId);
    const created = await prisma.cuentaUsuario.create({
      data: {
        userId,
        codigo,
        globalId: parent.id,
        entidadId,
        tipoCuenta: res.tipoCuenta as TipoCuenta,
        nombre: res.nombre!,
        enforceNonNegativeBalance: false,
        metadata: {
          legacyCodigo: entry.legacyCodigo,
          migration: 'test20260719',
        },
      },
    });
    resolved.set(entry.legacyCodigo, { kind: 'user', id: created.id });
  }

  return resolved;
}

function toEntryLines(
  expanded: ExpandedAsiento,
  resolved: Map<string, { kind: 'user' | 'global'; id: string }>,
): CreateEntryLineInput[] {
  return expanded.lines.map((line) => {
    const target = resolved.get(line.legacyCodigo);
    if (!target) {
      throw new Error(
        `No resolved account for legacy ${line.legacyCodigo} on ${expanded.asientoSimple}`,
      );
    }
    const base = {
      debito: Number(line.debito.toFixed(2)),
      credito: Number(line.credito.toFixed(2)),
    };
    if (target.kind === 'user') {
      return { ...base, cuentaId: target.id };
    }
    return { ...base, cuentaGlobalId: target.id };
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function migrateForUser(
  demo: DemoUserEnv,
  asientos: ExpandedAsiento[],
  map: AccountMapFile,
  dryRun: boolean,
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const { userId, bookId } = await ensureUser(demo);
  console.log(`\n=== ${demo.email} (${demo.mode}) userId=${userId} bookId=${bookId}`);

  const resolved = await provisionAccounts(userId, map);
  console.log(`  Accounts resolved: ${resolved.size}`);

  if (dryRun) {
    console.log(`  DRY RUN: would post ${asientos.length} asientos`);
    return { created: 0, skipped: asientos.length, errors: [] };
  }

  const accounting = createAccountingService(createJournalStore());
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const a of asientos) {
    const idempotencyKey = `migrate:test20260719:${demo.email}:${a.asientoSimple}`;
    try {
      const lineas = toEntryLines(a, resolved);
      const { entry } = await accounting.createEntry({
        bookId,
        fecha: a.fecha,
        concepto: a.concepto.slice(0, 500),
        lineas,
        idempotencyKey,
      });

      const existingApunte = await prisma.apunte.findUnique({
        where: { asientoId: entry.id },
      });
      if (!existingApunte && a.createApunte) {
        await prisma.apunte.create({
          data: {
            templateCode: null,
            date: a.fecha,
            concept: a.concepto.slice(0, 500),
            amount: a.amount.toFixed(2),
            asientoId: entry.id,
            userId,
          },
        });
      }
      created += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Idempotent replay already counted as success path above; treat duplicates soft
      if (msg.includes('idempotency') || msg.includes('Unique constraint')) {
        skipped += 1;
        continue;
      }
      errors.push(`${a.asientoSimple}: ${msg}`);
      console.error(`  ERROR ${a.asientoSimple}: ${msg}`);
    }
  }

  console.log(`  Posted=${created} skipped=${skipped} errors=${errors.length}`);
  return { created, skipped, errors };
}

async function main(): Promise<void> {
  const migrateDir = resolveMigrateDir();
  const envPath = resolve(migrateDir, '.env');
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  if (process.env.DEMO_SEED_ENABLED !== 'true') {
    // Allow make -e to set it without .env
    process.env.DEMO_SEED_ENABLED = process.env.DEMO_SEED_ENABLED ?? 'false';
  }
  assertDemoGuard();

  const dryRun = process.env.MIGRATE_DRY_RUN === 'true';
  const mapPath = resolve(migrateDir, 'account-map.approved.json');
  const csvPath = resolve(migrateDir, 'test20260719.csv');

  if (!existsSync(mapPath)) {
    throw new Error(`Missing ${mapPath}`);
  }
  if (!existsSync(csvPath)) {
    throw new Error(`Missing ${csvPath}`);
  }

  const map = JSON.parse(readFileSync(mapPath, 'utf-8')) as AccountMapFile;

  const rows = parseSemicolonCsv(readFileSync(csvPath, 'utf-8'));
  const byAsiento = new Map<string, CsvRow[]>();
  for (const row of rows) {
    const list = byAsiento.get(row.asiento_simple) ?? [];
    list.push(row);
    byAsiento.set(row.asiento_simple, list);
  }

  const asientos: ExpandedAsiento[] = [];
  for (const [, group] of byAsiento) {
    const tipo = group[0].tipo_asiento;
    asientos.push(expandAsiento(tipo, group));
  }
  asientos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  console.log(
    `Loaded ${rows.length} CSV rows → ${asientos.length} asientos (dryRun=${dryRun})`,
  );

  // Preflight expand already validated balance; print sample
  console.log(
    `Sample: ${asientos[0]?.asientoSimple} ${asientos[0]?.tipoAsiento} lines=${asientos[0]?.lines.length} amount=${asientos[0]?.amount}`,
  );

  const demos = loadDemoUsers();
  const allErrors: string[] = [];
  for (const demo of demos) {
    const result = await migrateForUser(demo, asientos, map, dryRun);
    allErrors.push(...result.errors.map((e) => `${demo.email}: ${e}`));
  }

  if (allErrors.length > 0) {
    console.error(`\nMigration finished with ${allErrors.length} errors`);
    process.exitCode = 1;
  } else {
    console.log('\nMigration finished OK');
  }
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
