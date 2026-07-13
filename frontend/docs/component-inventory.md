# TADOR Component Inventory

Living design-system catalog for the frontend. **Source of brand tokens:** [`specs/foundation/mockup/stitch/DESIGN.md`](../../specs/foundation/mockup/stitch/DESIGN.md). **Executable demos:** Storybook (`npm run storybook`).

Sprint 006 maps routes ↔ APIs in [`specs/006-frontend-hogar/inventory-vistas-endpoints.md`](../../specs/006-frontend-hogar/inventory-vistas-endpoints.md); this file owns **UI component definitions**.

**Status legend:** `exists` · `missing` · `post-MVP`

**Pacho / mascot:** not used in functional MVP views. Keep Storybook entries as experimental until character design supports off | messages-only | character.

---

## Foundations (exists)

| Component | Purpose | Story | Status |
|-----------|---------|-------|--------|
| ColorPalette | Swatches from DESIGN.md | Foundations/Branding | exists |
| TypographyScale | Manrope + Work Sans scale | Foundations/Branding | exists |
| DesignPrinciples | Brand voice / spacing / elevation notes | Foundations/Branding → Guidelines | exists |

Tokens in code: `src/design/tokens.ts` · CSS: `src/globals.css`

---

## UI primitives

### Button — exists
- **Purpose:** Primary / secondary / outline / ghost / surface actions
- **Mockup:** All neutro pages
- **Anatomy:** Label + optional leading/trailing Material icon; squishy active scale
- **States:** default, hover, disabled, loading (via disabled + label)
- **Props:** `variant`, `size`, `fullWidth`, `to` | `href`, `iconLeft`, `iconRight`
- **Story:** Inputs/Patterns → ButtonVariants
- **Path:** `src/components/ui/Button.tsx`

### TextInput — exists
- **Purpose:** Labeled field with optional icon and trailing control
- **Tokens:** surface-container-low, outline-variant, focus ring primary/20
- **States:** default, focus, error
- **Props:** `label`, `icon`, `error`, `trailing`, `labelAction`
- **Story:** Inputs/Patterns → TextField
- **Path:** `src/components/ui/TextInput.tsx`

### PasswordRequirement — exists
- **Purpose:** Chip for password rule met/unmet
- **Path:** `src/components/ui/PasswordRequirement.tsx`

### Icon — exists
- **Purpose:** Material Symbols wrapper (`filled` flag)
- **Path:** `src/components/ui/Icon.tsx`

### ValidationMessage — exists (P0)
- **Purpose:** Everyday-language validation / API errors (FR-008); no technical jargon
- **Mockup:** Login/Register error banners; apuntes form
- **Anatomy:** Container (error-container or soft surface) + short sentence + optional field hint
- **States:** error, warning, info, success
- **Props:** `tone`, `title?`, `children`
- **Story:** Hogar/P0 Foundations → ValidationMessages
- **Path:** `src/components/ui/ValidationMessage.tsx`

---

## Layout & navigation

### MarketingHeader / GlassMarketingHeader / MinimalHeader / AuthHeader — exists
- **Purpose:** Public / auth chrome
- **Path:** `src/components/layout/MarketingHeader.tsx`

### AppFooter / AuthFooter / CompactAuthFooter — exists
- **Path:** `src/components/layout/AppFooter.tsx`

### DesktopSidebar / MobileBottomBar — exists (shell pieces)
- **Purpose:** PRO/Hogar nav patterns from Storybook mockup
- **Story:** Navigation/Shells
- **Note:** Not yet wired as a single authenticated shell

### AppShell — exists (P0)
- **Purpose:** Authenticated layout: top bar + `MobileBottomBar` (sm) + desktop nav (md+)
- **Mockup:** `dashboard_hogar_tador`, `entidades_tador`
- **Nav map:** Resumen `/dashboard` · Apuntes `/entries` · Cuentas `/accounts` · Entidades `/entities` · Ajustes `/settings`
- **Anatomy:** Outlet region; active route highlight; no Pacho avatar in MVP
- **Props:** `activePath`, `userLabel?`, `onLogout?`
- **Story:** Hogar/P0 Foundations → Shell
- **Path:** `src/components/layout/AppShell.tsx`

