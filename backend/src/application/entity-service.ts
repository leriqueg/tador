/**
 * Entity application service — CRUD and atomic account provisioning.
 */

import type { EntidadRepository } from './ports/entidad-repository.js';
import type { AccountRepository } from './ports/account-repository.js';
import type { UserAccountRecord } from './ports/account-repository.js';
import type { EntidadRecord } from './ports/entidad-repository.js';
import { EntityConflictError } from './ports/entidad-repository.js';
import { autoAsignarCodigo } from './account-codigo.js';
import { sanitizeAccountMetadata } from './account-service.js';
import {
  ENTITY_PROVISION_MAP,
  InvalidCapabilityError,
  isProvisionableTipo,
  validateCapabilities,
  type Capability,
  type TipoEntidad,
} from '../domain/entidad.js';
import type { CuentaUsuarioMetadata } from '../domain/cuenta-usuario.js';

export class EntityNotFoundError extends Error {
  constructor(message = 'Entity not found') {
    super(message);
    this.name = 'EntityNotFoundError';
  }
}

export class InvalidEntityTipoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEntityTipoError';
  }
}

export class ChartGroupMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChartGroupMissingError';
  }
}

export { InvalidCapabilityError, EntityConflictError };

const VALID_TIPOS: TipoEntidad[] = [
  'person',
  'organization',
  'bank',
  'card_issuer',
  'wallet_platform',
];

export interface EntityListItemView {
  id: string;
  nombre: string;
  tipo: TipoEntidad;
  notas: string | null;
  capabilities: Capability[];
  createdAt: Date;
  provisionedAccountId: string | null;
  provisionedAccount: {
    id: string;
    nombre: string;
    tipoCuenta: string;
    codigo: string | null;
  } | null;
}

export interface CreateEntityInput {
  nombre: string;
  tipo: TipoEntidad;
  notas?: string;
  capabilities?: string[];
  metadata?: CuentaUsuarioMetadata;
}

export interface UpdateEntityInput {
  nombre?: string;
  tipo?: TipoEntidad;
  notas?: string;
  capabilities?: string[];
}

export interface EntityApplicationService {
  list(userId: string): Promise<EntityListItemView[]>;
  create(
    userId: string,
    input: CreateEntityInput,
  ): Promise<{ entity: EntidadRecord; provisionedAccount: UserAccountRecord | null }>;
  update(
    userId: string,
    id: string,
    input: UpdateEntityInput,
  ): Promise<EntidadRecord>;
  delete(userId: string, id: string): Promise<void>;
}

export function createEntityApplicationService(
  entities: EntidadRepository,
  accounts: AccountRepository,
): EntityApplicationService {
  return {
    list(userId) {
      return entities.listWithProvisionedAccounts(userId);
    },

    async create(userId, input) {
      const { nombre, tipo, notas, capabilities: bodyCapabilities, metadata } =
        input;

      if (!VALID_TIPOS.includes(tipo)) {
        throw new InvalidEntityTipoError(`Invalid tipo '${tipo}'`);
      }

      const capabilities = validateCapabilities(bodyCapabilities);

      if (!isProvisionableTipo(tipo)) {
        const entity = await entities.create({
          userId,
          nombre: nombre.trim(),
          tipo,
          notas: notas ?? null,
          capabilities,
        });
        return { entity, provisionedAccount: null };
      }

      const map = ENTITY_PROVISION_MAP[tipo];
      const parentId = await accounts.findGlobalIdByCodigo(map.parentGroupCodigo);
      if (!parentId) {
        throw new ChartGroupMissingError(
          `Chart group ${map.parentGroupCodigo} missing from seed`,
        );
      }

      const codigo = await autoAsignarCodigo(accounts, parentId, userId);
      const accountMetadata =
        tipo === 'card_issuer' ? sanitizeAccountMetadata(metadata) : undefined;

      const result = await entities.createWithProvisionedAccount(
        {
          userId,
          nombre: nombre.trim(),
          tipo,
          notas: notas ?? null,
          capabilities,
        },
        {
          codigo,
          tipoCuenta: map.tipoCuenta,
          globalId: parentId,
          metadata: accountMetadata ?? undefined,
        },
      );

      return {
        entity: result.entity,
        provisionedAccount: result.account,
      };
    },

    async update(userId, id, input) {
      const existing = await entities.findByIdForUser(id, userId);
      if (!existing) {
        throw new EntityNotFoundError();
      }

      const capabilities =
        input.capabilities !== undefined
          ? validateCapabilities(input.capabilities)
          : undefined;

      try {
        return await entities.update(
          id,
          userId,
          {
            ...(input.nombre !== undefined && { nombre: input.nombre.trim() }),
            ...(input.tipo !== undefined && { tipo: input.tipo }),
            ...(input.notas !== undefined && { notas: input.notas }),
            ...(capabilities !== undefined && { capabilities }),
          },
          input.nombre !== undefined ? input.nombre.trim() : undefined,
        );
      } catch (err) {
        if (err instanceof EntityConflictError) throw err;
        throw err;
      }
    },

    async delete(userId, id) {
      const existing = await entities.findByIdForUser(id, userId);
      if (!existing) {
        throw new EntityNotFoundError();
      }
      await entities.delete(id);
    },
  };
}
