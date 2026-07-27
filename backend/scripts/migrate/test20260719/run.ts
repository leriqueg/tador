/**
 * Demo / legacy migration for migrations/test20260719.
 *
 * Guarded: refuses production unless DEMO_SEED_ENABLED=true and NODE_ENV!==production.
 *
 * Inputs (deterministic):
 *  - account-map.csv — legacyCodigo;legacyNombre;codigoTador;codigoTadorPadre;crear_nombre;nueva_entidad
 *  - test20260719.csv — movements (mother columns are reference only)
 *
 * Rules:
 *  - CuentaGlobal is never created from the map.
 *  - If codigoTador is a postable chart leaf → post to that global (crear_nombre/nueva_entidad empty).
 *  - If codigoTador is not in the chart → create CuentaUsuario under codigoTadorPadre with
 *    codigo = codigoTador (deterministic; no autoAsignarCodigo) and nombre = crear_nombre.
 *  - codigoTador must not be a chart group (non-postable); put the group in codigoTadorPadre.
 *  - Several legacyCodigo may share the same TADOR target.
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
import { createJournalStore } from '../../../src/infrastructure/repositories/journal-store.js';
import {
  createAccountingService,
  type CreateEntryLineInput,
} from '../../../src/application/accounting-service.js';
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

function resolveChartSeedPath(): string {
  const candidates = [
    resolve(__dirname, '../../../data/plan-de-cuentas/plan-de-cuentas-final-seed.json'),
    resolve(process.cwd(), 'data/plan-de-cuentas/plan-de-cuentas-final-seed.json'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    `Cannot find plan-de-cuentas-final-seed.json (tried: ${candidates.join(', ')})`,
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

/** One row from account-map.csv (legacy → TADOR). */
interface AccountMapRow {
  legacyCodigo: string;
  legacyNombre: string | null;
  codigoTador: string;
  codigoTadorPadre: string;
  /** Display name when creating CuentaUsuario; null when posting to a global leaf. */
  crearNombre: string | null;
  nuevaEntidad: string | null;
  /** true = post to CuentaGlobal; false = find/create CuentaUsuario with fixed codigo. */
  isGlobal: boolean;
}

interface AccountMapFile {
  rows: AccountMapRow[];
}

interface ChartAccount {
  codigo: string;
  nombre: string;
  codigoPadre: string | null;
  esPostable: boolean;
  naturaleza: string;
  clasificacion: string;
  permiteCustom: string;
  relacionadasEntidades: string | null;
}

interface ResolvedTarget {
  kind: 'user' | 'global';
  /** CuentaGlobal.id or CuentaUsuario.id */
  id: string;
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
  nombre_cuenta_pyg: string;
  codigo_cuenta_bal: string;
  nombre_cuenta_bal: string;
}

