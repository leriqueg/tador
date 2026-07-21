# Feature Specification: EntryBuilder decision graph

**Feature Branch**: `feat/entry-builder-decision-graph`

**Created**: 2026-07-21

**Status**: Draft → In progress

**Input**: PRO EntryBuilder must guide the user with a decision graph (not plantilla chips + two raw account selects). Plantillas remain leaf recipes. No IA.

## Clarifications

### Session 2026-07-21

- Q: ¿Plantillas = árbol? → A: **No.** Plantillas = hojas contables. Grafo estático = UX PRO.
- Q: ¿MVP scope? → A: Rama **INGRESO** completa (sueldo / cliente / otro). EGRESO y TRANSFERENCIA: subgrafo mínimo o flujo lineal acotado (no picker de plantillas).
- Q: ¿IA? → A: Excluida (008).
- Q: ¿Backend nuevo? → A: No. `POST /api/apuntes` ± `templateCode`; grafo vive en frontend (JSON/TS) + walker puro.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Captura INGRESO por grafo (Priority: P1)

Como usuario PRO, quiero responder preguntas en lenguaje humano (¿sueldo, cliente u otro?) y que cada respuesta acote cuentas/entidad, sin ver un catálogo de plantillas.

**Why this priority**: Corrige la regresión “EntryBuilder ≈ QuickAdd peor”.

**Independent Test**: Completar camino sueldo hasta guardar apunte con `templateCode=registrar_sueldo` y empleador con capability.

**Acceptance Scenarios**:

1. **Given** `/pro/entries`, **When** elijo Ingreso → Sueldo, **Then** el siguiente paso pide empleador (capability `is_employment_dependency`), no todas las categorías de ingreso.
2. **Given** camino sueldo, **When** elijo liquidez y categoría bajo `41010000`, concepto y monto, **Then** se guarda apunte válido (plantilla sueldo).
3. **Given** camino cliente, **When** elijo entidad con `can_be_customer` (o JIT), liquidez e ingreso, **Then** se guarda apunte (libre o plantilla si existe) sin mostrar tiles Hogar.
4. **Given** camino otro, **When** elijo liquidez + categoría ingreso, **Then** apunte libre balanceado.

### User Story 2 - Walker puro + hoja plantilla (Priority: P1)

Como desarrollador, quiero un grafo declarativo y un reducer/walker testeable sin UI.

**Independent Test**: Unit tests del walker (advance/back/edit/burst) y mapeo hoja → payload.

**Acceptance Scenarios**:

1. **Given** nodo `choice`, **When** selecciono opción, **Then** avanzo al `next` declarado.
2. **Given** hoja con `templateCode`, **When** armo payload, **Then** incluye `templateCode` y líneas debit/credit.
3. **Given** hoja sin plantilla, **When** armo payload, **Then** líneas free-form con side+amount.

### User Story 3 - EGRESO / TRANSFERENCIA no bloquean (Priority: P2)

Como usuario PRO, quiero poder registrar egreso o transferencia sin el grafo INGRESO completo aún.

**Independent Test**: Egreso/transferencia usan subgrafo mínimo (liquidez/categoría acotada o dos cuentas) y guardan.

**Acceptance Scenarios**:

1. **Given** Egreso, **When** completo pasos mínimos, **Then** apunte válido sin chips de plantillas financieras como UX primaria.
2. **Given** Transferencia, **When** elijo origen ≠ destino liquidez, **Then** apunte/transferencia válida.

### Edge Cases

- Empleador sin capability → bloquear + CTA JIT.
- Sin cuentas de liquidez → empty state + CTA Cuentas/Entidades.
- Burst conserva camino (nodo hoja / tipo) y limpia concepto/monto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: EntryBuilder MUST caminar un grafo de decisión estático (nodos choice / pick_account / pick_entity / concept / amount / leaf).
- **FR-002**: MUST NOT presentar el catálogo de plantillas Hogar como UX primaria en PRO.
- **FR-003**: Hojas MAY resolver a `templateCode` existente; MAY guardar sin plantilla con líneas válidas.
- **FR-004**: Filtros de cuenta MUST usar `groupCodes` / `tipoCuenta` del nodo (no “todas las 4xxx” salvo camino “otro” acotado a incomeCategory).
- **FR-005**: Entidad MUST pedirse solo cuando el nodo lo declara (`requiredCapability` opcional).
- **FR-006**: Backend MUST reutilizar `POST /api/apuntes` (sin endpoint nuevo de grafo en MVP).
- **FR-007**: Plantilla `registrar_sueldo` MUST aceptar modo PRO (modes incluye `pro`) cuando se usa como hoja.
- **FR-008**: Tests MUST cubrir walker unitario + integración DB del camino sueldo.

### Out of scope

- IA / ranking dinámico (008).
- Editor visual del grafo.
- Grafo EGRESO completo (comisión/interés/activo) — post-MVP de este spec.
- Cambiar QuickAdd Hogar.

### Constitution Alignment

- Tenant, exact money, plantilla discipline (hojas), TDD, MVP boundary.

## Success Criteria

- **SC-001**: Camino sueldo &lt; 60s en smoke manual.
- **SC-002**: 100 % unit tests del walker en verde.
- **SC-003**: Integración DB: sueldo con empleador OK; sin capability rechazado.
- **SC-004**: Usuario PRO no ve tiles de plantillas en `/pro/entries`.
