/**
 * Admin global chart CRUD application service (013 US3).
 */

import type { CuentaGlobal } from '../../domain/cuenta-global.js';
import { validateGlobalAccountCreate } from '../../domain/cuenta-global.js';
import type {
  GlobalAccountAdminRepository,
  GlobalAccountDependencies,
} from '../ports/global-account-admin-repository.js';
import type { AdminAuditService } from './admin-audit-service.js';

export class GlobalAccountValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GlobalAccountValidationError';
  }
}

export class GlobalAccountDependencyError extends Error {
  readonly dependencies: GlobalAccountDependencies;

  constructor(message: string, dependencies: GlobalAccountDependencies) {
    super(message);
    this.name = 'GlobalAccountDependencyError';
    this.dependencies = dependencies;
  }
}

export interface GlobalAccountCreateInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  esPostable: boolean;
  parentId?: string | null;
}

export interface GlobalAccountUpdateInput {
  nombre?: string;
  descripcion?: string;
  esPostable?: boolean;
  parentId?: string | null;
}

export interface AdminGlobalAccountApplicationService {
  listTree(): Promise<{ accounts: CuentaGlobal[] }>;
  get(
    id: string,
  ): Promise<{
    account: CuentaGlobal;
    dependencies: GlobalAccountDependencies;
  } | null>;
  create(
    operatorId: string,
    input: GlobalAccountCreateInput,
  ): Promise<CuentaGlobal>;
  update(
    operatorId: string,
    id: string,
    input: GlobalAccountUpdateInput,
  ): Promise<CuentaGlobal>;
  delete(operatorId: string, id: string): Promise<void>;
}

export function createAdminGlobalAccountApplicationService(
  repo: GlobalAccountAdminRepository,
  audit: AdminAuditService,
): AdminGlobalAccountApplicationService {
  return {
    async listTree() {
      return { accounts: await repo.listAll() };
    },

    async get(id) {
      const account = await repo.findById(id);
      if (!account) return null;
      return {
        account,
        dependencies: await repo.dependencyCounts(id),
      };
    },

    async create(operatorId, input) {
      let parentEsPostable: boolean | null = null;
      if (input.parentId) {
        const parent = await repo.findById(input.parentId);
        if (!parent) {
          throw new GlobalAccountValidationError('parent not found');
        }
        parentEsPostable = parent.esPostable;
      }

      const validationError = validateGlobalAccountCreate({
        codigo: input.codigo,
        nombre: input.nombre,
        esPostable: input.esPostable,
        parentId: input.parentId ?? null,
        parentEsPostable,
      });
      if (validationError) {
        throw new GlobalAccountValidationError(validationError);
      }

      const existing = await repo.findByCodigo(input.codigo);
      if (existing) {
        throw new GlobalAccountValidationError('codigo already exists');
      }

      const row = await repo.create({
        codigo: input.codigo,
        nombre: input.nombre.trim(),
        descripcion: input.descripcion?.trim() ?? '',
        esPostable: input.esPostable,
        parentId: input.parentId ?? null,
      });

      await audit.append({
        operatorId,
        action: 'global_account.create',
        targetType: 'CuentaGlobal',
        targetId: row.id,
        payloadAfter: {
          codigo: row.codigo,
          nombre: row.nombre,
          esPostable: row.esPostable,
          parentId: row.parentId,
        },
      });

      return row;
    },

    async update(operatorId, id, input) {
      const existing = await repo.findById(id);
      if (!existing) {
        throw new GlobalAccountValidationError('Account not found');
      }

      const next = {
        codigo: existing.codigo,
        nombre: input.nombre ?? existing.nombre,
        esPostable: input.esPostable ?? existing.esPostable,
        parentId:
          input.parentId !== undefined ? input.parentId : existing.parentId,
        parentEsPostable: null as boolean | null,
      };

      if (next.parentId) {
        const parent = await repo.findById(next.parentId);
        if (!parent) {
          throw new GlobalAccountValidationError('parent not found');
        }
        next.parentEsPostable = parent.esPostable;
      }

      const validationError = validateGlobalAccountCreate({
        codigo: next.codigo,
        nombre: next.nombre,
        esPostable: next.esPostable,
        parentId: next.parentId,
        parentEsPostable: next.parentEsPostable,
      });
      if (validationError) {
        throw new GlobalAccountValidationError(validationError);
      }

      const row = await repo.update(id, {
        nombre: next.nombre.trim(),
        descripcion:
          input.descripcion !== undefined
            ? input.descripcion.trim()
            : undefined,
        esPostable: next.esPostable,
        parentId: next.parentId,
      });

      await audit.append({
        operatorId,
        action: 'global_account.update',
        targetType: 'CuentaGlobal',
        targetId: id,
        payloadBefore: {
          nombre: existing.nombre,
          esPostable: existing.esPostable,
          parentId: existing.parentId,
        },
        payloadAfter: {
          nombre: row.nombre,
          esPostable: row.esPostable,
          parentId: row.parentId,
        },
      });

      return row;
    },

    async delete(operatorId, id) {
      const existing = await repo.findById(id);
      if (!existing) {
        throw new GlobalAccountValidationError('Account not found');
      }

      const deps = await repo.dependencyCounts(id);
      if (
        deps.activaciones > 0 ||
        deps.lineas > 0 ||
        deps.children > 0 ||
        deps.cuentasUsuario > 0
      ) {
        throw new GlobalAccountDependencyError(
          'Cannot delete account with dependencies',
          deps,
        );
      }

      await repo.delete(id);
      await audit.append({
        operatorId,
        action: 'global_account.delete',
        targetType: 'CuentaGlobal',
        targetId: id,
        payloadBefore: {
          codigo: existing.codigo,
          nombre: existing.nombre,
        },
      });
    },
  };
}
