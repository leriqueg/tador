# Remediation execution report — Clean Architecture backend

Date: 2026-07-18  
Base SHA: `cca23d06577ae5a989db7edc27efb25930a0d9af`  
Branch: `audit/clean_architecure`  
Plan: `specs/010-audit-clean-architecture/2026-07-18/remediation-plan.md`

## Preexisting (not ours)

- Spec docs moved into `specs/010-audit-clean-architecture/2026-07-18/` (authorized plan tree).
- No commits made (user forbade commits/push).

## Extension hooks

- `before_implement` / `after_implement` optional `speckit.git.commit`: **skipped** (no-commit authorization).

## Baseline (outside sandbox)

| Command | Exit | Result |
|---------|------|--------|
| `npm run typecheck` | 0 | Pass |
| `npm run test:unit` | 0 | 87 tests (then 95 after new tests) |
| `POSTGRES_HOST=localhost npm run test:integration` | 0 | 111 tests |

Note: Tinypool `RangeError` from the plan reproduced **only inside the Cursor sandbox**; outside sandbox both suites were green. Not attributed to remediation.

## Units completed

| ID | Status | Notes |
|----|--------|-------|
| BASE-00 | Done | `tests/unit/architecture-boundaries.test.ts`; allowlists emptied |
| PORT-01 | Done | Ports under `application/ports/` |
| AUTH-02 | Done | `PasswordHasher` + Argon2 adapter |
| ACCT-03 | Done | `AccountRepository`; helpers Prisma-free |
| REPORT-04 | Done | `DashboardReadRepository` |
| ANALYSIS-05 | Done | `FinancialAnalysisReadRepository` |
| REPORT-06 | Done | Reports use `BookApplicationService` |
| JOURNAL-07a/b | Done | `JournalStore` / `JournalTransaction`; locks in infra |
| ENTRY-08/09 | Done | Via journal store |
| LEDGER-10 | Done | Periods/balances/reports via store |
| ROUTE-11 | Done | entries/periods/balances book resolution |
| CHART-12 | Done | `chart-service` |
| ACCOUNT-13 | Done | `account-service` |
| TAG-14 | Done | `tag-service` |
| ENTITY-15a/b | Done | `entity-service` + `EntidadRepository` |
| APUNTE-16–18 | Done | `apunte-service` + `ApunteRepository` |
| PLANTILLA-19 | Done | Admin/preview book via `BookApplicationService` |
| FINAL-20 | Done | Empty allowlists; composition root in `server.ts` |

## Final verification

| Command | Exit | Result |
|---------|------|--------|
| `rg` application forbids | 0 | No matches |
| `rg` api prisma/database | 0 | No matches |
| `rg` Prisma types in app/api | 0 | No matches |
| `npm run typecheck` | 0 | Pass |
| `npm run test:unit` | 0 | **95** passed |
| `POSTGRES_HOST=localhost npm run test:integration` | 0 | **111** passed |
| Architecture unit guard | 0 | 3/3; allowlists empty |
| `git diff --check` | 0 | Clean |

## Residual risks / decisions

1. **APUNTE-18 non-atomic PATCH** (preexisting behavior preserved): `updateEntry` then apunte row update are separate transactions. Documented in `apunte-service.ts`. Fixing atomicity needs an explicit product decision.
2. Domain `LineaAsiento` still uses `number` at the domain boundary after quantization (preexisting); intermediate money math uses `decimal.js`.
3. Plantilla routes receive `AccountRepository` from the composition root (no Prisma in API).

## Areas touched

- `backend/src/application/` (+ `ports/`, new services; deleted `transaction-locks.ts`)
- `backend/src/infrastructure/repositories/` and `services/argon2-password-hasher.ts`
- `backend/src/api/routes/*` (thin adapters)
- `backend/src/server.ts` (composition root)
- Unit tests: architecture guard, auth fakes, filter DTO updates
