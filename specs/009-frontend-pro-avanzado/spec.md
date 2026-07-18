# Feature Specification: Sprint 09 - Frontend PRO avanzado

**Feature Branch**: `sprint/009-frontend-pro-avanzado`

**Created**: 2026-07-16

**Status**: Clarified (2026-07-17)

**Input**: Densidad analítica PRO + plantillas financieras; diferenciar PRO de Hogar tras Sprint 07. IA v0 permanece en `008` excluida (ADR 0002) — **no renumerar**.

## Clarifications

### Session 2026-07-16 — Alcance inicial

- P&G/Balance base siguen iguales a Hogar; análisis en sección dedicada.
- Conciliación / extractos → post-MVP.
- Organizaciones: `organization` + capacidades (007).

### Session 2026-07-17 — Costos, catálogo, entityId, APIs

- Q: ¿Rutas? → A: **Separadas** `/pro/analysis/banks` | `/cards` | `/portfolio`.
- Q: ¿Seed CSV viejo? → A: **Eliminado**; fuente = `plan-de-cuentas-final.csv` + `plan-de-cuentas-final-seed.json`.
- Q: ¿Nombres financieros? → A: Grupo `62010000` = **Servicios financieros** (Comisiones, Intereses, Multas). Ingreso `41120002` = **Ganancias por invertir**.
- Q: ¿Cómo atribuir costo al banco? → A: **No** cruzar todo egreso vs banco. Al guardar apunte de **ingreso o egreso**, si una línea usa `CuentaUsuario` banco/tarjeta con `entidadId`, el backend setea `apunte.entityId` (no en **transferencias**). Reportes filtran por `entityId` + categorías `62010001–03` / `41120002`.
- Q: ¿Puente legacy para ocultar gasto del banco? → A: **No necesario**; banco = balance, gasto = PYG. El “costo del banco” es recorte analítico, no línea P&G por banco.
- Q: ¿Endpoint de cargos? → A: **No**; reusar `GET /api/apuntes?accountId=&dateFrom=&dateTo=`.
- Q: ¿Series de saldo? → A: Reusar `GET /api/balances/:cuentaId/monthly`.
- Q: ¿Netear comisiones vs ganancias? → A: **No**; mostrar por separado.
- Q: ¿Plantillas nuevas? → A: **Sí** — comisión, interés tarjeta, multa, ganancias por invertir. EntryBuilder PRO debe cubrir esas ramas.
- Q: ¿008 vs 009? → A: Números se mantienen; ADR 0002.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Analizar Bancos (Priority: P1)

Como usuario PRO, quiero ver saldos mensuales de un banco, sus costos de servicios financieros y las ganancias por invertir atribuidas, sin netearlas.

**Independent Test**: Abrir `/pro/analysis/banks`, elegir banco con Entidad; ver barras mensuales; totales anuales Comisiones/Intereses/Multas y Ganancias por invertir separados.

**Acceptance Scenarios**:

1. **Given** cuenta banco con `entidadId`, **When** abro análisis, **Then** veo serie mensual de saldo (API balances monthly).
2. **Given** apuntes egreso con entityId del banco y categorías `62010001–03`, **When** consulto costos, **Then** veo totales por categoría (año).
3. **Given** apuntes ingreso con entityId y `41120002`, **When** consulto, **Then** veo ganancias por invertir aparte (no neto con comisiones).

---

### User Story 2 - Analizar Tarjetas (Priority: P1)

Como usuario PRO, quiero listar movimientos del mes de una tarjeta y ver intereses/multas atribuidos.

**Independent Test**: `/pro/analysis/cards` + apuntes filtrados por accountId; costos `62010002`/`62010003` por entityId emisor.

**Acceptance Scenarios**:

1. **Given** tarjeta, **When** elijo mes, **Then** listado vía apuntes (sin endpoint cargos).
2. **Given** intereses/multas con entityId del emisor, **When** abro costos, **Then** aparecen en totales.

---

### User Story 3 - Analizar Cartera (Priority: P1)

Como usuario PRO, quiero ver saldos por cobrar vs por pagar por Entidad y un listado de registros.

**Independent Test**: `/pro/analysis/portfolio` muestra CxC vs CxP por entidad.

**Acceptance Scenarios**:

1. **Given** entidades con cuentas balance vinculadas, **When** abro cartera, **Then** veo totales cobrar/pagar por entidad.
2. **Given** una entidad, **When** abro detalle, **Then** veo listado de apuntes/movimientos relacionados.

---

### User Story 4 - Filtros P&G (Priority: P1)

