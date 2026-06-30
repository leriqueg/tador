/**
 * Application service for journal entry (Asiento) operations.
 *
 * Validates:
 * - FR-002: Entries must be balanced (total debes = total haberes)
 * - FR-003: All referenced accounts must be postable and active
 * - FR-006: The period must be open for the entry's year
 * - FR-008/009: Edits in open periods leave audit trail
 * - FR-010: Edits in closed periods require re-open
 */

import type { AsientoRepository, AsientoWithLines } from '../infrastructure/repositories/asiento-repo.js';
import type { PeriodoRepository } from '../infrastructure/repositories/periodo-repo.js';
import type { CreateAsientoInput } from '../domain/asiento.js';
import type { CreateLineaAsientoInput, LineaAsiento } from '../domain/linea-asiento.js';
import type { SaldoActual } from '../domain/saldo-actual.js';
import { ensureOwnership } from '../domain/tenant.js';
import { prisma } from '../infrastructure/database.js';

export interface CreateEntryInput {
  fecha: string; // ISO date string
  descripcion: string;
  lineas: Array<{
    cuentaUsuarioId: string;
    debe: number;
    haber: number;
  }>;
}

export interface UpdateEntryInput {
  descripcion: string;
  lineas: Array<{
    cuentaUsuarioId: string;
    debe: number;
    haber: number;
  }>;
}

export interface AsientoApplicationService {
  crearAsiento(
    bookId: string,
    userId: string,
    input: CreateEntryInput,
  ): Promise<AsientoWithLines>;

  listarAsientos(
    bookId: string,
    userId: string,
    desde?: string,
    hasta?: string,
  ): Promise<AsientoWithLines[]>;

  obtenerAsiento(
    id: string,
    userId: string,
    bookId: string,
  ): Promise<AsientoWithLines>;

  editarAsiento(
    id: string,
    userId: string,
    input: UpdateEntryInput,
  ): Promise<AsientoWithLines>;

  calcularSaldo(
    cuentaUsuarioId: string,
    userId: string,
    bookId: string,
  ): Promise<SaldoActual>;
}

export function createAsientoApplicationService(
  asientoRepo: AsientoRepository,
  periodoRepo: PeriodoRepository,
): AsientoApplicationService {
  return {
    async crearAsiento(
      bookId: string,
      userId: string,
      input: CreateEntryInput,
    ): Promise<AsientoWithLines> {
      const lines: CreateLineaAsientoInput[] = input.lineas.map((l) => ({
        cuentaUsuarioId: l.cuentaUsuarioId,
        debe: l.debe,
        haber: l.haber,
      }));

      // FR-002: Validate balanced entry
      validateBalanced(lines);

      // FR-003: Validate all accounts are postable and active
      await validateAccountsPostable(asientoRepo, lines, userId);

      // FR-006: Validate period is open
      const fecha = new Date(input.fecha);
      await validatePeriodOpen(periodoRepo, bookId, fecha, userId);

      return asientoRepo.insertWithLines(bookId, {
        bookId,
        fecha,
        descripcion: input.descripcion,
      }, lines);
    },

    async listarAsientos(
      bookId: string,
      userId: string,
      desde?: string,
      hasta?: string,
    ): Promise<AsientoWithLines[]> {
      const desdeDate = desde ? new Date(desde) : undefined;
      const hastaDate = hasta ? new Date(hasta) : undefined;

      return asientoRepo.listByBookAndDateRange(bookId, desdeDate, hastaDate);
    },

    async obtenerAsiento(
      id: string,
      userId: string,
      bookId: string,
    ): Promise<AsientoWithLines> {
      const asiento = await asientoRepo.findById(id);
      if (!asiento) {
        throw new Error('Entry not found');
      }
      // Tenant isolation: verify entry belongs to user's book
      if (asiento.bookId !== bookId) {
        throw new Error('Entry not found');
      }
      return asiento;
    },

    async editarAsiento(
      id: string,
      userId: string,
      input: UpdateEntryInput,
    ): Promise<AsientoWithLines> {
      // Load existing entry
      const existing = await asientoRepo.findById(id);
      if (!existing) {
        throw new Error('Entry not found');
      }

      const lines: CreateLineaAsientoInput[] = input.lineas.map((l) => ({
        cuentaUsuarioId: l.cuentaUsuarioId,
        debe: l.debe,
        haber: l.haber,
      }));

      // FR-002: Validate balanced entry
      validateBalanced(lines);

      // FR-003: Validate all accounts
      await validateAccountsPostable(asientoRepo, lines, userId);

      // FR-006/FR-010: Check period status
      const year = existing.fecha.getFullYear();
      const periodo = await periodoRepo.findByBookAndYear(existing.bookId, year);

      if (periodo?.cerrado) {
        throw new Error(
          `Cannot modify entry: fiscal year ${year} is closed. Reopen it first.`,
        );
      }

      // FR-008/009: Build audit history entry
      const historyEntry = {
        editadoAt: new Date(),
        editadoPorUsuarioId: userId,
        descripcionAnterior: existing.descripcion,
        lineasAnteriores: existing.lineas.map((l: LineaAsiento) => ({
          cuentaUsuarioId: l.cuentaUsuarioId,
          debe: l.debe,
          haber: l.haber,
        })),
      };

      return asientoRepo.updateLines(id, input.descripcion, lines, historyEntry);
    },

    async calcularSaldo(
      cuentaUsuarioId: string,
      userId: string,
      bookId: string,
    ): Promise<SaldoActual> {
      // Sum all lines for this account within the user's book
      const lines = await prismaQuerySumByAccount(bookId, cuentaUsuarioId);

      return {
        cuentaUsuarioId,
        totalDebe: lines.totalDebe,
        totalHaber: lines.totalHaber,
        saldo: lines.totalDebe - lines.totalHaber,
      };
    },
  };
}

