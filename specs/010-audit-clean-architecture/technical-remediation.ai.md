# Clean Architecture Audit — Technical Remediation (AI-oriented)

> Purpose: machine-consumable remediation spec for an AI coding agent.
> Scope: `backend/` TADOR service. Frontend out of scope.
> Reference authority: Constitution Principle VIII + `specs/foundation/stack-architecture.md`.
> Required dependency direction: `api -> application -> domain`, and `infrastructure -> application/domain contracts`.
> Golden rule: source dependencies MUST point inward. Inner layers MUST NOT import outer layers or frameworks/ORM.

## 0. Current layout (as-is)

```
backend/src/
  domain/          # entities + value objects (PURE) — OK
  application/     # use cases/services — LEAKY (imports Prisma + owns no ports)
  infrastructure/  # Prisma client, repos, services — defines the ports (WRONG owner)
  api/             # Fastify routes/middleware — FAT (queries Prisma directly)
  plantillas/      # template JSON loader
```

Legend for status: `OK` compliant · `FIX` must change · `MOVE` relocate file/symbol.

## 1. Findings (issue register)

| ID | Rule | Severity | Symptom | Evidence (file:line) |
|----|------|----------|---------|----------------------|
| CA-1 | `dep-inward-only`, `frame-orm-in-infrastructure` | CRITICAL | `application` imports the Prisma client | `application/accounting-service.ts:8`, `application/dashboard-report-service.ts:12`, `application/plantilla-account-resolver.ts:8`, `application/plantilla-validator.ts:15`, `application/account-codigo.ts:6` |
| CA-2 | `dep-interface-ownership` | CRITICAL | Repository/service ports defined in `infrastructure`, consumed by `application` | `infrastructure/repositories/user-repo.ts:8`, `infrastructure/repositories/book-repo.ts:9`, `infrastructure/services/email-service.ts:6`, `infrastructure/services/session-service.ts:15` (consumed at `application/auth-service.ts:7-10`, `application/book-service.ts:5`) |
| CA-3 | `adapt-controller-thin`, `frame-orm-in-infrastructure` | HIGH | HTTP routes call `prisma.*` directly (data access + business rules in controllers) | `api/routes/apuntes.ts` (15), `api/routes/entities.ts` (8), `api/routes/accounts.ts` (6), `api/routes/tags.ts` (6), `api/routes/chart.ts` (3), `api/routes/balances.ts`, `api/routes/periods.ts`, `api/routes/reports.ts`, `api/routes/entries.ts`, `api/routes/plantillas-admin.ts` (1 each) |
| CA-4 | `frame-orm-in-infrastructure` | HIGH | Raw SQL embedded in `application` | `application/dashboard-report-service.ts:192,232,258,326` (`prisma.$queryRaw`) |
| CA-5 | framework/detail isolation | MEDIUM | Concrete hashing lib used inside a use case | `application/auth-service.ts:6,65,102,193` (`argon2`) |
| CA-6 | `dep-data-crossing-boundaries` | MEDIUM | `@prisma/client` types used at the API boundary | `api/routes/accounts.ts:7`, `api/routes/entities.ts:6` (`import type { Prisma }`) |

Non-issues (keep as-is): domain purity (`domain/*` imports only `node:crypto` and mandated `decimal.js`); no dependency cycles (`infrastructure -> domain` only); composition root/DI already exists in `backend/src/server.ts` (`buildApp`).

## 2. Target port inventory (to create)

Create ports under `application/ports/` (owned by the client layer). Each port is an interface + input/output types built from DOMAIN types (never Prisma types).

| Port (interface) | Prisma models it hides | Replaces direct usage in |
|------------------|------------------------|--------------------------|
| `AccountRepository` | `cuentaUsuario`, `cuentaGlobal`, `activacionCuentaGlobal` | `account-codigo.ts`, `plantilla-account-resolver.ts`, `plantilla-validator.ts`, `api/routes/accounts.ts`, `api/routes/chart.ts` |
| `JournalRepository` | `asiento`, `lineaAsiento`, `periodoContable` | `accounting-service.ts`, `api/routes/entries.ts`, `api/routes/periods.ts`, `api/routes/balances.ts` |
| `BookRepository` (relocate existing) | `book`, `bookConfig` | `book-service.ts`, `accounting-service.ts`, `api/routes/reports.ts`, `api/routes/plantillas-admin.ts` |
| `EntidadRepository` | `entidad` (+ read `cuentaGlobal`) | `api/routes/entities.ts` |
| `TagRepository` | `tag` | `api/routes/tags.ts` |
| `ApunteRepository` | `apunte` (+ read book/config/accounts/period) | `api/routes/apuntes.ts` |
| `ReportReadRepository` | raw SQL for PYG/position | `dashboard-report-service.ts` |
| `PasswordHasher` | `argon2` | `auth-service.ts` |
| `UserRepository` (relocate existing) | `user` | `auth-service.ts` |
| `SessionService` / `EmailService` (relocate existing interfaces) | — | `auth-service.ts` |

Rule for method signatures: accept/return domain entities and value objects (e.g. `User`, `Book`, `Asiento`, `Money`/`Decimal`), plain DTOs, or primitives. NEVER expose `Prisma.*`, `PrismaClient`, or generated model types across the port.

## 3. Target layout (to-be)

