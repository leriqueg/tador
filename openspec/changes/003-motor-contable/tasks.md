# Tasks: Sprint 03 — Motor contable

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 900–1300 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain types + Prisma schema + migration | PR 1 | Foundation all later PRs depend on |
| 2 | Application service: entry CRUD + balance validation + entry repo + API routes + US1 tests | PR 2 | Core: guardar asiento balanceado |
| 3 | Balance query (SaldoActual) + API + US2 tests | PR 3 | Requires PR 2 (entries exist) |
| 4 | Period management (cierre/reapertura) + repo + API + US3 tests | PR 4 | Requires PR 2 (entries to protect) |

## Phase 1: Domain — Entidades contables

- [x] 1.1 Crear `backend/src/domain/asiento.ts`: interfaz Asiento (id, bookId, fecha, descripcion, createdAt, updatedAt)
- [x] 1.2 Crear `backend/src/domain/linea-asiento.ts`: interfaz LineaAsiento (id, asientoId, cuentaUsuarioId, debe number, haber number)
- [x] 1.3 Crear `backend/src/domain/saldo-actual.ts`: interfaz SaldoActual (cuentaUsuarioId, totalDebe, totalHaber, saldo number)
- [x] 1.4 Crear `backend/src/domain/periodo-anual.ts`: interfaz PeriodoAnual (id, bookId, año, cerrado boolean, cerradoEn?, reabiertoEn?, historia EventoPeriodo[])

## Phase 2: Infraestructura — Prisma + repositorios

- [x] 2.1 Agregar modelo `Asiento` a schema.prisma: id, bookId, fecha, descripcion, createdAt, updatedAt; book relation
- [x] 2.2 Agregar modelo `LineaAsiento`: id, asientoId, cuentaUsuarioId, debe Decimal, haber Decimal; relation a Asiento y CuentaUsuario
- [x] 2.3 Agregar modelo `PeriodoAnual`: id, bookId, año Int, cerrado Boolean, cerradoEn DateTime?, reabiertoEn DateTime?; unique (bookId, año)
- [x] 2.4 Schema Prisma actualizado — migración pendiente (no ejecutar en este sprint)
- [x] 2.5 Crear `backend/src/infrastructure/repositories/asiento-repo.ts`: insertar asiento con líneas, listar por bookId + rango fechas, obtener por id, verificar postabilidad de cuenta
- [x] 2.6 Crear `backend/src/infrastructure/repositories/periodo-repo.ts`: upsert periodo, find por bookId + año, listar por bookId

## Phase 3: Aplicación — Servicios contables

- [x] 3.1 Crear `backend/src/application/asiento-service.ts`: función `crearAsiento()` valida FR-002 (balance), FR-003 (cuenta postable + activa), FR-006 (periodo abierto); función `editarAsiento()` con historial FR-008/009; función `calcularSaldo()` FR-004
- [x] 3.2 Crear `backend/src/application/periodo-service.ts`: función `cerrarPeriodo()` FR-005 marca cerrado; `reabrirPeriodo()` FR-007 explícito marca reabierto

## Phase 4: API — Rutas Fastify

- [x] 4.1 Crear `backend/src/api/routes/entries.ts`: `POST /api/entries` (FR-001/002), `GET /api/entries` (listar), `GET /api/entries/:id`, `PUT /api/entries/:id` (FR-009/010)
- [x] 4.2 Crear `backend/src/api/routes/balances.ts`: `GET /api/balances/:cuentaUsuarioId` (FR-004), `GET /api/balances` (todas las cuentas del libro)
- [x] 4.3 Crear `backend/src/api/routes/periods.ts`: `POST /api/periods/:year/close` (FR-005), `POST /api/periods/:year/reopen` (FR-007)
- [x] 4.4 Registrar rutas nuevas en `backend/src/server.ts` con prefijo `/api` y tenant hook

## Phase 5: Pruebas

- [x] 5.1 US1 — Crear asiento balanceado ok, rechazar descuadrado, rechazar cuenta inactiva/no postable (SC-001)
- [x] 5.2 US2 — Crear asientos de prueba, consultar saldo por cuenta y verificar suma coincide con líneas (SC-002)
- [x] 5.3 US3 — Cerrar año, intentar modificar asiento → rechazado; reabrir → modificación permitida (SC-003/004)
- [x] 5.4 Edge cases — Asiento una sola línea, edición en periodo abierto deja auditoría, modificación que descuadra asiento existente
