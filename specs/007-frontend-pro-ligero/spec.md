# Feature Specification: Sprint 07 - Frontend PRO ligero

**Feature Branch**: `sprint/007-frontend-pro-ligero`

**Created**: 2026-06-22

**Updated**: 2026-07-18

**Status**: Clarified (2026-07-16 — scope ligero locked; avanzado → 009)

**Input**: Sprint 07: más control para usuario PRO sin convertir TADOR en ERP.

## Clarifications

### Session 2026-07-18

- Q: ¿EntryBuilder y asiento manual son idempotentes? → A: Sí. Cada intento conserva su Idempotency-Key hasta éxito.
- Q: ¿Dónde se configura el control de saldo negativo? → A: En Cuentas PRO, por cuenta de usuario y por uso directo de una cuenta global protegida; activo por defecto.

### Session 2026-07-13 — Captura de apuntes PRO (vs Hogar)

- Q: ¿PRO usa el mismo flujo de plantillas Hogar? → A: **No como presentación primaria.** PRO usa **EntryBuilder**.
- Q: ¿Formulario seco multi-campo? → A: **No** como UX primaria. Pasos previos visibles y editables.
- Q: ¿Burst? → A: **Sí** — “Guardar y registrar otro” conserva tipo y cuenta.
- Q: ¿Relación con Hogar? → A: Mismo motor de captura; Hogar = QuickAdd. MUST NOT cruzar UX.
- Q: ¿Asiento manual? → A: Escape hatch PRO (US3).

### Session 2026-07-16 — Rutas, alcance ligero, entidades, onboarding

- Q: ¿Mismas rutas front que Hogar? → A: **No.** Namespaces separados: `/hogar/*` y `/pro/*` (composiciones distintas; color/shell propios). Guard redirige según `BookConfig.mode`. Backend: **mismas APIs** salvo datos realmente distintos.
- Q: ¿EntryBuilder exige plantilla? → A: **No obligatoriamente.** Puede resolver a `POST /api/apuntes` con o sin `templateCode`, o a asiento manual. Plantillas siguen siendo el lenguaje/atajos del motor; el builder no debe forzar catálogo completo en memoria si arma líneas válidas.
- Q: ¿P&G / Balance densificados? → A: **No en 007.** Iguales a Hogar. Análisis bancos/tarjetas/cartera → **Sprint 009**.
- Q: ¿Árbol de cuentas? → A: Mostrar madres + hijas con códigos/saldos; crear hijas postables bajo madres permitidas. **MUST NOT** crear a mano cuentas que nacen de Entidad (bank/card/wallet_platform).
- Q: ¿client / supplier tipos? → A: **No.** Solo `organization` + capacidades (`can_be_customer`, `can_be_supplier`, `is_employment_dependency`). Validar capacidad **al apunte**, no retroactivo.
- Q: ¿Onboarding PRO pide clientes? → A: **No.** Solo pregunta si hay **relación de dependencia** → crear organización empleadora (hasta 3 flags; normalmente 1). Freelance sin clientes **puede** terminar onboarding.
- Q: ¿Clientes/proveedores? → A: **Just-in-Time** en EntryBuilder (inline). La UI JIT MUST ser clara (nombre + capacidades mínimas).
- Q: ¿IA / mockup asistente? → A: Fuera de MVP (`008` excluido).

### Session 2026-07-20 — Onboarding seed + perfil laboral

- Q: ¿Dependencia vs freelance son excluyentes? → A: **No.** Flags independientes: dependencia, freelance, **ambos**, o **ninguno** (público: abuelita, joven, ama de casa, emprendimiento, freelance sin clientes).
- Q: ¿Onboarding deja el libro listo para el primer apunte? → A: **Sí.** Al completar MUST seedear billetera default + categorías mínimas de ingreso/gasto (`CuentaUsuario`). Sin esto EntryBuilder queda sin opciones.
- Q: ¿Clientes en onboarding? → A: Sigue **MUST NOT**. JIT se define en follow-up; `/pro/entities` aún placeholder.

## User Scenarios & Testing *(mandatory)*

### User Story 0 - Namespace PRO y guard de modo (Priority: P1)

Como usuario con modo PRO (o Hogar), quiero que la app me lleve al namespace correcto sin mezclar pantallas densas en las mismas rutas.

**Independent Test**: Libro en PRO abre `/pro/dashboard`; visitar `/hogar/entries` redirige a `/pro/entries` (y al revés).

