/**
 * Prisma adapter for JournalStore — journal entries, periods, balances, reports.
 */

import Decimal from 'decimal.js';
import { Prisma } from '@prisma/client';
import type { AsientoTipo } from '../../domain/asiento.js';
import { prisma } from '../database.js';
import type {
  BalancePolicyLine,
  CreateAsientoData,
  CreateLineaData,
  JournalAsientoDetail,
  JournalAsientoRecord,
  JournalAsientoWithLines,
  JournalLineaRecord,
  JournalMonthlyBalanceRow,
  JournalPeriodRecord,
  JournalReportAsiento,
  JournalStore,
  JournalTransaction,
  ProtectedAccountRecord,
} from '../../application/ports/journal-store.js';

export type { JournalStore, JournalTransaction };

const DEBIT_NATURAL_PREFIXES = ['1111', '1112', '1132'];
const CREDIT_NATURAL_PREFIXES = ['2112', '2120'];

function naturalSideForCode(
  code: string | null,
): 'debit' | 'credit' | null {
  if (!code) return null;
  if (DEBIT_NATURAL_PREFIXES.some((prefix) => code.startsWith(prefix))) {
    return 'debit';
  }
  if (CREDIT_NATURAL_PREFIXES.some((prefix) => code.startsWith(prefix))) {
    return 'credit';
  }
  return null;
}

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
}): JournalAsientoRecord {
  return { ...record };
}

function mapLinea(record: {
  id: string;
  asientoId: string;
  cuentaId: string | null;
  cuentaGlobalId: string | null;
  debito: { toString(): string } | number | string;
  credito: { toString(): string } | number | string;
  createdAt: Date;
}): JournalLineaRecord {
  return {
    id: record.id,
    asientoId: record.asientoId,
    cuentaId: record.cuentaId,
    cuentaGlobalId: record.cuentaGlobalId,
    debito: record.debito,
    credito: record.credito,
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
}): JournalPeriodRecord {
  return { ...record };
}

function asientoWithLinesInclude() {
  return { lineas: true } as const;
}

function asientoDetailInclude() {
  return {
    lineas: true,
    versiones: { orderBy: { version: 'asc' as const } },
  } as const;
}

function reportAsientoInclude() {
  return {
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
  } as const;
}

function mapAsientoWithLines(record: {
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
  lineas: Array<{
    id: string;
    asientoId: string;
    cuentaId: string | null;
    cuentaGlobalId: string | null;
    debito: { toString(): string } | number | string;
    credito: { toString(): string } | number | string;
    createdAt: Date;
  }>;
}): JournalAsientoWithLines {
  return {
    ...mapAsiento(record),
    lineas: record.lineas.map(mapLinea),
  };
}

function mapReportAsiento(record: {
  id: string;
  fecha: Date;
  lineas: Array<{
    cuentaId: string | null;
    cuentaGlobalId: string | null;
    debito: { toString(): string } | number | string;
    credito: { toString(): string } | number | string;
    cuenta: {
      id: string;
      nombre: string;
      codigo: string | null;
      global: { codigo: string } | null;
    } | null;
    cuentaGlobal: { id: string; nombre: string; codigo: string } | null;
  }>;
}): JournalReportAsiento {
  return {
    id: record.id,
    fecha: record.fecha,
    lineas: record.lineas.map((linea) => ({
      cuentaId: linea.cuentaId,
      cuentaGlobalId: linea.cuentaGlobalId,
      debito: linea.debito,
      credito: linea.credito,
      cuentaUsuario: linea.cuenta
        ? {
            id: linea.cuenta.id,
            nombre: linea.cuenta.nombre,
            codigo: linea.cuenta.codigo,
            global: linea.cuenta.global,
          }
        : null,
      cuentaGlobal: linea.cuentaGlobal,
    })),
  };
}