Como usuario PRO, quiero filtrar el P&G por cuenta y/o Entidad.

**Independent Test**: `/pro/finances/pyg` acepta filtros; Hogar no los muestra.

**Acceptance Scenarios**:

1. **Given** PRO, **When** filtro por `accountId` o `entityId`, **Then** totales/serie reflejan el filtro.
2. **Given** Hogar, **When** abro P&G, **Then** no hay UI de esos filtros.

---

### User Story 5 - Plantillas financieras + auto-entityId (Priority: P1)

Como usuario, quiero registrar comisión/interés/multa/ganancias por invertir con plantillas, y que la Entidad del banco/tarjeta se asigne sola en ingreso/egreso.

**Independent Test**: Cada plantilla nueva genera asiento; entityId = entidad de la cuenta pago/cobro; transferencia no auto-asigna.

**Acceptance Scenarios**:

1. **Given** plantilla `comision_bancaria`, **When** elijo banco con entidad, **Then** apunte guarda `entityId` de esa cuenta.
2. **Given** `transferencia`, **When** muevo entre bancos, **Then** **MUST NOT** forzar auto-entityId por esta regla (comportamiento de transferencia sin atribución de costo).
3. **Given** EntryBuilder PRO, **When** elijo rama egreso financiero / ingreso ganancias, **Then** puedo completar el mismo flujo.

### Edge Cases

- Banco sin `entidadId` → costos por entity vacíos; CTA a vincular/crear entidad.
- Apuntes históricos sin entityId → MAY backfill solo si hay una única cuenta banco/tarjeta con entidad en el asiento (opcional follow-up).
- Usuario Hogar en `/pro/analysis/*` → redirect guard (007).

## Requirements *(mandatory)*

- **FR-001**: Rutas `/pro/analysis/banks`, `/pro/analysis/cards`, `/pro/analysis/portfolio`.
- **FR-002**: Bancos MUST usar `GET /api/balances/:cuentaId/monthly` para series.
- **FR-003**: Costos banco/tarjeta MUST agregarse por `entityId` + códigos `62010001|62010002|62010003`.
- **FR-004**: Ganancias por invertir MUST agregarse por `entityId` + `41120002`, mostradas **sin netear** con costos.
- **FR-005**: Movimientos de tarjeta MUST listarse con `GET /api/apuntes` filtrado; MUST NOT crear endpoint “cargos”.
- **FR-006**: Cartera MUST exponer CxC vs CxP por Entidad (extender position o endpoint hermano liviano).
- **FR-007**: P&G PRO MUST aceptar filtros `accountId` y/o `entityId` (extensión de `/api/reports/pyg` o query equivalente).
- **FR-008**: Plantillas MUST existir: `comision_bancaria`, `interes_tarjeta`, `multa_financiera`, `ganancia_inversion`.
- **FR-009**: En `POST /api/apuntes` de plantillas **ingreso/egreso** (no transferencia), si falta `entityId` y una línea usa cuenta usuario con `entidadId` (bank/card), el servidor MUST setear `entityId` desde esa cuenta.
- **FR-010**: Transferencias MUST NOT aplicar la auto-asignación de FR-009.
- **FR-011**: EntryBuilder PRO MUST permitir las ramas de estas plantillas/categorías.
- **FR-012**: Catálogo MUST usar nombres Servicios financieros / Ganancias por invertir (seed JSON sincronizado).

### Out of scope

- Conciliación bancaria/tarjeta con extractos.
- Facturas / aging documental.
- IA v0 (`008`).
- Endpoint dedicado de “cargos”.

### Constitution Alignment

- Tenant isolation; decimal money; plantillas versionadas; Clean Architecture.
- Testing: auto-entityId (ingreso/egreso vs transferencia), plantillas, vistas analysis smoke, filtros P&G.

## Success Criteria

- **SC-001**: Usuario ve comisiones y ganancias por invertir del mismo banco **en cifras separadas**.
- **SC-002**: Comisión registrada vía plantilla aparece en Analizar Bancos sin cruce full-ledger.
- **SC-003**: Listado tarjeta usa solo apuntes filtrados.
- **SC-004**: Transferencia entre bancos no inventa entityId de costo.
- **SC-005**: Filtro P&G por entidad reduce totales de forma demostrable.

## Assumptions

- Sprint 007 cerrado (namespaces, EntryBuilder, capabilities).
- Cuentas bank/card provisionadas cargan `entidadId`.
- Re-seed / migrate nombres de catálogo en entornos existentes vía upsert por código.
