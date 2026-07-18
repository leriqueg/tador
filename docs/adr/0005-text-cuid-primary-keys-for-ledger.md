# ADR 0005: Text (CUID) primary keys for Asiento and LineaAsiento

## Status

Accepted.

## Date

2026-07-18

## Context

Asiento and LineaAsiento are the ledger’s core records. Their identifiers appear
in API paths, foreign keys (Apunte, AsientoVersion, reversals), client caches,
and audit trails. Prisma already defaults most TADOR models to
`String @id @default(cuid())`. This ADR records why the ledger keeps that
convention instead of switching to `SERIAL` / `BIGSERIAL` integers or
database-generated UUIDs.

Alternatives considered:

| Option | Result | Reason |
|--------|--------|--------|
| `BIGSERIAL` / integer | Rejected for ledger IDs | Sequential integers leak volume and order, are easy to enumerate, and require a central sequence. |
| PostgreSQL `uuid` / `gen_random_uuid()` | Deferred | Valid opaque IDs, but CUID already matches the Prisma baseline and the rest of the schema. |
| Application-assigned CUID (`String`) | Accepted | Opaque, URL-safe, collision-resistant, and consistent with every other domain ID in TADOR. |

## Decision

1. `Asiento.id` and `LineaAsiento.id` are **text** primary keys:
   `String @id @default(cuid())` stored as PostgreSQL `TEXT`.
2. Foreign keys that point at them (`Apunte.asientoId`,
   `Asiento.asientoOriginalId`, `AsientoVersion.asientoId`,
   `LineaAsiento.asientoId`) are also text.
3. Clients and APIs treat these IDs as opaque strings. They MUST NOT parse them
   as numbers or infer chronology from their lexical order.
4. Business sequencing (period year, report order, “recent apuntes”) uses
   explicit fields such as `fecha`, `createdAt`, or report filters—not the
   primary key.

## Motives

- **Opacity and fail-closed URLs.** Integer IDs make `/api/entries/1`,
  `/api/entries/2`, … trivially enumerable. Text CUIDs do not expose how many
  journal entries exist or the next ID to probe.
- **No central sequence.** Concurrent writers do not contend on a single
  `SERIAL` counter when creating Asientos and lines inside the same
  transaction.
- **Stable across environments.** IDs remain valid when cloning fixtures,
  merging books for support, or referencing ledger rows from logs and
  Apunte payloads without remapping sequences.
- **Schema consistency.** Books, accounts, entities, Apuntes, and periods
  already use the same text CUID pattern; the ledger does not invent a second
  identity system.
- **API and TypeScript ergonomics.** Fastify routes, Prisma clients, and the
  frontend already pass `string` IDs end-to-end without numeric casting.

## Consequences

- Indexes and foreign keys are on `TEXT`, which is slightly wider than
  `BIGINT`. For MVP volumes this cost is acceptable and simpler than mixing
  identity types.
- Lexical sort of IDs is not a substitute for chronological order. Queries
  that need time order MUST use `fecha` / `createdAt`.
- Migrating later to UUID v7 or ULID would be a deliberate schema change;
  until then, CUID remains the generator.
- Idempotency keys remain a separate unique string (`Asiento.idempotencyKey`).
  They are not the primary key and must not be confused with `Asiento.id`.
