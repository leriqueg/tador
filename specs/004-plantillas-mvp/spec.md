# Feature Specification: Sprint 04 - Plantillas MVP

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Sprint 04 and `specs/foundation/plantillas-mvp-v0.md`: plantillas prioritarias para registrar apuntes Hogar y asiento manual PRO.

## Clarifications

### Session 2026-06-22

- Q: ¿Cuántos Asientos puede generar un Apunte? → A: Todo Apunte debe generar exactamente un Asiento, incluso si tiene muchas líneas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar apunte cotidiano (Priority: P1)

Como usuario Hogar, quiero registrar gastos, ingresos y traspasos con formularios simples para no pensar en líneas contables.

**Why this priority**: Es el valor central de TADOR frente a un sistema contable tradicional.

**Independent Test**: Registrar un gasto simple, ingreso simple y traspaso mediante plantillas y verificar los asientos generados.

**Acceptance Scenarios**:

1. **Given** cuentas válidas, **When** registro un gasto mediante plantilla, **Then** se crea un asiento balanceado.
2. **Given** dos cuentas de balance, **When** registro un traspaso, **Then** no se afecta PYG.

---

### User Story 2 - Registrar tarjeta con puente (Priority: P1)

Como usuario, quiero registrar una compra con tarjeta usando cuenta puente para que PYG y deuda queden separados.

**Why this priority**: Es un caso canónico del legacy y base para AMEX, taxis, regalos y gastos anuales.

**Independent Test**: Registrar `gasto_tarjeta_puente` y verificar PYG, puente en cero y deuda de tarjeta.

**Acceptance Scenarios**:

1. **Given** cuenta PYG, puente y tarjeta, **When** registro compra con tarjeta, **Then** la tarjeta no genera PYG y el puente queda neteado.

---

### User Story 3 - Registrar fondos de tercero (Priority: P2)

Como usuario, quiero recibir dinero de otra persona sin que se registre como ingreso propio.

**Why this priority**: Casos como Tía Toya requieren custodiar fondos sin inflar ingresos.

**Independent Test**: Registrar ingreso de tercero y verificar que no impacta PYG.

**Acceptance Scenarios**:

1. **Given** una Entidad de tercero y banco, **When** recibo fondos para custodiar, **Then** aumenta banco y se reconoce obligación sin PYG.

---

### User Story 4 - Usar asiento manual PRO (Priority: P3)

Como usuario PRO, quiero crear un asiento más abierto cuando una plantilla no cubre mi caso.

**Why this priority**: Evita bloquear casos reales sin ampliar plantillas prematuramente.

**Independent Test**: Crear asiento manual balanceado y rechazar uno descuadrado.

**Acceptance Scenarios**:

1. **Given** líneas balanceadas, **When** registro asiento manual, **Then** se guarda.
2. **Given** líneas descuadradas, **When** intento registrar, **Then** se rechaza.

### Edge Cases

- Falta cuenta por defecto del usuario.
- Plantilla apunta a cuenta inactiva.
- Periodo cerrado.
- Usuario intenta usar plantilla PRO desde Hogar.
- La plantilla genera asiento descuadrado por configuración incorrecta.
- Flujo compuesto que requiere varios hechos económicos; debe registrarse como varios Apuntes/Asientos separados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST soportar plantillas versionadas para apuntes.
- **FR-002**: El sistema MUST incluir plantillas prioritarias: `traspaso`, `gasto_efectivo`, `gasto_tarjeta_puente`, `ingreso_simple`, `ingreso_tercero`, `gasto_proyecto_puente` y `asiento_manual`.
- **FR-003**: Cada plantilla MUST validar campos, usuario, cuentas, moneda y periodo antes de generar asientos.
- **FR-004**: Cada plantilla MUST generar solo asientos balanceados.
- **FR-005**: Las plantillas MUST declarar si aplican a Hogar, PRO o ambos.
- **FR-006**: El asiento manual MUST estar limitado a Modo PRO.
- **FR-007**: Las plantillas con puente MUST preservar PYG separado de saldos de balance.
- **FR-008**: Cada Apunte MUST generar exactamente un Asiento.
- **FR-009**: Los flujos compuestos MUST registrarse como varios Apuntes/Asientos separados, cada uno balanceado por sí mismo.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: Plantillas solo operan con cuentas, Entidades y periodos del usuario.
- **Accounting Impact**: Crea asientos; debe respetar partida doble y validación del motor.
- **MVP/Sprint Boundary**: No incluye UI completa ni IA; solo capacidad funcional de plantillas.
- **Testing Obligation**: Debe probar cada plantilla prioritaria con al menos un caso canónico.

### Key Entities *(include if feature involves data)*

- **Plantilla**: Receta versionada de generación de asientos.
- **Apunte**: Uso concreto de una plantilla con datos del usuario.
- **Asiento generado**: Resultado validado de la plantilla.
- **Cuenta puente**: Cuenta usada para separar PYG y balance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % de plantillas prioritarias generan asientos balanceados en pruebas.
- **SC-002**: Los casos de taxi AMEX, Alekey, Tía Toya y Proyecto UP pueden reproducirse.
- **SC-003**: Un usuario Hogar puede registrar un gasto común sin ver líneas contables.
- **SC-004**: Asiento manual PRO rechaza cualquier descuadre.
- **SC-005**: Cada Apunte registrado queda vinculado a un único Asiento verificable.

## Assumptions

- Las plantillas MVP pueden vivir inicialmente como JSON versionado en el repositorio.
- La lista exacta puede ajustarse durante clarificación, pero no debe ampliar el MVP fuera de los casos prioritarios.
- Los casos compuestos, como envío de dinero más comisión y cruce de fondos, se representan con varios Apuntes consecutivos.
- La IA v0 usará estas plantillas en un sprint posterior.
