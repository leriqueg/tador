/**
 * Prisma-based Asiento repository.
 */

import { prisma } from '../database.js';
import type { Asiento, HistorialEdit, CreateAsientoInput } from '../../domain/asiento.js';
import type { LineaAsiento, CreateLineaAsientoInput } from '../../domain/linea-asiento.js';

export interface AsientoWithLines extends Asiento {
  lineas: LineaAsiento[];
}

export interface AsientoRepository {
  insertWithLines(
    bookId: string,
    input: CreateAsientoInput,
    lines: CreateLineaAsientoInput[],
  ): Promise<AsientoWithLines>;

  listByBookAndDateRange(
    bookId: string,
    desde?: Date,
    hasta?: Date,
  ): Promise<AsientoWithLines[]>;

  findById(id: string): Promise<AsientoWithLines | null>;

  updateLines(
    id: string,
    descripcion: string,
    lines: CreateLineaAsientoInput[],
    historyEntry: HistorialEdit,
  ): Promise<AsientoWithLines>;

  /** Verify that a CuentaUsuario is active and references a postable global account. */
  checkAccountPostable(cuentaUsuarioId: string, userId: string): Promise<boolean>;
}

export function createAsientoRepository(): AsientoRepository {
  return {
    async insertWithLines(
      bookId: string,
      input: CreateAsientoInput,
      lines: CreateLineaAsientoInput[],
    ): Promise<AsientoWithLines> {
      const record = await prisma.asiento.create({
        data: {
          bookId,
          fecha: input.fecha,
          descripcion: input.descripcion,
          lineas: {
            create: lines.map((l) => ({
              cuentaUsuarioId: l.cuentaUsuarioId,
              debe: l.debe,
              haber: l.haber,
            })),
          },
        },
        include: { lineas: true },
      });

      return mapToDomain(record);
    },

    async listByBookAndDateRange(
      bookId: string,
      desde?: Date,
      hasta?: Date,
    ): Promise<AsientoWithLines[]> {
      const where: Record<string, unknown> = { bookId };

      if (desde || hasta) {
        const fechaFilter: Record<string, Date> = {};
        if (desde) fechaFilter.gte = desde;
        if (hasta) fechaFilter.lte = hasta;
        where.fecha = fechaFilter;
      }

      const records = await prisma.asiento.findMany({
        where: where as any,
        include: { lineas: true },
        orderBy: { fecha: 'asc' },
      });

      return records.map(mapToDomain);
    },

    async findById(id: string): Promise<AsientoWithLines | null> {
      const record = await prisma.asiento.findUnique({
        where: { id },
        include: { lineas: true },
      });

      if (!record) return null;
      return mapToDomain(record);
    },

    async updateLines(
      id: string,
      descripcion: string,
      lines: CreateLineaAsientoInput[],
      historyEntry: HistorialEdit,
    ): Promise<AsientoWithLines> {
      const record = await prisma.$transaction(async (tx: any) => {
        // Delete existing lines and recreate
        await tx.lineaAsiento.deleteMany({ where: { asientoId: id } });

        return tx.asiento.update({
          where: { id },
          data: {
            descripcion,
            editHistory: {
              push: historyEntry,
            },
            lineas: {
              create: lines.map((l) => ({
                cuentaUsuarioId: l.cuentaUsuarioId,
                debe: l.debe,
                haber: l.haber,
              })),
            },
          },
          include: { lineas: true },
        });
      });

      return mapToDomain(record);
    },

    async checkAccountPostable(
      cuentaUsuarioId: string,
      userId: string,
    ): Promise<boolean> {
      const account = await prisma.cuentaUsuario.findUnique({
        where: { id: cuentaUsuarioId },
        include: { global: true },
      });

      if (!account) return false;
      if (account.userId !== userId) return false;
      if (!account.activa) return false;
      // If it has a global account reference, it must be postable
      if (account.global && !account.global.esPostable) return false;

      return true;
    },
  };
}

function mapToDomain(record: {
  id: string;
  bookId: string;
  fecha: Date;
  descripcion: string;
  editHistory: unknown;
  createdAt: Date;
  updatedAt: Date;
  lineas: Array<{
    id: string;
    asientoId: string;
    cuentaUsuarioId: string;
    debe: unknown;
    haber: unknown;
  }>;
}): AsientoWithLines {
  return {
    id: record.id,
    bookId: record.bookId,
    fecha: record.fecha,
    descripcion: record.descripcion,
    editHistory: (record.editHistory ?? []) as HistorialEdit[],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lineas: record.lineas.map((l) => ({
      id: l.id,
      asientoId: l.asientoId,
      cuentaUsuarioId: l.cuentaUsuarioId,
      debe: Number(l.debe),
      haber: Number(l.haber),
    })),
  };
}
