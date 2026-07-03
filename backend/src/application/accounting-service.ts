/**
 * Application service for accounting operations.
 * Manages journal entries (asientos), periods, balances, and reports.
 *
 * Follows the same factory pattern as auth-service.ts and book-service.ts.
 */

import { prisma } from '../infrastructure/database.js';
import type { Asiento, AsientoTipo } from '../domain/asiento.js';
import type { LineaAsiento } from '../domain/linea-asiento.js';
import {
  validateLinea,
  validateBalance,
  buildReversalLines,
  resolveCuenta,
} from '../domain/linea-asiento.js';
import type { AsientoVersion } from '../domain/asiento-version.js';
import type { PeriodoContable } from '../domain/periodo-contable.js';

// ---------------------------------------------------------------------------
// Input / Output types
// ---------------------------------------------------------------------------

export interface CreateEntryLineInput {
  cuentaId?: string;       // CuentaUsuario reference (financial accounts)
  cuentaGlobalId?: string; // CuentaGlobal reference (shared categories)
  debito: number;
  credito: number;
}

export interface CreateEntryParams {
  bookId: string;
  fecha: Date;
  concepto: string;
  lineas: CreateEntryLineInput[];
  idempotencyKey?: string;
}

export interface UpdateEntryParams {
  fecha?: Date;
  concepto?: string;
  lineas?: CreateEntryLineInput[];
}

// ---------------------------------------------------------------------------
// Report types
// ---------------------------------------------------------------------------

export interface CategoryBreakdown {
  cuentaId: string;
  nombre: string;
  total: number;
}

export interface PyGReport {
  año: number;
  totalIncome: number;
  totalExpense: number;
  neto: number;
  incomeBreakdown: CategoryBreakdown[];
  expenseBreakdown: CategoryBreakdown[];
}