interface UsedAccountRef {
  legacyCodigo: string;
  role: 'bal' | 'pyg';
  uses: number;
  nombres: Set<string>;
  sampleDescripcion: string;
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
// Chart catalog (classification / entity support from plan seed — not DB)
// ---------------------------------------------------------------------------

function loadChartCatalog(): Map<string, ChartAccount> {
  const raw = JSON.parse(readFileSync(resolveChartSeedPath(), 'utf-8')) as {
    accounts: Array<{
      codigo: string;
      nombre: string;
      codigoPadre?: string | null;
      esPostable: boolean;
      naturaleza?: string;
      clasificacion?: string;
      permiteCustom?: string;
      relacionadasEntidades?: string | null;
    }>;
  };
  const map = new Map<string, ChartAccount>();
  for (const a of raw.accounts) {
    map.set(a.codigo, {
      codigo: a.codigo,
      nombre: a.nombre,
      codigoPadre: a.codigoPadre ?? null,
      esPostable: a.esPostable,
      naturaleza: a.naturaleza ?? '',
      clasificacion: a.clasificacion ?? '',
      permiteCustom: a.permiteCustom ?? 'false',
      relacionadasEntidades: a.relacionadasEntidades ?? null,
    });
  }
  return map;
}

function allowsEntidad(chart: ChartAccount): boolean {
  return chart.permiteCustom === 'ConEntidadAutomatica';
}

function inferTipoCuenta(chart: ChartAccount): TipoCuenta {
  const c = chart.codigo;
  if (chart.naturaleza === 'cash') return 'wallet';
  if (chart.naturaleza === 'loan') return 'card';
  if (c.startsWith('1112')) return 'bank';
  if (c.startsWith('212')) return 'card';
  if (c.startsWith('213')) return 'card';
  if (c.startsWith('211')) return 'bridge';
  if (c.startsWith('112')) return 'wallet';
  if (c.startsWith('113')) return 'wallet';
  if (c.startsWith('1111')) return 'wallet';
  return 'wallet';
}

function inferEntidadTipo(chart: ChartAccount): TipoEntidad {
  const rel = chart.relacionadasEntidades;
  if (rel === 'PersonaNatural') return 'person';
  if (rel === 'EntidadGubernamental') return 'organization';
  if (rel === 'EntidadFinanciera') {
    if (chart.codigo.startsWith('212')) return 'card_issuer';
    if (chart.codigo.startsWith('1111')) return 'wallet_platform';
    return 'bank';
  }
  return 'person';
}

function userTargetKey(codigoTador: string): string {
  return `user:${codigoTador}`;
}

function globalTargetKey(codigoTador: string): string {
  return `global:${codigoTador}`;
}

// ---------------------------------------------------------------------------
// CSV parse
// ---------------------------------------------------------------------------

function parseSemicolonCsv(raw: string): Record<string, string>[] {
  const text = raw.replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(';').map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = (cols[j] ?? '').trim();
    }
    rows.push(obj);
  }
  return rows;
}

function emptyToNull(value: string): string | null {
  const v = value.trim();
  return v.length === 0 ? null : v;
}

function nullish(code: string): string | null {
  if (!code || code === 'NULL') return null;
  return code;
}

/**
 * account-map.csv columns:
 *   legacyCodigo;legacyNombre;codigoTador;codigoTadorPadre;crear_nombre;nueva_entidad
 */
