# TADOR Component Inventory

**Última actualización:** 2026-07-22

Thin index. **IA:** [`storybook-ia.md`](./storybook-ia.md). **Policy:** [ADR 0007](../../docs/adr/0007-ui-catalog-governance.md).

| Layer | Path |
|-------|------|
| Storybook IA | [`storybook-ia.md`](./storybook-ia.md) |
| View contracts | [`views/index.md`](./views/index.md) |
| Exceptions | [`ui-exceptions.md`](./ui-exceptions.md) |
| Routes | [`route-map.md`](./route-map.md) |

**Status:** `exists` · `debt` · `post-MVP` · **Class:** `canonical` · `reference` · `page-only`

---

## Foundations & primitives

| Component | Path | Story | Class | Status |
|-----------|------|-------|-------|--------|
| Branding | `foundations/` | Foundations/Branding | canonical | exists |
| Button, TextInput, PasswordRequirement | `ui/*` | Primitives/Inputs | canonical | exists |
| Icon, ValidationMessage | `ui/*` | Hogar/ShellAndPanels (+ Inputs) | canonical | exists |

---

## Patterns

| Component | Path | Story | Class | Status |
|-----------|------|-------|-------|--------|
| AppShell, sidebars, bottom bar | `layout/`, `navigation/` | Patterns/Shells, Hogar/ShellAndPanels | canonical | exists |
| Dashboard widgets | `dashboard/DashboardWidgets.tsx` | Patterns/DashboardWidgets | canonical | exists |
| AccountBankingRow | `financial/` | Patterns/AccountBanking | canonical | exists |
| RecentEntriesList | `entries/` | Patterns/RecentEntries | canonical | exists · debt:pro-desktop-density |

---

## Charts

| Component | Path | Story | Class | Status |
|-----------|------|-------|-------|--------|
| **BreakdownDonut** | `charts/BreakdownDonut.tsx` | Charts/Donut | **canonical** | exists (not wired to P&G yet) |
| PeriodBreakdownDonut / MonthlyEvolutionChart | `dataviz/DataViz.tsx` | Charts/Reference | **reference** | exists |
| SimplePieChart | `dashboard/SimplePieChart.tsx` | — (product only) | page-only → replace | debt |

---

## View compositions (Storybook)

| View story | Route | Notes | Class |
|------------|-------|-------|-------|
| Hogar/QuickAdd | `/hogar/entries` | Frequent + nav + mini-form | canonical |
| Hogar/ShellAndPanels | shell / dashboard panels | Onboarding, PYG panel, Position | canonical |
| **Hogar/FinancesPyg** | `/hogar/finances/pyg` | **2 donuts column: egresos + ingresos** | canonical composition |
| **PRO/FinancesPyg** | `/pro/finances/pyg` | Same chart composition; filters on page | canonical composition |
| PRO/EntryBuilder | `/pro/entries` | | canonical |
| PRO/ManualEntry | `/pro/entries/manual` | | canonical |
| PRO/AccountsTreePro | `/pro/accounts` | | canonical |
| PRO/Analysis | `/pro/analysis/*` | | canonical |
| Marketing/Landing | `/`, FAQ | | canonical |
| Experimental/Pacho | — | | reference |

---

## Hogar QuickAdd pieces

| Component | Path | Story | Class | Status |
|-----------|------|-------|-------|--------|
| FrequentTemplatesGrid, KindCategoryNav, TemplateSearch, ApunteMiniForm, ApunteSuccessPanel | `entries/` | Hogar/QuickAdd | canonical | exists |
| ApunteForm (legacy) | `entries/ApunteForm.tsx` | Hogar/ShellAndPanels → ApunteFlow | reference | exists |

---

## Open debt

1. Wire `BreakdownDonut` into `FinancesPyg` (column); retire `SimplePieChart` usage — see `ui-exceptions.md`.
2. PRO historial density (`Patterns/RecentEntries`).
3. Optional: data-driven bar chart to replace inline P&G bars / reference MonthlyEvolution.

## Agent checklist

1. Prefer view stories under `Hogar/*` / `PRO/*` when auditing a route.
2. Prefer `Charts/Donut` over `Charts/Reference`.
3. Update [`storybook-ia.md`](./storybook-ia.md) if folders change.
