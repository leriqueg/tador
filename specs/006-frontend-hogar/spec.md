# Feature Specification: Sprint 06 - Frontend Hogar

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Sprint 06: onboarding, login, configuración, creación guiada de cuentas/entidades, apuntes, saldos y dashboard para Modo Hogar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Primer uso guiado (Priority: P1)

Como usuario Hogar, quiero iniciar sesión, configurar mi libro y preparar cuentas básicas sin entender códigos contables.

**Why this priority**: La experiencia Hogar debe ser simple desde el primer contacto.

**Independent Test**: Un usuario completa onboarding y crea una cuenta básica sin ver códigos contables.

**Acceptance Scenarios**:

1. **Given** usuario nuevo, **When** entra por primera vez, **Then** puede configurar moneda y crear cuentas iniciales guiadas.

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

Como usuario Hogar, quiero ver saldos actuales y dashboard PYG para entender mi situación.

**Why this priority**: La captura no tiene valor sin retroalimentación simple.

**Independent Test**: Después de registrar apuntes, ver saldos y dashboard actualizados.

**Acceptance Scenarios**:

1. **Given** apuntes registrados, **When** abro saldos, **Then** veo cuentas con importes actuales.
2. **Given** apuntes con PYG, **When** abro dashboard, **Then** veo resumen anual.

### Edge Cases

- Usuario sin cuentas propias.
- Plantilla requiere una cuenta faltante.
- Error de validación al registrar apunte.
- Pantalla móvil con gráfico o tabla extensa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La UI Hogar MUST ocultar códigos contables por defecto.
- **FR-002**: La UI MUST permitir login y configuración inicial.
- **FR-003**: La UI MUST permitir creación guiada de cuentas básicas.
- **FR-004**: La UI MUST permitir creación básica de Entidades.
- **FR-005**: La UI MUST permitir registrar apuntes principales.
- **FR-006**: La UI MUST mostrar saldos actuales.
- **FR-007**: La UI MUST mostrar dashboard PYG anual.
- **FR-008**: La UI MUST presentar errores de validación en lenguaje cotidiano.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: La UI solo muestra datos del usuario autenticado.
- **Accounting Impact**: La UI no crea lógica contable propia; usa plantillas y backend.
- **MVP/Sprint Boundary**: No incluye PRO avanzado ni IA v0.
- **Testing Obligation**: Debe probar flujos principales de onboarding, apunte, saldos y dashboard.

### Key Entities *(include if feature involves data)*

- **Pantalla Hogar**: Interfaz simplificada.
- **Formulario de apunte**: Captura de intención cotidiana.
- **Saldos visibles**: Resumen de cuentas del usuario.
- **Dashboard PYG**: Reporte anual presentado al usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede registrar un gasto cotidiano en menos de 30 segundos.
- **SC-002**: Un usuario nuevo puede completar onboarding básico en menos de 10 minutos.
- **SC-003**: 90 % de acciones principales pueden completarse en móvil sin usar vista PRO.
- **SC-004**: Los errores de validación indican al usuario qué corregir sin mencionar detalles técnicos.

## Assumptions

- El backend de plataforma, catálogos, motor, plantillas y dashboard ya existe.
- Mobile-first significa que las pantallas principales deben ser cómodas en teléfono.
- El diseño visual detallado puede evolucionar durante planificación.
