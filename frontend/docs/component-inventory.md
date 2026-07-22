# TADOR Component Inventory

**Última actualización:** 2026-07-22

Thin index for the frontend design system. **Policy:** [ADR 0006](../../docs/adr/0006-ui-catalog-governance.md).

| Layer | Path |
|-------|------|
| Executable SoT | Storybook (`npm run storybook`) |
| Per-route contracts | [`views/index.md`](./views/index.md) |
| Allowed forks | [`ui-exceptions.md`](./ui-exceptions.md) |
| Brand tokens | [`DESIGN.md`](../../specs/foundation/mockup/stitch/DESIGN.md) |
| Routes | [`route-map.md`](./route-map.md) |
| Density | [`modos-hogar-pro.md`](../../specs/foundation/modos-hogar-pro.md) |
| Agents | [`AGENTS.md`](../../AGENTS.md) |

**Status:** `exists` · `debt` · `post-MVP`  
**Story class:** `canonical` · `reference` · `page-only`  
`debt:pro-desktop-density` = PRO desktop still shares Hogar-width density.

---

## Foundations & primitives

| Component | Path | Story | Class | Mode | Status |
|-----------|------|-------|-------|------|--------|
| ColorPalette / Typography / Guidelines | `components/foundations/` | Foundations/Branding | canonical | shared | exists |
| Button | `ui/Button.tsx` | Inputs/Patterns → ButtonVariants | canonical | shared | exists |
| TextInput | `ui/TextInput.tsx` | Inputs/Patterns → TextField | canonical | shared | exists |
| PasswordRequirement | `ui/PasswordRequirement.tsx` | Inputs/Patterns | canonical | shared | exists |
| Icon | `ui/Icon.tsx` | (used across stories) | canonical | shared | exists |
| ValidationMessage | `ui/ValidationMessage.tsx` | Hogar/P0 → ValidationMessages | canonical | shared | exists |

Tokens: `src/design/tokens.ts` · `src/globals.css`

---

## Layout & navigation

| Component | Path | Story | Class | Mode | Status |
|-----------|------|-------|-------|------|--------|
| MarketingHeader / variants | `layout/MarketingHeader.tsx` | Navigation/Shells | canonical | public | exists |
| AppFooter / variants | `layout/AppFooter.tsx` | (marketing pages) | canonical | public | exists |
| DesktopSidebar | `navigation/DesktopSidebar.tsx` | Navigation/Shells | canonical | PRO-leaning | exists |
| MobileBottomBar | `navigation/MobileBottomBar.tsx` | Navigation/Shells | canonical | shared | exists |
| AppShell | `layout/AppShell.tsx` | Hogar/P0 → Shell | canonical | hogar + pro | exists |

---

## Onboarding

| Component | Path | Story | Class | Mode | Status |
|-----------|------|-------|-------|------|--------|
| OnboardingWizard | `onboarding/OnboardingWizard.tsx` | Hogar/P0 → Onboarding | canonical | shared | exists |

---

## Dashboard / finances panels

| Component | Path | Story | Class | Mode | Status |
|-----------|------|-------|-------|------|--------|
| PygPanelHogar | `dashboard/PygPanelHogar.tsx` | Hogar/P0 → DashboardPanels | canonical | hogar | exists |
| PositionPanel | `dashboard/PositionPanel.tsx` | Hogar/P0 → DashboardPanels | canonical | hogar (+ pro balance) | exists |
| NetResult / income / expense widgets | `dashboard/DashboardWidgets.tsx` | Dashboard/Widgets | canonical | shared | exists |
| SimplePieChart | `dashboard/SimplePieChart.tsx` | (used in FinancesPyg; no dedicated story) | page-only → elevate | hogar + pro | debt (see ui-exceptions) |
| PeriodBreakdownDonut | `dataviz/DataViz.tsx` | DataViz/Advanced → PeriodBreakdown | **reference** | — | exists (mock; not wired) |
| MonthlyEvolutionChart | `dataviz/DataViz.tsx` | DataViz/Advanced | **reference** | — | exists (mock; not wired) |

---

## Hogar QuickAdd (`/hogar/entries`)

