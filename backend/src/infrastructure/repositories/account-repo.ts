/**
 * Prisma adapter for AccountRepository.
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../database.js';
import {
  lockBalancePolicyChange,
} from '../../application/account-balance-policy.js';
import { wrapPrismaTransaction } from './journal-store.js';
import type {
  AccountRepository,
  ChartGlobalAccountRecord,
  CreateUserAccountData,
  GlobalActivationRecord,
  GlobalAccountNode,
  UserAccountLineMeta,
  UserAccountListItem,
  UserAccountRecord,
  UserAccountSummary,
} from '../../application/ports/account-repository.js';
import type {
  CuentaUsuarioMetadata,
  TipoCuenta,
} from '../../domain/cuenta-usuario.js';

export type { AccountRepository };

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
  metadata: CuentaUsuarioMetadata | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (!metadata) return undefined;
  return metadata as Prisma.InputJsonValue;
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

export function createAccountRepository(): AccountRepository {
  return {
    async findPostableGlobalAccount(id: string) {
      const row = await prisma.cuentaGlobal.findUnique({
        where: { id },
        select: { id: true, esPostable: true },
      });
      if (!row || !row.esPostable) return null;
      return { id: row.id };
    },

    async findOwnedUserAccount(userId: string, id: string) {
      const row = await prisma.cuentaUsuario.findUnique({
        where: { id },
        select: { id: true, userId: true, activa: true },
      });
      if (!row || row.userId !== userId) return null;
      return { id: row.id, activa: row.activa };
    },

    async findUserAccountById(id: string) {
      const row = await prisma.cuentaUsuario.findUnique({
        where: { id },
        select: { userId: true, activa: true },
      });
      if (!row) return null;
      return { userId: row.userId, activa: row.activa };
    },

    async findGlobalCodigo(id: string): Promise<string | null> {
      const row = await prisma.cuentaGlobal.findUnique({
        where: { id },
        select: { codigo: true },
      });
      return row?.codigo ?? null;
    },

    async findGlobalParentLink(id: string) {
      return prisma.cuentaGlobal.findUnique({
        where: { id },
        select: { codigo: true, parentId: true },
      });
    },

    async globalExists(id: string): Promise<boolean> {
      const row = await prisma.cuentaGlobal.findUnique({
        where: { id },
        select: { id: true },
      });
      return row !== null;
    },

    async listGlobalChartNodes(): Promise<GlobalAccountNode[]> {
      return prisma.cuentaGlobal.findMany({
        select: {
          id: true,
          codigo: true,
          nombre: true,
          parentId: true,
          esPostable: true,
        },
      });
    },

    async findGlobalIdByCodigo(codigo: string): Promise<string | null> {
      const row = await prisma.cuentaGlobal.findUnique({
        where: { codigo },
        select: { id: true },
      });
      return row?.id ?? null;
    },

    async findFirstGroupGlobalIdByCodigoPrefix(
      prefix: string,
    ): Promise<string | null> {
      const row = await prisma.cuentaGlobal.findFirst({
        where: { codigo: { startsWith: prefix }, esPostable: false },
        select: { id: true },
      });
      return row?.id ?? null;
    },

    async findUserAccountGlobalId(id: string): Promise<string | null> {
      const row = await prisma.cuentaUsuario.findUnique({
        where: { id },
        select: { globalId: true },
      });
      return row?.globalId ?? null;
    },

    async listActiveUserAccountsWithGlobal(
      userId: string,
    ): Promise<UserAccountSummary[]> {
      return prisma.cuentaUsuario.findMany({
        where: { userId, activa: true, globalId: { not: null } },
        select: { id: true, nombre: true, codigo: true, globalId: true },
      });
    },

    async findLatestUserCodigoWithPrefix(
      userId: string,
      prefix: string,
    ): Promise<string | null> {
      const row = await prisma.cuentaUsuario.findFirst({
        where: {
          codigo: { startsWith: prefix },
          userId,
        },
        orderBy: { codigo: 'desc' },
        select: { codigo: true },
      });
      return row?.codigo ?? null;
    },

    async findUserAccountLineMeta(
      userId: string,
      accountIds: string[],
    ): Promise<UserAccountLineMeta[]> {
      if (accountIds.length === 0) return [];
      return prisma.cuentaUsuario.findMany({
        where: { id: { in: accountIds }, userId },
        select: { id: true, tipoCuenta: true, entidadId: true },
      });
    },

    async listChart(): Promise<ChartGlobalAccountRecord[]> {
      return prisma.cuentaGlobal.findMany({
        orderBy: { codigo: 'asc' },
      });
    },

    async listActivations(userId: string): Promise<GlobalActivationRecord[]> {
      return prisma.activacionCuentaGlobal.findMany({
        where: { userId },
      });
    },

    async upsertActivation(userId, globalId, input) {
      return prisma.activacionCuentaGlobal.upsert({
        where: {
          userId_globalId: { userId, globalId },
        },
        update: {
          activa: input.activa ?? true,
          ...(input.nombreOverride !== undefined && {
            nombreOverride: input.nombreOverride,
          }),
        },
        create: {
          userId,
          globalId,
          activa: input.activa ?? true,
          nombreOverride: input.nombreOverride ?? null,
        },
      });
    },

    async updateGlobalBalancePolicy(input) {
      return prisma.$transaction(async (tx) => {
        await lockBalancePolicyChange(
          wrapPrismaTransaction(tx),
          input.bookId,
          'global',
          input.globalId,
        );
        return tx.activacionCuentaGlobal.upsert({
          where: {
            userId_globalId: {
              userId: input.userId,
              globalId: input.globalId,
            },
          },
          update: { enforceNonNegativeBalance: input.enforceNonNegativeBalance },
          create: {
            userId: input.userId,
            globalId: input.globalId,
            activa: true,
            enforceNonNegativeBalance: input.enforceNonNegativeBalance,
          },
        });
      });
    },

    async listUserAccounts(userId: string): Promise<UserAccountListItem[]> {
      const rows = await prisma.cuentaUsuario.findMany({
        where: { userId },
        orderBy: [{ tipoCuenta: 'asc' }, { nombre: 'asc' }],
      });

      return rows.map((row) => ({
        id: row.id,
        codigo: row.codigo,
        nombre: row.nombre,
        tipoCuenta: row.tipoCuenta as TipoCuenta,
        entidadId: row.entidadId,
        isEntityProvisioned: row.entidadId != null,
        metadata: mapMetadata(row.metadata),
        activa: row.activa,
        enforceNonNegativeBalance: row.enforceNonNegativeBalance,
      }));
    },

    async createUserAccount(data: CreateUserAccountData): Promise<UserAccountRecord> {
      const row = await prisma.cuentaUsuario.create({
        data: {
          userId: data.userId,
          codigo: data.codigo,
          tipoCuenta: data.tipoCuenta,
          nombre: data.nombre,
          globalId: data.globalId,
          entidadId: data.entidadId ?? null,
          codigoPersonalizado: data.codigoPersonalizado ?? null,
          metadata: metadataToJson(data.metadata),
        },
      });
      return mapUserAccount(row);
    },

    async findUserAccountWithGlobalCodigo(userId, accountId) {
      const row = await prisma.cuentaUsuario.findFirst({
        where: { id: accountId, userId },
        select: {
          id: true,
          global: { select: { codigo: true } },
        },
      });
      if (!row) return null;
      return {
        id: row.id,
        globalCodigo: row.global?.codigo ?? null,
      };
    },

    async updateUserBalancePolicy(input) {
      return prisma.$transaction(async (tx) => {
        await lockBalancePolicyChange(
          wrapPrismaTransaction(tx),
          input.bookId,
          'user',
          input.accountId,
        );
        const row = await tx.cuentaUsuario.update({
          where: { id: input.accountId },
          data: { enforceNonNegativeBalance: input.enforceNonNegativeBalance },
        });
        return mapUserAccount(row);
      });
    },
  };
}
