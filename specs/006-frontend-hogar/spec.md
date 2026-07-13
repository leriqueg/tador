# Feature Specification: Sprint 06 - Frontend Hogar

**Feature Branch**: `sprint/006-frontend-hogar`

**Created**: 2026-06-22

**Status**: Clarified (decisions locked 2026-07-12; capture UX locked 2026-07-13)

**Input**: Sprint 06: onboarding, login, configuración, creación guiada de cuentas/entidades, apuntes, saldos y dashboard para Modo Hogar.

## Clarifications

### Session 2026-07-12

- Q: ¿A dónde redirige un login exitoso? → A: **Primer login / libro sin inicializar** → `/onboarding`. **En cualquier otro caso** → `/dashboard`.
- Q: ¿Qué inicializa el onboarding? → A: Wizard obligatorio al primer uso: elección de **modo (Hogar | PRO)**, **moneda** y **zona horaria (UTC por defecto)**; con eso queda el libro listo. Post-MVP, al crear/inicializar el libro MAY generarse vistas materializadas / índices calculados para un dashboard limpio.
- Q: ¿Verificación de email en UX? → A: **Deshabilitada temporalmente** hasta post-MVP (regla de negocio en plataforma-base). El producto no bloquea por correo no verificado en el MVP.
- Q: ¿Recuperación de contraseña? → A: **Sí**, se necesita vista UX; depende de configuración de envío de email. Delta documentado en `001-plataforma-base` para implementar después.
- Q: ¿Contacto? → A: Pantalla con **`mailto:`** (sin API de contacto en MVP).
- Q: ¿Hogar muestra CxC / CxP? → A: **Sí**, como saldos de cuentas de balance vinculadas a Entidades (préstamos a amigos, deudas informales). **No** incluye el módulo documental de facturas/aging/aplicación de pagos (eso es PRO / post-MVP).

### Session 2026-07-13 — Captura de apuntes (Hogar vs PRO)

- Q: ¿Hogar usa el flujo secuencial PRO? → A: **No.** Hogar usa **template-driven quick capture** (plantillas con vocabulario cotidiano). El constructor secuencial es exclusivo de PRO (Sprint 07).
- Q: ¿Cómo se evita abrumar con 20+ plantillas? → A: **Tres capas**: (1) 4–6 tiles frecuentes, (2) Gasto|Ingreso|Transferencia + chips de categoría (≤6; ≤3 plantillas visibles), (3) typeahead de búsqueda. Nunca una grilla plana de todas las plantillas.
- Q: ¿Qué ve el usuario al confirmar? → A: Mini-formulario con **cuenta** (preselección sticky), **monto** y **descripción breve**; fecha por defecto hoy. **MUST NOT** mostrar líneas contables.
- Q: ¿Registro en ráfaga? → A: **Sí** — acción **“Guardar y registrar otro”** (burst entry): conserva plantilla + cuenta, limpia monto/concepto, foco al monto.
- Q: ¿Motor compartido? → A: Una plantilla Hogar es el mismo contrato de captura que PRO con pasos pre-respondidos; un solo `POST` de apunte; presentación distinta por modo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Primer uso guiado (Priority: P1)

Como usuario Hogar, quiero iniciar sesión, configurar mi libro y preparar cuentas básicas sin entender códigos contables.

**Why this priority**: La experiencia Hogar debe ser simple desde el primer contacto.

**Independent Test**: Un usuario completa onboarding (modo + moneda + timezone) y crea una cuenta básica sin ver códigos contables.

**Acceptance Scenarios**:

1. **Given** usuario nuevo tras login, **When** su libro no está inicializado, **Then** es redirigido a `/onboarding`.
2. **Given** onboarding, **When** elige modo, moneda y timezone (UTC por defecto), **Then** el libro queda inicializado y puede continuar a crear cuentas guiadas.
3. **Given** usuario con libro ya inicializado, **When** inicia sesión, **Then** es redirigido a `/dashboard`.

---

### User Story 2 - Registrar apuntes cotidianos (Priority: P1)

Como usuaria Hogar (uso básico: ama de casa / trabajadora dependiente), quiero registrar un movimiento eligiendo una **plantilla nombrada** (“Pagar supermercado”, “Registrar sueldo”) y confirmando solo cuenta, monto y descripción — sin clasificar INGRESO/EGRESO a mano ni ver contabilidad.

**Why this priority**: Es el flujo diario principal de TADOR; recognition over recall.

**Independent Test**: Con al menos una cuenta usable, abrir `/entries`, elegir plantilla frecuente o por categoría, completar mini-form, ver confirmación y un ítem reciente; opcionalmente “Guardar y registrar otro”.

