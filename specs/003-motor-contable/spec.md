# Feature Specification: Sprint 03 - Motor contable

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Sprint 03: Asiento, línea de asiento, validación de balance, saldos actuales, periodo anual abierto/cerrado y reapertura básica.

## Clarifications

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

---

### User Story 2 - Consultar saldos actuales (Priority: P1)

Como usuario, quiero ver el saldo actual de mis cuentas para saber dónde está mi dinero o deuda.

**Why this priority**: El MVP necesita saldos antes de plantillas y dashboard.

**Independent Test**: Crear asientos de prueba y verificar que los saldos por cuenta coinciden con sus líneas.

**Acceptance Scenarios**:

1. **Given** una cuenta con líneas registradas, **When** consulto su saldo, **Then** el saldo refleja el efecto acumulado.

---

### User Story 3 - Cierre y reapertura anual (Priority: P2)

Como usuario, quiero cerrar un ejercicio anual y reabrirlo si necesito corregir.

**Why this priority**: Protege historial sin bloquear correcciones conscientes.

**Independent Test**: Cerrar un año, intentar modificarlo, reabrirlo y volver a modificar.

**Acceptance Scenarios**:

1. **Given** un año cerrado, **When** intento modificar un asiento de ese año, **Then** el sistema lo impide.
2. **Given** un año reabierto, **When** modifico un asiento permitido, **Then** el sistema acepta la corrección.
3. **Given** un año abierto, **When** edito un asiento, **Then** el sistema conserva historial/auditoría de la corrección.

### Edge Cases

- Asiento con una sola línea.
- Cuentas inexistentes, inactivas o no postables.
- Asiento en periodo cerrado.
- Modificación que descuadra un asiento existente.
- Edición en periodo abierto sin historial/auditoría.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST registrar Asientos con cabecera y líneas.
- **FR-002**: Todo Asiento MUST quedar balanceado antes de persistirse.
- **FR-003**: Toda línea MUST referenciar una cuenta postable del usuario.
- **FR-004**: El sistema MUST calcular saldo actual por cuenta desde líneas.
- **FR-005**: El sistema MUST permitir cierre anual.
- **FR-006**: El sistema MUST impedir modificación silenciosa en periodos cerrados.
- **FR-007**: El sistema MUST permitir reapertura anual explícita.
- **FR-008**: Las correcciones MUST mantener trazabilidad suficiente para auditoría futura.
- **FR-009**: En periodo abierto, el sistema MUST permitir edición controlada con historial/auditoría.
- **FR-010**: En periodo cerrado, el sistema MUST permitir correcciones solo después de reapertura explícita.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: Todos los Asientos y líneas pertenecen al libro del usuario autenticado.
- **Accounting Impact**: Es el sprint central de partida doble y balance.
- **MVP/Sprint Boundary**: No incluye plantillas ni reportes PYG, salvo datos base para saldos.
- **Testing Obligation**: Debe probar balance, rechazo de descuadres, postabilidad, saldos y periodo cerrado.

### Key Entities *(include if feature involves data)*

- **Asiento**: Unidad atómica del hecho económico.
- **Línea de asiento**: Afectación de una cuenta por importe y lado contable.
- **Saldo actual**: Resultado derivado de líneas de asiento.
- **Periodo anual**: Ejercicio que puede cerrarse o reabrirse.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 asientos descuadrados pueden guardarse.
- **SC-002**: Los saldos por cuenta coinciden con la suma de líneas en 100 % de casos de prueba.
- **SC-003**: Un periodo cerrado bloquea modificaciones no autorizadas.
- **SC-004**: Un usuario puede reabrir un ejercicio y corregirlo de forma explícita.
- **SC-005**: 100 % de ediciones en periodo abierto dejan evidencia de auditoría.

## Assumptions

- La visualización detallada de reportes se realiza en sprints posteriores.
- Las correcciones por reverso o ajuste podrán agregarse después, pero el MVP permite edición con historial en periodo abierto.
- Las plantillas usarán este motor, no lo reemplazarán.