---

## Onboarding

### OnboardingWizard — exists (P0)
- **Purpose:** Multi-step first-run (mode → currency/book → ready)
- **Mockups:** `onboarding_tador_mobile`, `onboarding_tador_desktop`
- **MVP rules:** No Pacho card/avatar. Guidance = typographic callout / tip banner only. Mode step: Hogar selectable; PRO “próximamente”
- **Anatomy:** Step indicator (3 bars) · title + body · selection cards or currency form · Continuar
- **States:** step index, selection required before continue
- **Props:** `initialStep?`, `showProComingSoon?`, `tipMessage?`, `onComplete`
- **Story:** Hogar/P0 Foundations → Onboarding
- **Path:** `src/components/onboarding/OnboardingWizard.tsx`
- **APIs:** `GET/PATCH /book` (when wired)

---

## Dashboard (Hogar)

### NetResultWidget / TotalIncomeWidget / OperatingExpensesWidget / NetProfitWidget — exists
- **Story:** Dashboard/Widgets
- **Note:** PRO-leaning visuals; prefer dedicated Hogar panels below for `/dashboard`

### PygPanelHogar — exists (P0)
- **Purpose:** Annual PYG summary for Hogar: income, expenses, net, simple monthly bars (FR-H-001/002); no account codes
- **Mockup:** `dashboard_hogar_tador`
- **Tokens:** primary, expense-rose, success-emerald, surface cards, ambient-shadow
- **Props:** `totalIncome`, `totalExpenses`, `netResult`, `monthlySeries`, `year`, `currencyFormat`
- **API:** `GET /api/reports/pyg?year=`
- **Story:** Hogar/P0 Foundations → DashboardPanels
- **Path:** `src/components/dashboard/PygPanelHogar.tsx`

### PositionPanel — exists (P0)
- **Purpose:** Disponible + Me deben (por cobrar) + Deudas (FR-H-004 / FR-007)
- **Mockup:** `dashboard_hogar_tador` / position contract
- **Props:** `disponible`, `porCobrar`, `deudas`, optional `currencyFormat`
- **API:** `GET /api/reports/position`
- **Story:** Hogar/P0 Foundations → DashboardPanels
- **Path:** `src/components/dashboard/PositionPanel.tsx`

---

## Apuntes

### ApunteForm — exists (P0)
- **Purpose:** Register gasto/ingreso via plantilla without ledger lines
- **Mockup:** `apuntes_tador`
- **Anatomy:** Gasto/Ingreso toggle · amount · date · category/template grid · concept · Guardar
- **States:** idle, validating, submitting, success
- **Props:** `plantillas`, `onSubmit`, `error?`, `submitting?`
- **API:** `GET /api/plantillas?mode=hogar`, `POST /api/apuntes`
- **Story:** Hogar/P0 Foundations → ApunteFlow
- **Path:** `src/components/entries/ApunteForm.tsx`

### ApunteConfirm / SuccessBanner — exists (P0)
- **Purpose:** Clear confirmation after save (US2)
- **Anatomy:** Short success message + optional dismiss
- **Story:** Hogar/P0 Foundations → ApunteFlow
- **Path:** `src/components/entries/ApunteForm.tsx` (`ApunteConfirm`)

---

## Accounts & balances

### SaldoTotalHero — missing (P1)
- **Purpose:** Total balance hero + Nueva Cuenta CTA
- **Mockup:** `cuentas_tador`
- **Props:** `total`, `currencyFormat`, `onCreate`

