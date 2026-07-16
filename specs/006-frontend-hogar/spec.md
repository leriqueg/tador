# Feature Specification: Sprint 06 - Frontend Hogar

**Feature Branch**: `sprint/006-frontend-hogar`

**Created**: 2026-06-22

**Status**: Clarified (decisions locked 2026-07-12; capture UX locked 2026-07-13; onboarding delta locked 2026-07-14; Ajustes/Entidades/Cuentas locked 2026-07-14 evening)

**Input**: Sprint 06: onboarding, login, configuración, creación guiada de cuentas/entidades, apuntes, saldos y dashboard para Modo Hogar.

## Clarifications

### Session 2026-07-12

- Q: ¿A dónde redirige un login exitoso? → A: **Primer login / libro sin inicializar** → `/onboarding`. **En cualquier otro caso** → `/dashboard`.
- Q: ¿Qué inicializa el onboarding? → A: Wizard obligatorio al primer uso: elección de **modo (Hogar | PRO)**, **moneda** y **zona horaria**; con eso + pasos opcionales de medios (banco/tarjeta/billetera virtual) queda el libro listo. Post-MVP, al crear/inicializar el libro MAY generarse vistas materializadas / índices calculados para un dashboard limpio.
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

### Session 2026-07-14 — Onboarding Hogar (cuentas, TZ, tarjetas, empleo)

- Q: ¿Lista de zonas horarias y default? → A: Lista curada **América del Norte, Sudamérica y Europa** (incl. `America/Guayaquil`). Default = timezone del browser (`Intl…timeZone`) si está en la lista; si no, fallback UTC. Labels humanos (p. ej. “Guayaquil (Ecuador)”).
- Q: ¿Billeteras en onboarding? → A: **Sí, paso opcional.** Existe billetera **global/default sin Entidad**. Billeteras virtuales extras = Entidad `wallet_platform` + cuenta aprovisionada.
- Q: ¿Bancos en onboarding Hogar? → A: **Sí, paso opcional** (“¿Declarar banco?”). Evita error “falta banco” al depositar. También JIT desde captura como red de seguridad. **Supersedes** la decisión anterior de “no bancos en onboarding”.
- Q: ¿Tarjetas de crédito atadas a un banco? → A: **No.** Entidad `card_issuer` aprovisiona cuenta tarjeta. Formulario: red + nombre (+ últimos 4 + corte opc.).
- Q: ¿Preguntar si es empleado / freelance / sin trabajo? → A: **No en onboarding Hogar.**
- Q: ¿Transferencia entre qué cuentas? → A: Bancos/billeteras/CxC/CxP; debe ≠ haber (V10).

### Session 2026-07-14 evening — Ajustes, Entidades, Cuentas

- Q: ¿Multi-book para FX? → A: **No.** Multi-book futuro = otros ámbitos de vida. Moneda = atributo del Book. Multimoneda = conversión/post-MVP.
- Q: ¿Tipos de Entidad Hogar? → A: `person` | `bank` | `card_issuer` | `wallet_platform` (+ `organization` reservada PRO).
- Q: ¿Quién crea la cuenta contable? → A: **La Entidad**, atómicamente. **MUST NOT** crear a mano `bank` / `card` / billetera virtual. Billetera default del plan = sin entidad.
- Q: ¿Dónde se agregan después del onboarding? → A: **`/entities`**. Onboarding solo pregunta declarar Banco / Tarjetas / Billeteras virtuales.
- Q: ¿Qué es `/accounts` en Hogar? → A: **Admin de categorías de ingreso/egreso** (no saldos, no P&G, no bancos/TC/billeteras virtuales/CxP auto). Puentes = posibilidad PRO.
- Q: ¿Dashboard vs P&G vs Balance en Hogar? → A: **Separados**. `/dashboard` = hub informativo (default **mes actual** vía `monthlySeries`; toggle año; posición condensada; tip/slot Pacho). Análisis elaborado vive en landing `/finances` (sin menú 2 niveles): Estado financiero (P&G), Estado de Balance, historial de apuntes. Filtro por cuentas/entidades en P&G = PRO.
- Q: ¿Ruta de análisis? → A: `/finances` landing explicativa + `/finances/pyg` | `/finances/balance` | `/finances/apuntes`.
- Q: ¿Top N en P&G? → A: **Top 10** fijo (sin selector 5/10/20 en MVP).
- Q: ¿Índice de endeudamiento? → A: **No en specs MVP**; la UI MAY calcularlo en front a partir de saldos de posición (no cambia contrato API).
- Q: ¿Captura vs listado de apuntes? → A: `/entries` = solo captura; historial filtrable en `/finances/apuntes`.
- Q: ¿Datos del mes en Dashboard? → A: Reusar `GET /api/reports/pyg?year=` y tomar `monthlySeries[mesActual]` (sin endpoint MTD nuevo en MVP).
- Q: ¿Por qué entidad en billetera/banco? → A: Trazar comisiones/mantenimiento (“¿cuánto me costó PayPal / el banco este mes?”).
## User Scenarios & Testing *(mandatory)*

