# Feature Specification: Sprint 02 - Catálogos base

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Sprint 02: plan de cuentas global, plan personalizado, cuentas madre/postables, creación guiada de cuentas, Entidades básicas y tags simples.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recibir plan inicial (Priority: P1)

Como usuario nuevo, quiero que TADOR tenga una estructura inicial de cuentas para no empezar desde cero.

**Why this priority**: Las plantillas y reportes dependen de cuentas clasificadas.

**Independent Test**: Crear un usuario nuevo y verificar que puede consultar una estructura inicial de cuentas.

**Acceptance Scenarios**:

1. **Given** un usuario con libro nuevo, **When** consulta su plan, **Then** ve cuentas base disponibles.
2. **Given** Modo Hogar, **When** el usuario navega cuentas, **Then** no necesita ver códigos contables.

---

### User Story 2 - Crear cuentas propias guiadas (Priority: P1)

Como usuario, quiero crear mis bancos, tarjetas, billeteras y cuentas puente con guía simple.

**Why this priority**: El plan global no debe traer cuentas concretas del usuario.

**Independent Test**: Crear una cuenta bancaria, tarjeta, billetera y puente bajo la rama correcta.

**Acceptance Scenarios**:

1. **Given** una Entidad financiera, **When** creo una cuenta bancaria, **Then** queda bajo la rama de bancos y asociada a esa Entidad.
2. **Given** una tarjeta nueva, **When** la creo, **Then** queda como cuenta de deuda asociada a una Entidad emisora.

---

### User Story 3 - Gestionar Entidades y tags (Priority: P2)

Como usuario, quiero registrar nombres propios y etiquetas para relacionarlos con cuentas y apuntes futuros.

**Why this priority**: Bancos, personas, emisores y plataformas deben existir antes de muchas plantillas.

**Independent Test**: Crear una Entidad y usarla como referencia sin crear CxC/CxP formal.

**Acceptance Scenarios**:

1. **Given** una persona llamada Mariuxi, **When** la creo como Entidad, **Then** queda disponible como dimensión de referencia.
2. **Given** una etiqueta libre, **When** la creo, **Then** puede usarse para contexto no estructurado.

### Edge Cases

- Cuenta creada bajo cuenta madre no permitida.
- Entidad duplicada para el mismo usuario.
- Tag con nombre igual a una Entidad existente.
- Intento de postear contra una cuenta madre.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mantener un plan de cuentas global base.
- **FR-002**: El sistema MUST permitir plan de cuentas personalizado por usuario.
- **FR-003**: El sistema MUST distinguir cuentas madre de cuentas postables.
- **FR-004**: El sistema MUST permitir creación guiada de banco, tarjeta, billetera y cuenta puente.
- **FR-005**: El sistema MUST permitir Entidades con tipo y capacidades iniciales.
- **FR-006**: El sistema MUST permitir tags simples por usuario.
- **FR-007**: El sistema MUST asociar cuentas del usuario con Entidades cuando aplique.
- **FR-008**: El sistema MUST preservar referencia legacy cuando una cuenta venga de migración.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: Cuentas, Entidades y tags pertenecen a un usuario.
- **Accounting Impact**: No crea asientos; define las cuentas que podrán recibir líneas.
- **MVP/Sprint Boundary**: No incluye plantillas, asientos, CxC/CxP ni facturas.
- **Testing Obligation**: Debe probar propiedad por usuario, postabilidad y creación guiada.

### Key Entities *(include if feature involves data)*

- **Cuenta global**: Estructura base del catálogo.
- **Cuenta de usuario**: Cuenta concreta creada o activada para un libro.
- **Entidad**: Objeto con nombre propio.
- **Tag**: Etiqueta contextual simple.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede crear sus cuentas financieras principales en menos de 10 minutos.
- **SC-002**: 100 % de cuentas postables creadas tienen cuenta madre válida.
- **SC-003**: Ninguna cuenta madre permite registros operativos.
- **SC-004**: Dos usuarios pueden tener Entidades con el mismo nombre sin compartir datos.

## Assumptions

- El plan legacy en foundation es insumo de revisión, no catálogo final.
- En MVP, Entidad no implica CxC/CxP ni documento.
- Hogar oculta códigos, PRO puede mostrarlos.
