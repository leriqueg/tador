# View: `/pro/finances/pyg`

| Field | Value |
|-------|-------|
| Route | `/pro/finances/pyg` |
| Mode | `pro` |
| Page module | `frontend/src/pages/FinancesPyg.tsx` (`namespace="pro"`) |
| Shell | `AppShell mode="pro"` |
| Audit status | debt |
| Last audit | 2026-07-22 |

## Purpose

P&G operativo con filtros por cuenta/entidad; misma base visual que Hogar hoy.

## Primary use case

1. Filtrar P&G por cuenta y/o entidad.
2. Leer neto e ingresos/gastos del período.
3. Ver top cuentas (año) y barras mensuales.

## APIs / data

| Need | Source |
|------|--------|
| P&G + filters | `GET /api/reports/pyg?year=&accountId=&entityId=` |
| Filter options | `GET /api/accounts`, `GET /api/entities` |

## Composition (must use)

| Role | Component / story | Class |
|------|-------------------|-------|
| Charts | `BreakdownDonut` ×2 · **PRO/FinancesPyg** (column) | canonical composition |
| Filters | Inline on page | page-only |
| Product today | `SimplePieChart` grid | exception until wired |

## Density

- Mobile: usable; charts in column.
- Desktop: view story uses `max-w-3xl`; page may widen further later — charts stay column.
- PRO-specific: account/entity filters on page.

## Gaps / exceptions

| Priority | Type | Finding | Action |
|----------|------|---------|--------|
| P0 | apply | Same as Hogar — wire BreakdownDonut column | See hogar-finances-pyg |
| P1 | density | Page chrome still `max-w-2xl` | Optional widen on `md+` |

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-22 | debt | Aligned to Storybook IA; waiting on product wire. |
