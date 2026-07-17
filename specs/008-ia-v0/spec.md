# Feature Specification: Sprint 08 - IA v0

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22

**Status**: **Excluded from MVP** (2026-07-16 — deferred for complexity + deadline; ADR 0002). Artifacts retained for post-MVP; do not delete or renumber this directory.

**Input**: Sprint 08: asistente local que interpreta lenguaje natural y sugiere plantillas en Modo Hogar.

> **MVP note**: Cierre del MVP **no** requiere IA v0. Ver `mvp-scope.md` y `estrategia-incremental-sprints.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interpretar gasto simple (Priority: P1)

Como usuario Hogar, quiero escribir una frase como “gasté $50 en almuerzo” para que TADOR sugiera una plantilla con datos precargados.

**Why this priority**: La IA v0 debe reducir fricción, no reemplazar el motor de plantillas.

**Independent Test**: Enviar frase simple y verificar que la sugerencia contiene plantilla, monto, concepto y confirmación.

**Acceptance Scenarios**:

1. **Given** frase con monto y concepto, **When** la IA interpreta, **Then** sugiere una plantilla conocida con campos precargados.

---

### User Story 2 - Confirmar antes de registrar (Priority: P1)

Como usuario, quiero confirmar la sugerencia antes de que se registre para evitar errores contables.

**Why this priority**: La constitución prohíbe ejecución autónoma de IA.

**Independent Test**: La IA sugiere; sin confirmación no se crea apunte ni asiento.

**Acceptance Scenarios**:

1. **Given** una sugerencia válida, **When** no confirmo, **Then** no se registra nada.
2. **Given** una sugerencia válida, **When** confirmo, **Then** se ejecuta la plantilla normal.

---

### User Story 3 - Pedir datos faltantes (Priority: P2)

Como usuario, quiero que TADOR me pregunte cuando falte monto, cuenta o concepto para no registrar mal.

**Why this priority**: La IA debe manejar ambigüedad de forma segura.

**Independent Test**: Enviar frase incompleta y verificar que devuelve pregunta o campos faltantes.

**Acceptance Scenarios**:

1. **Given** frase “almuerzo con efectivo”, **When** falta monto, **Then** la IA pide el monto antes de registrar.

### Edge Cases

- Frase ambigua con múltiples plantillas posibles.
- Monto no reconocido.
- Cuenta sugerida inexistente.
- Periodo cerrado.
- Sugerencia con baja confianza.
- Solicitud de operación fuera del MVP.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La IA v0 MUST interpretar frases simples de Modo Hogar.
- **FR-002**: La IA v0 MUST devolver sugerencia estructurada con plantilla, confianza y campos detectados.
- **FR-003**: La IA v0 MUST sugerir solo plantillas conocidas.
- **FR-004**: La IA v0 MUST pedir datos faltantes o marcar baja confianza cuando no pueda decidir.
- **FR-005**: La IA v0 MUST requerir confirmación del usuario antes de ejecutar.
- **FR-006**: La ejecución MUST pasar por las mismas validaciones backend que cualquier plantilla.
- **FR-007**: La IA v0 MUST NOT crear asientos directamente.
- **FR-008**: La IA v0 MUST NOT modificar periodos cerrados ni saltar reglas de tenant.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: La interpretación opera solo con contexto del usuario y no debe filtrar datos sensibles.
- **Accounting Impact**: No crea asientos; solo sugiere plantillas que luego ejecuta el backend validado.
- **MVP/Sprint Boundary**: IA simple de Hogar; no incluye contador autónomo, CxC/CxP, facturas ni decisiones complejas.
- **Testing Obligation**: Debe probar interpretación, baja confianza, confirmación y no ejecución sin confirmación.

### Key Entities *(include if feature involves data)*

- **Sugerencia IA**: Resultado estructurado con plantilla y campos.
- **Frase del usuario**: Texto de intención en lenguaje natural.
- **Plantilla sugerida**: Plantilla conocida a ejecutar tras confirmación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Frases simples de gasto con monto y concepto sugieren plantilla correcta en al menos 80 % de casos piloto.
- **SC-002**: 100 % de sugerencias requieren confirmación antes de registrar.
- **SC-003**: 100 % de frases incompletas críticas piden datos faltantes o no registran.
- **SC-004**: 0 asientos son creados directamente por la IA sin pasar por plantilla validada.

## Assumptions

- La IA v0 se incorpora después de backend, frontend y plantillas.
- El modelo local puede tener latencia aceptable para uso personal o pocos usuarios.
- Las frases soportadas se limitan a operaciones simples del MVP.
