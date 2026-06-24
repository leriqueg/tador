# ADR 0001: Stack architecture and library baseline

## Status

Accepted for MVP foundation.

## Date

2026-06-22

## Decision

TADOR will use a TypeScript web architecture with separated backend and frontend
roots, local-first Docker development, and stable open-source libraries for
security-sensitive and infrastructure concerns.

The baseline stack is:

| Area | Decision |
| --- | --- |
| Backend runtime | Node.js 24 LTS, TypeScript, ESM |
| Backend framework | Fastify |
| Persistence | PostgreSQL 18, Prisma ORM and migrations |
| API validation | Zod integrated with Fastify, unless Sprint 01 implementation proves native JSON Schema is simpler |
| Auth foundation | Email/password auth with Argon2 password hashing, opaque DB-backed sessions, secure HTTP-only cookies, and Prisma-managed recovery tokens |
| Backend tests | Vitest for TDD, with integration tests once the database schema exists |
| Frontend | React, TypeScript, Vite, Mantine, TanStack Query, Zustand |
| Money arithmetic | Decimal/exact arithmetic; `decimal.js` is the initial candidate for application calculations |
| Docker local dev | Docker Compose grows by phase; only implemented services are added |
| Package policy | Stable releases only; lock exact resolved versions with the package manager lockfile |

## Context

The MVP needs to start with backend TDD while keeping the full product direction
clear: multi-user registration, tenant isolation, stable currency per book,
balanced accounting entries, future Hogar/PRO UI, and later IA v0 as a
suggestion-only interpreter.

The stack is also part of the learning goal: React, TypeScript, Vite, Mantine,
Zustand, React Query, Node.js, Fastify, PostgreSQL, Prisma, and Docker are
intentional technologies for professional practice.

The architecture must support:

- local development with debug ports and hot reload;
- mobile-first UI later without coupling accounting rules to React;
- secure auth and password recovery without custom crypto;
- exact financial calculations;
- tenant-owned data that fails closed;
- incremental Docker Compose services only when code exists.

## Analysis

### Backend framework

Fastify is accepted over Express and NestJS.

| Option | Result | Reason |
| --- | --- | --- |
| Fastify | Accepted | Good TypeScript support, first-party plugin ecosystem, JSON Schema validation, Pino logging, and thin route handlers. |
| Express | Rejected for MVP | Stable and familiar, but would require more manual decisions for validation, typing, logging, and plugin conventions. |
| NestJS | Rejected for MVP | Powerful, but heavier than needed and likely to hide Clean Architecture decisions behind framework structure too early. |

Fastify routes must stay as adapters. Domain/accounting rules belong in
application/domain code.

### Persistence and migrations

Prisma with PostgreSQL is accepted over TypeORM/Drizzle/raw SQL for the MVP.

| Option | Result | Reason |
| --- | --- | --- |
| Prisma | Accepted | Strong TypeScript developer experience, migrations, generated client, and clear PostgreSQL workflow. |
| TypeORM | Rejected for MVP | More runtime/entity magic than needed for a fresh codebase. |
| Drizzle | Deferred | Attractive for SQL-first typing, but Prisma is a clearer MVP fit for migrations and onboarding. |
| Raw SQL only | Rejected for MVP | Too much infrastructure to own before the domain is stable. |

Prisma configuration should use `prisma.config.ts`, an explicit migrations path,
and `DATABASE_URL` from the environment.

### Validation

Zod is the preferred API boundary validator because it keeps TypeScript request
contracts close to implementation. Fastify native JSON Schema remains acceptable
where it is simpler.

For versioned template JSON files, the decision is deferred. `ajv` remains a
strong candidate because JSON Schema is natural for repository-stored JSON
artifacts.

### Authentication

The MVP will not start with stateless JWT auth.

Use:

- Argon2 for password hashing;
- opaque random session tokens stored hashed in PostgreSQL;
- HTTP-only, Secure, SameSite cookies via Fastify cookie support;
- short-lived password recovery tokens stored hashed with expiry;
- rate limiting on login, registration, verification, and recovery endpoints.

