# ADR 0003: Idempotent and concurrent accounting writes

## Status

Accepted.

## Date

2026-07-18

## Context

TADOR has two public creation paths for financial state:

- `POST /api/entries` creates a journal entry directly.
- `POST /api/apuntes` creates an Apunte and its underlying journal entry.

The accounting Constitution requires mutating financial operations to define a
duplicate-request strategy. A browser retry, double click, proxy retry, or two
concurrent requests must not create duplicate economic facts.

The database already had `Asiento.idempotencyKey @unique`, but only
`POST /api/entries` used it and its check-then-insert path did not recover from
two requests racing on the same key. QuickAdd and EntryBuilder did not send a
key.

## Decision

1. Both creation endpoints accept an optional key through `Idempotency-Key` or
   the request body.
2. The key is persisted on the underlying `Asiento` and protected by the unique
   database constraint.
3. A sequential replay returns the existing result without writing.
4. Requests with the same key acquire a transaction advisory lock and recheck
   the key before business validation. This is necessary when the first write
   changes a protected balance that would make a duplicate retry fail V12.
5. The unique constraint remains the final safety net. A request receiving
   Prisma `P2002` reads and returns the winner instead of failing.
6. Hogar QuickAdd, PRO EntryBuilder, and PRO manual entry generate one UUID per
   capture attempt. A failed transport/application retry reuses that UUID; a
   successful write clears it.
7. Idempotency does not replace accounting validation or balance locks. It only
   deduplicates the same requested economic fact.

## Consequences

- A client that supplies a stable key gets at-most-one persisted asiento for
  that key under sequential and concurrent retries.
- Calls without a key remain supported for compatibility but are not
  deduplicated.
- The first successful request defines the response replayed for that key.
- `Asiento.idempotencyKey` remains globally unique. Changing to book-scoped
  keys would require a future schema migration.
- Specs 003, 004, 006, and 007 must all state their part of the contract:
  engine guarantee, Apunte adaptation, and client key lifecycle.
