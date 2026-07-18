import Decimal from 'decimal.js';
import { Prisma } from '@prisma/client';
import { lockTransactionKey } from './transaction-locks.js';

export interface BalancePolicyLine {
  cuentaId?: string | null;
  cuentaGlobalId?: string | null;
  debito: Decimal.Value;
  credito: Decimal.Value;
}

type NaturalSide = 'debit' | 'credit';

interface ProtectedAccount {
  kind: 'user' | 'global';
  id: string;
  name: string;
  naturalSide: NaturalSide;
  enforce: boolean;
}

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

async function loadProtectedAccounts(
  tx: Prisma.TransactionClient,
  userId: string,
  lines: BalancePolicyLine[],
): Promise<Map<string, ProtectedAccount>> {
  const userIds = [
    ...new Set(lines.flatMap((line) => (line.cuentaId ? [line.cuentaId] : []))),
  ];
  const globalIds = [
    ...new Set(
      lines.flatMap((line) =>
        line.cuentaGlobalId ? [line.cuentaGlobalId] : [],
      ),
    ),
  ];

  const [userAccounts, globalAccounts, activations] = await Promise.all([
    tx.cuentaUsuario.findMany({
      where: { id: { in: userIds }, userId },
      select: {
        id: true,
        nombre: true,
        enforceNonNegativeBalance: true,
        global: { select: { codigo: true } },
      },
    }),
    tx.cuentaGlobal.findMany({
      where: { id: { in: globalIds } },
      select: { id: true, nombre: true, codigo: true },
    }),
    tx.activacionCuentaGlobal.findMany({
      where: { userId, globalId: { in: globalIds } },
      select: { globalId: true, enforceNonNegativeBalance: true },
    }),
  ]);

  const activationByGlobal = new Map(
    activations.map((activation) => [
      activation.globalId,
      activation.enforceNonNegativeBalance,
    ]),
  );
  const result = new Map<string, ProtectedAccount>();

  for (const account of userAccounts) {
    const naturalSide = naturalSideForCode(account.global?.codigo ?? null);
    if (!naturalSide) continue;
    result.set(accountKey('user', account.id), {
      kind: 'user',
      id: account.id,
      name: account.nombre,
      naturalSide,
      enforce: account.enforceNonNegativeBalance,
    });
  }

  for (const account of globalAccounts) {
    const naturalSide = naturalSideForCode(account.codigo);
    if (!naturalSide) continue;
    result.set(accountKey('global', account.id), {
      kind: 'global',
      id: account.id,
      name: account.nombre,
      naturalSide,
      enforce: activationByGlobal.get(account.id) ?? true,
    });
  }

  return result;
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
    const delta = new Decimal(line.debito).minus(line.credito);
    deltas.set(key, (deltas.get(key) ?? new Decimal(0)).plus(delta));
  }
  return deltas;
}

async function lockAccount(
  tx: Prisma.TransactionClient,
  bookId: string,
  account: ProtectedAccount,
): Promise<void> {
  const lockKey = `balance:${bookId}:${account.kind}:${account.id}`;
  await lockTransactionKey(tx, lockKey);
}

/** Serialize a policy toggle with in-flight balance checks for that account. */
export async function lockBalancePolicyChange(
  tx: Prisma.TransactionClient,
  bookId: string,
  kind: 'user' | 'global',
  accountId: string,
): Promise<void> {
  await lockAccount(tx, bookId, {
    kind,
    id: accountId,
    name: accountId,
    naturalSide: 'debit',
    enforce: true,
  });
}

async function currentDebitMinusCredit(
  tx: Prisma.TransactionClient,
  bookId: string,
  account: ProtectedAccount,
  replacingAsientoId?: string,
): Promise<Decimal> {
  const result = await tx.lineaAsiento.aggregate({
    where: {
      ...(account.kind === 'user'
        ? { cuentaId: account.id }
        : { cuentaGlobalId: account.id }),
      ...(replacingAsientoId
        ? { asientoId: { not: replacingAsientoId } }
        : {}),
      asiento: { bookId, anulado: false, asientoOriginalId: null },
    },
    _sum: { debito: true, credito: true },
  });
  return new Decimal(result._sum.debito?.toString() ?? 0).minus(
    result._sum.credito?.toString() ?? 0,
  );
}

/**
 * Serializes writers per protected account, then checks the projected natural
 * balance inside the same transaction that will persist the journal lines.
 *
 * `replacingAsientoId` excludes old lines during an edit before adding the
 * replacement lines.
 */
export async function assertProjectedBalances(
  tx: Prisma.TransactionClient,
  input: {
    bookId: string;
    userId: string;
    lines: BalancePolicyLine[];
    replacingAsientoId?: string;
  },
): Promise<void> {
  const accounts = await loadProtectedAccounts(tx, input.userId, input.lines);
  const deltas = consolidateDeltas(input.lines);
  const enforced = [...accounts.values()]
    .filter((account) => account.enforce)
    .sort((a, b) => accountKey(a.kind, a.id).localeCompare(accountKey(b.kind, b.id)));

  for (const account of enforced) {
    await lockAccount(tx, input.bookId, account);
  }

  for (const account of enforced) {
    const current = await currentDebitMinusCredit(
      tx,
      input.bookId,
      account,
      input.replacingAsientoId,
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
