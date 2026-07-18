import Decimal from 'decimal.js';
import type { BalancePolicyLine, JournalTransaction } from './ports/journal-store.js';

export type { BalancePolicyLine };

type NaturalSide = 'debit' | 'credit';

const DEBIT_NATURAL_PREFIXES = ['1111', '1112', '1132'];
const CREDIT_NATURAL_PREFIXES = ['2112', '2120'];

export class NegativeBalanceError extends Error {
  readonly code = 'V12';

  constructor(
    readonly accountId: string,
    readonly accountName: string,
    readonly projectedNaturalBalance: string,
  ) {
    super(
      `La cuenta "${accountName}" quedaría con saldo negativo ` +
        `(${projectedNaturalBalance}). Ajusta el monto o corrige el saldo registrado. (V12)`,
    );
    this.name = 'NegativeBalanceError';
  }
}

function naturalSideForCode(code: string | null): NaturalSide | null {
  if (!code) return null;
  if (DEBIT_NATURAL_PREFIXES.some((prefix) => code.startsWith(prefix))) {
    return 'debit';
  }
  if (CREDIT_NATURAL_PREFIXES.some((prefix) => code.startsWith(prefix))) {
    return 'credit';
  }
  return null;
}

function accountKey(kind: 'user' | 'global', id: string): string {
  return `${kind}:${id}`;
}

function consolidateDeltas(
  lines: BalancePolicyLine[],
): Map<string, Decimal> {
  const deltas = new Map<string, Decimal>();
  for (const line of lines) {
    const kind = line.cuentaId ? 'user' : 'global';
    const id = line.cuentaId ?? line.cuentaGlobalId;
    if (!id) continue;
    const key = accountKey(kind, id);
    const delta = new Decimal(String(line.debito)).minus(String(line.credito));
    deltas.set(key, (deltas.get(key) ?? new Decimal(0)).plus(delta));
  }
  return deltas;
}

/** Serialize a policy toggle with in-flight balance checks for that account. */
export async function lockBalancePolicyChange(
  tx: JournalTransaction,
  bookId: string,
  kind: 'user' | 'global',
  accountId: string,
): Promise<void> {
  await tx.lockKey(`balance:${bookId}:${kind}:${accountId}`);
}

/**
 * Serializes writers per protected account, then checks the projected natural
 * balance inside the same transaction that will persist the journal lines.
 *
 * `replacingAsientoId` excludes old lines during an edit before adding the
 * replacement lines.
 */
export async function assertProjectedBalances(
  tx: JournalTransaction,
  input: {
    bookId: string;
    userId: string;
    lines: BalancePolicyLine[];
    replacingAsientoId?: string;
  },
): Promise<void> {
  const protectedAccounts = await tx.loadProtectedAccounts(
    input.userId,
    input.lines,
  );
  const accounts = new Map(
    protectedAccounts.map((account) => [
      accountKey(account.kind, account.id),
      account,
    ]),
  );
  const deltas = consolidateDeltas(input.lines);
  const enforced = [...accounts.values()]
    .filter((account) => account.enforce)
    .sort((a, b) =>
      accountKey(a.kind, a.id).localeCompare(accountKey(b.kind, b.id)),
    );

  for (const account of enforced) {
    await tx.lockKey(`balance:${input.bookId}:${account.kind}:${account.id}`);
  }

  for (const account of enforced) {
    const current = new Decimal(
      await tx.getAccountDebitMinusCredit(
        input.bookId,
        { kind: account.kind, id: account.id },
        input.replacingAsientoId,
      ),
    );
    const projected = current.plus(
      deltas.get(accountKey(account.kind, account.id)) ?? 0,
    );
    const natural =
      account.naturalSide === 'debit' ? projected : projected.negated();
    if (natural.isNegative()) {
      throw new NegativeBalanceError(
        account.id,
        account.name,
        natural.toFixed(),
      );
    }
  }
}

export function isBalanceProtectedCode(code: string | null): boolean {
  return naturalSideForCode(code) !== null;
}