**Acceptance Scenarios**:

1. **Given** cuentas configuradas y plantillas Hogar disponibles, **When** abro `/entries`, **Then** veo hasta 4–6 plantillas frecuentes (tiles) y navegación por tipo (Gasto | Ingreso | Transferencia) sin listar 20+ botones a la vez.
2. **Given** elijo una plantilla (tile o tras categoría), **When** se abre el mini-formulario, **Then** solo pido cuenta (preseleccionada si hay última usada), monto y descripción breve; **no** muestro códigos ni líneas del asiento.
3. **Given** mini-form válido, **When** guardo, **Then** veo confirmación clara (`ApunteConfirm`) y el apunte aparece en recientes.
4. **Given** acabo de guardar, **When** elijo “Guardar y registrar otro”, **Then** se conserva plantilla + cuenta, se limpian monto y descripción, y el foco vuelve al monto.
5. **Given** una plantilla de compra con tarjeta (o similar) con cuentas necesarias, **When** registro el apunte, **Then** queda persistido sin mostrar líneas contables.
6. **Given** busco por nombre (“taxi”), **When** el typeahead encuentra la plantilla, **Then** puedo abrir el mismo mini-formulario.

**Pantalla formal — QuickAdd / Entries (Hogar)**

| Zona | Comportamiento |
|------|----------------|
| `FrequentTemplatesGrid` | 4–6 tiles; ranking por uso del usuario (fallback curado al inicio) |
| `KindSegment` | Gasto \| Ingreso \| Transferencia |
| `CategoryChips` | ≤6 chips; filtra plantillas del tipo activo |
| Lista filtrada | ≤3 plantillas visibles por hoja de categoría |
| `TemplateSearch` | Typeahead por nombre/sinónimos (long tail) |
| `ApunteMiniForm` | Cuenta + monto + descripción; fecha default hoy |
| Acciones | Guardar \| Guardar y registrar otro |
| `RecentEntriesList` | Últimos apuntes del usuario |
| Deep link | `/entries/new?plantilla=<code>` abre mini-form con plantilla resuelta |

---

### User Story 3 - Revisar estado del hogar (Priority: P2)

Como usuario Hogar, quiero ver saldos actuales y el dashboard (resultado del ejercicio y posición financiera) para entender mi situación — incluyendo cuánto me deben y cuánto debo de forma informal.

**Why this priority**: La captura no tiene valor sin retroalimentación simple.

**Independent Test**: Después de registrar apuntes (incl. deudas con Entidades), ver saldos y dashboard actualizados.

**Acceptance Scenarios**:

1. **Given** apuntes registrados, **When** abro saldos, **Then** veo cuentas con importes actuales.
2. **Given** apuntes con PYG y saldos de balance, **When** abro dashboard, **Then** veo resumen anual PYG y posición (disponible, por cobrar, por pagar) en lenguaje cotidiano.
3. **Given** préstamos a un amigo registrados vía Entidad + cuenta por cobrar, **When** consulto posición / saldos, **Then** veo el rastro de lo que aún me debe sin ver facturas ni aging.

### Edge Cases

