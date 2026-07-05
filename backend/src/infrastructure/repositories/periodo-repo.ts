/**
 * Prisma-based PeriodoAnual repository.
 */

import { prisma } from '../database.js';
import type { PeriodoAnual, EventoPeriodo } from '../../domain/periodo-anual.js';

export interface PeriodoRepository {
  upsert(
    bookId: string,
    año: number,
    data: Partial<{
      cerrado: boolean;
      cerradoEn: Date | null;
      reabiertoEn: Date | null;
    }>,
  ): Promise<PeriodoAnual>;

  findByBookAndYear(bookId: string, año: number): Promise<PeriodoAnual | null>;

  listByBook(bookId: string): Promise<PeriodoAnual[]>;
}

export function createPeriodoRepository(): PeriodoRepository {
  return {
    async upsert(
      bookId: string,
      año: number,
      data: Partial<{
        cerrado: boolean;
        cerradoEn: Date | null;
        reabiertoEn: Date | null;
      }>,
    ): Promise<PeriodoAnual> {
      const record = await prisma.periodoAnual.upsert({
        where: {
          bookId_año: { bookId, año },
        },
        update: {
          ...(data.cerrado !== undefined && { cerrado: data.cerrado }),
          ...(data.cerradoEn !== undefined && { cerradoEn: data.cerradoEn }),
          ...(data.reabiertoEn !== undefined && { reabiertoEn: data.reabiertoEn }),
        },
        create: {
          bookId,
          año,
          cerrado: data.cerrado ?? false,
          cerradoEn: data.cerradoEn ?? null,
          reabiertoEn: data.reabiertoEn ?? null,
        },
      });

      return mapToDomain(record);
    },

    async findByBookAndYear(
      bookId: string,
      año: number,
    ): Promise<PeriodoAnual | null> {
      const record = await prisma.periodoAnual.findUnique({
        where: { bookId_año: { bookId, año } },
      });

      if (!record) return null;
      return mapToDomain(record);
    },

    async listByBook(bookId: string): Promise<PeriodoAnual[]> {
      const records = await prisma.periodoAnual.findMany({
        where: { bookId },
        orderBy: { año: 'asc' },
      });

      return records.map(mapToDomain);
    },
  };
}

function mapToDomain(record: {
  id: string;
  bookId: string;
  año: number;
  cerrado: boolean;
  cerradoEn: Date | null;
  reabiertoEn: Date | null;
}): PeriodoAnual {
  return {
    id: record.id,
    bookId: record.bookId,
    año: record.año,
    cerrado: record.cerrado,
    cerradoEn: record.cerradoEn,
    reabiertoEn: record.reabiertoEn,
    historia: [], // history is tracked via cerradoEn/reabiertoEn for MVP,
                 // full event history will be a separate model in later sprints
  };
}
