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
| Shell | `AppShell` · Patterns/Shells / Hogar/ShellAndPanels | canonical |
| Errors | `ValidationMessage` | canonical |
| Top egresos | `BreakdownDonut` · **Hogar/FinancesPyg** (column) | canonical composition |
| Top ingresos | `BreakdownDonut` · same view story | canonical composition |
| Stitch toggle mock | Charts/Reference → PeriodBreakdownDonut | **reference** — do not wire |
| Product today | `SimplePieChart` (row on md) | page-only · exception until wired |

## Density

- Mobile: `max-w-2xl` — OK for Hogar.
- Desktop: charts **stacked in column** (not side-by-side) — Storybook view composition is SoT.
- PRO-specific: N/A here — see [`pro-finances-pyg.md`](./pro-finances-pyg.md).

## States to cover

- [x] Loading (text “Cargando…”)
- [ ] Empty (donut empty states exist in Charts/Donut + view story)
- [x] Error (`ValidationMessage`)
- [x] Populated

## Gaps / exceptions

| Priority | Type | Finding | Action |
|----------|------|---------|--------|
| P0 | apply | Product still uses `SimplePieChart` in a 2-col grid | Wire `BreakdownDonut` ×2 in **column** per Hogar/FinancesPyg; clear exception |
| P2 | optional | Inline monthly bars vs Charts/Reference MonthlyEvolution | Defer until bars have a canonical chart |

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-22 | debt | First audit; then Storybook IA reorganized. Canonical = BreakdownDonut + view composition. |
