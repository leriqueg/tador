# Feature Specification: Sprint 09 - Frontend PRO avanzado

**Feature Branch**: _(futuro — no activo)_

**Created**: 2026-07-16

**Status**: Deferred (post Sprint 07). Decisiones de producto capturadas; implementación después de PRO ligero.

**Input**: Densidad analítica PRO sin ERP documental ni conciliación en el primer corte.

## Purpose

Separar del Sprint 07 (ligero) las capacidades analíticas que el usuario ya anticipó, para no hinchar el MVP de captura/árbol/asiento.

## Decisions locked (2026-07-16)

### Reportes base

- P&G y Balance del Sprint 07 permanecen **iguales a Hogar**.
- Este sprint agrega una **sección de análisis** dedicada (no densificar los paneles base).

### Analizar Bancos

- Reporte visual de saldos mensuales (barras / mes).
- Registro de costos operativos; total anual de mantenimiento.
- Proceso de **conciliación y cierre** → **post-MVP** (fuera incluso de 009 si el tiempo aprieta; mínimo: vistas de saldo/costos).

### Analizar Tarjetas de crédito

- Listado mensual de cargos.
- Registro de costos operativos, intereses, multas.
- Conciliación y cierre → **post-MVP**.

### Analizar Cartera Entidades

- Saldos CxC vs CxP.
- Listado de registros por Entidad/`organization`.
- Sin facturas ni aging documental (sigue post-MVP).

### Organizaciones

- Mismo modelo que 007: `organization` + capacidades; sin tipos `client`/`supplier`.
- Filtros de informes por entidad/cuenta entran aquí (no en 007).

## User Stories (draft)

### US1 - Analizar Bancos (P1)

Ver evolución mensual de saldos y costos de mantenimiento por banco/cuenta.

### US2 - Analizar Tarjetas (P1)

Ver cargos del período e intereses/multas asociados.

### US3 - Analizar Cartera (P1)

Comparar por cobrar vs por pagar y listar movimientos por Entidad.

### US4 - Filtros P&G por cuenta/entidad (P2)

Extender P&G PRO con filtros que Hogar no expone.

## Out of scope

- Conciliación bancaria/tarjeta con extractos (post-MVP explícito).
- Facturas / aging / aplicación de pagos documentales.
- IA v0 (`008`).
- Cambiar captura EntryBuilder del 007 (salvo ajustes menores de deep-link a análisis).

## Dependencies

- Sprint 07 cerrado (namespaces `/pro/*`, entidades con capacidades, árbol, EntryBuilder).
- APIs de reportes existentes + posibles series por cuenta (gaps a inventariar en plan).

## Success criteria (draft)

- Usuario PRO responde “¿cuánto me cuesta el banco este año?” y “¿qué me deben vs qué debo?” sin salir a hojas externas.
- Conciliación no es requisito de cierre de 009 si se marca explícitamente follow-up.

## Next Spec Kit steps (when activated)

1. `/speckit-clarify` residual (series API, UX de costos).
2. `/speckit-plan` + inventory rutas `/pro/analysis/...`.
3. `/speckit-tasks` + implementación TDD.