- Usuario sin cuentas propias.
- Plantilla requiere una cuenta faltante → mensaje cotidiano; CTA a crear/seleccionar cuenta (sin códigos).
- Error de validación al registrar apunte (monto inválido, sesión expirada).
- Catálogo con muchas plantillas: la UI MUST NOT mostrarlas todas a la vez (capas de navegación).
- Pantalla móvil con gráfico o tabla extensa.
- Usuario autenticado pero onboarding incompleto intenta abrir `/dashboard` → redirect a `/onboarding`.
- Abandonar mini-form con datos parciales → advertir pérdida de cambios cuando haya monto o descripción no vacíos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La UI Hogar MUST ocultar códigos contables por defecto.
- **FR-002**: La UI MUST permitir login, registro y configuración inicial del libro.
- **FR-003**: La UI MUST permitir creación guiada de cuentas básicas.
- **FR-004**: La UI MUST permitir creación básica de Entidades.
- **FR-005**: La UI MUST permitir registrar apuntes principales mediante **plantillas** (template-driven capture), no mediante el constructor secuencial PRO.
- **FR-005a**: La pantalla `/entries` MUST ofrecer tres capas de descubrimiento: frecuentes (4–6), tipo+categoría, y búsqueda; MUST NOT presentar una grilla plana de todo el catálogo.
- **FR-005b**: Tras elegir plantilla, el mini-formulario MUST pedir solo cuenta, monto y descripción breve (fecha default hoy); MUST NOT mostrar líneas contables.
- **FR-005c**: La UI MUST ofrecer “Guardar y registrar otro” (burst entry) conservando plantilla y cuenta.
- **FR-005d**: La UI MUST soportar deep link `/entries/new?plantilla=<code>`.
- **FR-006**: La UI MUST mostrar saldos actuales.
- **FR-007**: La UI MUST mostrar dashboard con panel PYG anual y panel de posición (**disponible**, **por cobrar**, **por pagar**) en modo Hogar, en lenguaje cotidiano (sin códigos).
- **FR-008**: La UI MUST presentar errores de validación en lenguaje cotidiano.
- **FR-009**: Tras login exitoso, la UI MUST redirigir a `/onboarding` si el libro no está inicializado; en caso contrario a `/dashboard`.
- **FR-010**: El onboarding MUST capturar modo (Hogar | PRO), moneda y timezone (default `UTC`) y persistirlos en la configuración del libro antes de considerar el libro “inicializado”.
- **FR-011**: La pantalla `/contact` MUST usar `mailto:` (sin backend de contacto en MVP).
- **FR-012**: La UI Hogar MUST permitir registrar y visualizar deudas informales CxC/CxP como cuentas de balance ligadas a Entidades. MUST NOT implementar módulo documental (facturas, aging, aplicación FIFO a documentos) en Sprint 06.
- **FR-013**: La captura Hogar MUST NOT implementar EntryBuilder / progressive disclosure de Sprint 07; ese patrón es exclusivo de Modo PRO.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: La UI solo muestra datos del usuario autenticado.
- **Accounting Impact**: La UI no crea lógica contable propia; usa plantillas y backend. CxC/CxP informales = cuentas de balance + Entidad (constitución V).
- **MVP/Sprint Boundary**: No incluye PRO EntryBuilder, documental ni IA v0. Verificación de email diferida (ver 001).
- **Testing Obligation**: Debe probar flujos principales de onboarding, apunte por plantilla (incl. burst), saldos y dashboard.
- **Exact monetary arithmetic**: Montos mostrados y enviados respetan aritmética decimal exacta (Constitución IX); sin IEEE 754 en cálculos intermedios de dinero.

### Key Entities *(include if feature involves data)*

- **Pantalla Hogar**: Interfaz simplificada.
- **Plantilla (Hogar)**: Intención cotidiana versionada que resuelve la estructura contable.
- **QuickAdd / Entries**: Pantalla de captura por plantillas (tres capas + mini-form).
- **ApunteMiniForm**: Confirmación de cuenta, monto y descripción.
- **Saldos visibles**: Resumen de cuentas del usuario.
- **Dashboard MVP**: Reporte con panel PYG y panel de posición presentado al usuario.
- **Libro inicializado**: BookConfig con modo, moneda y timezone definidos por el wizard.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede registrar un gasto cotidiano (plantilla frecuente → guardar) en menos de 30 segundos y con ≤4 toques tras abrir `/entries`.
- **SC-002**: Un usuario nuevo puede completar onboarding básico en menos de 10 minutos.
- **SC-003**: 90 % de acciones principales pueden completarse en móvil sin usar vista PRO.
- **SC-004**: Los errores de validación indican al usuario qué corregir sin mencionar detalles técnicos.
- **SC-005**: Tras el primer login, el usuario llega al wizard; tras completar onboarding, el siguiente login llega al dashboard.
- **SC-006**: En ningún momento de la captura Hogar el usuario ve códigos contables ni líneas de asiento.
- **SC-007**: Tras “Guardar y registrar otro”, el usuario puede enviar un segundo apunte de la misma plantilla sin volver a elegir plantilla ni cuenta.

## Assumptions

- El backend de plataforma, catálogos, motor, plantillas y dashboard ya existe.
- Mobile-first significa que las pantallas principales deben ser cómodas en teléfono.
- El diseño visual detallado puede evolucionar durante planificación; mockup de referencia: `apuntes_tador`.
- “Libro inicializado” = existe `BookConfig` con modo + moneda + timezone persistidos.
- Post-MVP: al inicializar libro, el sistema MAY crear vistas materializadas / índices calculados para dashboard limpio; fuera de alcance de implementación en Sprint 06.
- Recuperación de contraseña: UI en alcance de producto; envío real de email depende del follow-up de 001.
- Ranking de plantillas frecuentes MAY empezar en cliente (local) y migrar a backend después; el fallback curado es suficiente para MVP.
- Categorías de chips (Compras, Comida, Hogar, Transporte, Salud, Otros, etc.) se derivan de metadatos/agrupación de plantillas; si faltan metadatos, se usan grupos curados en frontend hasta que el backend los exponga.
