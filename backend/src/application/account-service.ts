/**
 * Account application service — user account list/create and balance policy.
 */

import type { BookRepository } from './ports/book-repository.js';
import type {
  AccountRepository,
  CreateUserAccountData,
  UserAccountListItem,
  UserAccountRecord,
} from './ports/account-repository.js';
import { autoAsignarCodigo } from './account-codigo.js';
import { isBalanceProtectedCode } from './account-balance-policy.js';
import type {
  CuentaUsuarioMetadata,
  TipoCuenta,
} from '../domain/cuenta-usuario.js';

export class AccountNotFoundError extends Error {
  constructor(message = 'Account not found') {
    super(message);
    this.name = 'AccountNotFoundError';
  }
}

export class BalancePolicyNotApplicableError extends Error {
  constructor(
    message = 'Balance policy only applies to liquidity and debt accounts',
  ) {
    super(message);
    this.name = 'BalancePolicyNotApplicableError';
  }
}

export class EntityProvisionRequiredError extends Error {
  constructor(
    message = 'bank and card accounts must be created via POST /api/entities (FR-004b)',
  ) {
    super(message);
    this.name = 'EntityProvisionRequiredError';
  }
}

export class ManualAccountTypeNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManualAccountTypeNotAllowedError';
  }
}

export class UnknownParentGroupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownParentGroupError';
  }
}

const MANUAL_ALLOWED: TipoCuenta[] = [
  'wallet',
  'bridge',
  'incomeCategory',
  'expenseCategory',
];

export function sanitizeAccountMetadata(
  input: CuentaUsuarioMetadata | undefined,
): CuentaUsuarioMetadata | null {
  if (!input || typeof input !== 'object') return null;
  const out: CuentaUsuarioMetadata = {};
  if (typeof input.network === 'string' && input.network.trim()) {
    out.network = input.network.trim().toUpperCase();
  }
  if (typeof input.lastFour === 'string') {
    const digits = input.lastFour.replace(/\D/g, '').slice(-4);
    if (digits) out.lastFour = digits;
  }
  if (
    typeof input.cutoffDay === 'number' &&
    Number.isInteger(input.cutoffDay) &&
    input.cutoffDay >= 1 &&
    input.cutoffDay <= 31
  ) {
    out.cutoffDay = input.cutoffDay;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export interface CreateAccountInput {
  tipoCuenta: TipoCuenta;
  nombre: string;
  globalId?: string;
  parentGroupCodigo?: string;
  entidadId?: string;
  codigoPersonalizado?: string;
  metadata?: CuentaUsuarioMetadata;
}

export interface AccountApplicationService {
  list(userId: string): Promise<UserAccountListItem[]>;
  create(userId: string, input: CreateAccountInput): Promise<UserAccountRecord>;
  updateBalancePolicy(
    userId: string,
    accountId: string,
    enforceNonNegativeBalance: boolean,
  ): Promise<UserAccountRecord>;
}

export function createAccountApplicationService(
  accounts: AccountRepository,
  books: BookRepository,
): AccountApplicationService {
  return {
    list(userId) {
      return accounts.listUserAccounts(userId);
    },

    async create(userId, input) {
      const {
        tipoCuenta,
        nombre,
        globalId: bodyGlobalId,
        parentGroupCodigo,
        entidadId,
        codigoPersonalizado,
        metadata: bodyMetadata,
      } = input;

      if (tipoCuenta === 'bank' || tipoCuenta === 'card') {
        throw new EntityProvisionRequiredError();
      }

      if (!MANUAL_ALLOWED.includes(tipoCuenta)) {
        throw new ManualAccountTypeNotAllowedError(
          `tipoCuenta '${tipoCuenta}' is not allowed for manual create`,
        );
      }

      let globalId = bodyGlobalId ?? null;

      if (!globalId && parentGroupCodigo) {
        const parentId = await accounts.findGlobalIdByCodigo(parentGroupCodigo);
        if (!parentId) {
          throw new UnknownParentGroupError(
            `Unknown parentGroupCodigo '${parentGroupCodigo}'`,
          );
        }
        globalId = parentId;
      }

      if (!globalId && tipoCuenta === 'incomeCategory') {
        globalId = await accounts.findGlobalIdByCodigo('41010000');
      }
      if (!globalId && tipoCuenta === 'expenseCategory') {
        globalId = await accounts.findGlobalIdByCodigo('61000000');
        if (!globalId) {
          globalId = await accounts.findFirstGroupGlobalIdByCodigoPrefix('61');
        }
      }

      const codigo = await autoAsignarCodigo(accounts, globalId, userId);
      const metadata = sanitizeAccountMetadata(bodyMetadata);

      const data: CreateUserAccountData = {
        userId,
        codigo,
        tipoCuenta,
        nombre: nombre.trim(),
        globalId,
        entidadId: entidadId ?? null,
        codigoPersonalizado: codigoPersonalizado ?? null,
        metadata,
      };

      return accounts.createUserAccount(data);
    },

    async updateBalancePolicy(userId, accountId, enforceNonNegativeBalance) {
      const [account, book] = await Promise.all([
        accounts.findUserAccountWithGlobalCodigo(userId, accountId),
        books.findByUserId(userId),
      ]);
      if (!account || !book) {
        throw new AccountNotFoundError();
      }
      if (!isBalanceProtectedCode(account.globalCodigo)) {
        throw new BalancePolicyNotApplicableError();
      }
      return accounts.updateUserBalancePolicy({
        userId,
        bookId: book.id,
        accountId,
        enforceNonNegativeBalance,
      });
    },
  };
}