This keeps revocation and tenant access simple. JWT can be reconsidered only
when there is a real multi-service or external API requirement.

### Frontend framework and state

React + Vite + Mantine is accepted as the UI foundation.

| Concern | Decision | Reason |
| --- | --- | --- |
| Build | Vite | Best fit for SPA development, fast HMR, and TypeScript workflow. |
| UI | Mantine | Broad component/hook set, TypeScript support, forms, responsive UI, and fast MVP delivery. |
| Server state | TanStack Query | Clear query/mutation model, cache invalidation, retries, and devtools. |
| Local UI state | Zustand | Small, focused store for mode/navigation/preferences without Redux-level ceremony. |
| Forms | Mantine form first | Avoid another form dependency until UX proves it is needed. |

TanStack Query owns server state. Zustand must not duplicate API cache data.

### Money and accounting calculations

Financial values must not use JavaScript floating-point numbers. The initial
candidate is `decimal.js` for application-level calculations, with PostgreSQL
exact numeric/decimal columns for persistence.

The final schema must preserve accounting invariants in application/domain code:
balanced Asientos, immutable or controlled corrections, tenant isolation, and
idempotent mutation handling.

### Docker development

Compose will be phased:

| Phase | Services |
| --- | --- |
| Foundation | `postgres` only |
| Backend skeleton | `backend`, `postgres` |
| Backend integration tests | `backend`, `postgres`, optional `postgres_test` |
| Frontend skeleton | `frontend`, `backend`, `postgres` |
| IA v0 | AI runtime only after research and implementation starts |

Developer containers should use bind mounts, dependency volumes, hot reload, and
debug ports. Production images are out of scope until deployment work begins.

## Consequences

Positive consequences:

- The MVP starts with a small, understandable backend surface.
- Security-sensitive concerns use mature packages or platform primitives.
- React UI work can begin later without reshaping backend/domain boundaries.
- Docker remains useful without pretending unimplemented services exist.
- The stack supports learning goals while staying credible for production growth.

Trade-offs:

- Zod plus Fastify JSON Schema needs discipline to avoid duplicate schemas.
- Prisma is productive but less SQL-explicit than Drizzle/raw SQL.
- DB-backed sessions add tables and cleanup jobs, but simplify revocation.
- Mantine accelerates delivery but influences visual/component architecture.

## Version Research Snapshot

Observed stable npm `latest` versions on 2026-06-22:

| Package | Observed version |
| --- | ---: |
| `fastify` | 5.8.5 |
| `@fastify/cors` | 11.2.0 |
| `@fastify/helmet` | 13.0.2 |
| `@fastify/rate-limit` | 11.0.0 |
| `@fastify/cookie` | 11.0.2 |
| `prisma`, `@prisma/client` | 7.8.0 |
| `zod` | 4.4.3 |
| `argon2` | 0.44.0 |
| `vitest` | 4.1.9 |
| `typescript` | 6.0.3 |
| `tsx` | 4.22.4 |
| `eslint` | 10.5.0 |
| `prettier` | 3.8.4 |
| `react` | 19.2.7 |
| `vite` | 8.0.16 |
| `@vitejs/plugin-react` | 6.0.2 |
| `@mantine/core` | 9.4.0 |
| `@tanstack/react-query` | 5.101.0 |
| `zustand` | 5.0.14 |
| `decimal.js` | 10.6.0 |
| `ajv` | 8.20.0 |

These versions are research inputs, not installation guarantees. At install
time, use stable tags only and let the lockfile record exact resolved versions.

## Follow-up Decisions

- Choose final API validation integration after the first Fastify route test.
- Define session table, recovery token table, and cookie defaults in Sprint 01.
- Decide whether template JSON uses `ajv` or Zod during Sprint 04.
- Choose charting library during Sprint 05.
- Research IA v0 runtime separately before adding any AI service to Compose.