**Acceptance Scenarios**:

1. **Given** `mode=pro`, **When** navego a rutas `/hogar/*`, **Then** redirijo a equivalente `/pro/*`.
2. **Given** `mode=hogar`, **When** navego a `/pro/*`, **Then** redirijo a `/hogar/*`.

---

### User Story 1 - Onboarding PRO con perfil laboral flexible (Priority: P1)

Como usuario que elige PRO, quiero indicar si tengo dependencia y/o trabajo por mi cuenta (o ninguna), crear el empleador solo si aplica, y llegar al dashboard con cuentas listas para el primer apunte — sin inventar clientes.

**Independent Test**: Completar onboarding PRO: (a) solo dependencia → org + seed; (b) solo freelance → sin clientes + seed; (c) ambos; (d) ninguno; todos llegan a `/pro/dashboard` con billetera + categorías.

**Acceptance Scenarios**:

1. **Given** onboarding modo PRO + dependencia, **When** nombro la empresa, **Then** se crea `organization` con `is_employment_dependency`.
2. **Given** onboarding PRO freelance (o ninguno), **When** omito clientes, **Then** el libro queda inicializado.
3. **Given** onboarding PRO, **When** avanzo, **Then** **MUST NOT** pedirse lista de clientes/proveedores.
4. **Given** onboarding PRO o Hogar completado, **When** listo cuentas, **Then** existe billetera default + al menos una categoría de ingreso y una de gasto.
5. **Given** dependencia + freelance marcados a la vez, **When** completo, **Then** se crean empleadores y no se exigen clientes.

---

### User Story 2 - Captura EntryBuilder (Priority: P1)

Como profesional / pequeño emprendimiento, quiero registrar con un constructor secuencial sin formulario seco.

**Independent Test**: Ingreso + transferencia/préstamo con Entidad JIT; burst.

**Acceptance Scenarios**:

1. **Given** `/pro/entries`, **When** abro captura, **Then** EntryBuilder (no QuickAdd).
2. **Given** pasos completados, **When** avanzo, **Then** previos visibles/editables.
3. **Given** rama que exige Entidad, **When** no existe, **Then** creación inline (`organization`/`person` + capacidades).
4. **Given** guardado, **When** “Guardar y registrar otro”, **Then** conservan tipo y cuenta; limpian monto/concepto.
5. **Given** apunte de sueldo, **When** falta org con `is_employment_dependency`, **Then** bloquear con mensaje + CTA a crear/seleccionar.

**Pantalla formal — EntryBuilder**

| Paso | Contenido |
|------|-----------|
| 1 | TipoOperacion: INGRESO \| EGRESO \| TRANSFERENCIA |
| 2 | Subtipo / cuenta filtrada |
| 3 | Entidad (si aplica; combobox + JIT) |
| 4 | Concepto |
| 5 | Monto |
| Acciones | Guardar \| Guardar y registrar otro |
| A11y | Foco al paso revelado; `aria-live`; `prefers-reduced-motion` |

Ver tabla QuickAdd vs EntryBuilder en `specs/foundation/modos-hogar-pro.md`.

---

### User Story 3 - Asiento manual (Priority: P1)

Como usuario PRO, quiero un asiento manual balanceado cuando el builder no cubre el caso.

**Independent Test**: Balanceado OK; descuadrado rechazado.

**Acceptance Scenarios**:

1. **Given** líneas balanceadas en `/pro/entries/manual` (o equivalente), **When** guardo, **Then** se registra vía API de asientos.
2. **Given** descuadre, **When** intento guardar, **Then** error y no persiste.

---

### User Story 4 - Árbol de cuentas PRO (Priority: P1)

Como usuario PRO, quiero ver el árbol (códigos, madres, saldos) y crear hijas postables bajo madres permitidas.

**Independent Test**: Abrir `/pro/accounts`; crear categoría/puente bajo madre; no crear bank/card a mano.

**Acceptance Scenarios**:

1. **Given** `/pro/accounts`, **When** listo, **Then** veo códigos, nombres, tipo y saldo cuando aplique.
2. **Given** madre que admite hijos, **When** creo cuenta, **Then** queda bajo esa madre.
3. **Given** intento crear bank/card manual, **When** POST, **Then** 422 (vía Entidad).

---

### User Story 5 - Finanzas base sin densificar (Priority: P2)

Como usuario PRO, quiero P&G y Balance con la misma claridad que Hogar (sin análisis avanzado aún).