function parseAccountMapCsv(
  raw: string,
  chart: Map<string, ChartAccount>,
): AccountMapFile {
  const rows = parseSemicolonCsv(raw);
  if (rows.length === 0) {
    throw new Error('account-map.csv has no data rows');
  }

  const out: AccountMapRow[] = [];
  const errors: string[] = [];
  const seenLegacy = new Set<string>();
  /** Consistency across many-legacy → one TADOR target */
  const targetShape = new Map<string, string>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const line = i + 2;
    const legacyCodigo = (r.legacyCodigo ?? '').trim();
    const legacyNombre = emptyToNull(r.legacyNombre ?? '');
    const codigoTador = (r.codigoTador ?? '').trim();
    const codigoTadorPadre = (r.codigoTadorPadre ?? '').trim();
    const crearNombre = emptyToNull(r.crear_nombre ?? '');
    const nuevaEntidad = emptyToNull(r.nueva_entidad ?? '');

    if (!legacyCodigo) {
      errors.push(`line ${line}: missing legacyCodigo`);
      continue;
    }
    if (!codigoTador) {
      errors.push(`line ${line}: missing codigoTador`);
      continue;
    }
    if (!codigoTadorPadre) {
      errors.push(`line ${line}: missing codigoTadorPadre`);
      continue;
    }
    if (seenLegacy.has(legacyCodigo)) {
      errors.push(`line ${line}: duplicate legacyCodigo ${legacyCodigo}`);
      continue;
    }
    seenLegacy.add(legacyCodigo);

    const parent = chart.get(codigoTadorPadre);
    if (!parent) {
      errors.push(
        `line ${line}: codigoTadorPadre ${codigoTadorPadre} not in chart seed`,
      );
      continue;
    }
    if (parent.esPostable) {
      errors.push(
        `line ${line}: codigoTadorPadre ${codigoTadorPadre} must be a non-postable group`,
      );
      continue;
    }

    const chartAcc = chart.get(codigoTador);

    if (chartAcc?.esPostable) {
      if (crearNombre || nuevaEntidad) {
        errors.push(
          `line ${line}: postable ${codigoTador} must leave crear_nombre and nueva_entidad empty`,
        );
        continue;
      }
      if (chartAcc.codigoPadre && chartAcc.codigoPadre !== codigoTadorPadre) {
        errors.push(
          `line ${line}: codigoTadorPadre ${codigoTadorPadre} does not match chart parent ${chartAcc.codigoPadre} for ${codigoTador}`,
        );
        continue;
      }
      const key = globalTargetKey(codigoTador);
      const shape = `global|padre=${codigoTadorPadre}`;
      const prev = targetShape.get(key);
      if (prev && prev !== shape) {
        errors.push(`line ${line}: conflicting shapes for global ${codigoTador}`);
        continue;
      }
      targetShape.set(key, shape);
      out.push({
        legacyCodigo,
        legacyNombre,
        codigoTador,
        codigoTadorPadre,
        crearNombre: null,
        nuevaEntidad: null,
        isGlobal: true,
      });
      continue;
    }

    if (chartAcc && !chartAcc.esPostable) {
      errors.push(
        `line ${line}: codigoTador ${codigoTador} is a chart group; use a user-scoped code and put the group in codigoTadorPadre`,
      );
      continue;
    }

    if (!crearNombre) {
      errors.push(
        `line ${line}: user account ${codigoTador} requires crear_nombre`,
      );
      continue;
    }
    if (nuevaEntidad && !allowsEntidad(parent)) {
      errors.push(
        `line ${line}: chart group ${codigoTadorPadre} does not allow nueva_entidad (got "${nuevaEntidad}")`,
      );
      continue;
    }

    const key = userTargetKey(codigoTador);
    const shape = `padre=${codigoTadorPadre}|nombre=${crearNombre}|entidad=${nuevaEntidad ?? ''}`;
    const prev = targetShape.get(key);
    if (prev && prev !== shape) {
      errors.push(
        `line ${line}: same user codigoTador ${codigoTador} has conflicting padre/crear_nombre/nueva_entidad`,
      );
      continue;
    }
    targetShape.set(key, shape);

    out.push({
      legacyCodigo,
      legacyNombre,
      codigoTador,
      codigoTadorPadre,
      crearNombre,
      nuevaEntidad,
      isGlobal: false,
    });
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid account-map.csv (${errors.length} error(s)):\n  - ${errors.join('\n  - ')}`,
    );
  }

  return { rows: out };
}

function collectUsedAccounts(rows: CsvRow[]): UsedAccountRef[] {
  const byKey = new Map<string, UsedAccountRef>();

  const bump = (
    code: string | null,
    role: 'bal' | 'pyg',
    nombre: string,
    descripcion: string,
  ): void => {
    if (!code) return;
    const key = `${role}:${code}`;
    let cur = byKey.get(key);
    if (!cur) {
      cur = {
        legacyCodigo: code,
        role,
        uses: 0,
        nombres: new Set(),
        sampleDescripcion: descripcion.split('{')[0].trim().slice(0, 80),
      };
      byKey.set(key, cur);
    }
    cur.uses += 1;
    if (nombre && nombre !== 'NULL') cur.nombres.add(nombre);
  };

  for (const r of rows) {
    bump(nullish(r.codigo_cuenta_bal), 'bal', r.nombre_cuenta_bal ?? '', r.Descripcion);
    bump(nullish(r.codigo_cuenta_pyg), 'pyg', r.nombre_cuenta_pyg ?? '', r.Descripcion);
  }

  return [...byKey.values()].sort((a, b) =>
    a.legacyCodigo.localeCompare(b.legacyCodigo),
  );
}

function assertMapCoversMovements(
  map: AccountMapFile,
  used: UsedAccountRef[],
): void {
  const mapped = new Set(map.rows.map((a) => a.legacyCodigo));
  const missing = used.filter((u) => !mapped.has(u.legacyCodigo));

  if (missing.length === 0) {
    console.log(
      `Map coverage OK: ${used.length} codes used in movements, all present in account-map.csv`,
    );
    return;
  }

  console.error(`\nUNMAPPED accounts (${missing.length}):`);
  console.error(
    'Add a row to account-map.csv: legacyCodigo;legacyNombre;codigoTador;codigoTadorPadre;crear_nombre;nueva_entidad\n',
  );
  for (const m of missing) {
    const names = [...m.nombres].join(' | ') || '(no nombre_cuenta in CSV)';
    console.error(
      `  ${m.role.padEnd(3)} ${m.legacyCodigo}  uses=${m.uses}  names=[${names}]  sample="${m.sampleDescripcion}"`,
    );
  }
  throw new Error(
    `${missing.length} account code(s) used in movements are missing from account-map.csv`,
  );
}

/** Preferred ISO YYYY-MM-DD; fallback legacy DD/MM/YYYY. Noon UTC avoids TZ day-shift. */
function parseFecha(value: string): Date {
  const raw = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/.exec(raw);
  if (iso) {
    return utcNoonDate(Number(iso[1]), Number(iso[2]), Number(iso[3]), raw);
  }
  const legacy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (legacy) {
    return utcNoonDate(
      Number(legacy[3]),
      Number(legacy[2]),
      Number(legacy[1]),
      raw,
    );
  }
  throw new Error(`Invalid fecha: ${value}`);
}

function utcNoonDate(y: number, m: number, d: number, raw: string): Date {
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error(`Invalid fecha: ${raw}`);
  }
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    throw new Error(`Invalid fecha: ${raw}`);
  }
  return date;
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
  chart: Map<string, ChartAccount>,
): Promise<Map<string, ResolvedTarget>> {
  const legacyToTarget = new Map<string, ResolvedTarget>();
  const provisioned = new Map<string, ResolvedTarget>();

  for (const row of map.rows) {
    if (row.isGlobal) {
      const key = globalTargetKey(row.codigoTador);
      let target = provisioned.get(key);
      if (!target) {
        const global = await prisma.cuentaGlobal.findUnique({
          where: { codigo: row.codigoTador },
          select: { id: true, esPostable: true },
        });
        if (!global) {
          throw new Error(
            `CuentaGlobal ${row.codigoTador} missing in DB — seed catalog first (never auto-created)`,
          );
        }
        if (!global.esPostable) {
          throw new Error(`CuentaGlobal ${row.codigoTador} is not postable`);
        }
        target = { kind: 'global', id: global.id };
        provisioned.set(key, target);
      }
      legacyToTarget.set(row.legacyCodigo, target);
      continue;
    }

    const parentChart = chart.get(row.codigoTadorPadre);
    if (!parentChart) {
      throw new Error(
        `codigoTadorPadre ${row.codigoTadorPadre} not in chart (legacy ${row.legacyCodigo})`,
      );
    }

    const key = userTargetKey(row.codigoTador);
    let target = provisioned.get(key);
    if (!target) {
      const parent = await prisma.cuentaGlobal.findUnique({
        where: { codigo: row.codigoTadorPadre },
        select: { id: true, esPostable: true },
      });
      if (!parent) {
        throw new Error(
          `Chart group ${row.codigoTadorPadre} missing in DB — seed catalog first (never auto-created)`,
        );
      }
      if (parent.esPostable) {
        throw new Error(
          `codigoTadorPadre ${row.codigoTadorPadre} is postable; expected a group`,
        );
      }

      const crearNombre = row.crearNombre!;
      let entidadId: string | null = null;
      if (row.nuevaEntidad) {
        const tipo = inferEntidadTipo(parentChart);
        const existingEnt = await prisma.entidad.findUnique({
          where: { userId_nombre: { userId, nombre: row.nuevaEntidad } },
        });
        if (existingEnt) {
          entidadId = existingEnt.id;
        } else {
          const created = await prisma.entidad.create({
            data: {
              userId,
              nombre: row.nuevaEntidad,
              tipo,
              capabilities: [],
            },
          });
          entidadId = created.id;
        }
      }

      const existingByCodigo = await prisma.cuentaUsuario.findUnique({
        where: { userId_codigo: { userId, codigo: row.codigoTador } },
      });
      if (existingByCodigo) {
        if (existingByCodigo.globalId !== parent.id) {
          throw new Error(
            `CuentaUsuario ${row.codigoTador} exists under a different parent (legacy ${row.legacyCodigo})`,
          );
        }
        if (existingByCodigo.nombre !== crearNombre) {
          throw new Error(
            `CuentaUsuario ${row.codigoTador} exists with nombre "${existingByCodigo.nombre}", map wants "${crearNombre}"`,
          );
        }
        if (existingByCodigo.enforceNonNegativeBalance) {
          await prisma.cuentaUsuario.update({
            where: { id: existingByCodigo.id },
            data: { enforceNonNegativeBalance: false },
          });
        }
        target = { kind: 'user', id: existingByCodigo.id };
      } else {
        const existingByNombre = await prisma.cuentaUsuario.findFirst({
          where: { userId, nombre: crearNombre },
        });
        if (existingByNombre) {
          throw new Error(
            `CuentaUsuario nombre "${crearNombre}" already exists as codigo ${existingByNombre.codigo}; map wants ${row.codigoTador}`,
          );
        }
        const created = await prisma.cuentaUsuario.create({
          data: {
            userId,
            codigo: row.codigoTador,
            globalId: parent.id,
            entidadId,
            tipoCuenta: inferTipoCuenta(parentChart),
            nombre: crearNombre,
            enforceNonNegativeBalance: false,
            metadata: {
              migration: 'test20260719',
              codigoTador: row.codigoTador,
              codigoTadorPadre: row.codigoTadorPadre,
              legacyCodigo: row.legacyCodigo,
            },
          },
        });
        target = { kind: 'user', id: created.id };
      }
      provisioned.set(key, target);
    }
    legacyToTarget.set(row.legacyCodigo, target);
  }

  return legacyToTarget;
}

function toEntryLines(
  expanded: ExpandedAsiento,
  resolved: Map<string, ResolvedTarget>,
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

async function migrateForUser(
  demo: DemoUserEnv,
  asientos: ExpandedAsiento[],
  map: AccountMapFile,
  chart: Map<string, ChartAccount>,
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const { userId, bookId } = await ensureUser(demo);
  console.log(`\n=== ${demo.email} (${demo.mode}) userId=${userId} bookId=${bookId}`);

  const resolved = await provisionAccounts(userId, map, chart);
  console.log(`  Accounts resolved: ${resolved.size}`);

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
    process.env.DEMO_SEED_ENABLED = process.env.DEMO_SEED_ENABLED ?? 'false';
  }
  assertDemoGuard();

  const dryRun = process.env.MIGRATE_DRY_RUN === 'true';
  const mapPath = resolve(migrateDir, 'account-map.csv');
  const csvPath = resolve(migrateDir, 'test20260719.csv');

  if (!existsSync(mapPath)) {
    throw new Error(
      `Missing ${mapPath}. Columns: legacyCodigo;legacyNombre;codigoTador;codigoTadorPadre;crear_nombre;nueva_entidad`,
    );
  }
  if (!existsSync(csvPath)) {
    throw new Error(`Missing ${csvPath}`);
  }

  const chart = loadChartCatalog();
  const map = parseAccountMapCsv(readFileSync(mapPath, 'utf-8'), chart);
  const rows = parseSemicolonCsv(
    readFileSync(csvPath, 'utf-8'),
  ) as unknown as CsvRow[];
  const used = collectUsedAccounts(rows);
  assertMapCoversMovements(map, used);

  const byAsiento = new Map<string, CsvRow[]>();
  for (const row of rows) {
    const list = byAsiento.get(row.asiento_simple) ?? [];
    list.push(row);
    byAsiento.set(row.asiento_simple, list);
  }

  const asientos: ExpandedAsiento[] = [];
  for (const [, group] of byAsiento) {
    asientos.push(expandAsiento(group[0].tipo_asiento, group));
  }
  asientos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  console.log(
    `Loaded ${rows.length} movement rows → ${asientos.length} asientos; map rows=${map.rows.length} (dryRun=${dryRun})`,
  );
  console.log(
    `Sample: ${asientos[0]?.asientoSimple} ${asientos[0]?.tipoAsiento} lines=${asientos[0]?.lines.length} amount=${asientos[0]?.amount}`,
  );

  if (dryRun) {
    console.log(
      '\nDRY RUN: map coverage + chart refs + expansion OK. No users/asientos posted.',
    );
    console.log('Migration finished OK');
    return;
  }

  const demos = loadDemoUsers();
  const allErrors: string[] = [];
  for (const demo of demos) {
    const result = await migrateForUser(demo, asientos, map, chart);
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
