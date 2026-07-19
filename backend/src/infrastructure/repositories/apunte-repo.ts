/**
 * Prisma adapter for ApunteRepository.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../database.js';
import { assertProjectedBalances } from '../../application/account-balance-policy.js';
import type { ApunteListFilter } from '../../application/apunte-list-filters.js';
import type {
  ApunteDetailRecord,
  ApunteLineSnapshot,
  ApunteListItem,
  ApunteRecord,
  ApunteRepository,
  IdempotentApunteReplay,
  PersistCreateApunteResult,
  UpdateApunteInput,
} from '../../application/ports/apunte-repository.js';
import {
  wrapPrismaTransaction,
} from './journal-store.js';

export type { ApunteRepository };

function mapApunte(record: {
  id: string;
  templateCode: string | null;
  date: Date;
  concept: string;
  amount: { toString(): string };
  asientoId: string;
  userId: string;
  entityId: string | null;
  createdAt: Date;
}): ApunteRecord {
  return {
    id: record.id,
    templateCode: record.templateCode,
    date: record.date,
    concept: record.concept,
    amount: record.amount,
    asientoId: record.asientoId,
    userId: record.userId,
    entityId: record.entityId,
    createdAt: record.createdAt,
  };
}

function mapLinea(record: {
  cuentaId: string | null;
  cuentaGlobalId: string | null;
  debito: { toString(): string };
  credito: { toString(): string };
  createdAt: Date;
}): ApunteLineSnapshot {
  return {
    cuentaId: record.cuentaId,
    cuentaGlobalId: record.cuentaGlobalId,
    debito: record.debito,
    credito: record.credito,
    createdAt: record.createdAt,
  };
}

function toPrismaWhere(filter: ApunteListFilter): Prisma.ApunteWhereInput {
  const where: Prisma.ApunteWhereInput = { userId: filter.userId };

  if (filter.dateGte || filter.dateLte) {
    where.date = {
      ...(filter.dateGte ? { gte: filter.dateGte } : {}),
      ...(filter.dateLte ? { lte: filter.dateLte } : {}),
    };
  }

  if (filter.amountGte || filter.amountLte) {
    where.amount = {
      ...(filter.amountGte ? { gte: filter.amountGte } : {}),
      ...(filter.amountLte ? { lte: filter.amountLte } : {}),
    };
  }

  if (filter.conceptContains) {
    where.concept = {
      contains: filter.conceptContains,
      mode: 'insensitive',
    };
  }

  if (filter.accountId) {
    where.asiento = {
      lineas: {
        some: {
          OR: [
            { cuentaId: filter.accountId },
            { cuentaGlobalId: filter.accountId },
          ],
        },
      },
    };
  }

  return where;
}

async function findIdempotentReplayInTx(
  tx: Prisma.TransactionClient,
  idempotencyKey: string,
): Promise<IdempotentApunteReplay | null> {
  const asiento = await tx.asiento.findUnique({
    where: { idempotencyKey },
    include: {
      lineas: true,
      apuntes: true,
    },
  });
  const apunte = asiento?.apuntes[0];
  if (!asiento || !apunte) return null;

  return {
    apunte: mapApunte(apunte),
    asiento: {
      id: asiento.id,
      fecha: asiento.fecha,
      concepto: asiento.concepto,
    },
    lineas: asiento.lineas.map(mapLinea),
  };
}

export function createApunteRepository(): ApunteRepository {
  return {
    async list(filter, pagination) {
      const where = toPrismaWhere(filter);
      const [total, rows] = await Promise.all([
        prisma.apunte.count({ where }),
        prisma.apunte.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: pagination.limit,
          skip: pagination.offset,
        }),
      ]);

      return {
        total,
        rows: rows.map(
          (row): ApunteListItem => ({
            id: row.id,
            templateCode: row.templateCode,
            date: row.date,
            concept: row.concept,
            amount: row.amount.toString(),
            asientoId: row.asientoId,
            createdAt: row.createdAt,
          }),
        ),
      };
    },

    async findDetailById(userId, id) {
      const row = await prisma.apunte.findFirst({
        where: { id, userId },
        include: {
          asiento: {
            include: {
              lineas: { orderBy: { createdAt: 'asc' } },
            },
          },
        },
      });
      if (!row) return null;

      return {
        ...mapApunte(row),
        asiento: {
          id: row.asiento.id,
          fecha: row.asiento.fecha,
          concepto: row.asiento.concepto,
          lineas: row.asiento.lineas.map(mapLinea),
        },
      } satisfies ApunteDetailRecord;
    },

    async findByIdForUser(userId, id) {
      const row = await prisma.apunte.findFirst({
        where: { id, userId },
      });
      return row ? mapApunte(row) : null;
    },

    async findIdempotentReplay(idempotencyKey) {
      const asiento = await prisma.asiento.findUnique({
        where: { idempotencyKey },
        include: { lineas: true, apuntes: true },
      });
      const apunte = asiento?.apuntes[0];
      if (!asiento || !apunte) return null;

      return {
        apunte: mapApunte(apunte),
        asiento: {
          id: asiento.id,
          fecha: asiento.fecha,
          concepto: asiento.concepto,
        },
        lineas: asiento.lineas.map(mapLinea),
      };
    },

    async persistCreate(input): Promise<PersistCreateApunteResult> {
      return prisma.$transaction(async (tx) => {
        const jtx = wrapPrismaTransaction(tx);

        if (input.idempotencyKey) {
          await jtx.lockKey(`idempotency:${input.idempotencyKey}`);
          const replay = await findIdempotentReplayInTx(
            tx,
            input.idempotencyKey,
          );
          if (replay) {
            return { ...replay, replayed: true };
          }
        }

        await assertProjectedBalances(jtx, {
          bookId: input.bookId,
          userId: input.userId,
          lines: input.entryLines,
        });

        const asiento = await jtx.createAsiento({
          bookId: input.bookId,
          fecha: input.fecha,
          concepto: input.concept,
          tipo: 'manual',
          idempotencyKey: input.idempotencyKey,
        });

        const lineas = await Promise.all(
          input.entryLines.map((line) =>
            jtx.createLinea({
              asientoId: asiento.id,
              cuentaId: line.cuentaId ?? null,
              cuentaGlobalId: line.cuentaGlobalId ?? null,
              debito: line.debito,
              credito: line.credito,
            }),
          ),
        );

        const apunte = await tx.apunte.create({
          data: {
            templateCode: input.templateCode,
            date: input.fecha,
            concept: input.concept,
            amount: input.amount,
            asientoId: asiento.id,
            userId: input.userId,
            entityId: input.entityId,
          },
        });

        return {
          apunte: mapApunte(apunte),
          asiento: {
            id: asiento.id,
            fecha: asiento.fecha,
            concepto: asiento.concepto,
          },
          lineas: lineas.map(mapLinea),
          replayed: false,
        };
      });
    },

    async updateForUser(userId, id, data: UpdateApunteInput) {
      const existing = await prisma.apunte.findFirst({
        where: { id, userId },
        select: { id: true },
      });
      if (!existing) return null;

      const updated = await prisma.apunte.update({
        where: { id },
        data: {
          templateCode: data.templateCode,
          date: data.date,
          concept: data.concept,
          amount: data.amount,
        },
      });
      return mapApunte(updated);
    },

    async findEntityForUser(userId, entityId) {
      const entity = await prisma.entidad.findFirst({
        where: { id: entityId, userId },
        select: { tipo: true, capabilities: true },
      });
      if (!entity) return null;
      return {
        tipo: entity.tipo,
        capabilities: entity.capabilities as string[],
      };
    },

    async entityExistsForUser(userId, entityId) {
      const entity = await prisma.entidad.findFirst({
        where: { id: entityId, userId },
        select: { id: true },
      });
      return entity !== null;
    },
  };
}
