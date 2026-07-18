/**
 * Port: chart of accounts, activations, and user account persistence.
 */

import type { CuentaUsuarioMetadata, TipoCuenta } from '../../domain/cuenta-usuario.js';

export interface GlobalAccountNode {
  id: string;
  codigo: string;
  nombre: string;
  parentId: string | null;
  esPostable: boolean;
}

export interface ChartGlobalAccountRecord {
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
}

export interface GlobalActivationRecord {
  id: string;
  userId: string;
  globalId: string;
  activa: boolean;
  nombreOverride: string | null;
  enforceNonNegativeBalance: boolean;
  createdAt: Date;
}

export interface UserAccountSummary {
  id: string;
  nombre: string;
  codigo: string | null;
  globalId: string | null;
}

export interface UserAccountLineMeta {
  id: string;
  tipoCuenta: string;
  entidadId: string | null;
}

export interface UserAccountRecord {
  id: string;
  userId: string;
  codigo: string | null;
  globalId: string | null;
  entidadId: string | null;
  tipoCuenta: TipoCuenta;
  nombre: string;
  codigoPersonalizado: string | null;
  metadata: CuentaUsuarioMetadata | null;
  activa: boolean;
  enforceNonNegativeBalance: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAccountListItem {
  id: string;
  codigo: string | null;
  nombre: string;
  tipoCuenta: TipoCuenta;
  entidadId: string | null;
  isEntityProvisioned: boolean;
  metadata: CuentaUsuarioMetadata | null;
  activa: boolean;
  enforceNonNegativeBalance: boolean;
}

export interface CreateUserAccountData {
  userId: string;
  codigo: string | null;
  tipoCuenta: TipoCuenta;
  nombre: string;
  globalId: string | null;
  entidadId?: string | null;
  codigoPersonalizado?: string | null;
  metadata?: CuentaUsuarioMetadata | null;
}

export interface PostableGlobalAccount {
  id: string;
}

export interface OwnedUserAccount {
  id: string;
  activa: boolean;
}

export interface UserAccountTenant {
  userId: string;
  activa: boolean;
}

export interface AccountRepository {
  findPostableGlobalAccount(id: string): Promise<PostableGlobalAccount | null>;
  findOwnedUserAccount(
    userId: string,
    id: string,
  ): Promise<OwnedUserAccount | null>;
  findUserAccountById(id: string): Promise<UserAccountTenant | null>;
  findGlobalCodigo(id: string): Promise<string | null>;
  findGlobalParentLink(
    id: string,
  ): Promise<{ codigo: string; parentId: string | null } | null>;
  globalExists(id: string): Promise<boolean>;
  listGlobalChartNodes(): Promise<GlobalAccountNode[]>;
  findGlobalIdByCodigo(codigo: string): Promise<string | null>;
  findFirstGroupGlobalIdByCodigoPrefix(prefix: string): Promise<string | null>;
  findUserAccountGlobalId(id: string): Promise<string | null>;
  listActiveUserAccountsWithGlobal(
    userId: string,
  ): Promise<UserAccountSummary[]>;
  findLatestUserCodigoWithPrefix(
    userId: string,
    prefix: string,
  ): Promise<string | null>;
  findUserAccountLineMeta(
    userId: string,
    accountIds: string[],
  ): Promise<UserAccountLineMeta[]>;

  listChart(): Promise<ChartGlobalAccountRecord[]>;
  listActivations(userId: string): Promise<GlobalActivationRecord[]>;
  upsertActivation(
    userId: string,
    globalId: string,
    input: { nombreOverride?: string | null; activa?: boolean },
  ): Promise<GlobalActivationRecord>;
  updateGlobalBalancePolicy(input: {
    userId: string;
    bookId: string;
    globalId: string;
    enforceNonNegativeBalance: boolean;
  }): Promise<GlobalActivationRecord>;

  listUserAccounts(userId: string): Promise<UserAccountListItem[]>;
  createUserAccount(data: CreateUserAccountData): Promise<UserAccountRecord>;
  findUserAccountWithGlobalCodigo(
    userId: string,
    accountId: string,
  ): Promise<{ id: string; globalCodigo: string | null } | null>;
  updateUserBalancePolicy(input: {
    userId: string;
    bookId: string;
    accountId: string;
    enforceNonNegativeBalance: boolean;
  }): Promise<UserAccountRecord>;
}
