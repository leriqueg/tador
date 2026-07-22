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
| Same as Hogar P&G | See [`hogar-finances-pyg.md`](./hogar-finances-pyg.md) | — |
| Filters | Inline `<select>` | page-only |

## Density

- Mobile: usable.
- Desktop: still `max-w-2xl` — **borderline debt** for a PRO report (filters + charts deserve more width).
- PRO-specific: filters exist; layout not yet “report workstation”.

## States to cover

- [x] Loading
- [ ] Empty
- [x] Error
- [x] Populated

## Gaps / exceptions

| Priority | Type | Finding | Action |
|----------|------|---------|--------|
| P0 | elevate | Same chart fork as Hogar (`SimplePieChart` vs donut reference) | Same elevate plan |
| P1 | density | Desktop width too Hogar-like for filtered PRO reports | Widen layout / denser filter bar on `md+` |
| P2 | promote | Filter controls duplicated pattern possible later | Watch 3-use rule |

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-22 | debt | Shares `FinancesPyg`; chart elevate + desktop density. |
