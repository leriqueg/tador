# Feature Specification: Sprint 05 - Dashboard PYG y Posición

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Sprint 05, `specs/foundation/reporte-pyg-mvp.md` y constitución v1.3.0: dashboard obligatorio del MVP con panel PYG y panel de posición separados.

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

---

### User Story 4 - Ver qué tengo y qué debo (Priority: P2)

Como usuario, quiero ver junto al resultado del ejercicio un resumen de mi posición: cuánto tengo disponible (efectivo, bancos), cuánto me deben y cuánto debo (tarjetas, préstamos, cuentas por pagar), para no confundir "tener dinero" con "estar bien".

**Why this priority**: El MVP soporta deudas por cobrar/pagar como cuentas de balance vinculadas a Entidades; el dashboard debe exponer esa lectura sin esperar al módulo formal de CxC/CxP.

**Independent Test**: Crear cuentas de activo líquido, por cobrar y pasivo con saldos, y verificar los tres totales del panel de posición sin que alteren los totales PYG.

**Acceptance Scenarios**:

1. **Given** cuentas de banco/efectivo con saldo, **When** consulto el dashboard, **Then** veo total disponible.
2. **Given** cuentas por cobrar y pasivos con saldo, **When** consulto el dashboard, **Then** veo total por cobrar y total por pagar como lecturas separadas del panel PYG.

### Edge Cases

- Ejercicio sin datos.
- Meses sin ingresos o sin egresos.
- Saldo mensual negativo.
- Cuentas puente con saldo pero sin PYG.
- Más de diez cuentas con importes relevantes.
- Usuario sin cuentas de pasivo o por cobrar (panel de posición muestra ceros).
- Movimientos que afectan balance y PYG en el mismo asiento (cada panel refleja solo su fuente).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir seleccionar un ejercicio anual para el panel PYG.
- **FR-002**: El sistema MUST mostrar total ingresos del ejercicio.
- **FR-003**: El sistema MUST mostrar total egresos del ejercicio como valor positivo.
- **FR-004**: El sistema MUST mostrar neto del ejercicio.
- **FR-005**: El sistema MUST producir serie mensual de ingresos, egresos y saldo.
- **FR-006**: El sistema MUST producir Top 10 de ingresos acumulados por cuenta.
- **FR-007**: El sistema MUST producir Top 10 de egresos acumulados por cuenta.
- **FR-008**: El panel PYG MUST calcularse desde cuentas de ingreso/egreso, no desde cuentas puente, medios de pago ni saldos de balance.
- **FR-009**: El dashboard MUST incluir un panel de posición con: total disponible (cuentas de activo líquido), total por cobrar (activos por cobrar) y total por pagar (pasivos: tarjetas, préstamos, cuentas por pagar).
- **FR-010**: El panel de posición MUST calcularse desde saldos de cuentas de balance a la fecha de consulta; MUST NOT usar cuentas de ingreso/egreso.
- **FR-011**: El panel PYG y el panel de posición MUST presentarse como lecturas separadas; ningún total de un panel se deriva del otro.

### Constitution Alignment *(mandatory for TADOR)*

- **Tenant & Privacy**: El reporte solo agrega datos del usuario autenticado.
- **Accounting Impact**: No crea asientos; lee líneas y saldos existentes según el panel.
- **MVP/Sprint Boundary**: Incluye panel PYG anual y panel de posición agregada; no incluye reportes avanzados, exportación, estados de cuenta por Entidad ni filtros por entidad/tag.
- **Testing Obligation**: Debe probar totales PYG, series mensuales, Top 10, exclusión de cuentas puente en PYG, totales de posición y separación de fuentes entre paneles.

### Key Entities *(include if feature involves data)*

- **Ejercicio**: Año consultado para el panel PYG.
- **Dato mensual PYG**: Ingresos, egresos y saldo de un mes.
- **Desglose Top 10**: Cuentas de ingreso o egreso ordenadas por acumulado.
- **Posición financiera**: Agregados de saldo por clasificación de balance (disponible, por cobrar, por pagar).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El usuario ve resumen anual PYG en menos de 3 segundos para un libro piloto.
- **SC-002**: 100 % de meses del ejercicio aparecen en la serie, incluso si no tienen datos.
- **SC-003**: Las cuentas puente no alteran los totales PYG.
- **SC-004**: El Top 10 ordena correctamente de mayor a menor acumulado.
- **SC-005**: El panel de posición refleja saldos actuales de balance sin incluir cuentas de ingreso/egreso.
- **SC-006**: Cambiar saldos de balance no altera totales PYG del ejercicio, y viceversa.

## Assumptions

- La visualización PYG usa barras verdes para ingresos, barras rojas para egresos y línea negra para saldo mensual.
- El panel de posición muestra tres totales agregados sin desglose por Entidad en el MVP.
- El formato monetario respeta la configuración del usuario.
- Filtros por Entidad, Tag, centro o estado de cuenta por tercero quedan fuera del MVP.
