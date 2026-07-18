# ADR 0004: Derived balances and concurrent natural-balance guard

## Status

Accepted.

## Date

2026-07-18

## Context

TADOR calculates balances from active journal lines. It does not persist a
mutable balance column. This keeps the ledger as the source of truth, but a
naive `read balance → validate → insert lines` sequence is unsafe: two
concurrent withdrawals can both observe the same funds and overdraw the
account.

The product requires cash, banks, electronic wallets, personal receivables,
personal payables, and credit-card debt to avoid crossing below zero in their
natural accounting direction by default. Users also need an explicit per-account
escape hatch for intentional reconciliation corrections.

## Decision

1. Balances remain derived at query time from `LineaAsiento`; there is no
   materialized balance, trigger-maintained total, or materialized view.
2. The protected chart families are:
   - debit-natural: `1111` cash/wallets, `1112` banks, `1132` personal
     receivables;
   - credit-natural: `2112` personal payables, `2120` credit cards.
3. Before persisting a create or replacement of lines, the same database
   transaction:
   - acquires deterministic PostgreSQL transaction advisory locks per
     `(book, account-kind, account-id)`;
   - recalculates the current balance from committed journal lines;
   - adds the proposed line delta with exact decimal arithmetic;
   - rejects a negative projected natural balance as `V12`.
4. Locks are acquired in sorted order to avoid deadlocks. They are released
   automatically on commit or rollback.
5. `CuentaUsuario.enforceNonNegativeBalance` and the per-user
   `ActivacionCuentaGlobal.enforceNonNegativeBalance` default to `true`.
   Disabling the flag bypasses V12 only for that account.
6. A policy change acquires the same advisory lock as a writer, so a toggle
   cannot race an in-flight balance decision.
7. This is an application + transaction invariant, not a database `CHECK`.
   A SQL writer that bypasses the application service can bypass V12 and is not
   a supported write path.
8. A void keeps the original and reversal for audit, but effective balance and
   report reads exclude both (`original.anulado = true`; reversal has
   `asientoOriginalId`). V12 evaluates the projected state with the original
   removed.

## Why not alternatives

- **Row locks:** direct global accounts do not always have a per-user activation
  row to lock. Advisory locks give both account kinds one lock namespace.
- **Serializable isolation:** correct with retries, but broader and more
  expensive than serializing only the affected accounts.
- **Stored balance + trigger:** faster reads but duplicates ledger state,
  increases migration/reconciliation complexity, and is unnecessary for MVP
  volume.

## Consequences

- Concurrent spending of the same protected account is serialized; only writes
  whose projected natural balance remains non-negative can commit.
- Balance reads remain reproducible from ledger lines.
- Multi-account writes have deterministic lock ordering.
- The toggle is safe but intentionally exceptional; UI wording must communicate
  that disabling it allows inconsistent real-world balances.
- Reversal/void behavior must preserve this invariant. Any future write path
  must call the same guard inside its transaction.
