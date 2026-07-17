# Stack architecture and library decisions

This document records the initial technical architecture for TADOR. It is a
foundation artifact: exact package installation must still be confirmed during
each sprint and locked through the package manager lockfile.

Formal decision record: [ADR 0001 - Stack architecture and library baseline](../../docs/adr/0001-stack-architecture-and-library-baseline.md).

## Architecture direction

TADOR will be built as a web application with separated backend and frontend
roots:

```text
backend/
  src/
    domain/
    application/
    infrastructure/
    api/
  tests/

frontend/
  src/
    components/
    pages/
    services/
    state/
  tests/
```

The dependency direction is:

```text
API / UI -> Application -> Domain
Infrastructure -> Application / Domain contracts
```

Controllers and routes must stay thin. Accounting rules, tenant isolation,
idempotency decisions, and template execution rules belong in application and
domain code, not in HTTP handlers or React components.

## Runtime baseline

| Area | Initial decision | Reason |
| --- | --- | --- |
| Node.js | Node.js 24 LTS line | Active LTS as of 2026-06-22; avoid Node 26 until it reaches LTS. |
| PostgreSQL | PostgreSQL 18 line for local development | Current supported stable major as of 2026-06-22. |
| Package manager | npm, unless Sprint 01 research selects another tool | Simple default; lock exact resolved versions with `package-lock.json`. |
| Language | TypeScript | Shared backend/frontend language and stronger contracts. |
| Module format | ESM | Aligns with modern Node.js and Vite ecosystem. |

## Backend stack

| Concern | Candidate library/framework | Candidate version observed | Decision status |
| --- | --- | ---: | --- |
| HTTP server | `fastify` | 5.8.5 | Adopt for backend API. |
| CORS | `@fastify/cors` | 11.2.0 | Adopt when browser API access begins. |
| Security headers | `@fastify/helmet` | 13.0.2 | Adopt for HTTP hardening. |
| Rate limiting | `@fastify/rate-limit` | 11.0.0 | Adopt for auth and recovery endpoints. |
| API docs | `@fastify/swagger`, `@fastify/swagger-ui` | 9.7.0 / 6.0.0 | Use for development contract visibility once routes exist. |
| Persistence | `prisma`, `@prisma/client` | 7.8.0 | Adopt with PostgreSQL migrations. |
| Validation | `zod` or Fastify JSON Schema | 4.4.3 / built-in | Research before Sprint 01 implementation. Prefer one source of truth. |
| Password hashing | `argon2` | 0.44.0 | Adopt unless research finds a stronger operational reason. |
| Logging | Fastify/Pino | Pino included by Fastify; `pino` 10.3.1 available | Use structured logs with redaction. |
| Tokens/IDs | Node `crypto`, `nanoid` when readable external IDs are needed | `nanoid` 5.1.15 | Prefer `crypto` for security tokens; use `nanoid` only for non-secret IDs. |
| Tests | `vitest` | 4.1.9 | Candidate for backend TDD and fast TypeScript tests. |
| TypeScript tooling | `typescript`, `tsx` | 6.0.3 / 4.22.4 | Candidate for typecheck and local dev execution. |
| Lint/format | `eslint`, `prettier` | 10.5.0 / 3.8.4 | Adopt once project skeleton exists. |

Fastify already provides JSON Schema request validation and uses Pino for
logging. Prisma's current setup should use `prisma.config.ts` with schema,
migrations path, and `DATABASE_URL` loaded from the environment.

## Frontend stack

Frontend implementation starts in later sprints, but the architecture target is:

| Concern | Candidate library/framework | Decision status |
| --- | --- | --- |
| Build tool | Vite | Adopt. |
| UI | React + Mantine | Adopt for mobile-first Hogar and desktop PRO views. |
| Server state | TanStack Query / React Query | Adopt when API exists. |
| UI state | Zustand | Adopt for mode, navigation, and local UI preferences. |
| Forms | Mantine form first | Use unless requirements exceed it. |
| Charts | Pending research | Needed for PYG dashboard sprint. |

Frontend user-facing text may be Spanish. Code identifiers, file names, route
paths, and comments must remain English.

## Accounting and data libraries

| Concern | Candidate | Decision status |
| --- | --- | --- |
| Money/decimal arithmetic | `decimal.js` | **Required** for all monetary calculation in application/domain code. Persist with PostgreSQL `NUMERIC` / Prisma `Decimal`. Quantize to ISO 4217 minor units (MVP: USD = 2). |
| Template JSON validation | `ajv` 8.20.0 or `zod` | Decide during template sprint; avoid duplicate schema systems if possible. |
| Date/month grouping | Native `Temporal` only if runtime support is stable; otherwise a small utility library | Defer to PYG sprint. |

Exact monetary arithmetic policy: see Constitution principle IX. IEEE 754 binary
floating-point (`number`) MUST NOT be used for intermediate money math; API
responses MAY expose `number` only after Decimal quantization.

## Docker development strategy

Docker Compose grows by phase. We only add services when the repository has the
corresponding implemented code or the service is required infrastructure for
implemented code.

| Phase | Compose services | Notes |
| --- | --- | --- |
| 0 - Current foundation | `postgres` | Database infrastructure only. No app container until `backend/` exists. |
| 1 - Backend skeleton | `backend`, `postgres` | Backend container runs local dev command with hot reload and Node inspector. |
| 2 - Backend tests | `backend`, `postgres`, `postgres_test` | Test database can be added when integration tests exist. |
| 3 - Frontend skeleton | `frontend`, `backend`, `postgres` | Vite dev server with bind mount and hot reload. |
| 4 - IA v0 | `ai` or external local runtime | Add only when the IA sprint starts and a runtime has been selected. |

Developer images must be optimized for local feedback:

- bind mount source code into containers;
- keep dependencies inside container volumes instead of host `node_modules`;
- expose backend HTTP and Node inspector ports;
- run backend with a watch command such as `tsx watch` or equivalent;
- run frontend with Vite dev server and HMR;
- keep production Dockerfiles separate from local development images when that
  concern appears.

## Dependency policy

Before installing a package:

- verify the current stable release and avoid alpha, beta, release-candidate,
  canary, next, dev, integration, or early-access tags;
- prefer mature framework features and reputable open-source libraries for
  authentication, hashing, validation, migrations, logging, and security;
- document alternatives when the decision is security-sensitive or architectural;
- commit the generated lockfile;
- run `npm audit` or the selected package manager equivalent after installation.

The versions above were observed from npm metadata on 2026-06-22. They are not a
substitute for the lockfile that will be generated during implementation.
