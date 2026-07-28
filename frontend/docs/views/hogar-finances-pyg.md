# View: `/hogar/finances/pyg`

| Field | Value |
|-------|-------|
| Route | `/hogar/finances/pyg` |
| Mode | `hogar` |
| Page module | `frontend/src/pages/FinancesPyg.tsx` (`namespace="hogar"`) |
| Shell | `AppShell mode="hogar"` |
| Audit status | aligned |
| Last audit | 2026-07-28 |

## Purpose

Mostrar el resultado financiero del período (ingresos, gastos, neto) y el top de cuentas, en lenguaje claro.

## Primary use case

1. Elegir ejercicio o mes y ver neto + totales.
2. Comparar ingresos vs egresos en barras mensuales adyacentes (Recharts).
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
| Income vs expenses bars | `HogarIncomeExpenseBars` · Charts/Bars · Hogar/FinancesPyg | canonical |
| Top egresos | `BreakdownOutcomesDonut` (rose) · Hogar/FinancesPyg | canonical |
| Top ingresos | `BreakdownIncomesDonut` (green) · Hogar/FinancesPyg | canonical |

## Density

- Mobile: `max-w-2xl` — OK for Hogar.
- Desktop: charts **stacked in column** — matches Storybook view composition.
- Bars: adjacent green/rose; scale via grid (no Y tick labels); tooltip for values; **no** cumulative net line.
- PRO-specific: N/A here — see [`pro-finances-pyg.md`](./pro-finances-pyg.md).
- Policy: [`../hogar-pro-density.md`](../hogar-pro-density.md).

## States to cover

- [x] Loading (text “Cargando…”)
- [x] Empty (bars + BreakdownDonut empty states)
- [x] Error (`ValidationMessage`)
- [x] Populated

## Gaps / exceptions

None open for charts (P0 closed 2026-07-26; Recharts bars 2026-07-28).

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-22 | debt | Storybook IA + canonical donut defined. |
| 2026-07-26 | aligned | Product wired to `BreakdownDonut` ×2 in column. |
| 2026-07-28 | aligned | `HogarIncomeExpenseBars` (Recharts); wired in P&G + PygPanelHogar. |
