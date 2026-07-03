# Feature Specification: Sprint 03 — Motor contable

**Created**: 2026-06-22
**Updated**: 2026-07-02
**Status**: Ratified

**Input**: Asiento, línea de asiento, validación de balance, anulación, saldos acumulados, periodo anual, PYG y Balance.

**Scope**: Motor contable puro — NO incluye apuntes, plantillas, ni UI de captura (spec 004).

## Clarifications

### Session 2026-07-02

- Q: ¿Cómo se modela el lado contable de la línea? → A: Dos columnas `debito` / `credito` (Decimal), una de las dos > 0 por línea. Sin campo `lado` o `tipoDC`.
- Q: ¿Apunte vs Asiento? → A: Apunte (spec 004) es la intención del usuario. Asiento (spec 003) es el registro contable. Spec 003 no conoce apuntes.
- Q: ¿Anulación? → A: Se crea un asiento de tipo `reversa` con líneas invertidas, referenciando el original. El original se marca `anulado`.
- Q: ¿Saldos materializados? → A: Calculados en tiempo real desde líneas para MVP.
- Q: ¿Periodo se crea manual? → A: Automático al primer asiento del año.

### Session 2026-06-22

- Q: ¿Cómo se corrigen asientos en el MVP? → A: En periodo abierto se permite editar con historial/auditoría; en periodo cerrado solo tras reapertura.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guardar asiento balanceado (Priority: P1)

Como usuario, quiero que todo registro económico se guarde correctamente para confiar en mis saldos y reportes.

**Why this priority**: Es la base de todo apunte, traspaso, puente y PYG.

**Independent Test**: Intentar guardar un asiento balanceado y uno descuadrado; solo el balanceado se guarda.

**Acceptance Scenarios**:

1. **Given** líneas con débitos y créditos iguales, **When** guardo el asiento, **Then** queda registrado.
2. **Given** líneas descuadradas, **When** intento guardar, **Then** el sistema lo rechaza.
3. **Given** un asiento con idempotencyKey repetida, **When** intento guardar de nuevo, **Then** devuelve el asiento existente sin duplicar.

---

### User Story 2 - Consultar saldos acumulados (Priority: P1)

Como usuario, quiero ver el saldo actual de mis cuentas y su acumulado mensual/anual para saber dónde está mi dinero o deuda.

**Why this priority**: El MVP necesita saldos antes de plantillas y dashboard.

**Independent Test**: Crear asientos de prueba y verificar que los saldos por cuenta coinciden con sus líneas.

**Acceptance Scenarios**:

1. **Given** una cuenta con líneas en varios meses, **When** consulto su saldo actual, **Then** refleja el efecto acumulado total.
2. **Given** una cuenta con líneas en enero y febrero, **When** consulto el acumulado mensual, **Then** veo el saldo separado por mes.

---

### User Story 3 - Anular asiento (Priority: P1)

Como usuario, quiero anular un asiento incorrecto sin perder la pista de auditoría.

**Why this priority**: La anulación es necesaria antes de que lleguen plantillas y apuntes.

**Independent Test**: Crear un asiento, anularlo, verificar que el saldo neto es cero y que el original queda marcado.

**Acceptance Scenarios**:

1. **Given** un asiento existente en periodo abierto, **When** lo anulo, **Then** se crea un asiento de reversa y el original se marca anulado.
2. **Given** un asiento anulado, **When** consulto saldos, **Then** el efecto neto del par (original + reversa) es cero.

---

### User Story 4 - Cierre y reapertura anual (Priority: P2)

Como usuario, quiero cerrar un ejercicio anual y reabrirlo si necesito corregir.

**Why this priority**: Protege historial sin bloquear correcciones conscientes.

**Independent Test**: Cerrar un año, intentar modificarlo, reabrirlo y volver a modificar.

**Acceptance Scenarios**:

1. **Given** un año cerrado, **When** intento modificar un asiento de ese año, **Then** el sistema lo impide.
2. **Given** un año reabierto, **When** modifico un asiento permitido, **Then** el sistema acepta la corrección.
3. **Given** un año abierto, **When** edito un asiento, **Then** el sistema conserva historial/auditoría de la corrección.

---

### User Story 5 - Ver PYG y Balance (Priority: P2)

Como usuario, quiero ver mis ingresos y gastos del ejercicio (PYG) y el estado de mis activos, pasivos y patrimonio (Balance).

**Why this priority**: Dashboard financiero mínimo antes del frontend.

**Independent Test**: Crear asientos de ingreso, gasto, activo y pasivo; verificar que PYG y Balance reflejan los valores correctos.

**Acceptance Scenarios**:

1. **Given** asientos con cuentas de ingreso y gasto, **When** consulto PYG del ejercicio, **Then** veo total de ingresos, gastos y neto.
2. **Given** asientos con cuentas de activo, pasivo y patrimonio, **When** consulto Balance, **Then** veo activos = pasivos + patrimonio.

### Edge Cases

- Asiento con una sola línea (rechazado).
- Cuentas inexistentes, inactivas o no postables.
- Asiento en periodo cerrado (rechazado).
- Modificación que descuadra un asiento existente (rechazado).
- Anulación de un asiento ya anulado.
- IdempotencyKey repetida (retorna existente, no duplica).
- PYG sin asientos en el ejercicio (todo ceros).
- Balance sin asientos (todo ceros).

## Requirements *(mandatory)*

### Functional Requirements

