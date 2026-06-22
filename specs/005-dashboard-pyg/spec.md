# Feature Specification: Sprint 05 - Dashboard PYG

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Sprint 05 and `specs/foundation/reporte-pyg-mvp.md`: único reporte obligatorio del MVP.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver resultado anual (Priority: P1)

Como usuario, quiero ver ingresos, gastos y neto de un ejercicio para entender rápidamente mi resultado anual.

**Why this priority**: El MVP no puede perder el dashboard PYG que ya daba valor en el legacy.

**Independent Test**: Crear asientos de ingresos y egresos en un ejercicio y verificar totales anuales.

**Acceptance Scenarios**:

1. **Given** un ejercicio con ingresos y egresos, **When** consulto el dashboard, **Then** veo total ingresos, total gastos y neto.

---

### User Story 2 - Ver evolución mensual (Priority: P1)

Como usuario, quiero comparar ingresos, egresos y saldo por mes para detectar patrones durante el año.

**Why this priority**: El gráfico mensual es la lectura visual principal del PYG MVP.

**Independent Test**: Crear datos en varios meses y verificar serie mensual de ingresos, egresos y saldo.

**Acceptance Scenarios**:

1. **Given** movimientos en varios meses, **When** consulto el gráfico mensual, **Then** veo ingresos positivos, egresos positivos y saldo mensual.

---

### User Story 3 - Ver Top 10 ingresos y egresos (Priority: P2)

Como usuario, quiero ver mis principales categorías de ingresos y egresos para entender qué explica el resultado.

**Why this priority**: El Top 10 reemplaza análisis manual básico sin requerir reportes avanzados.

**Independent Test**: Crear más de diez cuentas con importes y verificar que se muestran las diez más altas.

**Acceptance Scenarios**:

1. **Given** varias cuentas de ingreso, **When** consulto desglose, **Then** veo Top 10 ingresos acumulados.
2. **Given** varias cuentas de egreso, **When** consulto desglose, **Then** veo Top 10 egresos acumulados.

### Edge Cases

- Ejercicio sin datos.
- Meses sin ingresos o sin egresos.
- Saldo mensual negativo.
- Cuentas puente con saldo pero sin PYG.
- Más de diez cuentas con importes relevantes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir seleccionar un ejercicio anual.
- **FR-002**: El sistema MUST mostrar total ingresos del ejercicio.
- **FR-003**: El sistema MUST mostrar total egresos del ejercicio como valor positivo.
- **FR-004**: El sistema MUST mostrar neto del ejercicio.
- **FR-005**: El sistema MUST producir serie mensual de ingresos, egresos y saldo.
- **FR-006**: El sistema MUST producir Top 10 de ingresos acumulados por cuenta.
- **FR-007**: El sistema MUST producir Top 10 de egresos acumulados por cuenta.
- **FR-008**: El dashboard MUST calcular PYG desde cuentas de ingreso/egreso, no desde cuentas puente o medios de pago.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: El reporte solo agrega datos del usuario autenticado.
- **Accounting Impact**: No crea asientos; lee líneas y cuentas de ingreso/egreso.
- **MVP/Sprint Boundary**: Solo dashboard PYG anual; no incluye reportes avanzados, exportación ni filtros por entidad/tag.
- **Testing Obligation**: Debe probar totales, series mensuales, Top 10 y exclusión de cuentas puente.

### Key Entities *(include if feature involves data)*

- **Ejercicio**: Año consultado.
- **Dato mensual PYG**: Ingresos, egresos y saldo de un mes.
- **Desglose Top 10**: Cuentas de ingreso o egreso ordenadas por acumulado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El usuario ve resumen anual en menos de 3 segundos para un libro piloto.
- **SC-002**: 100 % de meses del ejercicio aparecen en la serie, incluso si no tienen datos.
- **SC-003**: Las cuentas puente no alteran los totales PYG.
- **SC-004**: El Top 10 ordena correctamente de mayor a menor acumulado.

## Assumptions

- La visualización usa barras verdes para ingresos, barras rojas para egresos y línea negra para saldo.
- El formato monetario respeta la configuración del usuario.
- Filtros por Entidad, Tag o centro quedan fuera del MVP.
