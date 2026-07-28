/**
 * Prisma admin global account repository (013 US3).
 */

import type { CuentaGlobal } from '../../domain/cuenta-global.js';
import type {
  GlobalAccountAdminRepository,
  GlobalAccountDependencies,
} from '../../application/ports/global-account-admin-repository.js';
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
  createdAt: Date;
  updatedAt: Date;
}): CuentaGlobal {
  return { ...row };
}

export function createGlobalAccountAdminRepository(): GlobalAccountAdminRepository {
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

    async create(data) {
      const row = await prisma.cuentaGlobal.create({ data });
      return toDomain(row);
    },

    async update(id, data) {
      const row = await prisma.cuentaGlobal.update({ where: { id }, data });
      return toDomain(row);
    },

    async delete(id) {
      await prisma.cuentaGlobal.delete({ where: { id } });
    },

    async dependencyCounts(id): Promise<GlobalAccountDependencies> {
      const [activaciones, lineas, children, cuentasUsuario] = await Promise.all([
        prisma.activacionCuentaGlobal.count({ where: { globalId: id } }),
        prisma.lineaAsiento.count({ where: { cuentaGlobalId: id } }),
        prisma.cuentaGlobal.count({ where: { parentId: id } }),
        prisma.cuentaUsuario.count({ where: { globalId: id } }),
      ]);
      return { activaciones, lineas, children, cuentasUsuario };
    },
  };
}