### AccountGroupList — missing (P1)
- **Purpose:** Groups Efectivo / Bancos / Billeteras with row balances
- **Mockup:** `cuentas_tador`
- **Anatomy:** Group header · account rows (name, subtitle, amount) · no reconcile CTA in MVP
- **API:** `GET /api/accounts` + balances
- **Note:** Reuse layout ideas from `AccountBankingRow` but drop Conciliar for Sprint 06

### AccountBankingRow — exists
- **Story:** Financial/Account Banking
- **Status:** exists — adapt for Hogar (no conciliación)

### GuidedAccountCreate — missing (P1)
- **Purpose:** Wizard banco/tarjeta/billetera/puente without account codes (FR-001, FR-003)
- **Mockup:** `cuentas_tador` FAB / Nueva Cuenta
- **API:** `POST /api/accounts`, optionally `GET /api/chart`
- **Story:** Inputs/Patterns → GuidedAccountCreate

---

## Entities

### EntityCard / EntityTable — missing (P1)
- **Purpose:** Banks, cards, people/contacts listing with search/filter
- **Mockup:** `entidades_tador`
- **API:** `GET /api/entities`
- **Story:** Financial/Entities

### EntityCreateForm — missing (P1)
- **Purpose:** Añadir Entidad
- **API:** `POST /api/entities`
- **Story:** Financial/Entities → CreateForm

---

## Settings & contact

### BookConfigForm — missing (P1)
- **Purpose:** Currency, date format; Hogar mode fixed in MVP (PRO toggle disabled or hidden)
- **Mockup:** `configuraci_n_tador`
- **API:** `GET /book`, `PATCH /book/config`
- **Story:** Inputs/Patterns → BookConfigForm

### ContactForm — missing (P2)
- **Purpose:** Public contact form
- **Mockup:** `contacto_tador_neutro`
- **API:** none yet (static / mailto until endpoint exists)
- **Story:** Marketing/Contact

### EmptyState — missing (P2)
- **Purpose:** No accounts / no apuntes edge cases
- **Anatomy:** Short copy + single CTA
- **Story:** Foundations/EmptyState

### RecentEntriesList — missing (P2)
- **Purpose:** Chronological apuntes list for `/entries` history
- **Mockup:** `apuntes_tador`
- **API:** `GET /api/apuntes` (004 follow-up; not yet implemented)
- **Story:** Hogar/Entries → RecentList

---

## Marketing (exists)

| Component | Path | Status |
|-----------|------|--------|
| BenefitCard, HeroEvolutionCard, StepItem, CtaBanner | `marketing/LandingSections.tsx` | exists |
| AccordionItem, FaqCategory, FaqCta | `faq/FaqComponents.tsx` | exists |

---

## Data viz (exists — optional for Hogar)

| Component | Note | Status |
|-----------|------|--------|
| MonthlyEvolutionChart | May feed PygPanelHogar | exists |
| PeriodBreakdownDonut | More PRO; optional | exists |

---

## Inputs / wizards (partial)

| Component | Status | MVP use |
|-----------|--------|---------|
| ConversationalWizard | exists | post-MVP / IA |
| AITemplateResult | exists | post-MVP / IA |
| FabButton | exists | optional on accounts |

---

## Mascot (post-MVP experimental)

| Component | Path | Status |
|-----------|------|--------|
| PachoMentorCard, PachoGreeting, PachoAssistant | `mascot/Pacho.tsx` | post-MVP |

**Future config (not implemented):** `advisorMode: 'off' | 'messages' | 'character'`. Until character art/motion is ready, functional UI uses `off` or plain `messages` callouts only.

---

## Priority build order (Storybook before screens)

1. ValidationMessage, AppShell  
2. OnboardingWizard (no Pacho), PygPanelHogar, PositionPanel  
3. ApunteForm, ApunteConfirm  
4. SaldoTotalHero, AccountGroupList, GuidedAccountCreate  
5. EntityCard/Table, EntityCreateForm, BookConfigForm  
6. ContactForm, EmptyState, RecentEntriesList  