#### Asientos y líneas
- **FR-001**: El sistema MUST registrar Asientos con cabecera (fecha, concepto, tipo) y líneas.
- **FR-002**: TODO asiento MUST quedar balanceado antes de persistirse (Σ débitos = Σ créditos).
- **FR-003**: Toda línea MUST referenciar una cuenta postable (esPostable = true) del libro del usuario.
- **FR-004**: Cada línea MUST tener un valor en `debito` o `credito` (> 0), el otro en 0. Nunca ambos > 0.
- **FR-005**: El sistema MUST rechazar asientos con una sola línea.

#### Idempotencia
- **FR-006**: El endpoint de creación MUST aceptar `Idempotency-Key` opcional en header.
- **FR-007**: Si se recibe una `Idempotency-Key` ya usada, MUST devolver el asiento existente sin duplicar.

#### Saldos acumulados
- **FR-008**: El sistema MUST calcular saldo actual por cuenta desde la suma de líneas (debito − credito).
- **FR-009**: El sistema MUST calcular acumulado mensual y anual por cuenta.
- **FR-010**: Los saldos MUST excluir asientos anulados del cómputo.

#### Anulación
- **FR-011**: El sistema MUST permitir anular un asiento en periodo abierto.
- **FR-012**: Al anular, el sistema MUST crear un asiento de tipo `reversa` con las líneas invertidas.
- **FR-013**: Al anular, el sistema MUST marcar el asiento original como `anulado = true`.
- **FR-014**: El asiento de reversa MUST referenciar al original via `asientoOriginalId`.

#### Periodo contable
- **FR-015**: El sistema MUST crear un PeriodoContable automáticamente al primer asiento de un año.
- **FR-016**: El sistema MUST permitir cierre anual explícito.
- **FR-017**: El sistema MUST impedir crear/modificar asientos en periodos cerrados.
- **FR-018**: El sistema MUST permitir reapertura anual explícita. Al reabrir, MUST permitir modificaciones.

#### Edición y trazabilidad
- **FR-019**: En periodo abierto, el sistema MUST permitir editar asientos (cabecera y líneas).
- **FR-020**: Toda edición MUST guardar la versión anterior en `AsientoVersion` antes de aplicar el cambio.
- **FR-021**: En periodo cerrado, el sistema MUST rechazar ediciones incluso con reapertura (solo después de reabrir).

#### Reportes
- **FR-022**: El sistema MUST exponer PYG del ejercicio: suma de ingresos, suma de gastos, neto, agrupado por categoría (cuenta madre).
- **FR-023**: El sistema MUST exponer Balance del ejercicio: total activos, total pasivos, total patrimonio.
- **FR-024**: PYG y Balance MUST calcularse desde líneas de asiento activas (no anuladas).
- **FR-025**: PYG y Balance MUST soportar filtro por año.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: Todos los Asientos y líneas pertenecen al libro del usuario autenticado.
- **Accounting Impact**: Es el sprint central de partida doble, balance, PYG y anulación.
- **MVP/Sprint Boundary**: NO incluye apuntes, plantillas, ni UI de captura. Solo motor contable vía API.
- **Testing Obligation**: Debe probar balance, rechazo de descuadres, postabilidad, anulación, saldos mensuales/anuales, cierre, reapertura, PYG y Balance.

### Key Entities *(include if feature involves data)*

- **Asiento**: Cabecera del hecho económico. Tipos: `manual`, `reversa`.
- **Línea de asiento**: Afectación de una cuenta con `debito` o `credito` (> 0).
- **AsientoVersion**: Instantánea de un asiento antes de cada edición.
- **PeriodoContable**: Ejercicio anual que puede cerrarse o reabrirse.
- **Saldo acumulado**: Calculado desde líneas (no materializado en MVP).
- **PYG / Balance**: Vistas calculadas desde líneas.

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/entries` | Crear asiento (valida balance, postabilidad, periodo) |
| GET | `/api/entries` | Listar asientos (filtro por año, mes) |
| GET | `/api/entries/:id` | Ver asiento con líneas y versiones |
| PUT | `/api/entries/:id` | Editar asiento (solo periodo abierto, guarda versión) |
| POST | `/api/entries/:id/void` | Anular asiento (crea reversa) |
| GET | `/api/balances/:cuentaId` | Saldo actual de una cuenta |
| GET | `/api/balances/:cuentaId/monthly?ano=` | Acumulado mensual |
| GET | `/api/reports/pyg?ano=` | PYG del ejercicio |
| GET | `/api/reports/balance?ano=` | Balance del ejercicio |
| POST | `/api/periods/:ano/close` | Cerrar ejercicio |
| POST | `/api/periods/:ano/reopen` | Reabrir ejercicio |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 asientos descuadrados pueden guardarse.
- **SC-002**: Los saldos por cuenta coinciden con la suma de líneas en 100 % de casos de prueba.
- **SC-003**: Una anulación crea un reverso exacto y el neto del par es cero.
- **SC-004**: Un periodo cerrado bloquea modificaciones no autorizadas.
- **SC-005**: 100 % de ediciones en periodo abierto dejan evidencia de auditoría.
- **SC-006**: PYG y Balance calculados desde líneas coinciden con los totales esperados en 100 % de casos.
- **SC-007**: IdempotencyKey repetida no crea asientos duplicados.

## Assumptions

- Los saldos se calculan en tiempo real (no materializados) para MVP.
- El periodo se crea automáticamente al primer asiento del año.
- Las plantillas (spec 004) usarán este motor para generar asientos.
- Modo Hogar y PRO comparten el mismo motor contable. La diferencia es solo de UI.
