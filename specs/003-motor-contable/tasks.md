# Tareas: Sprint 03 — Motor contable

**Updated**: 2026-07-18

## Revisión de Carga de Trabajo

| Campo | Valor |
|-------|-------|
| Líneas estimadas cambiadas | 1100–1800 |
| Riesgo de presupuesto 400 líneas | Extremo |
| PR encadenados recomendados | Sí |
| Estrategia de entrega | ask-on-risk |
| Estrategia de cadena | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Extremo

### Unidades de trabajo sugeridas

| Unidad | Objetivo | PR | Notas |
|--------|----------|----|-------|
| 1 | Modelo de dominio + esquema Prisma + migración (Fase 1–2) | PR 1 | Base de tipos e infraestructura contable |
| 2 | Servicios de aplicación — asientos, periodos, balances, reportes (Fase 3) | PR 2 | Core del motor contable, aprox. 400–500 líneas |
| 3 | Rutas API + registro en servidor (Fase 4) | PR 3 | ~300–400 líneas, 11 endpoints |
| 4 | Tests de integración + cleanup en setup (Fase 5) | PR 4 | ~500–700 líneas, escenarios por User Story |

## Fase 1: Dominio — Tipos y validación pura

- [ ] 1.1 Crear `backend/src/domain/asiento.ts`: tipo `AsientoTipo` (`manual | reversa`), interfaz `Asiento` con bookId, fecha, concepto, tipo, asientoOriginalId, idempotencyKey, anulado, anuladoAt
- [ ] 1.2 Crear `backend/src/domain/linea-asiento.ts`: interfaz `LineaAsiento` con asientoId, cuentaId, debito, credito; validación `validateLinea()` (exactamente uno > 0)
- [ ] 1.3 Crear `backend/src/domain/asiento-version.ts`: interfaz `AsientoVersion` con asientoId, version, snapshot (JSON), modifiedBy
- [ ] 1.4 Crear `backend/src/domain/periodo-contable.ts`: interfaz `PeriodoContable` con bookId, año, abierto, cerradoAt, reabiertoAt
- [ ] 1.5 Crear `backend/src/domain/validaciones-contables.ts`: `validateBalance(lines)` (Σ débito = Σ crédito), `lines >= 2`, `validatePeriod(periodo)`

## Fase 2: Infraestructura — Esquema Prisma + migración

- [ ] 2.1 Agregar enum `AsientoTipo` (`manual`, `reversa`) a `backend/prisma/schema.prisma`
- [ ] 2.2 Agregar modelo `Asiento` con: id, bookId, fecha, concepto, tipo, asientoOriginalId (self-ref opcional), idempotencyKey (@unique opcional), anulado, anuladoAt, timestamps
- [ ] 2.3 Agregar modelo `LineaAsiento` con: id, asientoId, cuentaId (→ CuentaUsuario), debito (Decimal), credito (Decimal), createdAt
- [ ] 2.4 Agregar modelo `AsientoVersion` con: id, asientoId, version (Int), snapshot (JSON), modifiedBy, createdAt; unique en (asientoId, version)
- [ ] 2.5 Agregar modelo `PeriodoContable` con: id, bookId, año (Int), abierto, cerradoAt, reabiertoAt, createdAt; unique en (bookId, año)
- [ ] 2.6 Agregar relaciones: Asiento → Book, Asiento → LineaAsiento[], Asiento → AsientoVersion[], Asiento → Asiento (self-ref via asientoOriginalId), LineaAsiento → CuentaUsuario, PeriodoContable → Book
- [ ] 2.7 Ejecutar `prisma migrate dev --name motor-contable` y verificar generación del cliente

## Fase 3: Servicios de aplicación — Lógica de negocio

- [ ] 3.1 Crear `backend/src/application/entry-service.ts`: `createEntry(bookId, fecha, concepto, lineas[], idempotencyKey?)` — valida balance, postabilidad de cuentas, periodo abierto, mínimo 2 líneas, idempotencia
- [ ] 3.2 Agregar `getEntry(entryId)` — retorna asiento con líneas y versiones; `listEntries(bookId, año?, mes?)` — filtro por año/mes
- [ ] 3.3 Agregar `updateEntry(entryId, fecha?, concepto?, lineas[]?)` — guarda snapshot en AsientoVersion, valida periodo abierto, re-valida balance
- [ ] 3.4 Agregar `voidEntry(entryId, userId)` — crea asiento tipo `reversa` con líneas invertidas, marca original como anulado, valida periodo abierto y que no esté ya anulado
- [ ] 3.5 Crear `backend/src/application/periodo-service.ts`: `closePeriod(bookId, año)`, `reopenPeriod(bookId, año)` — cambia estado, registra fechas; crear periodo automático al primer asiento del año
- [ ] 3.6 Crear `backend/src/application/balance-service.ts`: `getCurrentBalance(cuentaId)` — suma líneas activas (debito - credito) excluyendo anuladas
- [ ] 3.7 Agregar `getMonthlyBalance(cuentaId, año)` — acumulado por mes desde líneas activas, excluye anuladas
- [ ] 3.8 Crear `backend/src/application/report-service.ts`: `getPyG(bookId, año)` — suma ingresos y gastos desde líneas activas, agrupado por categoría madre de CuentaGlobal
- [ ] 3.9 Agregar `getBalance(bookId, año)` — total activos, pasivos, patrimonio desde líneas activas, verifica activo = pasivo + patrimonio

