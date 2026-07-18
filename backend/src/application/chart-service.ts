/**
 * Chart application service — global chart reads and activations.
 */

import type { BookRepository } from './ports/book-repository.js';
import type {
  AccountRepository,
  ChartGlobalAccountRecord,
  GlobalActivationRecord,
} from './ports/account-repository.js';
import {
  isBalanceProtectedCode,
} from './account-balance-policy.js';

export class ChartAccountNotFoundError extends Error {
  constructor(message = 'Account not found') {
    super(message);
    this.name = 'ChartAccountNotFoundError';
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

export interface ChartApplicationService {
  listChart(userId: string): Promise<{
    chart: ChartGlobalAccountRecord[];
    activations: GlobalActivationRecord[];
  }>;
  activateGlobalAccount(
    userId: string,
    globalId: string,
    nombreOverride?: string,
  ): Promise<GlobalActivationRecord>;
  updateGlobalBalancePolicy(
    userId: string,
    globalId: string,
    enforceNonNegativeBalance: boolean,
  ): Promise<GlobalActivationRecord>;
}

export function createChartApplicationService(
  accounts: AccountRepository,
  books: BookRepository,
): ChartApplicationService {
  return {
    async listChart(userId) {
      const [chart, activations] = await Promise.all([
        accounts.listChart(),
        accounts.listActivations(userId),
      ]);
      return { chart, activations };
    },

    activateGlobalAccount(userId, globalId, nombreOverride) {
      return accounts.upsertActivation(userId, globalId, {
        activa: true,
        nombreOverride: nombreOverride ?? null,
      });
    },

    async updateGlobalBalancePolicy(userId, globalId, enforceNonNegativeBalance) {
      const [global, book] = await Promise.all([
        accounts.findGlobalParentLink(globalId),
        books.findByUserId(userId),
      ]);
      if (!global || !book) {
        throw new ChartAccountNotFoundError();
      }
      if (!isBalanceProtectedCode(global.codigo)) {
        throw new BalancePolicyNotApplicableError();
      }
      return accounts.updateGlobalBalancePolicy({
        userId,
        bookId: book.id,
        globalId,
        enforceNonNegativeBalance,
      });
    },
  };
}