### User Story 1 - Primer uso guiado (Priority: P1)

Como usuario Hogar, quiero iniciar sesión, configurar mi libro y opcionalmente declarar banco, tarjetas y billeteras virtuales sin entender códigos contables.

**Why this priority**: La experiencia Hogar debe ser simple desde el primer contacto y evitar “falta banco” en el primer depósito.

**Independent Test**: Usuario completa onboarding (modo + moneda + TZ auto), opcionalmente declara banco/`card_issuer`/`wallet_platform` (cada uno aprovisiona cuenta), llega al dashboard.

**Acceptance Scenarios**:

1. **Given** usuario nuevo tras login, **When** su libro no está inicializado, **Then** es redirigido a `/onboarding`.
2. **Given** onboarding paso moneda/zona, **When** carga el wizard, **Then** la zona horaria se preselecciona desde el browser si está en la lista curada; si no, UTC.
3. **Given** onboarding, **When** elige modo, moneda y timezone y completa el wizard, **Then** el libro queda inicializado.
4. **Given** pasos opcional Banco / Tarjeta / Billetera virtual, **When** declara entidades, **Then** cada una crea su cuenta automáticamente; puede saltar todos.
5. **Given** billetera default del plan, **When** no declara billeteras virtuales, **Then** sigue disponible la billetera global sin Entidad.
6. **Given** onboarding Hogar, **When** completa el flujo, **Then** **MUST NOT** pedirse perfil laboral.
7. **Given** usuario con libro ya inicializado, **When** inicia sesión, **Then** es redirigido a `/dashboard`.

---

### User Story 1b - Ajustes del libro y perfil (Priority: P1)

Como usuario Hogar, quiero corregir zona horaria y mi nombre, ver la moneda fija, sin cambiar email ni contraseña en el MVP.

**Independent Test**: En `/settings`, cambio timezone y fullName; moneda aparece readonly; no hay UI de password/email change.

**Acceptance Scenarios**:

1. **Given** libro inicializado, **When** abro `/settings`, **Then** veo moneda (readonly), timezone (editable), nombre completo (editable).
2. **Given** timezone distinta, **When** guardo, **Then** se persiste vía `PATCH /book/config`.
3. **Given** nombre completo, **When** guardo, **Then** se persiste en el perfil de usuario.
4. **Given** moneda, **When** intento editarla, **Then** no puedo (UI + backend rechazan si ya hubo actividad / locked).

---

### User Story 1c - Entidades (Priority: P1)

Como usuario Hogar, quiero crear bancos, emisores de tarjeta, plataformas de billetera y personas; el sistema crea la cuenta contable asociada.

**Independent Test**: Crear un banco desde `/entities` y ver la cuenta bancaria disponible en plantillas; no puedo crear cuenta `bank` desde `/accounts`.

**Acceptance Scenarios**:

1. **Given** `/entities`, **When** creo `bank` / `card_issuer` / `wallet_platform` / `person`, **Then** se crea Entidad + CuentaUsuario bajo el grupo correcto (atómicamente).
2. **Given** intento `POST /api/accounts` con `tipoCuenta=bank|card`, **When** no es vía provisión de entidad, **Then** 422.
3. **Given** billetera default, **When** listo entidades, **Then** no aparece como entidad (solo virtuales vía `wallet_platform`).

---

### User Story 1d - Cuentas (ingresos/egresos) (Priority: P1)

