# Feature Specification: Sprint 02 - Catálogos base

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Sprint 02: plan de cuentas global, plan personalizado, cuentas madre/postables, creación guiada de cuentas, Entidades básicas y tags simples.

## Clarifications

### Session 2026-06-22

- Q: ¿Cómo se materializa el plan de cuentas global en cada usuario? → A: Híbrido: catálogo global compartido + activación/override por usuario cuando una cuenta se usa o personaliza.
- Q: ¿Cómo se relacionan Tags y Entidades en el MVP? → A: Entidades y tags son catálogos separados; pueden duplicar nombres y se resuelve en reportes.

### Session 2026-07-14 evening — Provisión por Entidad

- Q: ¿Tipos Entidad canónicos? → A: `person` | `bank` | `card_issuer` | `wallet_platform` | `organization` (PRO). Renombrar legacy `issuer` → `card_issuer`.
- Q: ¿Quién crea cuentas bank/card/wallet virtual? → A: Solo `POST /api/entities` (provisión atómica). `POST /api/accounts` rechaza `bank`/`card` (422). Billetera global del seed = sin entidad.
- Q: ¿Mapa provisión? → A:
  - `bank` → CuentaUsuario `bank` bajo `11120000`
  - `card_issuer` → `card` bajo `21200000` (+ metadata opcional)
  - `wallet_platform` → `wallet` bajo `11110000`
  - `person` → cuenta bajo `11320000` (CxC personales) con `entidadId`
- Q: ¿Cuentas manuales? → A: `incomeCategory` / `expenseCategory` / `bridge` (bridge PRO) / wallet libre solo si no es plataforma (billetera default ya existe en globales).
## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recibir plan inicial (Priority: P1)

Como usuario nuevo, quiero que TADOR tenga una estructura inicial de cuentas para no empezar desde cero.

**Why this priority**: Las plantillas y reportes dependen de cuentas clasificadas.

**Independent Test**: Crear un usuario nuevo y verificar que puede consultar una estructura inicial de cuentas.

**Acceptance Scenarios**:

1. **Given** un usuario con libro nuevo, **When** consulta su plan, **Then** ve cuentas base disponibles.
2. **Given** Modo Hogar, **When** el usuario navega cuentas, **Then** no necesita ver códigos contables.
3. **Given** una cuenta global no usada, **When** el usuario la selecciona por primera vez, **Then** queda activada en su plan sin copiar todo el catálogo global.

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
3. **Given** una Entidad y un tag con el mismo nombre, **When** se consultan reportes o búsquedas, **Then** el sistema distingue claramente si el filtro apunta a Entidad, tag o ambos.

### Edge Cases

- Cuenta creada bajo cuenta madre no permitida.
- Entidad duplicada para el mismo usuario.
- Tag con nombre igual a una Entidad existente.
- Intento de postear contra una cuenta madre.
- Usuario personaliza una cuenta global ya activada.
- Reporte o búsqueda con nombre duplicado entre Entidad y tag.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mantener un plan de cuentas global base.
- **FR-002**: El sistema MUST permitir plan de cuentas personalizado por usuario.
- **FR-003**: El sistema MUST distinguir cuentas madre de cuentas postables.
- **FR-004**: El sistema MUST permitir creación de cuentas usuario: provisión vía Entidad (bank/card/wallet_platform/person) o manual (`incomeCategory`/`expenseCategory`/`bridge`).
- **FR-004a**: `POST /api/entities` MUST crear Entidad + CuentaUsuario en una transacción según tipo→grupo.
- **FR-004b**: `POST /api/accounts` MUST reject `tipoCuenta` `bank` o `card` (usar flujo entidad).
- **FR-005**: El sistema MUST permitir Entidades con tipos `person` | `bank` | `card_issuer` | `wallet_platform` | `organization`.
- **FR-006**: El sistema MUST permitir tags simples por usuario.
- **FR-007**: El sistema MUST asociar cuentas del usuario con Entidades cuando aplique.
- **FR-008**: El sistema MUST preservar referencia legacy cuando una cuenta venga de migración.
- **FR-009**: El sistema MUST mantener el catálogo global compartido sin copiarlo completo a cada usuario.
- **FR-010**: El sistema MUST activar una cuenta global para un usuario cuando se usa o personaliza.
- **FR-011**: El sistema MUST permitir overrides por usuario sin modificar la definición global.
- **FR-012**: El sistema MUST mantener Entidades y tags como catálogos separados en el MVP.
- **FR-013**: El sistema MUST permitir nombres duplicados entre Entidades y tags, distinguiendo explícitamente el tipo de filtro o referencia.
- **FR-014**: El sistema MUST exponer `GET /api/accounts` que liste las cuentas del usuario autenticado (propias y provisionadas por entidad), sin filtrar por códigos contables en la proyección Hogar.

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
- **Activación de cuenta global**: Relación que habilita una cuenta global dentro del plan de un usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede crear sus cuentas financieras principales en menos de 10 minutos.
- **SC-002**: 100 % de cuentas postables creadas tienen cuenta madre válida.
- **SC-003**: Ninguna cuenta madre permite registros operativos.
- **SC-004**: Dos usuarios pueden tener Entidades con el mismo nombre sin compartir datos.
- **SC-005**: Un usuario puede usar una cuenta global común sin que se copie todo el catálogo a su libro.
- **SC-006**: Una búsqueda o reporte puede diferenciar entre una Entidad y un tag aunque compartan nombre.
- **SC-007**: `GET /api/accounts` devuelve solo las cuentas del usuario autenticado e incluye al menos id, nombre, tipoCuenta y flags de activación/provisión.

## Assumptions

- El plan legacy en foundation es insumo de revisión, no catálogo final.
- El plan de usuario combina cuentas propias y cuentas globales activadas.
- En MVP, Entidad no implica CxC/CxP ni documento.
- En MVP, Entidades y tags son catálogos separados y pueden tener nombres duplicados.
- Hogar oculta códigos, PRO puede mostrarlos.
