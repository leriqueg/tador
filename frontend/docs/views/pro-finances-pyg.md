# View: `/pro/finances/pyg`

| Field | Value |
|-------|-------|
| Route | `/pro/finances/pyg` |
| Mode | `pro` |
| Page module | `frontend/src/pages/FinancesPyg.tsx` (`namespace="pro"`) |
| Shell | `AppShell mode="pro"` |
| Audit status | aligned |
| Last audit | 2026-07-28 |

## Purpose

P&G operativo con filtros por cuenta/entidad; misma base visual de barras que Hogar hasta definir el neto arrastrado.

## Primary use case

1. Filtrar P&G por cuenta y/o entidad.
2. Leer neto e ingresos/gastos del período.
3. Ver top cuentas (año) y barras mensuales (`ProIncomeExpenseBars`).

## APIs / data

| Need | Source |
|------|--------|
| P&G + filters | `GET /api/reports/pyg?year=&accountId=&entityId=` |
| Filter options | `GET /api/accounts`, `GET /api/entities` |

## Composition (must use)

| Role | Component / story | Class |
|------|-------------------|-------|
| Period bars | `ProIncomeExpenseBars` · Charts/Bars · PRO/FinancesPyg | canonical |
| Charts (donuts) | `BreakdownOutcomesDonut` + `BreakdownIncomesDonut` · column | canonical |
| Filters | Inline on page | page-only |

## Density

- Mobile: usable; charts in column.
- Desktop: charts in column; page chrome `max-w-2xl` (optional widen later).
- Bars: same as Hogar until accounting defines “neto arrastrado” (line series). Do not invent the line.
- Policy: [`../hogar-pro-density.md`](../hogar-pro-density.md).

## Gaps / exceptions

- Pending: cumulative / carried net line on `ProIncomeExpenseBars` (accounting definition).

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-22 | debt | Storybook composition defined. |
| 2026-07-26 | aligned | Shared `FinancesPyg` uses BreakdownDonut column. |
| 2026-07-28 | aligned | Separate `ProIncomeExpenseBars` (wraps Hogar bars for now). |
