/**
 * Prisma chart repository (014).
 */

import type { CuentaGlobal, ReportRole } from '../../domain/cuenta-global.js';
import type { CodeChange } from '../../domain/chart/cascade-recode.js';
import type {
  ChartRepository,
  ChartUserAccountRow,
} from '../../application/ports/chart-repository.js';
import { prisma } from '../database.js';

function toDomain(row: {
  id: string;
  parentId: string | null;
  codigo: string;
  nombre: string;
  descripcion: string;
  esPostable: boolean;
  legacyId: number | null;
  legacyCode: string | null;
  deprecatedAt: Date | null;
  reportRole: string;
  createdAt: Date;
  updatedAt: Date;
}): CuentaGlobal {
  return {
    ...row,
    reportRole: row.reportRole as ReportRole,
  };
}

export function createChartRepository(): ChartRepository {
  return {
    async listAll() {
      const rows = await prisma.cuentaGlobal.findMany({
        orderBy: { codigo: 'asc' },
      });
      return rows.map(toDomain);
    },

    async findById(id) {
      const row = await prisma.cuentaGlobal.findUnique({ where: { id } });
      return row ? toDomain(row) : null;
    },

    async findByCodigo(codigo) {
      const row = await prisma.cuentaGlobal.findUnique({ where: { codigo } });
      return row ? toDomain(row) : null;
    },

    async applyCodeChanges(changes: CodeChange[]) {
      await prisma.$transaction(async (tx) => {
        // Two-phase update to avoid unique collisions on codigo.
        for (const [i, change] of changes.entries()) {
          await tx.cuentaGlobal.update({
            where: { id: change.id },
            data: { codigo: `__tmp_${i}_${change.id.slice(0, 8)}` },
          });
        }
        for (const change of changes) {
          await tx.cuentaGlobal.update({
            where: { id: change.id },
            data: {
              codigo: change.codigoAfter,
              parentId: change.parentIdAfter,
            },
          });
        }
      });
    },

    async listUserAccountsByGlobalIds(globalIds) {
      if (globalIds.length === 0) return [];
      const rows = await prisma.cuentaUsuario.findMany({
        where: { globalId: { in: globalIds } },
        select: { id: true, userId: true, globalId: true, codigo: true },
      });
      return rows as ChartUserAccountRow[];
    },

    async updateUserCodigos(changes) {
      if (changes.length === 0) return;
      await prisma.$transaction(
        changes.map((c) =>
          prisma.cuentaUsuario.update({
            where: { id: c.id },
            data: { codigo: c.codigo },
          }),
        ),
      );
    },

    async create(data) {
      const row = await prisma.cuentaGlobal.create({
        data: {
          codigo: data.codigo,
          nombre: data.nombre,
          descripcion: data.descripcion,
          esPostable: data.esPostable,
          parentId: data.parentId,
          reportRole: data.reportRole ?? 'normal',
        },
      });
      return toDomain(row);
    },

    async updateMeta(id, data) {
      const row = await prisma.cuentaGlobal.update({
        where: { id },
        data,
      });
      return toDomain(row);
    },
  };
}
