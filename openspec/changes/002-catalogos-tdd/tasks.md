# Tasks: Sprint 02 — Catálogos base (TDD)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700–1000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Delivery strategy | single-pr (user request) |
| Chain strategy | n/a |

## TDD Mode: ACTIVE

Every implementation task MUST be preceded by its test (RED → GREEN → REFACTOR).
Domain logic first, then infrastructure, then API.

---

## Phase 1: Domain types + Unit tests (TDD) — ✅ COMPLETE

- [x] 1.1 [TEST] Escribir `tests/unit/cuenta-global.test.ts` — 5 tests (postable/non-postable, hierarchy, legacy)
- [x] 1.2 [IMPL] `backend/src/domain/cuenta-global.ts` — interfaz con parentId, codigo, nombre, esPostable
- [x] 1.3 [TEST] Escribir `tests/unit/cuenta-usuario.test.ts` — 8 tests (4 tipos, activa defaults, userId)
- [x] 1.4 [IMPL] `backend/src/domain/cuenta-usuario.ts` — interfaz con tipoCuenta, globalId/entidadId opcional
- [x] 1.5 [TEST] Escribir `tests/unit/entidad.test.ts` — 7 tests (4 tipos, estructura, unique constraint)
- [x] 1.6 [IMPL] `backend/src/domain/entidad.ts` — interfaz con userId, nombre, tipo
- [x] 1.7 [TEST] Escribir `tests/unit/tag.test.ts` — 5 tests (creación, inmutable, unique)
- [x] 1.8 [IMPL] `backend/src/domain/tag.ts` — interfaz con userId, nombre, createdAt (sin updatedAt)
- [x] 1.9 [TEST] Escribir `tests/unit/activacion.test.ts` — 7 tests (activación, overrides, defaults)
- [x] 1.10 [IMPL] `backend/src/domain/activacion-cuenta-global.ts` — interfaz con userId, globalId, activo, overrideProps

## Phase 2: Prisma schema + Repositorios — ✅ COMPLETE (existente en main)

- [x] 2.1 Modelos CuentaGlobal, CuentaUsuario, Entidad, Tag, ActivacionCuentaGlobal en schema.prisma
- [x] 2.2 Migración `prisma migrate dev --name catalogos_base` (ejecutada en desarrollo)
- [x] 2.3 Repositorios inline en routes (Prisma directo) — patrón MVP válido

## Phase 3: Seed — Plan de cuentas global — ✅ COMPLETE (existente en main)

- [x] 3.1 `backend/prisma/seed/catalogos.ts` — lee plan legacy y siembra 27+ cuentas grupo
- [x] 3.2 Seed idempotente (upsert por codigo/legacyId)

## Phase 4: API — Rutas Fastify — ✅ COMPLETE (existente en main)

- [x] 4.1 `GET /api/chart` + `POST /api/chart/:id/activate` (FR-009/010)
- [x] 4.2 `POST /api/accounts` con validación de tipos (FR-004, FR-007)
- [x] 4.3 CRUD `GET/POST/PUT/DELETE /api/entities` (FR-005, FR-012/013)
- [x] 4.4 CRUD `GET/POST/PUT/DELETE /api/tags` (FR-006, FR-012/013)
- [x] 4.5 Validación tenant (userId autenticado) en todas las rutas

## Phase 5: Tests de integración — ✅ COMPLETE (existente en main)

- [x] 5.1 US1 — Chart activation (27 cuentas, activación sin copia) — 1 test
- [x] 5.2 US2 — Crear banco/tarjeta/billetera/puente guiado — 1 test
- [x] 5.3 US3 — CRUD entidad y tag con unicidad — 3 tests
- [x] 5.4 Tenant isolation — 1 test (usuario B no ve/modifica datos de A)
- [x] 5.5 Edge cases — 3 tests (duplicado, FK inválida, 409 descriptivo)

## Resumen

| Fase | Estado | Tests |
|------|--------|-------|
| Phase 1: Unit tests domain | ✅ 32 tests pasan | Unit (vitest) |
| Phase 2: Prisma schema | ✅ Existente | — |
| Phase 3: Seed | ✅ Existente | — |
| Phase 4: API routes | ✅ 5 endpoints | — |
| Phase 5: Integration tests | ✅ 9 tests | Integration (vitest) |
