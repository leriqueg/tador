# Feature Specification: Sprint 07 - Frontend PRO ligero

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22

**Status**: Draft (capture UX locked 2026-07-13; implementación UI diferida a Sprint 07)

**Input**: Sprint 07: más control para usuario PRO sin convertir TADOR en ERP.

## Clarifications

### Session 2026-07-13 — Captura de apuntes PRO (vs Hogar)

- Q: ¿PRO usa el mismo flujo de plantillas Hogar? → A: **No como presentación primaria.** PRO usa **EntryBuilder** (progressive disclosure / narrative form): pasos secuenciales que convierten la intención en asiento, con validez por construcción.
- Q: ¿Formulario seco multi-campo? → A: **No** como UX primaria. El constructor mantiene pasos completados **visibles y editables** (acceso aleatorio hacia atrás). En ráfaga se comporta como formulario una vez avanzado, sin forzar clasificación abstracta de entrada.
- Q: ¿Ejemplo de flujo? → A: Registrar → INGRESO|EGRESO|TRANSFERENCIA → subtipo/cuenta filtrada → (si aplica) Entidad con creación inline → concepto → monto.
- Q: ¿Burst? → A: **Sí** — “Guardar y registrar otro” conserva tipo y cuenta (pasos 1–2), limpia monto/concepto.
- Q: ¿Relación con Hogar? → A: Mismo motor/contrato de captura; Hogar pre-responde pasos vía plantilla (Sprint 06). MUST NOT reutilizar EntryBuilder como UX Hogar.
- Q: ¿Asiento manual? → A: Sigue en alcance PRO como escape cuando ninguna rama/plantilla cubre el caso (US2 existente).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver estructura contable (Priority: P1)

Como usuario PRO, quiero ver códigos y cuentas madre para crear cuentas con mayor precisión.

**Why this priority**: PRO necesita control del plan sin perder la base guiada.

**Independent Test**: Activar Modo PRO y crear una cuenta seleccionando cuenta madre.

**Acceptance Scenarios**:

1. **Given** Modo PRO activo, **When** creo una cuenta, **Then** puedo ver código, cuenta madre y ubicación.

---

### User Story 2 - Captura guiada EntryBuilder (Priority: P1)

Como profesional independiente / pequeño emprendimiento (≤3 clientes), quiero registrar movimientos con un **constructor secuencial** (INGRESO / EGRESO / TRANSFERENCIA → cuenta → … → monto) sin un formulario seco ni códigos en cada paso intermedio — y sin perder el contexto de pasos ya elegidos.

**Why this priority**: Es el flujo diario PRO; enseña el modelo y evita estados inválidos.

**Independent Test**: Completar un ingreso y una transferencia (p. ej. préstamo + Entidad nueva inline); guardar; usar “Guardar y registrar otro”.

**Acceptance Scenarios**:

1. **Given** Modo PRO, **When** abro registro, **Then** empiezo por tipo de operación; solo se revelan opciones compatibles con lo ya elegido.
2. **Given** pasos completados, **When** avanzo, **Then** los pasos previos permanecen visibles y editables (no chat destructivo).
3. **Given** rama que requiere Entidad (p. ej. préstamo), **When** el nombre no existe, **Then** puedo crearla inline sin abandonar el flujo.
4. **Given** registro guardado, **When** elijo “Guardar y registrar otro”, **Then** se conservan tipo y cuenta; monto y concepto se limpian.

**Pantalla formal — EntryBuilder (PRO)**

| Paso | Contenido |
|------|-----------|
| 1 | TipoOperacion: INGRESO \| EGRESO \| TRANSFERENCIA |
| 2 | Subtipo / cuenta filtrada por paso 1 |
| 3 | Entidad (solo si la rama lo exige; combobox + crear inline) |
| 4 | Concepto |
| 5 | Monto |
| Acciones | Guardar \| Guardar y registrar otro |
| Accesibilidad | Foco al paso revelado; `aria-live` en revelados; animación solo transform/opacity + `prefers-reduced-motion` |
| Navegación | Advertir si hay pasos con datos y se abandona; estado preferible en query cuando aplique |

---

### User Story 3 - Registrar asiento manual (Priority: P1)

Como usuario PRO, quiero registrar un asiento manual balanceado cuando una plantilla o rama del EntryBuilder no cubre mi caso.

**Why this priority**: Evita bloquear casos profesionales o de migración sin crear plantillas prematuras.

