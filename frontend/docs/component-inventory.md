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
| **BreakdownDonut** | `charts/BreakdownDonut.tsx` | Charts/Donut | **canonical** (base) | exists |
| **BreakdownIncomesDonut** | `charts/BreakdownIncomesDonut.tsx` | Charts/Donut → Incomes, Hogar\|PRO/FinancesPyg | **canonical** | exists · wired (green) |
| **BreakdownOutcomesDonut** | `charts/BreakdownOutcomesDonut.tsx` | Charts/Donut → Outcomes, Hogar\|PRO/FinancesPyg | **canonical** | exists · wired (rose) |
| **HogarIncomeExpenseBars** | `charts/HogarIncomeExpenseBars.tsx` | Charts/Bars; Hogar/FinancesPyg; PygPanelHogar | **canonical** | exists · Recharts · wired |
| **ProIncomeExpenseBars** | `charts/ProIncomeExpenseBars.tsx` | Charts/Bars; PRO/FinancesPyg | **canonical** | exists · wraps Hogar until net line |
| PeriodBreakdownDonut / MonthlyEvolutionChart | `dataviz/DataViz.tsx` | Charts/Reference | **reference** | exists |

---

## View compositions (Storybook)

| View story | Route | Notes | Class |
|------------|-------|-------|-------|
| Hogar/QuickAdd | `/hogar/entries` | Frequent + nav + mini-form | canonical |
| Hogar/ShellAndPanels | shell / dashboard panels | Onboarding, PYG panel, Position | canonical |
| **Hogar/FinancesPyg** | `/hogar/finances/pyg` | Bars + 2 donuts column | canonical composition |
| **PRO/FinancesPyg** | `/pro/finances/pyg` | `ProIncomeExpenseBars` + donuts; filters on page | canonical composition |
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

1. PRO historial density (`Patterns/RecentEntries`) — paused pending PRO column definition.

## Agent checklist

1. Prefer view stories under `Hogar/*` / `PRO/*` when auditing a route.
2. Prefer `Charts/Donut` over `Charts/Reference`.
3. Update [`storybook-ia.md`](./storybook-ia.md) if folders change.
