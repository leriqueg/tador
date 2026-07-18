/**
 * Application service for accounting operations.
 * Manages journal entries (asientos), periods, balances, and reports.
 */

import type { Asiento, AsientoTipo } from '../domain/asiento.js';
import type { LineaAsiento } from '../domain/linea-asiento.js';
import {
  validateLinea,
  validateBalance,
  buildReversalLines,
  resolveCuenta,
  quantizeEntryLines,
} from '../domain/linea-asiento.js';
import {
  DEFAULT_CURRENCY,
  moneyToNumber,
  quantizeMoney,
} from '../domain/money.js';
import type { AsientoVersion } from '../domain/asiento-version.js';
import type { PeriodoContable } from '../domain/periodo-contable.js';
import { assertProjectedBalances } from './account-balance-policy.js';
import type {
  JournalAsientoRecord,
  JournalAsientoWithLines,
  JournalLineaRecord,
  JournalReportAsiento,
  JournalStore,
} from './ports/journal-store.js';

// ---------------------------------------------------------------------------
// Input / Output types
// ---------------------------------------------------------------------------

export interface CreateEntryLineInput {
  cuentaId?: string;
  cuentaGlobalId?: string;
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

export interface AccountingService {
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
  ensurePeriod(bookId: string, año: number): Promise<PeriodoContable>;
  closePeriod(bookId: string, año: number): Promise<PeriodoContable>;
  reopenPeriod(bookId: string, año: number): Promise<PeriodoContable>;
  getPeriod(
    bookId: string,
    año: number,
  ): Promise<PeriodoContable | null>;
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
  getPyG(bookId: string, año: number): Promise<PyGReport>;
  getBalanceSheet(
    bookId: string,
    año: number,
  ): Promise<BalanceSheetReport>;
}

type AccountClass =
  | 'asset'
  | 'liability'
  | 'income'
  | 'expense'
  | 'equity'
  | 'unknown';

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

function toNumber(
  value:
    | { toNumber?: () => number; toString: () => string }
    | number
    | string,
  currencyCode: string = DEFAULT_CURRENCY,
): number {
  if (typeof value === 'number') {
    return moneyToNumber(value, currencyCode);
  }
  if (typeof value === 'string') {
    return moneyToNumber(value, currencyCode);
  }
  if (typeof value.toNumber === 'function') {
    return moneyToNumber(value.toNumber(), currencyCode);
  }
  return moneyToNumber(value.toString(), currencyCode);
}

function mapAsiento(record: JournalAsientoRecord): Asiento {
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

function mapLinea(
  record: JournalLineaRecord,
  currencyCode: string = DEFAULT_CURRENCY,
): LineaAsiento {
  return {
    id: record.id,
    asientoId: record.asientoId,
    cuentaId: record.cuentaId,
    cuentaGlobalId: record.cuentaGlobalId,
    debito: toNumber(record.debito, currencyCode),
    credito: toNumber(record.credito, currencyCode),
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

function mapAsientoWithLines(
  record: JournalAsientoWithLines,
  currencyCode: string = DEFAULT_CURRENCY,
): { entry: Asiento; lineas: LineaAsiento[] } {
  return {
    entry: mapAsiento(record),
    lineas: record.lineas.map((linea) => mapLinea(linea, currencyCode)),
  };
}

async function validatePeriodOpen(
  store: JournalStore,
  bookId: string,
  año: number,
): Promise<void> {
  const period = await store.findPeriod(bookId, año);
  if (period && !period.abierto) {
    throw new Error(
      `Cannot modify entries in closed period: fiscal year ${año} is closed`,
    );
  }
}

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

async function validateEntryAccounts(
  store: JournalStore,
  bookId: string,
  lineas: CreateEntryLineInput[],
): Promise<void> {
  const userId = await store.findBookUserId(bookId);
  if (!userId) {
    throw new Error(`Book not found: ${bookId}`);
  }

  const cuentaIds: string[] = [];
  const cuentaGlobalIds: string[] = [];

  for (const l of lineas) {
    if (l.cuentaId) cuentaIds.push(l.cuentaId);
    if (l.cuentaGlobalId) cuentaGlobalIds.push(l.cuentaGlobalId);
  }

  if (cuentaIds.length > 0) {
    const uniqueCuentaIds = [...new Set(cuentaIds)];
    const foundIds = new Set(
      await store.findActiveUserAccountIds(userId, uniqueCuentaIds),
    );
    for (const cid of uniqueCuentaIds) {
      if (!foundIds.has(cid)) {
        throw new Error(
          `Account ${cid} not found, not active, or does not belong to this book`,
        );
      }
    }
  }

  if (cuentaGlobalIds.length > 0) {
    const uniqueGlobalIds = [...new Set(cuentaGlobalIds)];
    const foundIds = new Set(await store.findPostableGlobalIds(uniqueGlobalIds));
    for (const cid of uniqueGlobalIds) {
      if (!foundIds.has(cid)) {
        throw new Error(
          `Global account ${cid} not found or is not postable`,
        );
      }
    }
  }
}

function reportLineForResolve(linea: JournalReportAsiento['lineas'][number]) {
  return {
    cuentaId: linea.cuentaId,
    cuentaGlobalId: linea.cuentaGlobalId,
    cuenta: linea.cuentaUsuario
      ? {
          nombre: linea.cuentaUsuario.nombre,
          codigo: linea.cuentaUsuario.codigo,
          global: linea.cuentaUsuario.global
            ? {
                codigo: linea.cuentaUsuario.global.codigo,
                nombre: linea.cuentaUsuario.nombre,
              }
            : null,
        }
      : null,
    cuentaGlobal: linea.cuentaGlobal,
  };
}

export function createAccountingService(store: JournalStore): AccountingService {
  return {
    async createEntry(params) {
      for (const linea of params.lineas) {
        const err = validateLinea(linea);
        if (err) throw new Error(`Invalid line: ${err}`);
      }

      const currency =
        (await store.getBookCurrency(params.bookId)) ?? DEFAULT_CURRENCY;
      const quantizedLines = quantizeEntryLines(params.lineas, currency);

      const balanceErr = validateBalance(quantizedLines, currency);
      if (balanceErr) throw new Error(balanceErr);

      const año = params.fecha.getFullYear();

      if (params.idempotencyKey) {
        const existing = await store.findAsientoByIdempotencyKey(
          params.idempotencyKey,
        );
        if (existing) {
          return mapAsientoWithLines(existing, currency);
        }
      }

      await validateEntryAccounts(store, params.bookId, quantizedLines);
      await store.ensurePeriod(params.bookId, año);
      await validatePeriodOpen(store, params.bookId, año);

      let result: JournalAsientoWithLines;
      try {
        result = await store.runInTransaction(async (tx) => {
          if (params.idempotencyKey) {
            await tx.lockKey(`idempotency:${params.idempotencyKey}`);
            const replay = await tx.findAsientoByIdempotencyKey(
              params.idempotencyKey,
            );
            if (replay) return replay;
          }

          const userId = await tx.findBookUserId(params.bookId);
          if (!userId) throw new Error(`Book not found: ${params.bookId}`);

          await assertProjectedBalances(tx, {
            bookId: params.bookId,
            userId,
            lines: quantizedLines,
          });

          const entry = await tx.createAsiento({
            bookId: params.bookId,
            fecha: params.fecha,
            concepto: params.concepto,
            tipo: 'manual',
            idempotencyKey: params.idempotencyKey,
          });

          const lineas = await Promise.all(
            quantizedLines.map((l) => {
              const { cuentaId, cuentaGlobalId } = normalizeLineAccount(l);
              return tx.createLinea({
                asientoId: entry.id,
                cuentaId,
                cuentaGlobalId,
                debito: quantizeMoney(l.debito, currency).toFixed(),
                credito: quantizeMoney(l.credito, currency).toFixed(),
              });
            }),
          );

          return { ...entry, lineas };
        });
      } catch (err) {
        if (params.idempotencyKey && store.isUniqueConstraintError(err)) {
          const existing = await store.findAsientoByIdempotencyKey(
            params.idempotencyKey,
          );
          if (existing) {
            return mapAsientoWithLines(existing, currency);
          }
        }
        throw err;
      }

      return mapAsientoWithLines(result, currency);
    },

    async getEntry(id, bookId) {
      const record = await store.findAsientoDetail(id);
      if (!record || record.bookId !== bookId) return null;

      const currency = (await store.getBookCurrency(bookId)) ?? DEFAULT_CURRENCY;
      return {
        entry: mapAsiento(record),
        lineas: record.lineas.map((linea) => mapLinea(linea, currency)),
        versiones: record.versiones.map(mapVersion),
      };
    },

    async listEntries(bookId, año, mes) {
      let fechaGte: Date | undefined;
      let fechaLt: Date | undefined;

      if (año !== undefined) {
        if (mes !== undefined) {
          fechaGte = new Date(año, mes - 1, 1);
          fechaLt = new Date(año, mes, 1);
        } else {
          fechaGte = new Date(año, 0, 1);
          fechaLt = new Date(año + 1, 0, 1);
        }
      }

      const records = await store.listAsientos(bookId, fechaGte, fechaLt);
      return records.map(mapAsiento);
    },

    async updateEntry(id, bookId, params, userId) {
      const existing = await store.findAsientoWithLines(id);
      if (!existing || existing.bookId !== bookId) {
        throw new Error(`Entry ${id} not found in book ${bookId}`);
      }

      if (existing.anulado) {
        throw new Error(`Cannot modify voided entry ${id}`);
      }

      const currency = (await store.getBookCurrency(bookId)) ?? DEFAULT_CURRENCY;
      const newLineas: CreateEntryLineInput[] =
        params.lineas ??
        existing.lineas.map((l) => ({
          cuentaId: l.cuentaId ?? undefined,
          cuentaGlobalId: l.cuentaGlobalId ?? undefined,
          debito: toNumber(l.debito, currency),
          credito: toNumber(l.credito, currency),
        }));

      for (const linea of newLineas) {
        const err = validateLinea(linea);
        if (err) throw new Error(`Invalid line: ${err}`);
      }

      const quantizedLineas = quantizeEntryLines(newLineas, currency);
      const balanceErr = validateBalance(quantizedLineas, currency);
      if (balanceErr) throw new Error(balanceErr);

      await validateEntryAccounts(store, bookId, quantizedLineas);

      const año = existing.fecha.getFullYear();
      await validatePeriodOpen(store, bookId, año);

      const fecha = params.fecha ?? existing.fecha;
      const concepto = params.concepto ?? existing.concepto;

      const result = await store.runInTransaction(async (tx) => {
        await assertProjectedBalances(tx, {
          bookId,
          userId,
          lines: quantizedLineas,
          replacingAsientoId: id,
        });

        const nextVersion = (await tx.findMaxVersion(id)) + 1;

        await tx.createVersion({
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
              debito: toNumber(l.debito, currency),
              credito: toNumber(l.credito, currency),
            })),
          },
          modifiedBy: userId,
        });

        await tx.deleteLineas(id);

        const createdLines = await Promise.all(
          quantizedLineas.map((l) => {
            const { cuentaId, cuentaGlobalId } = normalizeLineAccount(l);
            return tx.createLinea({
              asientoId: id,
              cuentaId,
              cuentaGlobalId,
              debito: quantizeMoney(l.debito, currency).toFixed(),
              credito: quantizeMoney(l.credito, currency).toFixed(),
            });
          }),
        );

        const updated = await tx.updateAsiento(id, { fecha, concepto });
        return { entry: updated, lineas: createdLines };
      });

      return {
        entry: mapAsiento(result.entry),
        lineas: result.lineas.map((linea) => mapLinea(linea, currency)),
      };
    },

    async voidEntry(id, bookId) {
      const existing = await store.findAsientoWithLines(id);
      if (!existing || existing.bookId !== bookId) {
        throw new Error(`Entry ${id} not found in book ${bookId}`);
      }

      if (existing.anulado) {
        throw new Error(`Entry ${id} is already voided`);
      }

      const currency = (await store.getBookCurrency(bookId)) ?? DEFAULT_CURRENCY;
      const año = existing.fecha.getFullYear();
      await validatePeriodOpen(store, bookId, año);

      const reversalLines = buildReversalLines(
        existing.lineas.map((linea) => mapLinea(linea, currency)),
      );

      const result = await store.runInTransaction(async (tx) => {
        const userId = await tx.findBookUserId(bookId);
        if (!userId) throw new Error(`Book not found: ${bookId}`);

        await assertProjectedBalances(tx, {
          bookId,
          userId,
          lines: existing.lineas.map((line) => ({
            cuentaId: line.cuentaId,
            cuentaGlobalId: line.cuentaGlobalId,
            debito: 0,
            credito: 0,
          })),
          replacingAsientoId: id,
        });

        const reversa = await tx.createAsiento({
          bookId,
          fecha: new Date(),
          concepto: `Reversal of entry ${existing.concepto}`,
          tipo: 'reversa',
          asientoOriginalId: id,
        });

        const lineas = await Promise.all(
          reversalLines.map((l) =>
            tx.createLinea({
              asientoId: reversa.id,
              cuentaId: l.cuentaId,
              cuentaGlobalId: l.cuentaGlobalId,
              debito: String(l.debito),
              credito: String(l.credito),
            }),
          ),
        );

        await tx.updateAsiento(id, {
          anulado: true,
          anuladoAt: new Date(),
        });

        return { reversa, lineas };
      });

      return {
        reversa: mapAsiento(result.reversa),
        lineas: result.lineas.map((linea) => mapLinea(linea, currency)),
      };
    },

    async ensurePeriod(bookId, año) {
      const period = await store.ensurePeriod(bookId, año);
      return mapPeriod(period);
    },

    async closePeriod(bookId, año) {
      const period = await store.findPeriod(bookId, año);
      if (!period) {
        throw new Error(
          `Period for fiscal year ${año} does not exist in book ${bookId}`,
        );
      }
      if (!period.abierto) {
        throw new Error(`Period for fiscal year ${año} is already closed`);
      }
      const updated = await store.closePeriod(bookId, año);
      return mapPeriod(updated);
    },

    async reopenPeriod(bookId, año) {
      const period = await store.findPeriod(bookId, año);
      if (!period) {
        throw new Error(
          `Period for fiscal year ${año} does not exist in book ${bookId}`,
        );
      }
      if (period.abierto) {
        throw new Error(`Period for fiscal year ${año} is already open`);
      }
      const updated = await store.reopenPeriod(bookId, año);
      return mapPeriod(updated);
    },

    async getPeriod(bookId, año) {
      const period = await store.findPeriod(bookId, año);
      return period ? mapPeriod(period) : null;
    },

    async getBalance(cuentaId, bookId, tipo = 'usuario') {
      const currency = (await store.getBookCurrency(bookId)) ?? DEFAULT_CURRENCY;
      const account =
        tipo === 'global'
          ? ({ kind: 'global' as const, id: cuentaId })
          : ({ kind: 'user' as const, id: cuentaId });
      const result = await store.aggregateBalance(bookId, account);
      const totalDebito = toNumber(result.debito, currency);
      const totalCredito = toNumber(result.credito, currency);
      return totalDebito - totalCredito;
    },

    async getMonthlyBalances(cuentaId, bookId, año, tipo = 'usuario') {
      const account =
        tipo === 'global'
          ? ({ kind: 'global' as const, id: cuentaId })
          : ({ kind: 'user' as const, id: cuentaId });
      const rows = await store.listMonthlyBalances(bookId, account, año);
      return rows.map((r) => ({
        mes: r.mes,
        saldo: Number(r.totalDebito) - Number(r.totalCredito),
      }));
    },

    async getPyG(bookId, año) {
      const currency = (await store.getBookCurrency(bookId)) ?? DEFAULT_CURRENCY;
      const asientos = await store.listReportAsientos(bookId, año);

      let totalIncome = 0;
      let totalExpense = 0;
      const incomeMap = new Map<string, { nombre: string; total: number }>();
      const expenseMap = new Map<string, { nombre: string; total: number }>();

      for (const asiento of asientos) {
        for (const linea of asiento.lineas) {
          const { nombreCuenta, codigoCuenta } = resolveCuenta(
            reportLineForResolve(linea),
          );
          const codigo = codigoCuenta;
          const nombre = nombreCuenta;
          const globalId = linea.cuentaGlobalId
            ? (linea.cuentaGlobal?.id ?? '')
            : (linea.cuentaUsuario?.id ?? '');

          const tipo = classifyAccount(codigo);
          if (tipo === 'unknown' && !codigo) continue;

          const debito = toNumber(linea.debito, currency);
          const credito = toNumber(linea.credito, currency);

          if (tipo === 'income') {
            const amount = credito - debito;
            if (amount === 0) continue;
            totalIncome += amount;
            const entry = incomeMap.get(globalId) ?? { nombre, total: 0 };
            entry.total += amount;
            incomeMap.set(globalId, entry);
          } else if (tipo === 'expense') {
            const amount = debito - credito;
            if (amount === 0) continue;
            totalExpense += amount;
            const entry = expenseMap.get(globalId) ?? { nombre, total: 0 };
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

    async getBalanceSheet(bookId, año) {
      const currency = (await store.getBookCurrency(bookId)) ?? DEFAULT_CURRENCY;
      const asientos = await store.listReportAsientos(bookId, año);

      let totalAssets = 0;
      let totalLiabilities = 0;
      const assetMap = new Map<string, { nombre: string; total: number }>();
      const liabilityMap = new Map<string, { nombre: string; total: number }>();

      for (const asiento of asientos) {
        for (const linea of asiento.lineas) {
          const { nombreCuenta, codigoCuenta } = resolveCuenta(
            reportLineForResolve(linea),
          );
          const codigo = codigoCuenta;
          const nombre = nombreCuenta;
          const globalId = linea.cuentaGlobalId
            ? (linea.cuentaGlobal?.id ?? '')
            : (linea.cuentaUsuario?.id ?? '');

          const tipo = classifyAccount(codigo);
          if (tipo === 'unknown' && !codigo) continue;

          const debito = toNumber(linea.debito, currency);
          const credito = toNumber(linea.credito, currency);

          if (tipo === 'asset') {
            const amount = debito - credito;
            if (amount === 0) continue;
            totalAssets += amount;
            const entry = assetMap.get(globalId) ?? { nombre, total: 0 };
            entry.total += amount;
            assetMap.set(globalId, entry);
          } else if (tipo === 'liability') {
            const amount = credito - debito;
            if (amount === 0) continue;
            totalLiabilities += amount;
            const entry = liabilityMap.get(globalId) ?? { nombre, total: 0 };
            entry.total += amount;
            liabilityMap.set(globalId, entry);
          }
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