| Component | Path | Story | Class | Mode | Status |
|-----------|------|-------|-------|------|--------|
| FrequentTemplatesGrid | `entries/FrequentTemplatesGrid.tsx` | Hogar/QuickAdd | canonical | hogar | exists |
| KindCategoryNav | `entries/KindCategoryNav.tsx` | Hogar/QuickAdd | canonical | hogar | exists |
| TemplateSearch | `entries/TemplateSearch.tsx` | Hogar/QuickAdd | canonical | hogar | exists |
| ApunteMiniForm | `entries/ApunteMiniForm.tsx` | Hogar/QuickAdd | canonical | hogar | exists |
| ApunteSuccessPanel | `entries/ApunteSuccessPanel.tsx` | Hogar/QuickAdd | canonical | hogar | exists |
| ApunteForm / ApunteConfirm | `entries/ApunteForm.tsx` | Hogar/P0 → ApunteFlow | reference (legacy) | hogar | exists |
| RecentEntriesList | `entries/RecentEntriesList.tsx` | Shared/Entries | canonical | hogar + pro | exists · debt:pro-desktop-density |

Page: `pages/Entries.tsx`. Historial: `pages/FinancesApuntes.tsx` (PRO wrapper → density debt).

---

## PRO capture

| Component | Path | Story | Class | Mode | Status |
|-----------|------|-------|-------|------|--------|
| EntryBuilder | `entry-builder/EntryBuilder.tsx` | PRO/EntryBuilder | canonical | pro | exists |
| EntityJitForm | `entry-builder/EntityJitForm.tsx` | PRO/EntryBuilder (embedded) | canonical | pro | exists |
| ManualEntryForm | `manual-entry/ManualEntryForm.tsx` | PRO/ManualEntry | canonical | pro | exists |
| AccountsTreePro | `accounts-tree/AccountsTreePro.tsx` | PRO/AccountsTreePro | canonical | pro | exists |

---

## PRO analysis (009)

| Component | Path | Story | Class | Mode | Status |
|-----------|------|-------|-------|------|--------|
| CostYieldPanel | `analysis/CostYieldPanel.tsx` | PRO/Analysis | canonical | pro | exists |
| BankMissingEntityBanner | `analysis/BankMissingEntityBanner.tsx` | PRO/Analysis | canonical | pro | exists |

---

## Accounts / entities / settings (page-heavy)

| Surface | Path | Story | Class | Mode | Status |
|---------|------|-------|-------|------|--------|
| Hogar accounts page | `pages/Accounts.tsx` | — | page-only | hogar | exists |
| Entities page | `pages/Entities.tsx` | — | page-only | hogar + pro | exists |
| Settings / BookConfig | `pages/Settings.tsx` | — | page-only | hogar + pro | exists |
| AccountBankingRow | `financial/AccountBankingRow.tsx` | Financial/Account Banking | canonical | shared | exists |

---

## Marketing

| Component | Path | Story | Class | Mode | Status |
|-----------|------|-------|-------|------|--------|
| Landing sections | `marketing/LandingSections.tsx` | Marketing/Landing | canonical | public | exists |
| FAQ pieces | `faq/FaqComponents.tsx` | Marketing/Landing → FaqAccordion | canonical | public | exists |

---

## Experimental (post-MVP)

| Component | Path | Story | Class | Status |
|-----------|------|-------|-------|--------|
| Pacho variants | `mascot/Pacho.tsx` | Mascot/Pacho | reference | post-MVP |
| ConversationalWizard / AITemplateResult | `inputs/InputPatterns.tsx` | Inputs/Patterns | reference | post-MVP |

---

## Open density / catalog debt

1. **P&G charts** — `SimplePieChart` vs `PeriodBreakdownDonut` (reference). Exception logged.
2. **`/pro/finances/apuntes`** — Hogar `max-w-lg` layout. `debt:pro-desktop-density`.
3. **`RecentEntriesList`** — card list; PRO desktop needs denser columns.

## Agent checklist

1. Prefer `ui-design-governance` for audits (views index).
2. Diff components vs stories vs this index vs `ui-exceptions.md`.
3. Promote at 3 uses; classify `canonical` / `reference`.
4. `cd frontend && npm run build-storybook` when stories change.