export interface BalanceSheetReport {
  año: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  assetsBreakdown: CategoryBreakdown[];
  liabilitiesBreakdown: CategoryBreakdown[];
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface AccountingService {
  // Entry CRUD
  createEntry(
    params: CreateEntryParams,
  ): Promise<{ entry: Asiento; lineas: LineaAsiento[] }>;
  getEntry(
    id: string,
    bookId: string,
  ): Promise<{
    entry: Asiento;
    lineas: LineaAsiento[];
    versiones: AsientoVersion[];
  } | null>;
  listEntries(
    bookId: string,
    año?: number,
    mes?: number,
  ): Promise<Asiento[]>;
  updateEntry(
    id: string,
    bookId: string,
    params: UpdateEntryParams,
    userId: string,
  ): Promise<{ entry: Asiento; lineas: LineaAsiento[] }>;
  voidEntry(
    id: string,
    bookId: string,
  ): Promise<{ reversa: Asiento; lineas: LineaAsiento[] }>;

  // Period management
  ensurePeriod(bookId: string, año: number): Promise<PeriodoContable>;
  closePeriod(bookId: string, año: number): Promise<PeriodoContable>;
  reopenPeriod(bookId: string, año: number): Promise<PeriodoContable>;
  getPeriod(
    bookId: string,
    año: number,
  ): Promise<PeriodoContable | null>;

  // Balances
  getBalance(
    cuentaId: string,
    bookId: string,
    tipo?: 'usuario' | 'global',
  ): Promise<number>;
  getMonthlyBalances(
    cuentaId: string,
    bookId: string,
    año: number,
    tipo?: 'usuario' | 'global',
  ): Promise<Array<{ mes: number; saldo: number }>>;

  // Reports
  getPyG(bookId: string, año: number): Promise<PyGReport>;
  getBalanceSheet(
    bookId: string,
    año: number,
  ): Promise<BalanceSheetReport>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Account type classification from CuentaGlobal codigo first digit. */
type AccountClass = 'asset' | 'liability' | 'income' | 'expense' | 'equity' | 'unknown';

function classifyAccount(codigo: string): AccountClass {
  const first = codigo.charAt(0);
  switch (first) {
    case '1':
      return 'asset';
    case '2':
      return 'liability';
    case '3':
      return 'equity';
    case '4':
      return 'income';
    case '6':
      return 'expense';
    default:
      return 'unknown';
  }
}

/** Safely convert a Prisma Decimal (or number) to a JS number. */
function toNumber(value: { toNumber: () => number } | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

// ---------------------------------------------------------------------------
// Mappers (Prisma → domain)
// ---------------------------------------------------------------------------

function mapAsiento(record: {
  id: string;
  bookId: string;
  fecha: Date;
  concepto: string;
  tipo: string;
  asientoOriginalId: string | null;
  idempotencyKey: string | null;
  anulado: boolean;
  anuladoAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Asiento {
  return {
    id: record.id,
    bookId: record.bookId,
    fecha: record.fecha,
    concepto: record.concepto,
    tipo: record.tipo as AsientoTipo,
    asientoOriginalId: record.asientoOriginalId,
    idempotencyKey: record.idempotencyKey,
    anulado: record.anulado,
    anuladoAt: record.anuladoAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapLinea(record: {
  id: string;
  asientoId: string;
  cuentaId: string | null;
  cuentaGlobalId: string | null;
  debito: { toNumber: () => number } | number;
  credito: { toNumber: () => number } | number;
  createdAt: Date;
}): LineaAsiento {
  return {
    id: record.id,
    asientoId: record.asientoId,
    cuentaId: record.cuentaId,
    cuentaGlobalId: record.cuentaGlobalId,
    debito: toNumber(record.debito),
    credito: toNumber(record.credito),
    createdAt: record.createdAt,
  };
}

function mapPeriod(record: {
  id: string;
  bookId: string;
  año: number;
  abierto: boolean;
  cerradoAt: Date | null;
  reabiertoAt: Date | null;
  createdAt: Date;
}): PeriodoContable {
  return {
    id: record.id,
    bookId: record.bookId,
    año: record.año,
    abierto: record.abierto,
    cerradoAt: record.cerradoAt,
    reabiertoAt: record.reabiertoAt,
    createdAt: record.createdAt,
  };
}

function mapVersion(record: {
  id: string;
  asientoId: string;
  version: number;
  snapshot: unknown;
  modifiedBy: string;
  createdAt: Date;
}): AsientoVersion {
  return {
    id: record.id,
    asientoId: record.asientoId,
    version: record.version,
    snapshot: record.snapshot as Record<string, unknown>,
    modifiedBy: record.modifiedBy,
    createdAt: record.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Period validation helper
// ---------------------------------------------------------------------------

/**
 * Check whether the accounting period for (bookId, año) is open.
 * If the period does not exist yet, it is considered open (will be created
 * on first entry).
 *
 * @throws Error if the period exists and is closed.
 */
async function validatePeriodOpen(
  bookId: string,
  año: number,
): Promise<void> {
  const period = await prisma.periodoContable.findUnique({
    where: { bookId_año: { bookId, año } },
  });
  if (period && !period.abierto) {
    throw new Error(
      `Cannot modify entries in closed period: fiscal year ${año} is closed`,
    );
  }
}

/**
 * Ensure a period exists for (bookId, año). Creates it if missing.
 */
async function ensurePeriodExists(
  bookId: string,
  año: number,
): Promise<PeriodoContable> {
  const existing = await prisma.periodoContable.findUnique({
    where: { bookId_año: { bookId, año } },
  });
  if (existing) return mapPeriod(existing);

  const created = await prisma.periodoContable.create({
    data: { bookId, año, abierto: true },
  });
  return mapPeriod(created);
}

// ---------------------------------------------------------------------------
// Account validation helper
// ---------------------------------------------------------------------------

/**
 * Normalize a line input: extract the referenced account ID for query purposes.
 * Returns { cuentaId, cuentaGlobalId } with exactly one non-null.
 * Throws if both or neither are present.
 */
function normalizeLineAccount(
  line: CreateEntryLineInput,
): { cuentaId: string | null; cuentaGlobalId: string | null } {
  const hasCuenta = Boolean(line.cuentaId);
  const hasGlobal = Boolean(line.cuentaGlobalId);
  if (hasCuenta && hasGlobal) {
    throw new Error('Line cannot have both cuentaId and cuentaGlobalId');
  }
  if (!hasCuenta && !hasGlobal) {
    throw new Error('Line must have either cuentaId or cuentaGlobalId');
  }
  return {
    cuentaId: line.cuentaId ?? null,
    cuentaGlobalId: line.cuentaGlobalId ?? null,
  };
}

/**
 * Validate that all account references in the lines are valid.
 * For cuentaId → verifies the CuentaUsuario exists, is active, belongs to the
 *   book's user, and its linked CuentaGlobal is postable.
 * For cuentaGlobalId → verifies the CuentaGlobal exists and is postable.
 *
 * @throws Error with a descriptive message if any account is invalid.
 */
async function validateEntryAccounts(
  bookId: string,
  lineas: CreateEntryLineInput[],
): Promise<void> {
  // Get book's userId for tenant isolation
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { userId: true },
  });
  if (!book) {
    throw new Error(`Book not found: ${bookId}`);
  }

  // Collect distinct account IDs by type
  const cuentaIds: string[] = [];
  const cuentaGlobalIds: string[] = [];

  for (const l of lineas) {
    if (l.cuentaId) cuentaIds.push(l.cuentaId);
    if (l.cuentaGlobalId) cuentaGlobalIds.push(l.cuentaGlobalId);
  }

  // Validate CuentaUsuario references
  if (cuentaIds.length > 0) {
    const uniqueCuentaIds = [...new Set(cuentaIds)];
    const cuentas = await prisma.cuentaUsuario.findMany({
      where: {
        id: { in: uniqueCuentaIds },
        userId: book.userId,
        activa: true,
        global: { esPostable: true },
      },
      select: { id: true },
    });

    const foundIds = new Set(cuentas.map((c) => c.id));
    for (const cid of uniqueCuentaIds) {
      if (!foundIds.has(cid)) {
        throw new Error(
          `Account ${cid} not found, not active, not postable, or does not belong to this book`,
        );
      }
    }
  }

  // Validate CuentaGlobal references
  if (cuentaGlobalIds.length > 0) {
    const uniqueGlobalIds = [...new Set(cuentaGlobalIds)];
    const globales = await prisma.cuentaGlobal.findMany({
      where: {
        id: { in: uniqueGlobalIds },
        esPostable: true,
      },
      select: { id: true },
    });

    const foundIds = new Set(globales.map((c) => c.id));
    for (const cid of uniqueGlobalIds) {
      if (!foundIds.has(cid)) {
        throw new Error(
          `Global account ${cid} not found or is not postable`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createAccountingService(): AccountingService {
  return {
    // -----------------------------------------------------------------------
    // createEntry
    // -----------------------------------------------------------------------
    async createEntry(params) {
      // 1. Validate each line
      for (const linea of params.lineas) {
        const err = validateLinea(linea);
        if (err) throw new Error(`Invalid line: ${err}`);
      }

      // 2. Validate balance
      const balanceErr = validateBalance(params.lineas);
      if (balanceErr) throw new Error(balanceErr);

      // 3. Extract año from fecha
      const año = params.fecha.getFullYear();

      // 4. Check idempotency
      if (params.idempotencyKey) {
        const existing = await prisma.asiento.findUnique({
          where: { idempotencyKey: params.idempotencyKey },
          include: { lineas: true },
        });
        if (existing) {
          return {
            entry: mapAsiento(existing),
            lineas: existing.lineas.map(mapLinea),
          };
        }
      }

      // 5. Validate all accounts
      await validateEntryAccounts(params.bookId, params.lineas);

      // 6. Ensure period exists and is open
      await ensurePeriodExists(params.bookId, año);
      await validatePeriodOpen(params.bookId, año);

      // 7. Create asiento + lines in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const entry = await tx.asiento.create({
          data: {
            bookId: params.bookId,
            fecha: params.fecha,
            concepto: params.concepto,
            tipo: 'manual',
            ...(params.idempotencyKey && {
              idempotencyKey: params.idempotencyKey,
            }),
          },
        });

        const lineas = await Promise.all(
          params.lineas.map((l) => {
            const { cuentaId, cuentaGlobalId } = normalizeLineAccount(l);
            return tx.lineaAsiento.create({
              data: {
                asientoId: entry.id,
                cuentaId,
                cuentaGlobalId,
                debito: l.debito,
                credito: l.credito,
              },
            });
          }),
        );

        return { entry, lineas };
      });

      return {
        entry: mapAsiento(result.entry),
        lineas: result.lineas.map(mapLinea),
      };
    },

    // -----------------------------------------------------------------------
    // getEntry
    // -----------------------------------------------------------------------
    async getEntry(id, bookId) {
      const record = await prisma.asiento.findUnique({
        where: { id },
        include: {
          lineas: true,
          versiones: { orderBy: { version: 'asc' } },
        },
      });

      if (!record || record.bookId !== bookId) return null;

      return {
        entry: mapAsiento(record),
        lineas: record.lineas.map(mapLinea),
        versiones: record.versiones.map(mapVersion),
      };
    },

    // -----------------------------------------------------------------------
    // listEntries
    // -----------------------------------------------------------------------
    async listEntries(bookId, año, mes) {
      const where: Record<string, unknown> = { bookId };

      if (año !== undefined) {
        if (mes !== undefined) {
          where.fecha = {
            gte: new Date(año, mes - 1, 1),
            lt: new Date(año, mes, 1),
          };
        } else {
          where.fecha = {
            gte: new Date(año, 0, 1),
            lt: new Date(año + 1, 0, 1),
          };
        }
      }

      const records = await prisma.asiento.findMany({
        where,
        orderBy: { fecha: 'desc' },
      });

      return records.map(mapAsiento);
    },

    // -----------------------------------------------------------------------
    // updateEntry
    // -----------------------------------------------------------------------
    async updateEntry(id, bookId, params, userId) {
      // 1. Get existing entry and verify ownership
      const existing = await prisma.asiento.findUnique({
        where: { id },
        include: { lineas: true },
      });

      if (!existing || existing.bookId !== bookId) {
        throw new Error(`Entry ${id} not found in book ${bookId}`);
      }

      // 2. Check not voided
      if (existing.anulado) {
        throw new Error(`Cannot modify voided entry ${id}`);
      }

      // 3. Determine resulting lines (merged with original if not provided)
      const newLineas: CreateEntryLineInput[] = params.lineas ?? existing.lineas.map((l) => ({
        cuentaId: l.cuentaId ?? undefined,
        cuentaGlobalId: l.cuentaGlobalId ?? undefined,
        debito: toNumber(l.debito),
        credito: toNumber(l.credito),
      }));

      // 4. Validate each line
      for (const linea of newLineas) {
        const err = validateLinea(linea);
        if (err) throw new Error(`Invalid line: ${err}`);
      }

      // 5. Validate balance
      const balanceErr = validateBalance(newLineas);
      if (balanceErr) throw new Error(balanceErr);

      // 6. Validate accounts (same as createEntry)
      await validateEntryAccounts(bookId, newLineas);

      // 7. Check period is open (from the entry's fecha)
      const año = existing.fecha.getFullYear();
      await validatePeriodOpen(bookId, año);

      // 8. Save version snapshot, update in transaction
      const fecha = params.fecha ?? existing.fecha;
      const concepto = params.concepto ?? existing.concepto;

      const result = await prisma.$transaction(async (tx) => {
        // Find current max version
        const maxVer = await tx.asientoVersion.findFirst({
          where: { asientoId: id },
          orderBy: { version: 'desc' },
          select: { version: true },
        });
        const nextVersion = (maxVer?.version ?? 0) + 1;

        // Save snapshot
        await tx.asientoVersion.create({
          data: {
            asientoId: id,
            version: nextVersion,
            snapshot: {
              asiento: {
                id: existing.id,
                fecha: existing.fecha,
                concepto: existing.concepto,
                tipo: existing.tipo,
                asientoOriginalId: existing.asientoOriginalId,
                anulado: existing.anulado,
                anuladoAt: existing.anuladoAt,
              },
              lineas: existing.lineas.map((l) => ({
                id: l.id,
                cuentaId: l.cuentaId,
                cuentaGlobalId: l.cuentaGlobalId,
                debito: toNumber(l.debito),
                credito: toNumber(l.credito),
              })),
            },
            modifiedBy: userId,
          },
        });

        // Delete old lines
        await tx.lineaAsiento.deleteMany({
          where: { asientoId: id },
        });

        // Create new lines
        const createdLines = await Promise.all(
          newLineas.map((l) => {
            const { cuentaId, cuentaGlobalId } = normalizeLineAccount(l);
            return tx.lineaAsiento.create({
              data: {
                asientoId: id,
                cuentaId,
                cuentaGlobalId,
                debito: l.debito,
                credito: l.credito,
              },
            });
          }),
        );

        // Update asiento header
        const updated = await tx.asiento.update({
          where: { id },
          data: {
            fecha,
            concepto,
          },
        });

        return { entry: updated, lineas: createdLines };
      });

      return {
        entry: mapAsiento(result.entry),
        lineas: result.lineas.map(mapLinea),
      };
    },

    // -----------------------------------------------------------------------
    // voidEntry
    // -----------------------------------------------------------------------
    async voidEntry(id, bookId) {
      // 1. Get existing entry and verify ownership
      const existing = await prisma.asiento.findUnique({
        where: { id },
        include: { lineas: true },
      });

      if (!existing || existing.bookId !== bookId) {
        throw new Error(`Entry ${id} not found in book ${bookId}`);
      }

      // 2. Check not already voided
      if (existing.anulado) {
        throw new Error(`Entry ${id} is already voided`);
      }

      // 3. Check period is open
      const año = existing.fecha.getFullYear();
      await validatePeriodOpen(bookId, año);

      // 4. Build reversal lines and create in transaction
      const reversalLines = buildReversalLines(
        existing.lineas.map(mapLinea),
      );

      const result = await prisma.$transaction(async (tx) => {
        // Create reversal asiento
        const reversa = await tx.asiento.create({
          data: {
            bookId,
            fecha: new Date(),
            concepto: `Reversal of entry ${existing.concepto}`,
            tipo: 'reversa',
            asientoOriginalId: id,
          },
        });

        // Create reversal lines
        const lineas = await Promise.all(
          reversalLines.map((l) =>
            tx.lineaAsiento.create({
              data: {
                asientoId: reversa.id,
                cuentaId: l.cuentaId,
                cuentaGlobalId: l.cuentaGlobalId,
                debito: l.debito,
                credito: l.credito,
              },
            }),
          ),
        );

        // Mark original as voided
        await tx.asiento.update({
          where: { id },
          data: {
            anulado: true,
            anuladoAt: new Date(),
          },
        });

        return { reversa, lineas };
      });

      return {
        reversa: mapAsiento(result.reversa),
        lineas: result.lineas.map(mapLinea),
      };
    },

    // -----------------------------------------------------------------------
    // ensurePeriod
    // -----------------------------------------------------------------------
    async ensurePeriod(bookId, año) {
      return ensurePeriodExists(bookId, año);
    },

    // -----------------------------------------------------------------------
    // closePeriod
    // -----------------------------------------------------------------------
    async closePeriod(bookId, año) {
      const period = await prisma.periodoContable.findUnique({
        where: { bookId_año: { bookId, año } },
      });

      if (!period) {
        throw new Error(
          `Period for fiscal year ${año} does not exist in book ${bookId}`,
        );
      }

      if (!period.abierto) {
        throw new Error(`Period for fiscal year ${año} is already closed`);
      }

      const updated = await prisma.periodoContable.update({
        where: { bookId_año: { bookId, año } },
        data: { abierto: false, cerradoAt: new Date() },
      });

      return mapPeriod(updated);
    },

    // -----------------------------------------------------------------------
    // reopenPeriod
    // -----------------------------------------------------------------------
    async reopenPeriod(bookId, año) {
      const period = await prisma.periodoContable.findUnique({
        where: { bookId_año: { bookId, año } },
      });

      if (!period) {
        throw new Error(
          `Period for fiscal year ${año} does not exist in book ${bookId}`,
        );
      }

      if (period.abierto) {
        throw new Error(`Period for fiscal year ${año} is already open`);
      }

      const updated = await prisma.periodoContable.update({
        where: { bookId_año: { bookId, año } },
        data: { abierto: true, reabiertoAt: new Date() },
      });

      return mapPeriod(updated);
    },

    // -----------------------------------------------------------------------
    // getPeriod
    // -----------------------------------------------------------------------
    async getPeriod(bookId, año) {
      const period = await prisma.periodoContable.findUnique({
        where: { bookId_año: { bookId, año } },
      });

      return period ? mapPeriod(period) : null;
    },

    // -----------------------------------------------------------------------
    // getBalance
    // -----------------------------------------------------------------------
    async getBalance(cuentaId, bookId, tipo = 'usuario') {
      if (tipo === 'global') {
        const result = await prisma.lineaAsiento.aggregate({
          where: {
            cuentaGlobalId: cuentaId,
            asiento: {
              bookId,
              anulado: false,
            },
          },
          _sum: {
            debito: true,
            credito: true,
          },
        });

        const totalDebito = toNumber(result._sum.debito ?? 0);
        const totalCredito = toNumber(result._sum.credito ?? 0);
        return totalDebito - totalCredito;
      }

      // Default: CuentaUsuario balance
      const result = await prisma.lineaAsiento.aggregate({
        where: {
          cuentaId,
          asiento: {
            bookId,
            anulado: false,
          },
        },
        _sum: {
          debito: true,
          credito: true,
        },
      });

      const totalDebito = toNumber(result._sum.debito ?? 0);
      const totalCredito = toNumber(result._sum.credito ?? 0);
      return totalDebito - totalCredito;
    },

    // -----------------------------------------------------------------------
    // getMonthlyBalances
    // -----------------------------------------------------------------------
    async getMonthlyBalances(cuentaId, bookId, año, tipo = 'usuario') {
      if (tipo === 'global') {
        const rows: Array<{ mes: number; totalDebito: number; totalCredito: number }> =
          await prisma.$queryRaw`
            SELECT
              EXTRACT(MONTH FROM a.fecha)::int AS mes,
              COALESCE(SUM(l.debito), 0) AS "totalDebito",
              COALESCE(SUM(l.credito), 0) AS "totalCredito"
            FROM lineas_asiento l
            INNER JOIN asientos a ON a.id = l."asientoId"
            WHERE l."cuentaGlobalId" = ${cuentaId}
              AND a."bookId" = ${bookId}
              AND a.anulado = false
              AND EXTRACT(YEAR FROM a.fecha) = ${año}::int
            GROUP BY EXTRACT(MONTH FROM a.fecha)
            ORDER BY mes
          `;

        return rows.map((r) => ({
          mes: r.mes,
          saldo: Number(r.totalDebito) - Number(r.totalCredito),
        }));
      }

      // Default: CuentaUsuario monthly balances
      const rows: Array<{ mes: number; totalDebito: number; totalCredito: number }> =
        await prisma.$queryRaw`
          SELECT
            EXTRACT(MONTH FROM a.fecha)::int AS mes,
            COALESCE(SUM(l.debito), 0) AS "totalDebito",
            COALESCE(SUM(l.credito), 0) AS "totalCredito"
          FROM lineas_asiento l
          INNER JOIN asientos a ON a.id = l."asientoId"
          WHERE l."cuentaId" = ${cuentaId}
            AND a."bookId" = ${bookId}
            AND a.anulado = false
            AND EXTRACT(YEAR FROM a.fecha) = ${año}::int
          GROUP BY EXTRACT(MONTH FROM a.fecha)
          ORDER BY mes
        `;

      return rows.map((r) => ({
        mes: r.mes,
        saldo: Number(r.totalDebito) - Number(r.totalCredito),
      }));
    },

    // -----------------------------------------------------------------------
    // getPyG
    // -----------------------------------------------------------------------
    async getPyG(bookId, año) {
      // Fetch all non-voided entries for the year with lines and account info
      const asientos = await prisma.asiento.findMany({
        where: {
          bookId,
          anulado: false,
          fecha: {
            gte: new Date(año, 0, 1),
            lt: new Date(año + 1, 0, 1),
          },
        },
        include: {
          lineas: {
            include: {
              cuenta: {
                include: {
                  global: true,
                },
              },
              cuentaGlobal: true,
            },
          },
        },
      });

      let totalIncome = 0;
      let totalExpense = 0;
      const incomeMap = new Map<
        string,
        { nombre: string; total: number }
      >();
      const expenseMap = new Map<
        string,
        { nombre: string; total: number }
      >();

      for (const asiento of asientos) {
        for (const linea of asiento.lineas) {
          const { nombreCuenta, codigoCuenta } = resolveCuenta(linea);
          const codigo = codigoCuenta;
          const nombre = nombreCuenta;
          // globalId for grouping — prefer CuentaGlobal id
          const globalId = linea.cuentaGlobalId
            ? (linea.cuentaGlobal?.id ?? linea.cuenta?.global?.id ?? '')
            : (linea.cuenta?.id ?? '');

          const tipo = classifyAccount(codigo);
          if (tipo === 'unknown' && !codigo) continue; // skip uncategorised

          const debito = toNumber(linea.debito);
          const credito = toNumber(linea.credito);

          if (tipo === 'income') {
            const amount = credito - debito; // credit-natural
            if (amount === 0) continue;
            totalIncome += amount;
            const entry = incomeMap.get(globalId) ?? {
              nombre,
              total: 0,
            };
            entry.total += amount;
            incomeMap.set(globalId, entry);
          } else if (tipo === 'expense') {
            const amount = debito - credito; // debit-natural
            if (amount === 0) continue;
            totalExpense += amount;
            const entry = expenseMap.get(globalId) ?? {
              nombre,
              total: 0,
            };
            entry.total += amount;
            expenseMap.set(globalId, entry);
          }
        }
      }

      return {
        año,
        totalIncome,
        totalExpense,
        neto: totalIncome - totalExpense,
        incomeBreakdown: Array.from(incomeMap.entries()).map(
          ([cuentaId, v]) => ({ cuentaId, nombre: v.nombre, total: v.total }),
        ),
        expenseBreakdown: Array.from(expenseMap.entries()).map(
          ([cuentaId, v]) => ({ cuentaId, nombre: v.nombre, total: v.total }),
        ),
      };
    },

    // -----------------------------------------------------------------------
    // getBalanceSheet
    // -----------------------------------------------------------------------
    async getBalanceSheet(bookId, año) {
      // Fetch all non-voided entries for the year with lines and account info
      const asientos = await prisma.asiento.findMany({
        where: {
          bookId,
          anulado: false,
          fecha: {
            gte: new Date(año, 0, 1),
            lt: new Date(año + 1, 0, 1),
          },
        },
        include: {
          lineas: {
            include: {
              cuenta: {
                include: {
                  global: true,
                },
              },
              cuentaGlobal: true,
            },
          },
        },
      });

      let totalAssets = 0;
      let totalLiabilities = 0;
      const assetMap = new Map<
        string,
        { nombre: string; total: number }
      >();
      const liabilityMap = new Map<
        string,
        { nombre: string; total: number }
      >();

      for (const asiento of asientos) {
        for (const linea of asiento.lineas) {
          const { nombreCuenta, codigoCuenta } = resolveCuenta(linea);
          const codigo = codigoCuenta;
          const nombre = nombreCuenta;
          // globalId for grouping — prefer CuentaGlobal id
          const globalId = linea.cuentaGlobalId
            ? (linea.cuentaGlobal?.id ?? linea.cuenta?.global?.id ?? '')
            : (linea.cuenta?.id ?? '');

          const tipo = classifyAccount(codigo);
          if (tipo === 'unknown' && !codigo) continue;

          const debito = toNumber(linea.debito);
          const credito = toNumber(linea.credito);

          if (tipo === 'asset') {
            const amount = debito - credito; // debit-natural
            if (amount === 0) continue;
            totalAssets += amount;
            const entry = assetMap.get(globalId) ?? {
              nombre,
              total: 0,
            };
            entry.total += amount;
            assetMap.set(globalId, entry);
          } else if (tipo === 'liability') {
            const amount = credito - debito; // credit-natural
            if (amount === 0) continue;
            totalLiabilities += amount;
            const entry = liabilityMap.get(globalId) ?? {
              nombre,
              total: 0,
            };
            entry.total += amount;
            liabilityMap.set(globalId, entry);
          }
          // Note: equity (3xxx) is not tracked separately in MVP;
          // it is derived as assets - liabilities
        }
      }

      return {
        año,
        totalAssets,
        totalLiabilities,
        equity: totalAssets - totalLiabilities,
        assetsBreakdown: Array.from(assetMap.entries()).map(
          ([cuentaId, v]) => ({ cuentaId, nombre: v.nombre, total: v.total }),
        ),
        liabilitiesBreakdown: Array.from(liabilityMap.entries()).map(
          ([cuentaId, v]) => ({
            cuentaId,
            nombre: v.nombre,
            total: v.total,
          }),
        ),
      };
    },
  };
}