/**
 * FR-002: Validate that total debes equal total haberes.
 */
function validateBalanced(lines: CreateLineaAsientoInput[]): void {
  if (lines.length === 0) {
    throw new Error('Entry must have at least one line');
  }

  const totalDebe = lines.reduce((sum, l) => sum + l.debe, 0);
  const totalHaber = lines.reduce((sum, l) => sum + l.haber, 0);

  if (Math.abs(totalDebe - totalHaber) > 0.001) {
    throw new Error(
      `Unbalanced entry: total debe (${totalDebe}) != total haber (${totalHaber})`,
    );
  }
}

/**
 * FR-003: Validate all referenced accounts are postable, active, and belong to user.
 */
async function validateAccountsPostable(
  asientoRepo: AsientoRepository,
  lines: CreateLineaAsientoInput[],
  userId: string,
): Promise<void> {
  for (const line of lines) {
    const isPostable = await asientoRepo.checkAccountPostable(
      line.cuentaUsuarioId,
      userId,
    );
    if (!isPostable) {
      throw new Error(
        `Account ${line.cuentaUsuarioId} is not postable, inactive, or does not belong to this user`,
      );
    }
  }
}

/**
 * FR-006: Validate that the period for the given fecha is open.
 * If no period record exists, the year is considered open by default.
 */
async function validatePeriodOpen(
  periodoRepo: PeriodoRepository,
  bookId: string,
  fecha: Date,
  userId: string,
): Promise<void> {
  const year = fecha.getFullYear();
  const periodo = await periodoRepo.findByBookAndYear(bookId, year);

  if (periodo?.cerrado) {
    throw new Error(
      `Fiscal year ${year} is closed. Entries cannot be created or modified in a closed period.`,
    );
  }
}

/**
 * Aggregate line amounts for a given account within a book.
 */
async function prismaQuerySumByAccount(
  bookId: string,
  cuentaUsuarioId: string,
): Promise<{ totalDebe: number; totalHaber: number }> {
  const result = await prisma.lineaAsiento.aggregate({
    where: {
      cuentaUsuarioId,
      asiento: { bookId },
    },
    _sum: {
      debe: true,
      haber: true,
    },
  });

  return {
    totalDebe: Number(result._sum.debe ?? 0),
    totalHaber: Number(result._sum.haber ?? 0),
  };
}
