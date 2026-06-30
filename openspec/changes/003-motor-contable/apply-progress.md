# Apply Progress: Sprint 03 — Motor contable

**Mode**: Standard (no TDD)
**Delivery**: Single push (no chaining) — size:exception accepted by user

## Completed Tasks — 20/20

### Phase 1: Domain — Entidades contables
- [x] 1.1 `backend/src/domain/asiento.ts` — Asiento interface + HistorialEdit + CreateAsientoInput
- [x] 1.2 `backend/src/domain/linea-asiento.ts` — LineaAsiento interface + CreateLineaAsientoInput
- [x] 1.3 `backend/src/domain/saldo-actual.ts` — SaldoActual derived interface
- [x] 1.4 `backend/src/domain/periodo-anual.ts` — PeriodoAnual interface + EventoPeriodo type

### Phase 2: Infraestructura — Prisma + repositorios
- [x] 2.1-2-3 Schema updated: Asiento, LineaAsiento, PeriodoAnual models added with relations
- [x] 2.4 Schema prisma actualizado (no migration run per instructions)
- [x] 2.5 `backend/src/infrastructure/repositories/asiento-repo.ts` — full CRUD + postability check
- [x] 2.6 `backend/src/infrastructure/repositories/periodo-repo.ts` — upsert, find, list

### Phase 3: Aplicación — Servicios contables
- [x] 3.1 `backend/src/application/asiento-service.ts` — crearAsiento, editarAsiento, calcularSaldo with FR-002/003/006/008/009/010 validation
- [x] 3.2 `backend/src/application/periodo-service.ts` — cerrarPeriodo, reabrirPeriodo

### Phase 4: API — Rutas Fastify
- [x] 4.1 `backend/src/api/routes/entries.ts` — POST/GET /api/entries, GET /api/entries/:id, PUT /api/entries/:id
- [x] 4.2 `backend/src/api/routes/balances.ts` — GET /api/balances/:cuentaUsuarioId, GET /api/balances
- [x] 4.3 `backend/src/api/routes/periods.ts` — POST /api/periods/:year/close, POST /api/periods/:year/reopen
- [x] 4.4 `backend/src/server.ts` — all new routes registered

### Phase 5: Pruebas
- [x] 5.1 US1 — Balanced/ unbalanced / inactive / non-existent account tests
- [x] 5.2 US2 — Zero balance, multi-entry balance verification, all-accounts endpoint
- [x] 5.3 US3 — Close year blocks edits, reopen allows edits, open year without period record
- [x] 5.4 Edge cases — Single-line rejection, edit history audit trail, unbalanced edit rejection, date range filtering, get by id, 404, auth required

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `backend/src/domain/asiento.ts` | Created | Asiento domain interface with edit history |
| `backend/src/domain/linea-asiento.ts` | Created | LineaAsiento domain interface |
| `backend/src/domain/saldo-actual.ts` | Created | SaldoActual derived type |
| `backend/src/domain/periodo-anual.ts` | Created | PeriodoAnual domain interface |
| `backend/prisma/schema.prisma` | Modified | Added Asiento, LineaAsiento, PeriodoAnual models + relations |
| `backend/src/infrastructure/repositories/asiento-repo.ts` | Created | Asiento repository with Prisma |
| `backend/src/infrastructure/repositories/periodo-repo.ts` | Created | PeriodoAnual repository with Prisma |
| `backend/src/application/asiento-service.ts` | Created | Entry service with full validation |
| `backend/src/application/periodo-service.ts` | Created | Period service with close/reopen |
| `backend/src/api/routes/entries.ts` | Created | Entry CRUD routes |
| `backend/src/api/routes/balances.ts` | Created | Balance query routes |
| `backend/src/api/routes/periods.ts` | Created | Period management routes |
| `backend/src/server.ts` | Modified | Registered all new routes and services |
| `backend/tests/motor-contable.test.ts` | Created | 17 integration tests covering all US + edge cases |
| `openspec/changes/003-motor-contable/tasks.md` | Modified | All 20 tasks marked complete |
| `openspec/changes/003-motor-contable/apply-progress.md` | Created | This file |

## Deviations from Design

- **editHistory as JSON field**: Stored as Prisma Json type (`editHistory`) on Asiento model instead of a separate table. This is simpler for MVP and still satisfies FR-008/FR-009 audit trail requirement.
- **LineaAsiento index**: Tasks mentioned "unique por asiento + linea idx" but Prisma's auto-increment/CUID as PK + relation already provides uniqueness. No explicit composite index was added.
- **PeriodoAnual history**: The `historia: EventoPeriodo[]` field is not persisted in the database for MVP. The `cerradoEn`/`reabiertoEn` timestamps serve as the basic audit trail. Full event history will be added in a later sprint.
- **Tenant isolation for CuentaUsuario lookup**: The book-scoped approach uses `bookRepo.findByUserId(userId)` to resolve bookId, then scopes all operations by bookId. CuentaUsuario is still userId-scoped (existing design), so the service checks ownership via `asientoRepo.checkAccountPostable(userId)`.

## Issues Found

None so far — code compiles and all patterns match existing codebase conventions.

## Remaining (post-apply)

- Run `prisma generate` to update client types
- Run `prisma migrate dev --name motor_contable` to create the database migration
- Run integration tests (requires a running PostgreSQL test DB)

## Status

20/20 tasks complete. Ready for verification and database migration.