Como usuario Hogar, quiero administrar categorías de ingreso y egreso propias sin ver saldos ni P&G en esa pantalla.

**Independent Test**: En `/accounts` creo “Suscripciones streaming” como egreso; no veo hero de saldo ni puedo crear banco ahí.

**Acceptance Scenarios**:

1. **Given** `/accounts`, **When** listo, **Then** veo solo cuentas `incomeCategory` / `expenseCategory` (Hogar).
2. **Given** creo categoría, **When** guardo, **Then** `POST /api/accounts` con tipo ingreso/egreso bajo grupo permitido.
3. **Given** Hogar, **When** estoy en `/accounts`, **Then** no creo bancos, tarjetas, billeteras virtuales ni CxP.
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
7. **Given** plantilla `transferencia`, **When** elijo origen y destino, **Then** puedo elegir entre bancos, billeteras/efectivo, CxC y CxP personales; **MUST NOT** permitir la misma cuenta en debe y haber.

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

Como usuario Hogar, quiero un **hub** en `/dashboard` (mes actual + posición) y, cuando necesite profundidad, una landing **Estado** (`/finances`) con P&G, Balance e historial de apuntes — sin menús de segundo nivel.

**Why this priority**: La captura no tiene valor sin retroalimentación simple; el análisis profundo no debe saturar el home.

**Independent Test**: Tras apuntes, el dashboard muestra mes/año y posición; desde `/finances` abro P&G (ejercicio o mes), Balance (saldos) y busco apuntes con filtros.

**Acceptance Scenarios**:

1. **Given** apuntes en el mes actual, **When** abro `/dashboard`, **Then** veo mini P&G del mes (desde `monthlySeries`), totales disponibles/me deben/debo, y CTA hacia `/finances`.
2. **Given** dashboard, **When** elijo vista año, **Then** veo totales del ejercicio sin reemplazar el detalle de `/finances/pyg`.
3. **Given** `/finances`, **When** elijo Estado financiero, **Then** veo P&G con barras ingresos/egresos + línea de saldo por período (ejercicio→meses; mes→días cuando el API lo permita; MVP mes puede mostrar el punto mensual) y pies Top 10 ingresos/egresos sin códigos.
4. **Given** `/finances/balance`, **When** abro, **Then** veo saldos agrupados (disponible, por cobrar, deudas) a partir de posición; la UI MAY mostrar un índice de endeudamiento calculado en cliente (no exigido por contrato API).
5. **Given** `/finances/apuntes`, **When** filtro por fechas/cuentas/montos/descripción, **Then** veo coincidencias ordenadas por `createdAt` desc y puedo editar.
6. **Given** préstamos vía Entidad + CxC, **When** consulto posición en dashboard o balance, **Then** veo “me deben” sin facturas ni aging.

### Edge Cases

