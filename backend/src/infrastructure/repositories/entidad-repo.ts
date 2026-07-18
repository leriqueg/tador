/**
 * Prisma adapter for EntidadRepository.
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../database.js';
import type {
  CreateEntidadData,
  EntidadRecord,
  EntidadRepository,
  EntityListItem,
  UpdateEntidadData,
} from '../../application/ports/entidad-repository.js';
import { EntityConflictError } from '../../application/ports/entidad-repository.js';
import type { UserAccountRecord } from '../../application/ports/account-repository.js';
import type {
  Capability,
  TipoEntidad,
} from '../../domain/entidad.js';
import type {
  CuentaUsuarioMetadata,
  TipoCuenta,
} from '../../domain/cuenta-usuario.js';

export type { EntidadRepository };

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Error &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  );
}

function mapCapabilities(value: unknown): Capability[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Capability => typeof item === 'string');
}

function mapMetadata(value: unknown): CuentaUsuarioMetadata | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const out: CuentaUsuarioMetadata = {};
  if (typeof raw.network === 'string') out.network = raw.network;
  if (typeof raw.lastFour === 'string') out.lastFour = raw.lastFour;
  if (typeof raw.cutoffDay === 'number') out.cutoffDay = raw.cutoffDay;
  return Object.keys(out).length > 0 ? out : null;
}

function metadataToJson(
  metadata: CuentaUsuarioMetadata | undefined,
): Prisma.InputJsonValue | undefined {
  if (!metadata) return undefined;
  return metadata as Prisma.InputJsonValue;
}

function mapEntidad(row: {
  id: string;
  userId: string;
  nombre: string;
  tipo: string;
  notas: string | null;
  capabilities: unknown;
  createdAt: Date;
  updatedAt: Date;
}): EntidadRecord {
  return {
    id: row.id,
    userId: row.userId,
    nombre: row.nombre,
    tipo: row.tipo as TipoEntidad,
    notas: row.notas,
    capabilities: mapCapabilities(row.capabilities),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapUserAccount(row: {
  id: string;
  userId: string;
  codigo: string | null;
  globalId: string | null;
  entidadId: string | null;
  tipoCuenta: string;
  nombre: string;
  codigoPersonalizado: string | null;
  metadata: unknown;
  activa: boolean;
  enforceNonNegativeBalance: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserAccountRecord {
  return {
    id: row.id,
    userId: row.userId,
    codigo: row.codigo,
    globalId: row.globalId,
    entidadId: row.entidadId,
    tipoCuenta: row.tipoCuenta as TipoCuenta,
    nombre: row.nombre,
    codigoPersonalizado: row.codigoPersonalizado,
    metadata: mapMetadata(row.metadata),
    activa: row.activa,
    enforceNonNegativeBalance: row.enforceNonNegativeBalance,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createEntidadRepository(): EntidadRepository {
  return {
    async listWithProvisionedAccounts(userId: string): Promise<EntityListItem[]> {
      const rows = await prisma.entidad.findMany({
        where: { userId },
        orderBy: { nombre: 'asc' },
        include: {
          cuentasUsuario: {
            where: { activa: true },
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return rows.map((row) => {
        const account = row.cuentasUsuario[0];
        return {
          id: row.id,
          nombre: row.nombre,
          tipo: row.tipo as TipoEntidad,
          notas: row.notas,
          capabilities: mapCapabilities(row.capabilities),
          createdAt: row.createdAt,
          provisionedAccountId: account?.id ?? null,
          provisionedAccount: account
            ? {
                id: account.id,
                nombre: account.nombre,
                tipoCuenta: account.tipoCuenta as TipoCuenta,
                codigo: account.codigo,
              }
            : null,
        };
      });
    },

    async findByIdForUser(id: string, userId: string): Promise<EntidadRecord | null> {
      const row = await prisma.entidad.findFirst({ where: { id, userId } });
      return row ? mapEntidad(row) : null;
    },

    async create(data: CreateEntidadData): Promise<EntidadRecord> {
      try {
        const row = await prisma.entidad.create({
          data: {
            userId: data.userId,
            nombre: data.nombre,
            tipo: data.tipo,
            notas: data.notas ?? null,
            capabilities: data.capabilities,
          },
        });
        return mapEntidad(row);
      } catch (err) {
        if (isUniqueViolation(err)) throw new EntityConflictError();
        throw err;
      }
    },

    async createWithProvisionedAccount(entity, account) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const createdEntity = await tx.entidad.create({
            data: {
              userId: entity.userId,
              nombre: entity.nombre,
              tipo: entity.tipo,
              notas: entity.notas ?? null,
              capabilities: entity.capabilities,
            },
          });

          const createdAccount = await tx.cuentaUsuario.create({
            data: {
              userId: entity.userId,
              codigo: account.codigo,
              tipoCuenta: account.tipoCuenta,
              nombre: entity.nombre,
              globalId: account.globalId,
              entidadId: createdEntity.id,
              metadata: metadataToJson(account.metadata),
            },
          });

          return { entity: createdEntity, account: createdAccount };
        });

        return {
          entity: mapEntidad(result.entity),
          account: mapUserAccount(result.account),
        };
      } catch (err) {
        if (isUniqueViolation(err)) throw new EntityConflictError();
        throw err;
      }
    },

    async update(id, userId, data: UpdateEntidadData, syncAccountNombre?) {
      try {
        const row = await prisma.$transaction(async (tx) => {
          const updated = await tx.entidad.update({
            where: { id },
            data: {
              ...(data.nombre !== undefined && { nombre: data.nombre }),
              ...(data.tipo !== undefined && { tipo: data.tipo }),
              ...(data.notas !== undefined && { notas: data.notas }),
              ...(data.capabilities !== undefined && {
                capabilities: data.capabilities,
              }),
            },
          });

          if (syncAccountNombre !== undefined) {
            await tx.cuentaUsuario.updateMany({
              where: { entidadId: id, userId },
              data: { nombre: syncAccountNombre },
            });
          }

          return updated;
        });
        return mapEntidad(row);
      } catch (err) {
        if (isUniqueViolation(err)) throw new EntityConflictError();
        throw err;
      }
    },

    async delete(id: string): Promise<void> {
      await prisma.entidad.delete({ where: { id } });
    },
  };
}
