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

## Phase 1: Domain types + Unit tests (TDD)

- [ ] 1.1 [TEST] Escribir `tests/unit/cuenta-global.test.ts`: crear CuentaGlobal madre y postable, verificar esPostable distingue hijos permitidos
- [ ] 1.2 [IMPL] Crear `backend/src/domain/cuenta-global.ts`: interfaz CuentaGlobal con parentId, codigo, nombre, esPostable, legacyId/legacyCode
- [ ] 1.3 [TEST] Escribir `tests/unit/cuenta-usuario.test.ts`: crear cuenta con tipo bank/card/wallet/bridge, validar activa por defecto
- [ ] 1.4 [IMPL] Crear `backend/src/domain/cuenta-usuario.ts`: interfaz CuentaUsuario con globalId opcional, entidadId opcional, tipoCuenta, userId
- [ ] 1.5 [TEST] Escribir `tests/unit/entidad.test.ts`: crear Entidad con tipo person/org/bank/issuer, validar unique por (userId, nombre)
- [ ] 1.6 [IMPL] Crear `backend/src/domain/entidad.ts`: interfaz Entidad con userId, nombre, tipo (person|organization|bank|issuer)
- [ ] 1.7 [TEST] Escribir `tests/unit/tag.test.ts`: crear Tag simple, validar unique por (userId, nombre), sin updatedAt
- [ ] 1.8 [IMPL] Crear `backend/src/domain/tag.ts`: interfaz Tag con userId, nombre, createdAt
- [ ] 1.9 [TEST] Escribir `tests/unit/activacion.test.ts`: activar cuenta global para usuario, validar unique (userId, globalId), overrideProps
- [ ] 1.10 [IMPL] Crear `backend/src/domain/activacion-cuenta-global.ts`: interfaz Activacion con userId, globalId, activo, overrideProps

## Phase 2: Prisma schema + Repositorios

- [ ] 2.1 Agregar modelos CuentaGlobal, CuentaUsuario, Entidad, Tag, ActivacionCuentaGlobal a `backend/prisma/schema.prisma`
- [ ] 2.2 Ejecutar `prisma migrate dev --name catalogos_base`
- [ ] 2.3 Crear `backend/src/infrastructure/repositories/cuenta-global.repo.ts`: listar jerarquía, findById
- [ ] 2.4 Crear `backend/src/infrastructure/repositories/cuenta-usuario.repo.ts`: CRUD, listar por userId, activar global
- [ ] 2.5 Crear `backend/src/infrastructure/repositories/entidad.repo.ts`: CRUD con unique (userId, nombre)
- [ ] 2.6 Crear `backend/src/infrastructure/repositories/tag.repo.ts`: CRUD con unique (userId, nombre)

## Phase 3: Seed — Plan de cuentas global

- [ ] 3.1 Crear `backend/prisma/seed/catalogos.ts`: leer plan-de-cuentas-legacy.normalized.json y sembrar 27+ cuentas grupo globales
- [ ] 3.2 Verificar seed idempotente (upsert por legacyId)

## Phase 4: API — Rutas Fastify

- [ ] 4.1 [TEST + IMPL] `GET /api/chart` lista catálogo global; `POST /api/chart/:id/activate` activa cuenta global (FR-009/010)
- [ ] 4.2 [TEST + IMPL] `POST /api/accounts` crea cuenta propia (bank/card/wallet/bridge) con validación (FR-004, FR-007)
- [ ] 4.3 [TEST + IMPL] CRUD `GET/POST/PUT/DELETE /api/entities` (FR-005, FR-012/013)
- [ ] 4.4 [TEST + IMPL] CRUD `GET/POST/PUT/DELETE /api/tags` (FR-006, FR-012/013)
- [ ] 4.5 Agregar validación tenant (userId autenticado) en todas las rutas

## Phase 5: Tests de integración

- [ ] 5.1 US1 — Nuevo usuario consulta catálogo global + activa cuenta sin copiar (SC-005)
- [ ] 5.2 US2 — Crear banco/tarjeta/billetera/puente guiado (SC-001, SC-002)
- [ ] 5.3 US3 — CRUD entidad y tag con unicidad por usuario, nombres duplicados separados (SC-004, SC-006)
- [ ] 5.4 Edge cases: cuenta bajo madre inválida, entidad duplicada, posteo contra cuenta madre, tenant isolation