- Usuario sin cuentas propias.
- Plantilla requiere una cuenta faltante → mensaje cotidiano; CTA a crear/seleccionar cuenta (sin códigos).
- Error de validación al registrar apunte (monto inválido, sesión expirada).
- Catálogo con muchas plantillas: la UI MUST NOT mostrarlas todas a la vez (capas de navegación).
- Pantalla móvil con gráfico o tabla extensa.
- Usuario autenticado pero onboarding incompleto intenta abrir `/dashboard` → redirect a `/onboarding`.
- Abandonar mini-form con datos parciales → advertir pérdida de cambios cuando haya monto o descripción no vacíos.
- Browser timezone no está en la lista curada → preseleccionar UTC y permitir elegir otra zona.
- Usuario intenta transferir la misma cuenta a sí misma → validación cotidiana (cliente + V10 backend).
- Usuario salta pasos de billeteras/tarjetas → onboarding igualmente completo.
- Mes actual sin movimientos → empty state en dashboard con CTA a `/entries`.
- Serie diaria P&G (vista mes) ausente en API → UI muestra KPIs del mes desde `monthlySeries` y no inventa días.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La UI Hogar MUST ocultar códigos contables por defecto.
- **FR-002**: La UI MUST permitir login, registro y configuración inicial del libro.
- **FR-003**: La UI Hogar MUST permitir declarar medios vía Entidades (onboarding opcional + `/entities`): banco, tarjeta (`card_issuer`), billetera virtual (`wallet_platform`).
- **FR-003a**: El onboarding MUST ofrecer pasos opcionales Banco / Tarjeta / Billetera virtual. Billetera global default sin Entidad permanece.
- **FR-003b**: Tarjeta = Entidad `card_issuer` + cuenta aprovisionada (red, nombre, últimos 4 opc., corte opc.); sin banco requerido.
- **FR-003c**: El onboarding MUST NOT pedir perfil laboral. Bancos SÍ pueden declararse en onboarding (opcional).
- **FR-003d**: `POST /api/accounts` MUST NOT crear `bank` ni `card` directamente; esas cuentas solo vía provisión de Entidad.
- **FR-004**: La UI MUST permitir creación básica de Entidades en `/entities` (`person` | `bank` | `card_issuer` | `wallet_platform`).
- **FR-004a**: Crear Entidad `bank` / `card_issuer` / `wallet_platform` / `person` MUST aprovisionar CuentaUsuario bajo el grupo contable correcto en la misma transacción.
- **FR-004b**: `/accounts` en Hogar MUST administrar solo `incomeCategory` / `expenseCategory` (sin saldos/P&G en esa vista). Puentes = PRO.
- **FR-004c**: `/settings` MUST permitir editar timezone y nombre completo; moneda readonly; sin cambio de email/password en MVP.
- **FR-005**: La UI MUST permitir registrar apuntes principales mediante **plantillas** (template-driven capture), no mediante el constructor secuencial PRO.
- **FR-005a**: La pantalla `/entries` MUST ofrecer tres capas de descubrimiento: frecuentes (4–6), tipo+categoría, y búsqueda; MUST NOT presentar una grilla plana de todo el catálogo.
- **FR-005b**: Tras elegir plantilla, el mini-formulario MUST pedir solo cuenta, monto y descripción breve (fecha default hoy); MUST NOT mostrar líneas contables.
- **FR-005c**: La UI MUST ofrecer “Guardar y registrar otro” (burst entry) conservando plantilla y cuenta.
- **FR-005d**: La UI MUST soportar deep link `/entries/new?plantilla=<code>`.
- **FR-006**: La UI MUST mostrar saldos de posición (disponible / por cobrar / deudas) en dashboard y/o `/finances/balance`.
- **FR-007**: `/dashboard` MUST ser un **hub informativo** (default mes actual desde `monthlySeries`; toggle año; posición condensada; tip o slot post-MVP Pacho). MUST NOT ser el reporte P&G completo.
- **FR-007a**: `/finances` MUST ser landing explicativa (sin submenú) con CTAs a Estado financiero (P&G), Estado de Balance e historial de apuntes.
- **FR-007b**: `/finances/pyg` MUST mostrar resultado P&G, gráfico ingresos/egresos + saldo por período, y pies Top 10 ingresos/egresos sin códigos. Período: ejercicio (meses) o mes (días cuando API disponible). Filtro por cuenta/entidad = fuera de Hogar MVP (PRO).
- **FR-007c**: `/finances/balance` MUST presentar saldos de activo/pasivo relevantes (vía posición). Índice de endeudamiento MAY calcularse solo en UI (no requisito de contrato).
- **FR-007d**: `/finances/apuntes` MUST permitir buscar/listar apuntes con filtros básicos (fechas, cuentas, montos, descripción); orden `createdAt` desc; edición reutiliza flujo de captura.
- **FR-007e**: `/entries` MUST enfocarse en captura; MUST NOT ser el único lugar del historial filtrable.
- **FR-008**: La UI MUST presentar errores de validación en lenguaje cotidiano.
- **FR-009**: Tras login exitoso, la UI MUST redirigir a `/onboarding` si el libro no está inicializado; en caso contrario a `/dashboard`.
- **FR-010**: El onboarding MUST capturar modo (Hogar | PRO), moneda y timezone y persistirlos en la configuración del libro antes de considerar el libro “inicializado”.
- **FR-010a**: La UI MUST preseleccionar timezone del browser cuando el IANA esté en la lista curada (Américas + Europa, incl. `America/Guayaquil`); fallback `UTC`. Labels humanos.
- **FR-011**: La pantalla `/contact` MUST usar `mailto:` (sin backend de contacto en MVP).
- **FR-012**: La UI Hogar MUST permitir registrar y visualizar deudas informales CxC/CxP como cuentas de balance ligadas a Entidades. MUST NOT implementar módulo documental (facturas, aging, aplicación FIFO a documentos) en Sprint 06.
- **FR-013**: La captura Hogar MUST NOT implementar EntryBuilder / progressive disclosure de Sprint 07; ese patrón es exclusivo de Modo PRO.
- **FR-014**: En plantillas con origen y destino (p. ej. `transferencia`), la UI MUST impedir seleccionar la misma cuenta en debe y haber; el backend MUST rechazar ese caso (V10 en 004).

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
- **Dashboard hub**: `/dashboard` — mes/año + posición + tip (no reporte completo).
- **Finances landing**: `/finances` — Estado financiero / Balance / historial apuntes.
- **P&G Hogar**: `/finances/pyg` — reporte elaborado Top 10.
- **Balance Hogar**: `/finances/balance` — lo que tengo / me deben / debo.
- **Historial apuntes**: `/finances/apuntes` — búsqueda filtrable.
- **Libro inicializado**: BookConfig con modo, moneda y timezone definidos por el wizard.
- **Billetera virtual**: Entidad `wallet_platform` + CuentaUsuario `wallet` bajo efectivo/billeteras.
- **Tarjeta Hogar**: Entidad `card_issuer` + CuentaUsuario `card` (+ metadata).
- **Banco Hogar**: Entidad `bank` + CuentaUsuario `bank`.
- **Ajustes**: BookConfig (currency readonly, timeZone) + User.fullName.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede registrar un gasto cotidiano (plantilla frecuente → guardar) en menos de 30 segundos y con ≤4 toques tras abrir `/entries`.
- **SC-002**: Un usuario nuevo puede completar onboarding básico (libro + opcionales) en menos de 10 minutos.
- **SC-003**: 90 % de acciones principales pueden completarse en móvil sin usar vista PRO.
- **SC-004**: Los errores de validación indican al usuario qué corregir sin mencionar detalles técnicos.
- **SC-005**: Tras el primer login, el usuario llega al wizard; tras completar onboarding, el siguiente login llega al dashboard.
- **SC-006**: En ningún momento de la captura Hogar el usuario ve códigos contables ni líneas de asiento.
- **SC-007**: Tras “Guardar y registrar otro”, el usuario puede enviar un segundo apunte de la misma plantilla sin volver a elegir plantilla ni cuenta.

