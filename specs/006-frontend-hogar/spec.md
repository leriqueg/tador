# Feature Specification: Sprint 06 - Frontend Hogar

**Feature Branch**: `sprint/006-frontend-hogar`

**Created**: 2026-06-22

**Status**: Clarified (draft → decisions locked 2026-07-12)

**Input**: Sprint 06: onboarding, login, configuración, creación guiada de cuentas/entidades, apuntes, saldos y dashboard para Modo Hogar.

## Clarifications

### Session 2026-07-12

- Q: ¿A dónde redirige un login exitoso? → A: **Primer login / libro sin inicializar** → `/onboarding`. **En cualquier otro caso** → `/dashboard`.
- Q: ¿Qué inicializa el onboarding? → A: Wizard obligatorio al primer uso: elección de **modo (Hogar | PRO)**, **moneda** y **zona horaria (UTC por defecto)**; con eso queda el libro listo. Post-MVP, al crear/inicializar el libro MAY generarse vistas materializadas / índices calculados para un dashboard limpio.
- Q: ¿Verificación de email en UX? → A: **Deshabilitada temporalmente** hasta post-MVP (regla de negocio en plataforma-base). El producto no bloquea por correo no verificado en el MVP.
- Q: ¿Recuperación de contraseña? → A: **Sí**, se necesita vista UX; depende de configuración de envío de email. Delta documentado en `001-plataforma-base` para implementar después.
- Q: ¿Contacto? → A: Pantalla con **`mailto:`** (sin API de contacto en MVP).
- Q: ¿Hogar muestra CxC / CxP? → A: **Sí**, como saldos de cuentas de balance vinculadas a Entidades (préstamos a amigos, deudas informales). **No** incluye el módulo documental de facturas/aging/aplicación de pagos (eso es PRO / post-MVP).

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

Como usuario Hogar, quiero registrar ingresos, gastos, compras con tarjeta y traspasos desde frases o formularios simples.

**Why this priority**: Es el flujo diario principal de TADOR.

**Independent Test**: Registrar apuntes principales desde UI y verificar confirmación visible.

**Acceptance Scenarios**:

1. **Given** cuentas configuradas, **When** registro un gasto, **Then** veo confirmación clara.
2. **Given** una tarjeta y puente, **When** registro una compra con tarjeta, **Then** queda registrada sin mostrar líneas contables.

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
- Plantilla requiere una cuenta faltante.
- Error de validación al registrar apunte.
- Pantalla móvil con gráfico o tabla extensa.
- Usuario autenticado pero onboarding incompleto intenta abrir `/dashboard` → redirect a `/onboarding`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La UI Hogar MUST ocultar códigos contables por defecto.
- **FR-002**: La UI MUST permitir login, registro y configuración inicial del libro.
- **FR-003**: La UI MUST permitir creación guiada de cuentas básicas.
- **FR-004**: La UI MUST permitir creación básica de Entidades.
- **FR-005**: La UI MUST permitir registrar apuntes principales.
- **FR-006**: La UI MUST mostrar saldos actuales.
- **FR-007**: La UI MUST mostrar dashboard con panel PYG anual y panel de posición (**disponible**, **por cobrar**, **por pagar**) en modo Hogar, en lenguaje cotidiano (sin códigos).
- **FR-008**: La UI MUST presentar errores de validación en lenguaje cotidiano.
- **FR-009**: Tras login exitoso, la UI MUST redirigir a `/onboarding` si el libro no está inicializado; en caso contrario a `/dashboard`.
- **FR-010**: El onboarding MUST capturar modo (Hogar | PRO), moneda y timezone (default `UTC`) y persistirlos en la configuración del libro antes de considerar el libro “inicializado”.
- **FR-011**: La pantalla `/contact` MUST usar `mailto:` (sin backend de contacto en MVP).
- **FR-012**: La UI Hogar MUST permitir registrar y visualizar deudas informales CxC/CxP como cuentas de balance ligadas a Entidades. MUST NOT implementar módulo documental (facturas, aging, aplicación FIFO a documentos) en Sprint 06.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: La UI solo muestra datos del usuario autenticado.
- **Accounting Impact**: La UI no crea lógica contable propia; usa plantillas y backend. CxC/CxP informales = cuentas de balance + Entidad (constitución V).
- **MVP/Sprint Boundary**: No incluye PRO avanzado documental ni IA v0. Verificación de email diferida (ver 001).
- **Testing Obligation**: Debe probar flujos principales de onboarding, apunte, saldos y dashboard.

### Key Entities *(include if feature involves data)*

- **Pantalla Hogar**: Interfaz simplificada.
- **Formulario de apunte**: Captura de intención cotidiana.
- **Saldos visibles**: Resumen de cuentas del usuario.
- **Dashboard MVP**: Reporte con panel PYG y panel de posición presentado al usuario.
- **Libro inicializado**: BookConfig con modo, moneda y timezone definidos por el wizard.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede registrar un gasto cotidiano en menos de 30 segundos.
- **SC-002**: Un usuario nuevo puede completar onboarding básico en menos de 10 minutos.
- **SC-003**: 90 % de acciones principales pueden completarse en móvil sin usar vista PRO.
- **SC-004**: Los errores de validación indican al usuario qué corregir sin mencionar detalles técnicos.
- **SC-005**: Tras el primer login, el usuario llega al wizard; tras completar onboarding, el siguiente login llega al dashboard.

## Assumptions

- El backend de plataforma, catálogos, motor, plantillas y dashboard ya existe.
- Mobile-first significa que las pantallas principales deben ser cómodas en teléfono.
- El diseño visual detallado puede evolucionar durante planificación.
- “Libro inicializado” = existe `BookConfig` con modo + moneda + timezone persistidos (campos a extender en schema si aún faltan).
- Post-MVP: al inicializar libro, el sistema MAY crear vistas materializadas / índices calculados para dashboard limpio; fuera de alcance de implementación en Sprint 06.
- Recuperación de contraseña: UI en alcance de producto; envío real de email depende del follow-up de 001.