**Independent Test**: `/pro/finances/pyg` y `/pro/finances/balance` muestran los mismos paneles conceptuales que Hogar.

**Acceptance Scenarios**:

1. **Given** PRO, **When** abro P&G/Balance, **Then** veo reportes base (sin filtros por entidad ni “Analizar bancos”).

### Edge Cases

- Cross-namespace sin permiso de modo → redirect.
- Madre sin hijos postables → no ofrecer crear.
- Periodo cerrado en asiento manual → error.
- Capacidad de org incorrecta en apunte → rechazar al guardar.
- Entidad requerida omitida → bloquear avance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: UI PRO MUST usar namespace `/pro/*` (y Hogar `/hogar/*`) con guard por modo.
- **FR-002**: Backend MUST reutilizar APIs de dominio existentes para datos compartidos.
- **FR-003**: UI PRO MUST mostrar códigos de cuenta en el árbol / creación.
- **FR-004**: UI PRO MUST permitir seleccionar cuenta madre al crear cuentas postables permitidas.
- **FR-005**: UI PRO MUST NOT crear a mano cuentas aprovisionadas por Entidad (bank/card/wallet_platform).
- **FR-006**: Captura diaria PRO MUST ser EntryBuilder; MUST NOT ser QuickAdd.
- **FR-007**: EntryBuilder MUST permitir apunte con o sin `templateCode` (válido por construcción / balance).
- **FR-008**: EntryBuilder MUST ofrecer burst conservando tipo y cuenta.
- **FR-009**: Entidad requerida MUST permitir selección o JIT inline con capacidades mínimas.
- **FR-010**: Asiento manual MUST aceptar balanceados y rechazar descuadres.
- **FR-011**: P&G y Balance PRO MUST equivaler conceptualmente a Hogar (sin análisis 009).
- **FR-012**: Onboarding PRO MUST ofrecer perfil laboral con flags independientes (dependencia y/o freelance, o ninguno); MUST NOT exigir clientes/proveedores.
- **FR-016**: Al completar onboarding (Hogar o PRO) el sistema MUST crear cuentas starter: billetera default sin entidad + categorías mínimas de ingreso y gasto, para que EntryBuilder/QuickAdd tengan opciones.
- **FR-013**: Organizaciones MUST usar tipo `organization` + capacidades; validación al apunte.
- **FR-014**: Sticky defaults: última cuenta por tipo de operación SHOULD preseleccionarse.
- **FR-015**: Funciones PRO MUST respetar tenant, periodo y postables.

### Out of scope (→ 009 / 008)

- Analizar Bancos / Tarjetas / Cartera Entidades.
- Filtros P&G por cuenta/entidad.
- Conciliación y cierre de extractos.
- IA v0 / mockup asistente IA.

### Constitution Alignment

- **Tenant & Privacy**: Sin acceso cruzado.
- **Accounting Impact**: Solo motor / plantillas / asientos balanceados.
- **MVP/Sprint Boundary**: Ligero; sin ERP documental ni 009.
- **Testing Obligation**: Guard rutas, EntryBuilder (ingreso + JIT), burst, asiento manual, árbol, onboarding dependencia/freelance.
- **Exact monetary arithmetic**: Constitución IX.

### Key Entities

- EntryBuilder state, Asiento manual, Árbol cuentas, Organization + capabilities, Namespace guard.

## Success Criteria *(mandatory)*

- **SC-001**: Crear cuenta bajo madre en &lt; 3 clics desde `/pro/accounts`.
- **SC-002**: 100 % descuadres de asiento manual rechazados.
- **SC-003**: Ingreso típico EntryBuilder &lt; 60 s.
- **SC-004**: Burst no exige reelegir tipo ni cuenta.
- **SC-005**: Freelance (o perfil ninguno) completa onboarding PRO sin clientes.
- **SC-008**: Tras onboarding, EntryBuilder muestra al menos una opción en debe y haber para INGRESO.
- **SC-006**: Cross-namespace siempre redirige al modo del libro.
- **SC-007**: Ninguna función PRO salta reglas del motor.

## Assumptions

- Modo PRO = configuración de uso, no pricing.
- APIs de asientos/apuntes/cuentas/entidades ya existen o se extienden mínimamente (capacidades).
- Mockup EntryBuilder: `registro_pro_plantillas_tador`. IA mockup = post-MVP.
- Detalle captura vs QuickAdd: `modos-hogar-pro.md`.