## Fase 4: API — Rutas Fastify

- [ ] 4.1 Crear `backend/src/api/routes/entries.ts`: `POST /api/entries` crear (acepta `Idempotency-Key` header), `GET /api/entries` listar (query año/mes), `GET /api/entries/:id` detalle con líneas + versiones
- [ ] 4.2 Agregar `PUT /api/entries/:id` editar y `POST /api/entries/:id/void` anular a `entries.ts`
- [ ] 4.3 Crear `backend/src/api/routes/balances.ts`: `GET /api/balances/:cuentaId` saldo actual, `GET /api/balances/:cuentaId/monthly?ano=` acumulado mensual
- [ ] 4.4 Crear `backend/src/api/routes/reports.ts`: `GET /api/reports/pyg?ano=`, `GET /api/reports/balance?ano=`
- [ ] 4.5 Crear `backend/src/api/routes/periods.ts`: `POST /api/periods/:ano/close`, `POST /api/periods/:ano/reopen`
- [ ] 4.6 Registrar todas las rutas nuevas en `backend/src/server.ts` con auth middleware y tenant isolation via bookId

## Fase 5: Pruebas de integración

- [ ] 5.1 Agregar tablas de motor contable al cleanup en `backend/tests/setup.ts` (orden: AsientoVersion, LineaAsiento, Asiento, PeriodoContable)
- [ ] 5.2 Escribir test creación de asiento balanceado y rechazo de descuadrado (US1, FR-001/002/005)
- [ ] 5.3 Escribir test idempotencia — `Idempotency-Key` repetida retorna asiento existente sin duplicar (FR-006/007)
- [ ] 5.4 Escribir test línea con débito y crédito bien formados (FR-004); línea en cuenta no postable o inactiva rechazada (FR-003)
- [ ] 5.5 Escribir test asiento con una sola línea rechazado (FR-005)
- [ ] 5.6 Escribir test crear asiento en periodo cerrado rechazado (FR-017)
- [ ] 5.7 Escribir test anular asiento crea reversa exacta y marca original (US3, FR-011/012/013/014)
- [ ] 5.8 Escribir test anular asiento ya anulado rechazado (edge case)
- [ ] 5.9 Escribir test editar asiento en periodo abierto guarda versión snapshot (FR-019/020)
- [ ] 5.10 Escribir test editar asiento en periodo cerrado rechazado (FR-021)
- [ ] 5.11 Escribir test cerrar y reabrir periodo (US4, FR-015/016/017/018)
- [ ] 5.12 Escribir test saldo actual por cuenta desde líneas (US2, FR-008)
- [ ] 5.13 Escribir test acumulado mensual por cuenta (US2, FR-009)
- [ ] 5.14 Escribir test saldos excluyen asientos anulados (FR-010)
- [ ] 5.15 Escribir test PYG del ejercicio (US5, FR-022/024)
- [ ] 5.16 Escribir test Balance del ejercicio (US5, FR-023/024/025)
- [ ] 5.17 Escribir test PYG/Balance sin asientos retorna todo ceros (edge case)
- [ ] 5.18 Escribir test aislamiento — usuario B no ve asientos/saldos de usuario A (tenant isolation)

## Fase 6: Hardening transaccional (2026-07-18)

- [x] 6.1 Hacer concurrente la idempotencia de `createEntry`: recuperar el ganador tras `P2002`
- [x] 6.2 Agregar política `enforceNonNegativeBalance` a `CuentaUsuario` y `ActivacionCuentaGlobal`
- [x] 6.3 Implementar V12 con saldo natural, decimal exacto y locks advisory transaccionales por cuenta
- [x] 6.4 Aplicar V12 a creación, edición y anulación/reversa del motor
- [x] 6.5 Serializar cambios de política con la misma clave de lock usada por escritores
- [x] 6.6 Exponer endpoints tenant-safe para configurar política en cuentas de usuario y globales
- [x] 6.7 Probar sobregiro, bypass explícito, cuenta global, CxC y dos retiros concurrentes
- [x] 6.8 Documentar ADR de idempotencia/concurrencia y ADR de saldos derivados/V12
