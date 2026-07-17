# Tareas: Sprint 02 — Catálogos base

## Revisión de Carga de Trabajo

| Campo | Valor |
|-------|-------|
| Líneas estimadas cambiadas | 600–900 |
| Riesgo de presupuesto 400 líneas | Alto |
| PR encadenados recomendados | Sí |
| Estrategia de entrega | ask-always |
| Estrategia de cadena | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Unidades de trabajo sugeridas

| Unidad | Objetivo | PR | Notas |
|--------|----------|----|-------|
| 1 | Catálogo global + activación híbrida + cuentas de usuario (US1, US2) | PR 1 | Incluye seed del plan legacy normalizado |
| 2 | Entidades y tags (US3) | PR 2 | Catálogos separados, nombres duplicados permitidos |

## Fase 1: Dominio — Entidades y modelo de activación

- [ ] 1.1 Crear `backend/src/domain/cuenta-global.ts`: tipo CuentaGlobal con parentId, código, nombre, esPostable, legacyId/legacyCode
- [ ] 1.2 Crear `backend/src/domain/cuenta-usuario.ts`: tipo CuentaUsuario con globalId opcional, entidadId opcional, tipoCuenta (bank|card|wallet|bridge), userId
- [ ] 1.3 Crear `backend/src/domain/entidad.ts`: tipo Entidad con userId, nombre, tipo (person|organization|bank|issuer)
- [ ] 1.4 Crear `backend/src/domain/tag.ts`: tipo Tag con userId, nombre
- [ ] 1.5 Crear `backend/src/domain/activacion-cuenta-global.ts`: tipo Activacion con userId, globalId, activo, overrideProps

## Fase 2: Infraestructura — Esquema Prisma

- [ ] 2.1 Agregar modelo `CuentaGlobal` a `backend/prisma/schema.prisma` con campos: id, parentId (self-ref), codigo, nombre, descripcion, esPostable, legacyId, legacyCode, createdAt, updatedAt
- [ ] 2.2 Agregar modelo `CuentaUsuario` con: id, userId, globalId (opcional), entidadId (opcional), tipoCuenta (enum), nombre, codigoPersonalizado, activa, createdAt, updatedAt
- [ ] 2.3 Agregar modelo `Entidad` con: id, userId, nombre, tipo (enum), notas, createdAt, updatedAt; unique en (userId, nombre)
- [ ] 2.4 Agregar modelo `Tag` con: id, userId, nombre, createdAt; unique en (userId, nombre); sin updatedAt (inmutable en MVP)
- [ ] 2.5 Agregar modelo `ActivacionCuentaGlobal` con: id, userId, globalId, activa, nombreOverride, createdAt; unique en (userId, globalId)

## Fase 3: Semilla — Plan de cuentas global

- [ ] 3.1 Crear `backend/prisma/seed/catalogos.ts` que lea `specs/foundation/plan-de-cuentas-legacy.normalized.json` y siembre 27+ cuentas grupo globales con legacyId y legacyCode preservados
- [ ] 3.2 Verificar que el seed ejecuta idempotente (upsert por legacyId o código único)

## Fase 4: API — Rutas Fastify

- [ ] 4.1 Crear `backend/src/api/routes/chart.ts`: `GET /api/chart` lista catálogo global + activaciones del usuario; `POST /api/chart/:id/activate` activa cuenta global para el usuario
- [ ] 4.2 Crear `backend/src/api/routes/accounts.ts`: `POST /api/accounts` crea cuenta propia (bank/card/wallet/bridge) validando parent permitido y asociando entidad
- [ ] 4.3 Crear `backend/src/api/routes/entities.ts`: CRUD (`GET /api/entities`, `POST`, `PUT /api/entities/:id`, `DELETE /api/entities/:id`)
- [ ] 4.4 Crear `backend/src/api/routes/tags.ts`: CRUD (`GET /api/tags`, `POST`, `PUT /api/tags/:id`, `DELETE /api/tags/:id`)
- [ ] 4.5 Agregar validación de tenant (userId autenticado) como hook Fastify en todas las rutas nuevas

## Fase 5: Pruebas

- [ ] 5.1 Escribir test `POST /api/chart/:id/activate` activa cuenta global y `GET /api/chart` la incluye sin copiar catálogo completo (FR-009/010)
- [ ] 5.2 Escribir test creación guiada de banco/tarjeta/billetera/puente bajo rama correcta con entidad asociada (US2)
- [ ] 5.3 Escribir test CRUD entidad con unicidad por usuario y nombres duplicados entidad/tag independientes (FR-012/013)
- [ ] 5.4 Escribir test aislamiento — usuario B no ve ni modifica catálogo/entidades/tags de usuario A (tenant isolation)
- [ ] 5.5 Escribir test edge cases — cuenta bajo madre inválida, entidad duplicada, posteo contra cuenta madre rechazado

## Follow-up (deuda para Sprint 06)

Contrato en `contracts/api.md` (`GET /api/accounts`). Implementado en `backend/src/api/routes/accounts.ts` (GET + POST). Tests en `tests/catalogos-base.test.ts` (FR-014); correr con `vitest.integration.config.ts` y Postgres disponible.

- [x] F1 Escribir test de integración: `GET /api/accounts` → 200 con cuentas del usuario A; usuario B no ve las de A (FR-014, SC-007)
- [x] F2 Implementar `GET /api/accounts` en `backend/src/api/routes/accounts.ts` según `contracts/api.md` (id, codigo, nombre, tipoCuenta, entidadId, isEntityProvisioned, activa)
- [x] F3 Decisión: la proyección de listado **no** incluye saldo. El frontend obtiene saldos con `GET /api/balances/:cuentaId` (ya existe en `balances.ts`) por cuenta al armar `/accounts` / `AccountGroupList`.