function createTransactionMethods(
  tx: Prisma.TransactionClient,
): JournalTransaction {
  return {
    async lockKey(key: string): Promise<void> {
      await tx.$queryRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text AS locked`,
      );
    },

    async findAsientoByIdempotencyKey(key: string) {
      const record = await tx.asiento.findUnique({
        where: { idempotencyKey: key },
        include: asientoWithLinesInclude(),
      });
      return record ? mapAsientoWithLines(record) : null;
    },

    async findBookUserId(bookId: string): Promise<string | null> {
      const book = await tx.book.findUnique({
        where: { id: bookId },
        select: { userId: true },
      });
      return book?.userId ?? null;
    },

    async createAsiento(data: CreateAsientoData): Promise<JournalAsientoRecord> {
      const record = await tx.asiento.create({
        data: {
          bookId: data.bookId,
          fecha: data.fecha,
          concepto: data.concepto,
          tipo: data.tipo as AsientoTipo,
          ...(data.idempotencyKey && { idempotencyKey: data.idempotencyKey }),
          ...(data.asientoOriginalId && {
            asientoOriginalId: data.asientoOriginalId,
          }),
        },
      });
      return mapAsiento(record);
    },

    async createLinea(data: CreateLineaData): Promise<JournalLineaRecord> {
      const record = await tx.lineaAsiento.create({
        data: {
          asientoId: data.asientoId,
          cuentaId: data.cuentaId,
          cuentaGlobalId: data.cuentaGlobalId,
          debito: data.debito,
          credito: data.credito,
        },
      });
      return mapLinea(record);
    },

    async loadProtectedAccounts(
      userId: string,
      lines: BalancePolicyLine[],
    ): Promise<ProtectedAccountRecord[]> {
      const userIds = [
        ...new Set(
          lines.flatMap((line) => (line.cuentaId ? [line.cuentaId] : [])),
        ),
      ];
      const globalIds = [
        ...new Set(
          lines.flatMap((line) =>
            line.cuentaGlobalId ? [line.cuentaGlobalId] : [],
          ),
        ),
      ];

      const [userAccounts, globalAccounts, activations] = await Promise.all([
        tx.cuentaUsuario.findMany({
          where: { id: { in: userIds }, userId },
          select: {
            id: true,
            nombre: true,
            enforceNonNegativeBalance: true,
            global: { select: { codigo: true } },
          },
        }),
        tx.cuentaGlobal.findMany({
          where: { id: { in: globalIds } },
          select: { id: true, nombre: true, codigo: true },
        }),
        tx.activacionCuentaGlobal.findMany({
          where: { userId, globalId: { in: globalIds } },
          select: { globalId: true, enforceNonNegativeBalance: true },
        }),
      ]);

      const activationByGlobal = new Map(
        activations.map((activation) => [
          activation.globalId,
          activation.enforceNonNegativeBalance,
        ]),
      );
      const result: ProtectedAccountRecord[] = [];

      for (const account of userAccounts) {
        const naturalSide = naturalSideForCode(account.global?.codigo ?? null);
        if (!naturalSide) continue;
        result.push({
          kind: 'user',
          id: account.id,
          name: account.nombre,
          naturalSide,
          enforce: account.enforceNonNegativeBalance,
        });
      }

      for (const account of globalAccounts) {
        const naturalSide = naturalSideForCode(account.codigo);
        if (!naturalSide) continue;
        result.push({
          kind: 'global',
          id: account.id,
          name: account.nombre,
          naturalSide,
          enforce: activationByGlobal.get(account.id) ?? true,
        });
      }

      return result;
    },

    async getAccountDebitMinusCredit(
      bookId: string,
      account: { kind: 'user' | 'global'; id: string },
      replacingAsientoId?: string,
    ): Promise<string> {
      const result = await tx.lineaAsiento.aggregate({
        where: {
          ...(account.kind === 'user'
            ? { cuentaId: account.id }
            : { cuentaGlobalId: account.id }),
          ...(replacingAsientoId
            ? { asientoId: { not: replacingAsientoId } }
            : {}),
          asiento: { bookId, anulado: false, asientoOriginalId: null },
        },
        _sum: { debito: true, credito: true },
      });
      return new Decimal(result._sum.debito?.toString() ?? 0)
        .minus(result._sum.credito?.toString() ?? 0)
        .toFixed();
    },

    async findMaxVersion(asientoId: string): Promise<number> {
      const maxVer = await tx.asientoVersion.findFirst({
        where: { asientoId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      return maxVer?.version ?? 0;
    },

    async createVersion(data: {
      asientoId: string;
      version: number;
      snapshot: Record<string, unknown>;
      modifiedBy: string;
    }): Promise<void> {
      await tx.asientoVersion.create({
        data: {
          asientoId: data.asientoId,
          version: data.version,
          snapshot: data.snapshot as Prisma.InputJsonValue,
          modifiedBy: data.modifiedBy,
        },
      });
    },

    async deleteLineas(asientoId: string): Promise<void> {
      await tx.lineaAsiento.deleteMany({
        where: { asientoId },
      });
    },

    async updateAsiento(
      id: string,
      data: {
        fecha?: Date;
        concepto?: string;
        anulado?: boolean;
        anuladoAt?: Date | null;
      },
    ): Promise<JournalAsientoRecord> {
      const record = await tx.asiento.update({
        where: { id },
        data,
      });
      return mapAsiento(record);
    },
  };
}

export function wrapPrismaTransaction(
  tx: Prisma.TransactionClient,
): JournalTransaction {
  return createTransactionMethods(tx);
}

function createStoreMethods(client: typeof prisma): Omit<
  JournalStore,
  'runInTransaction' | 'isUniqueConstraintError'
> {
  const txMethods = createTransactionMethods(client as Prisma.TransactionClient);

  return {
    async getBookCurrency(bookId: string): Promise<string | null> {
      const config = await client.bookConfig.findUnique({
        where: { bookId },
        select: { currency: true },
      });
      return config?.currency ?? null;
    },

    async findPeriod(bookId: string, año: number) {
      const period = await client.periodoContable.findUnique({
        where: { bookId_año: { bookId, año } },
      });
      return period ? mapPeriod(period) : null;
    },

    async ensurePeriod(bookId: string, año: number) {
      await client.periodoContable.createMany({
        data: [{ bookId, año, abierto: true }],
        skipDuplicates: true,
      });
      const period = await client.periodoContable.findUnique({
        where: { bookId_año: { bookId, año } },
      });
      if (!period) {
        throw new Error(`Failed to ensure period ${año} for book ${bookId}`);
      }
      return mapPeriod(period);
    },

    async closePeriod(bookId: string, año: number) {
      const updated = await client.periodoContable.update({
        where: { bookId_año: { bookId, año } },
        data: { abierto: false, cerradoAt: new Date() },
      });
      return mapPeriod(updated);
    },

    async reopenPeriod(bookId: string, año: number) {
      const updated = await client.periodoContable.update({
        where: { bookId_año: { bookId, año } },
        data: { abierto: true, reabiertoAt: new Date() },
      });
      return mapPeriod(updated);
    },

    findBookUserId: txMethods.findBookUserId,

    async findActiveUserAccountIds(userId: string, ids: string[]) {
      if (ids.length === 0) return [];
      const uniqueIds = [...new Set(ids)];
      const cuentas = await client.cuentaUsuario.findMany({
        where: {
          id: { in: uniqueIds },
          userId,
          activa: true,
        },
        select: { id: true },
      });
      return cuentas.map((c) => c.id);
    },

    async findPostableGlobalIds(ids: string[]) {
      if (ids.length === 0) return [];
      const uniqueIds = [...new Set(ids)];
      const globales = await client.cuentaGlobal.findMany({
        where: {
          id: { in: uniqueIds },
          esPostable: true,
        },
        select: { id: true },
      });
      return globales.map((c) => c.id);
    },

    async findAsientoByIdempotencyKey(key: string) {
      const record = await client.asiento.findUnique({
        where: { idempotencyKey: key },
        include: asientoWithLinesInclude(),
      });
      return record ? mapAsientoWithLines(record) : null;
    },

    async findAsientoDetail(id: string) {
      const record = await client.asiento.findUnique({
        where: { id },
        include: asientoDetailInclude(),
      });
      if (!record) return null;
      return {
        ...mapAsientoWithLines(record),
        versiones: record.versiones.map((v) => ({
          id: v.id,
          asientoId: v.asientoId,
          version: v.version,
          snapshot: v.snapshot,
          modifiedBy: v.modifiedBy,
          createdAt: v.createdAt,
        })),
      } satisfies JournalAsientoDetail;
    },

    async findAsientoWithLines(id: string) {
      const record = await client.asiento.findUnique({
        where: { id },
        include: asientoWithLinesInclude(),
      });
      return record ? mapAsientoWithLines(record) : null;
    },

    async listAsientos(bookId: string, fechaGte?: Date, fechaLt?: Date) {
      const where: {
        bookId: string;
        fecha?: { gte: Date; lt: Date };
      } = { bookId };
      if (fechaGte !== undefined && fechaLt !== undefined) {
        where.fecha = { gte: fechaGte, lt: fechaLt };
      }

      const records = await client.asiento.findMany({
        where,
        orderBy: { fecha: 'desc' },
      });
      return records.map(mapAsiento);
    },

    async aggregateBalance(
      bookId: string,
      account: { kind: 'user' | 'global'; id: string },
    ) {
      const result = await client.lineaAsiento.aggregate({
        where: {
          ...(account.kind === 'user'
            ? { cuentaId: account.id }
            : { cuentaGlobalId: account.id }),
          asiento: {
            bookId,
            anulado: false,
            asientoOriginalId: null,
          },
        },
        _sum: {
          debito: true,
          credito: true,
        },
      });
      return {
        debito: result._sum.debito?.toString() ?? '0',
        credito: result._sum.credito?.toString() ?? '0',
      };
    },

    async listMonthlyBalances(
      bookId: string,
      account: { kind: 'user' | 'global'; id: string },
      año: number,
    ): Promise<JournalMonthlyBalanceRow[]> {
      if (account.kind === 'global') {
        return client.$queryRaw<JournalMonthlyBalanceRow[]>`
          SELECT
            EXTRACT(MONTH FROM a.fecha)::int AS mes,
            COALESCE(SUM(l.debito), 0) AS "totalDebito",
            COALESCE(SUM(l.credito), 0) AS "totalCredito"
          FROM lineas_asiento l
          INNER JOIN asientos a ON a.id = l."asientoId"
          WHERE l."cuentaGlobalId" = ${account.id}
            AND a."bookId" = ${bookId}
            AND a.anulado = false
            AND a."asientoOriginalId" IS NULL
            AND EXTRACT(YEAR FROM a.fecha) = ${año}::int
          GROUP BY EXTRACT(MONTH FROM a.fecha)
          ORDER BY mes
        `;
      }

      return client.$queryRaw<JournalMonthlyBalanceRow[]>`
        SELECT
          EXTRACT(MONTH FROM a.fecha)::int AS mes,
          COALESCE(SUM(l.debito), 0) AS "totalDebito",
          COALESCE(SUM(l.credito), 0) AS "totalCredito"
        FROM lineas_asiento l
        INNER JOIN asientos a ON a.id = l."asientoId"
        WHERE l."cuentaId" = ${account.id}
          AND a."bookId" = ${bookId}
          AND a.anulado = false
          AND a."asientoOriginalId" IS NULL
          AND EXTRACT(YEAR FROM a.fecha) = ${año}::int
        GROUP BY EXTRACT(MONTH FROM a.fecha)
        ORDER BY mes
      `;
    },

    async listReportAsientos(bookId: string, año: number) {
      const records = await client.asiento.findMany({
        where: {
          bookId,
          anulado: false,
          asientoOriginalId: null,
          fecha: {
            gte: new Date(año, 0, 1),
            lt: new Date(año + 1, 0, 1),
          },
        },
        include: reportAsientoInclude(),
      });
      return records.map(mapReportAsiento);
    },
  };
}

export function createJournalStore(): JournalStore {
  const methods = createStoreMethods(prisma);

  return {
    ...methods,

    async runInTransaction<T>(
      fn: (tx: JournalTransaction) => Promise<T>,
    ): Promise<T> {
      return prisma.$transaction((tx) => fn(wrapPrismaTransaction(tx)));
    },

    isUniqueConstraintError(err: unknown): boolean {
      return (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      );
    },
  };
}
