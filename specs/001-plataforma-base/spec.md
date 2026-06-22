# Feature Specification: Sprint 01 - Plataforma base

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Sprint 01 from `specs/foundation/estrategia-incremental-sprints.md`: base multiusuario segura con registro, login, recuperación, libro/configuración inicial y aislamiento por usuario.

## Clarifications

### Session 2026-06-22

- Q: ¿Debe verificarse el correo antes de acceder al libro financiero? → A: El usuario debe verificar correo antes de acceder al libro financiero.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro y primer libro (Priority: P1)

Como visitante, quiero crear una cuenta con correo y configurar mi libro inicial para empezar a usar TADOR con moneda definida.

**Why this priority**: Todo el producto depende de usuario, libro y configuración inicial.

**Independent Test**: Crear un usuario nuevo, configurar moneda/formato y verificar que existe un libro propio inicial.

**Acceptance Scenarios**:

1. **Given** un visitante sin cuenta, **When** se registra con correo válido, **Then** se crea un usuario y un libro propio.
2. **Given** un usuario recién creado sin correo verificado, **When** intenta acceder al libro financiero, **Then** el sistema bloquea el acceso hasta completar verificación de correo.
3. **Given** un usuario con correo verificado, **When** define moneda y formato, **Then** esa configuración queda asociada a su libro.

---

### User Story 2 - Acceso seguro (Priority: P1)

Como usuario registrado, quiero iniciar sesión y recuperar mi contraseña para acceder a mi libro sin perder control de mis datos.

**Why this priority**: El MVP es multiusuario y no puede depender de acceso manual o compartido.

**Independent Test**: Un usuario puede iniciar sesión y completar recuperación de contraseña sin acceder a datos de otro usuario.

**Acceptance Scenarios**:

1. **Given** credenciales válidas, **When** el usuario inicia sesión, **Then** accede solo a su libro.
2. **Given** un usuario que olvidó su contraseña, **When** solicita recuperación, **Then** puede completar un flujo seguro para establecer una nueva contraseña.

---

### User Story 3 - Aislamiento entre usuarios (Priority: P1)

Como titular de un libro, quiero que ningún otro usuario pueda consultar o modificar mis datos.

**Why this priority**: La privacidad financiera es principio constitucional y base del SaaS.

**Independent Test**: Crear dos usuarios y verificar que cualquier intento de acceso cruzado es rechazado o no devuelve datos.

**Acceptance Scenarios**:

1. **Given** usuario A y usuario B, **When** B intenta leer datos de A, **Then** el sistema lo impide.
2. **Given** usuario A y usuario B, **When** B intenta modificar datos de A, **Then** el sistema lo impide.

### Edge Cases

- Registro con correo ya existente.
- Recuperación de contraseña con correo no registrado.
- Intento de cambiar moneda después de crear registros financieros.
- Sesión vencida o inválida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir autoregistro con correo.
- **FR-002**: El sistema MUST permitir inicio de sesión de usuarios registrados.
- **FR-003**: El sistema MUST permitir recuperación de contraseña.
- **FR-004**: El sistema MUST crear o asociar un libro inicial por usuario.
- **FR-005**: El sistema MUST guardar moneda y formato monetario del libro.
- **FR-006**: La moneda MUST quedar bloqueada después de existir actividad financiera.
- **FR-007**: Todo dato de libro MUST pertenecer a un usuario.
- **FR-008**: El sistema MUST impedir lectura y escritura cruzada entre usuarios.
- **FR-009**: El sistema MUST requerir verificación de correo antes de permitir acceso al libro financiero.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: Es el sprint base de aislamiento por usuario y privacidad.
- **Accounting Impact**: No crea asientos; prepara el propietario de datos financieros.
- **MVP/Sprint Boundary**: Corresponde solo a plataforma base; no incluye plan de cuentas, asientos ni UI completa.
- **Testing Obligation**: Debe establecer test runner si no existe y cubrir registro, login, recuperación y aislamiento entre usuarios.

### Key Entities *(include if feature involves data)*

- **Usuario**: Persona registrada y propietaria de datos financieros.
- **Libro**: Contenedor financiero del usuario.
- **Configuración del libro**: Moneda, formato y preferencias iniciales.
- **Sesión o acceso**: Estado autenticado que permite operar sobre el libro propio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede completar registro y configuración inicial en menos de 5 minutos.
- **SC-002**: 100 % de pruebas de acceso cruzado entre dos usuarios son rechazadas o devuelven vacío.
- **SC-003**: Un usuario puede recuperar acceso sin intervención manual del operador.
- **SC-004**: La moneda del libro se mantiene estable después de la configuración inicial.

## Assumptions

- El MVP usa correo y contraseña como método inicial de autenticación.
- La verificación de correo es obligatoria antes de acceder al libro financiero.
- Un usuario tiene un libro principal en el MVP.
