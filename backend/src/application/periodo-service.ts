/**
 * Application service for annual period management.
 *
 * - FR-005: Allow annual close
 * - FR-007: Allow explicit annual reopen
 */

import type { PeriodoRepository } from '../infrastructure/repositories/periodo-repo.js';
import type { PeriodoAnual, EventoPeriodo } from '../domain/periodo-anual.js';

export interface PeriodoApplicationService {
  cerrarPeriodo(
    bookId: string,
    año: number,
    userId: string,
  ): Promise<PeriodoAnual>;

  reabrirPeriodo(
    bookId: string,
    año: number,
    userId: string,
  ): Promise<PeriodoAnual>;
}

export function createPeriodoApplicationService(
  periodoRepo: PeriodoRepository,
): PeriodoApplicationService {
  return {
    async cerrarPeriodo(
      bookId: string,
      año: number,
      userId: string,
    ): Promise<PeriodoAnual> {
      const now = new Date();

      const periodo = await periodoRepo.upsert(bookId, año, {
        cerrado: true,
        cerradoEn: now,
        reabiertoEn: null,
      });

      return periodo;
    },

    async reabrirPeriodo(
      bookId: string,
      año: number,
      userId: string,
    ): Promise<PeriodoAnual> {
      const now = new Date();

      const periodo = await periodoRepo.upsert(bookId, año, {
        cerrado: false,
        reabiertoEn: now,
      });

      return periodo;
    },
  };
}
