# Feature Specification: Sprint 07 - Frontend PRO ligero

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Sprint 07: más control para usuario PRO sin convertir TADOR en ERP.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver estructura contable (Priority: P1)

Como usuario PRO, quiero ver códigos y cuentas madre para crear cuentas con mayor precisión.

**Why this priority**: PRO necesita control del plan sin perder la base guiada.

**Independent Test**: Activar Modo PRO y crear una cuenta seleccionando cuenta madre.

**Acceptance Scenarios**:

1. **Given** Modo PRO activo, **When** creo una cuenta, **Then** puedo ver código, cuenta madre y ubicación.

---

### User Story 2 - Registrar asiento manual (Priority: P1)

Como usuario PRO, quiero registrar un asiento manual balanceado cuando una plantilla no cubre mi caso.

**Why this priority**: Evita bloquear casos profesionales o de migración sin crear plantillas prematuras.

**Independent Test**: Crear asiento manual balanceado desde UI y rechazar uno descuadrado.

**Acceptance Scenarios**:

1. **Given** líneas balanceadas, **When** guardo asiento manual, **Then** se registra.
2. **Given** líneas descuadradas, **When** intento guardar, **Then** se informa el error y no se guarda.

---

### User Story 3 - Revisar saldos con más detalle (Priority: P2)

Como usuario PRO, quiero una vista más explícita de cuentas y saldos para revisar la estructura de mi libro.

**Why this priority**: PRO necesita control sin depender solo de frases Hogar.

**Independent Test**: Ver árbol/listado de cuentas con códigos y saldos.

**Acceptance Scenarios**:

1. **Given** cuentas configuradas, **When** abro vista PRO, **Then** veo códigos, nombres, tipo y saldo.

### Edge Cases

- Usuario Hogar intenta acceder a asiento manual.
- Cuenta madre seleccionada no permite hijos postables.
- Asiento manual toca periodo cerrado.
- Asiento manual usa cuenta de otro usuario.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La UI PRO MUST permitir ver códigos de cuenta.
- **FR-002**: La UI PRO MUST permitir seleccionar cuenta madre al crear cuentas.
- **FR-003**: La UI PRO MUST permitir crear asiento manual balanceado.
- **FR-004**: La UI PRO MUST rechazar asientos manuales descuadrados.
- **FR-005**: La UI PRO MUST mostrar saldos y clasificación con más detalle que Hogar.
- **FR-006**: Las funciones PRO MUST mantener las mismas reglas de tenant, periodo y cuentas postables.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: PRO no amplía acceso a datos de otros usuarios.
- **Accounting Impact**: Asiento manual debe usar el motor contable y validar balance.
- **MVP/Sprint Boundary**: No incluye CxC/CxP, facturas, reportes avanzados ni ERP.
- **Testing Obligation**: Debe probar acceso PRO, asiento manual balanceado y rechazo de descuadres.

### Key Entities *(include if feature involves data)*

- **Vista PRO**: Interfaz con códigos y mayor detalle.
- **Asiento manual**: Registro abierto con líneas explícitas.
- **Árbol/listado de cuentas**: Vista estructurada del plan del usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario PRO puede crear una cuenta bajo madre elegida sin usar formularios técnicos externos.
- **SC-002**: 100 % de asientos manuales descuadrados son rechazados.
- **SC-003**: Un usuario PRO puede identificar código, madre y saldo de una cuenta en menos de 3 clics.
- **SC-004**: Ninguna función PRO permite saltar reglas del motor contable.

## Assumptions

- Modo PRO es configuración de uso, no plan de pago.
- El backend de asiento manual ya existe desde Sprint 04.
- PRO sigue siendo ligero y no incorpora módulos formales fuera del MVP.