## Assumptions

- El backend de plataforma, catálogos, motor, plantillas y dashboard ya existe.
- Mobile-first significa que las pantallas principales deben ser cómodas en teléfono.
- El diseño visual detallado puede evolucionar durante planificación; mockup de referencia: `apuntes_tador`.
- “Libro inicializado” = existe `BookConfig` con modo + moneda + timezone persistidos y `onboardingCompletedAt` seteado.
- Onboarding Hogar ofrece declarar Banco / Tarjeta / Billetera virtual (Entidad→cuenta); billetera default sin entidad.
- Empleo/empresa no se pregunta en Hogar.
- Multi-book futuro ≠ FX; moneda estable por Book.
- `/accounts` Hogar = categorías PYG; `/entities` = bank/card_issuer/wallet_platform/person.
- Post-MVP: al inicializar libro, el sistema MAY crear vistas materializadas / índices calculados para dashboard limpio; fuera de alcance de implementación en Sprint 06.
- Recuperación de contraseña: UI en alcance de producto; envío real de email depende del follow-up de 001.
- Ranking de plantillas frecuentes MAY empezar en cliente (local) y migrar a backend después; el fallback curado es suficiente para MVP.
- Categorías de chips (Compras, Comida, Hogar, Transporte, Salud, Otros, etc.) se derivan de metadatos/agrupación de plantillas; si faltan metadatos, se usan grupos curados en frontend hasta que el backend los exponga.
- Diagnóstico de plantillas (`/api/dev/plantillas-admin`) es tool de desarrollo; **frontend de administración** de plantillas es post-MVP (ver 004 §12). Hogar Entries usa listado liviano + detalle enriquecido al elegir.
- Entries carga `GET /api/plantillas?mode=hogar` sin `availableAccounts` y solo llama `GET /api/plantillas/:code` al seleccionar (perf; SC-009 en 004).
