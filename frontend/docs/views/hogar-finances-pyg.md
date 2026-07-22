# View: `/hogar/finances/pyg`

| Field | Value |
|-------|-------|
| Route | `/hogar/finances/pyg` |
| Mode | `hogar` |
| Page module | `frontend/src/pages/FinancesPyg.tsx` (`namespace="hogar"`) |
| Shell | `AppShell mode="hogar"` |
| Audit status | debt |
| Last audit | 2026-07-22 |

## Purpose

Mostrar el resultado financiero del período (ingresos, gastos, neto) y el top de cuentas, en lenguaje claro.

## Primary use case

1. Elegir ejercicio o mes y ver neto + totales.
2. Comparar ingresos vs egresos en barras mensuales.
3. En vista año, revisar top 10 egresos e ingresos por cuenta (sin códigos).

## APIs / data

| Need | Source |
|------|--------|
| P&G report | `GET /api/reports/pyg?year=` |
| Book currency | `useBookGate` → `BookConfig.currency` |

## Composition (must use)

| Role | Component / story | Class |
|------|-------------------|-------|
| Shell | `AppShell` · Hogar/P0 → Shell | canonical |
| Errors | `ValidationMessage` · Hogar/P0 | canonical |
| Top cuentas pie | `SimplePieChart` · **no dedicated story** | page-only → **elevate** |
| Brand donut look | `PeriodBreakdownDonut` · DataViz/Advanced | **reference** (do not wire as-is) |
| Monthly bars | Inline in page (not `MonthlyEvolutionChart`) | page-only; reference story exists separately |
| Summary card | Inline in page | page-only |

## Density

- Mobile: `max-w-2xl` — acceptable for Hogar clarity.
- Desktop: same width; fine for Hogar (not a dense report workstation).
- PRO-specific: N/A on this doc — see [`pro-finances-pyg.md`](./pro-finances-pyg.md).

## States to cover

- [x] Loading (text “Cargando…”)
- [ ] Empty (no dedicated empty for zero activity beyond empty pies)
- [x] Error (`ValidationMessage`)
- [x] Populated

## Gaps / exceptions

| Priority | Type | Finding | Action |
|----------|------|---------|--------|
| P0 | elevate | Product pie (`SimplePieChart`) ≠ Storybook donut look (`PeriodBreakdownDonut` reference) | Elevate data-driven donut (tokens, hole+total, legend) as **canonical**; replace pies in P&G; add Storybook story; clear [`ui-exceptions`](../ui-exceptions.md) row |
| P1 | elevate | “Ingresos vs egresos” bars are page-inline; Storybook has `MonthlyEvolutionChart` (reference, different API/shape) | Decide: restyle inline bars toward reference **or** promote a data-driven bar chart component |
| P2 | states | Weak empty state when year has no movements | Add empty copy + CTA to apuntes |
| P2 | story | `SimplePieChart` has no story | After elevate, story under Dashboard or DataViz as canonical |

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-22 | debt | First governance audit. Strong visual fork on charts vs DataViz/Advanced. Exception already logged. |