**Independent Test**: Crear asiento manual balanceado desde UI y rechazar uno descuadrado.

**Acceptance Scenarios**:

1. **Given** líneas balanceadas, **When** guardo asiento manual, **Then** se registra.
2. **Given** líneas descuadradas, **When** intento guardar, **Then** se informa el error y no se guarda.

---

### User Story 4 - Revisar saldos con más detalle (Priority: P2)

Como usuario PRO, quiero una vista más explícita de cuentas y saldos para revisar la estructura de mi libro.

**Why this priority**: PRO necesita control sin depender solo de frases Hogar.

**Independent Test**: Ver árbol/listado de cuentas con códigos y saldos.

**Acceptance Scenarios**:

1. **Given** cuentas configuradas, **When** abro vista PRO, **Then** veo códigos, nombres, tipo y saldo.

### Edge Cases

- Usuario Hogar intenta acceder a EntryBuilder o asiento manual → denegar / redirigir a captura Hogar.
- Cuenta madre seleccionada no permite hijos postables.
- Asiento manual toca periodo cerrado.
- Asiento manual usa cuenta de otro usuario.
- Entidad requerida omitida en rama préstamo → bloquear avance con mensaje claro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La UI PRO MUST permitir ver códigos de cuenta.
- **FR-002**: La UI PRO MUST permitir seleccionar cuenta madre al crear cuentas.
- **FR-003**: La UI PRO MUST permitir crear asiento manual balanceado.
- **FR-004**: La UI PRO MUST rechazar asientos manuales descuadrados.
- **FR-005**: La UI PRO MUST mostrar saldos y clasificación con más detalle que Hogar.
- **FR-006**: Las funciones PRO MUST mantener las mismas reglas de tenant, periodo y cuentas postables.
- **FR-007**: La captura diaria PRO MUST usar **EntryBuilder** (progressive disclosure): un paso a la vez, opciones filtradas (validez por construcción), pasos previos editables.
- **FR-008**: EntryBuilder MUST ofrecer “Guardar y registrar otro” conservando tipo y cuenta.
- **FR-009**: Cuando una rama requiera Entidad, MUST permitir selección o creación inline.
- **FR-010**: EntryBuilder MUST NOT ser la UX de captura del Modo Hogar (ver Sprint 06).
- **FR-011**: Sticky defaults: última cuenta usada por tipo de operación SHOULD preseleccionarse.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: PRO no amplía acceso a datos de otros usuarios.
- **Accounting Impact**: EntryBuilder y asiento manual deben usar el motor / plantillas y validar balance; la UI no inventa asientos.
- **MVP/Sprint Boundary**: No incluye CxC/CxP documentales, facturas, aging ni ERP completo.
- **Testing Obligation**: Debe probar EntryBuilder (ingreso + transferencia/préstamo), burst, asiento manual balanceado y rechazo de descuadres.
- **Exact monetary arithmetic**: Montos con aritmética decimal exacta (Constitución IX).

### Key Entities *(include if feature involves data)*

- **Vista PRO**: Interfaz con códigos y mayor detalle.
- **EntryBuilder**: Constructor secuencial de captura (narrative form).
- **Asiento manual**: Registro abierto con líneas explícitas (escape hatch).
- **Árbol/listado de cuentas**: Vista estructurada del plan del usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario PRO puede crear una cuenta bajo madre elegida sin usar formularios técnicos externos.
- **SC-002**: 100 % de asientos manuales descuadrados son rechazados.
- **SC-003**: Un usuario PRO puede identificar código, madre y saldo de una cuenta en menos de 3 clics.
- **SC-004**: Ninguna función PRO permite saltar reglas del motor contable.
- **SC-005**: Un usuario PRO completa un ingreso típico por EntryBuilder en menos de 60 segundos.
- **SC-006**: Tras “Guardar y registrar otro”, el segundo movimiento no exige reelegir tipo ni cuenta.

## Assumptions

- Modo PRO es configuración de uso, no plan de pago.
- El backend de asiento manual ya existe desde Sprint 04.
- El backend de plantillas/apuntes sirve ambos modos; la diferencia es presentación.
- PRO sigue siendo ligero y no incorpora módulos formales fuera del MVP.
- Mockups de referencia: `registro_pro_plantillas_tador` (flujo paso a paso); `registro_pro_asistente_ia_tador` es **post-MVP / IA**, no el EntryBuilder del Sprint 07.