```
backend/src/
  domain/                         # unchanged
  application/
    ports/                        # NEW: all interfaces (repositories, services, hasher)
      account-repository.ts
      journal-repository.ts
      book-repository.ts
      entidad-repository.ts
      tag-repository.ts
      apunte-repository.ts
      report-read-repository.ts
      user-repository.ts
      session-service.ts
      email-service.ts
      password-hasher.ts
    <use-case>-service.ts         # depend ONLY on ports + domain
  infrastructure/
    prisma/                       # Prisma client + mappers (domain <-> prisma)
    repositories/                 # implements application/ports/* using Prisma
    services/                     # argon2 hasher, session, email adapters
  api/
    routes/                       # THIN: parse/validate -> call app service -> map reply
    middleware/
  main / server.ts                # composition root: wire concretes into services
```

## 4. Per-issue remediation instructions

### CA-2 (do first — unblocks the rest)
1. Create `application/ports/*.ts`. Move the interfaces `UserRepository`, `BookRepository`, `SessionService`, `EmailService` out of `infrastructure/*` into `application/ports/*` (keep names).
2. In `infrastructure/repositories/*` and `infrastructure/services/*`, `import type` the port from `application/ports/*` and `implements` it (or keep factory returning the port type).
3. Update `application/auth-service.ts` and `application/book-service.ts` imports to `../ports/*`.
4. Update `backend/src/server.ts` imports if paths change. No runtime behavior change expected.

### CA-1 + CA-4 (remove Prisma from application)
For each file in CA-1:
1. Add a constructor/factory param of the relevant port(s) from section 2.
2. Replace every `prisma.<model>...` call with a port method; add the method to the port and implement it in the matching `infrastructure/repositories/*`.
3. For CA-4 raw SQL in `dashboard-report-service.ts`: move the 4 `$queryRaw` blocks into `infrastructure/repositories/report-read-repo.ts` behind `ReportReadRepository`, returning typed row DTOs; keep Decimal aggregation (Constitution IX) in the application service.
4. Delete the `import { prisma } from '../infrastructure/database.js'` lines from `application/*`.
5. Update `server.ts` to inject the new repositories into these services.

### CA-3 + CA-6 (thin the controllers)
For each route file in CA-3:
1. Move business rules and all `prisma.*` calls into an application service that depends on a port (reuse ports from section 2; e.g. `AccountRepository`, `EntidadRepository`, `TagRepository`, `ApunteRepository`, `JournalRepository`).
2. Route handler must only: authenticate (existing middleware), validate/parse request (zod or Fastify schema), call the application service, map the result to the HTTP reply, map known errors to status codes.
3. Remove `import { prisma }` and `import type { Prisma }` from `api/routes/*`. Define request/response DTOs in the route or a shared `api` types module using domain/primitive types (CA-6).
4. Register the new services in `server.ts` and pass them to `register*Routes(...)` (follow the existing pattern used for `authService`, `bookService`, `accountingService`, `dashboardReportService`).

### CA-5 (hasher behind a port)
1. Define `PasswordHasher` in `application/ports/password-hasher.ts`: `hash(plain: string): Promise<string>` and `verify(hash: string, plain: string): Promise<boolean>`.
2. Implement `Argon2PasswordHasher` in `infrastructure/services/`.
3. Inject it into `createAuthApplicationService(...)`; replace the three `argon2.*` call sites in `application/auth-service.ts`. Remove the `argon2` import from `application`.

## 5. Suggested execution order (dependency-ordered)

1. CA-2 relocate ports (mechanical move; run tests).
2. Introduce `AccountRepository` + implement; migrate `account-codigo.ts`, `plantilla-account-resolver.ts`, `plantilla-validator.ts` (CA-1 slice).
3. Introduce `JournalRepository` + `BookRepository` methods; migrate `accounting-service.ts` (CA-1 slice).
4. Introduce `ReportReadRepository`; migrate `dashboard-report-service.ts` (CA-1/CA-4).
5. Introduce `PasswordHasher`; migrate `auth-service.ts` (CA-5).
6. Thin controllers one route at a time (CA-3/CA-6): `accounts` -> `chart` -> `entities` -> `tags` -> `apuntes` -> `entries` -> `periods` -> `balances` -> `reports` -> `plantillas-admin`.

Each step is independently shippable and test-verifiable. Keep public HTTP contracts and JSON shapes unchanged.

## 6. Acceptance criteria (must all pass)

- No file under `application/` imports `infrastructure/`, `@prisma/client`, `argon2`, or `prisma`.
  - Verify: `rg -n "infrastructure/|@prisma/client|from 'argon2'|prisma\." backend/src/application` returns nothing.
- No file under `api/` imports `prisma` or `@prisma/client`.
  - Verify: `rg -n "infrastructure/database|@prisma/client" backend/src/api` returns nothing.
- All repository/service ports live in `application/ports/`; `infrastructure/*` only implements them.
- `domain/` remains free of framework/ORM imports (unchanged).
- Money math stays on `decimal.js` / Prisma `Decimal` (Constitution IX) — no `number` intermediates introduced.
- Behavior parity: `cd backend && POSTGRES_HOST=localhost npm run typecheck && npm run test:unit && npm run test:integration` all green; existing HTTP responses unchanged.

## 7. Guardrails / constraints for the implementing AI

- Do NOT change database schema, migrations, seeds, or HTTP route paths/response shapes.
- Do NOT introduce new runtime deps unless justified; prefer plain TS interfaces for ports.
- Keep identifiers, filenames, and route paths in English (Constitution VIII); comments rare + English.
- Preserve tenant isolation (`userId` scoping) exactly as today; it must remain enforced at the application boundary.
- Ship in small vertical slices (Constitution VII); run tests after each slice.
