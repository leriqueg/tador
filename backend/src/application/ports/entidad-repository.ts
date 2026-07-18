/**
 * Port: tenant-owned entities and atomic account provisioning.
 */

import type { Capability, TipoEntidad } from '../../domain/entidad.js';
import type { CuentaUsuarioMetadata, TipoCuenta } from '../../domain/cuenta-usuario.js';
import type { UserAccountRecord } from './account-repository.js';

export interface EntidadRecord {
  id: string;
  userId: string;
  nombre: string;
  tipo: TipoEntidad;
  notas: string | null;
  capabilities: Capability[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProvisionedAccountSummary {
  id: string;
  nombre: string;
  tipoCuenta: TipoCuenta;
  codigo: string | null;
}

export interface EntityListItem {
  id: string;
  nombre: string;
  tipo: TipoEntidad;
  notas: string | null;
  capabilities: Capability[];
  createdAt: Date;
  provisionedAccountId: string | null;
  provisionedAccount: ProvisionedAccountSummary | null;
}

export interface CreateEntidadData {
  userId: string;
  nombre: string;
  tipo: TipoEntidad;
  notas?: string | null;
  capabilities: Capability[];
}

export interface UpdateEntidadData {
  nombre?: string;
  tipo?: TipoEntidad;
  notas?: string | null;
  capabilities?: Capability[];
}

export interface ProvisionEntityAccountData {
  userId: string;
  entityId: string;
  nombre: string;
  codigo: string | null;
  tipoCuenta: TipoCuenta;
  globalId: string;
  metadata?: CuentaUsuarioMetadata;
}

export class EntityConflictError extends Error {
  constructor(message = 'An entity with this name already exists') {
    super(message);
    this.name = 'EntityConflictError';
  }
}

export interface EntidadRepository {
  listWithProvisionedAccounts(userId: string): Promise<EntityListItem[]>;
  findByIdForUser(id: string, userId: string): Promise<EntidadRecord | null>;
  create(data: CreateEntidadData): Promise<EntidadRecord>;
  createWithProvisionedAccount(
    entity: CreateEntidadData,
    account: Omit<ProvisionEntityAccountData, 'userId' | 'entityId' | 'nombre'>,
  ): Promise<{ entity: EntidadRecord; account: UserAccountRecord }>;
  update(
    id: string,
    userId: string,
    data: UpdateEntidadData,
    syncAccountNombre?: string,
  ): Promise<EntidadRecord>;
  delete(id: string): Promise<void>;
}
