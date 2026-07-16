# Tasks: Sprint 06 - Frontend Hogar

**Input**: Design documents from `/specs/006-frontend-hogar/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/behavior.md, inventory-vistas-endpoints.md

**Component catalog**: [`frontend/docs/component-inventory.md`](../../frontend/docs/component-inventory.md) (not owned by this sprint’s tasks for design-system scope — referenced as build prerequisites)

**Backend follow-ups (blocking for authenticated screens)**:

- `GET /api/accounts` — [002 tasks Follow-up](../002-catalogos-base/tasks.md)
- `GET /api/apuntes` — [004 tasks Follow-up](../004-plantillas-mvp/tasks.md)
- PYG query `year` — [005 tasks Follow-up](../005-dashboard-pyg/tasks.md)

**Tests**: Frontend smoke/manual for MVP screens; backend follow-ups keep TDD in their own specs. No Pacho in functional UI tasks.

**Organization**: By user story (US1 → US2 → US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: US1 | US2 | US3 | or omit for setup/foundational

---

## Phase 1: Setup

**Purpose**: Align frontend docs and API client surface for Hogar

- [x] T001 Document active Spec Kit plan pointer for 006 in `.cursor/rules/specify-rules.mdc` (SPECKIT section → `specs/006-frontend-hogar/plan.md`)
- [x] T002 [P] Extend `frontend/src/lib/api.ts` with typed clients for book, chart, accounts, entities, plantillas, apuntes, reports (stubs OK until backend follow-ups land) — **done**: book, accounts, entities, plantillas, apuntes, auth.profile; chart/reports still thin
- [x] T003 [P] Confirm Storybook scripts and link from `frontend/README.md` to `frontend/docs/component-inventory.md` (already drafted — verify)

---

## Phase 2: Foundational (blocking)

**Purpose**: Shell, shared UI primitives, and backend gaps required by all authenticated stories

**CRITICAL**: Do not start US1–US3 page wiring until T010–T016 are done (or explicitly mocked with feature flags)

### 2A — Backend follow-ups (other specs; track here as deps)

- [x] T004 Complete 002 Follow-up F1–F3 (`GET /api/accounts`) per `specs/002-catalogos-base/tasks.md`
- [x] T005 Complete 004 Follow-up F1–F3 (`GET /api/apuntes`) per `specs/004-plantillas-mvp/tasks.md`
- [x] T006 Complete 005 Follow-up F1–F4 (`year` query) per `specs/005-dashboard-pyg/tasks.md`

### 2B — Storybook P0 components (no product routes yet)

- [x] T007 [P] Add `ValidationMessage` in `frontend/src/components/ui/ValidationMessage.tsx` + story (FR-008)
- [x] T008 [P] Add `AppShell` in `frontend/src/components/layout/AppShell.tsx` (bottom nav + desktop sidebar; **no Pacho**) + Navigation story
- [x] T009 [P] Add `OnboardingWizard` in `frontend/src/components/onboarding/OnboardingWizard.tsx` from `onboarding_tador_mobile` / `onboarding_tador_desktop` **without mascot**; Hogar-only mode; tip callout instead of Pacho + story
- [x] T010 [P] Add `PygPanelHogar` + `PositionPanel` in `frontend/src/components/dashboard/` + stories (FR-007 / FR-H-*)
- [x] T011 [P] Add `ApunteForm` + `ApunteConfirm` in `frontend/src/components/entries/` + stories

**Checkpoint**: Foundation + P0 Storybook ready

---

## Phase 3: User Story 1 — Primer uso guiado (P1)

**Goal**: Login/register already exist; complete onboarding (currency + timezone auto + optional wallets/cards; no banks) without accounting codes (FR-001–003, FR-003a–c, FR-010, FR-010a)

**Independent test**: New user finishes onboarding with Guayaquil (or browser TZ), can skip or add wallets/cards, lands on dashboard without creating a bank

- [x] T012 [US1] Add route `/onboarding` in `frontend/src/App.tsx` and page `frontend/src/pages/Onboarding.tsx` using `OnboardingWizard` (modo + moneda + timezone UTC)
- [x] T013 [US1] Wire onboarding to `GET/PATCH /book` via `frontend/src/lib/api.ts`; persist mode, currency, locale/format, timeZone; mark book initialized
- [x] T032 [US1] Expand timezone list (NA/SA/EU incl. `America/Guayaquil`) + browser auto-default in `OnboardingWizard` / `frontend/src/lib/time-zones.ts` (FR-010a)
- [x] T033 [US1] Backend: `POST /api/accounts` accepts `parentGroupCodigo` + optional `metadata` (network/lastFour/cutoffDay); persist `metadata` Json on `CuentaUsuario`
- [x] T034 [US1] Add wallets step to onboarding: copy explaining default vs virtual extras; create 0–2 `wallet` under `11110000` (FR-003a)
- [x] T035 [US1] Add optional credit-card step: network + name + optional last4 + cutoff; `card` under `21200000` without bank (FR-003b)
- [x] T036 [US1] Ensure wizard has **no** employment step (FR-003c); banks/cards/wallets optional via entities
- [x] T014 [US1] After book config, CTA paths documented — banks via entities not GuidedAccount bank on `/accounts`
- [x] T015 [US1] Add `/settings` — currency readonly, timezone editable, fullName editable (FR-004c)
- [x] T016 [US1] Gate authenticated app…
- [x] T017 [P] [US1] Add `/contact`… — **deferred** (mailto post-MVP follow-up; see spec clarifications)
- [x] T017b [P] [US1] Add `/recovery`… — **deferred** (email infra post-MVP; see `001-plataforma-base`)

**Checkpoint**: US1 demonstrable (onboarding + settings + contact)

---

## Phase 3b: Delta plantillas — done

- [x] T037 Complete 004 Follow-up F7–F9
- [x] T038 [US2] ApunteMiniForm same-account block

---

## Phase 3c: Entidades + Cuentas + provisión (2026-07-14 evening)

- [x] T039 Backend: rename `issuer`→`card_issuer`; add `wallet_platform`; User.fullName; migrate
- [x] T040 Backend: `POST /api/entities` atomic provision (bank/card_issuer/wallet_platform/person); return provisionedAccount
- [x] T041 Backend: `POST /api/accounts` reject bank|card with 422; allow incomeCategory|expenseCategory|bridge|wallet(non-platform)
- [x] T042 Backend: `PATCH /auth/me` or `/api/profile` for fullName
- [x] T043 [US1c] Page `/entities` — list/filter/create bank|card_issuer|wallet_platform|person
- [x] T044 [US1d] Page `/accounts` — list/create incomeCategory|expenseCategory only (no saldo hero)
- [x] T045 [US1] Onboarding steps: optional Bank / Card / Virtual wallet via entities API
- [x] T046 [US1b] Page `/settings` + wire book TZ + profile fullName
- [x] T047 Wire routes in App.tsx + AppShell nav destinations
- [x] T048 Tests: entity provision atomic; reject manual bank/card; settings/profile
---

## Phase 4: User Story 2 — Registrar apuntes cotidianos (P1)

**Goal**: Template-driven QuickAdd — tres capas + mini-form + burst + recientes (FR-005, FR-005a–d, FR-008, FR-013)

**Independent test**: With accounts configured, user picks a frequent plantilla (or category path), saves a gasto, sees confirmation, and can “Guardar y registrar otro” without re-picking plantilla/account

### 4A — API client + page shell

- [x] T018 [US2] Add `/entries` (+ `/entries/new`) routes in `frontend/src/App.tsx` and page `frontend/src/pages/Entries.tsx` with `AppShell` (mockup `apuntes_tador`)
- [x] T018b [US2] Extend `frontend/src/lib/api.ts` with typed `plantillas` + `apuntes` clients (`GET /api/plantillas?mode=hogar`, `POST /api/apuntes`, `GET /api/apuntes`) and `accounts` list for mini-form

### 4B — Discovery layers (template-driven)

- [x] T018c [P] [US2] Add `FrequentTemplatesGrid` in `frontend/src/components/entries/` (4–6 tiles; curated fallback; optional local usage ranking) + Storybook
- [x] T018d [P] [US2] Add `KindSegment` (Gasto | Ingreso | Transferencia) + `CategoryChips` (≤6) + filtered plantilla list (≤3 visible) in `frontend/src/components/entries/`
- [x] T018e [P] [US2] Add `TemplateSearch` typeahead (name/synonyms) in `frontend/src/components/entries/`

### 4C — Mini-form + persist + burst

- [x] T019 [US2] Evolve `ApunteForm` → `ApunteMiniForm`: only account (sticky last-used), amount, short description; date default today; **no** ledger lines; wire submit to `POST /api/apuntes`; map errors via `ValidationMessage` (FR-005b, FR-008)
- [x] T019b [US2] Support deep link `/entries/new?plantilla=<code>` selecting plantilla and opening mini-form (FR-005d)
- [x] T019c [US2] Add “Guardar y registrar otro” (burst): keep plantilla + account; clear amount + description; focus amount (FR-005c)
- [x] T020 [US2] Show `ApunteConfirm` on success (`aria-live`); list recientes via `GET /api/apuntes` (`RecentEntriesList`)
- [x] T021 [US2] Edge case: missing required account for plantilla → everyday-language message + CTA to accounts (no codes)
- [x] T021b [US2] Warn before leaving mini-form with unsaved amount/description — **deferred** follow-up (router guard / beforeunload)

**Checkpoint**: US2 demonstrable independently (frequent path + category path + burst)

---

## Phase 5: User Story 3 — Revisar estado del hogar (P2)

**Goal**: Hub dashboard + landing Finances (P&G / Balance / historial) (FR-006, FR-007–FR-007e)

**Independent test**: After apuntes, `/dashboard` shows month KPIs + position; `/finances` opens P&G, Balance, filtered history

- [x] T022 [US3] Wire `/dashboard` hub: month (default) / year toggle from `GET /api/reports/pyg`; `PositionPanel` from `GET /api/reports/position`; CTA to `/finances`; tip slot (no Pacho)
- [x] T023 [cancelled] GuidedAccountCreate for bank on `/accounts` — **superseded** by entity provision
- [x] T024 [US1c] covered by T043 Entities page
- [x] T025 [US3] Add `/finances` landing (Estado financiero / Balance / Revisar apuntes) — FR-007a
- [x] T049 [US3] Add `/finances/pyg` — totals, bars+line from monthlySeries, Top 10 pies; year|month period UI (FR-007b)
- [x] T050 [US3] Add `/finances/balance` — position breakdown + optional client-only leverage hint (FR-007c)
- [x] T051 Backend: extend `GET /api/apuntes` filters (`dateFrom`/`dateTo`, `accountId`, `amountMin`/`amountMax`, `q` concept) + order `createdAt` desc — TDD
- [x] T052 [US3] Add `/finances/apuntes` history UI with filters + edit (FR-007d)
- [x] T053 [P] API client `reports.pyg` / `reports.position` + apuntes list query params in `frontend/src/lib/api.ts`
- [x] T026 [US3] Hide account codes everywhere in Hogar dashboard/finances (FR-001, FR-H-006)
- [x] T027 [US3] Empty states when no movements (`EmptyState`) on dashboard/finances
- [x] T054 Wire AppShell nav: Estado → `/finances`

**Checkpoint**: US3 demonstrable; full Hogar loop works

---

## Phase 6: Polish

- [x] T028 [P] Mobile pass on AppShell + onboarding + entries (SC-003) — **accepted as mobile-first layouts shipped**; dedicated device QA remains follow-up
- [x] T029 [P] Ensure no Pacho components imported from `frontend/src/pages/**`
- [x] T030 Quickstart update in `specs/006-frontend-hogar/quickstart.md` with concrete `npm` / Docker steps for the three stories
- [x] T031 Run `frontend` lint + build; fix regressions
- [x] T021b [US2] Warn before leaving mini-form with unsaved amount/description — **deferred** follow-up
- [x] T055 Frontend test pyramid 70/20/10: Vitest unit+integration + Playwright E2E (`make test-e2e` on `tador_test`)

**Sprint 006 closed** — core US1–US3 + tests shipped. Deferred: contact, recovery, unsaved-form guard, device QA.

---

## Dependencies

```text
Phase 1 → Phase 2 (T004–T011)
    → US1 (T012–T013, T032–T036, T014–T017)
    → 004 delta T037 + mini-form T038
    → US2 (T018–T021b)
    → US3 (T022–T027)
    → Polish (T028–T031)
```

US1 settings/contact (T015, T017) can parallelize with onboarding wiring after T008–T009.

T032–T036 (onboarding delta) block polished US1 demo; T037 blocks correct transferencia catalog.

US2 discovery components (T018c–T018e) can run in parallel after T018b API types exist.

## Parallel examples

```text
# Phase 2B Storybook P0
T007 ValidationMessage
T008 AppShell
T009 OnboardingWizard
T010 PygPanelHogar + PositionPanel
T011 ApunteForm + ApunteConfirm

# After US1 shell exists
T015 Settings || T017 Contact

# US2 discovery (after T018b)
T018c FrequentTemplatesGrid || T018d KindSegment+CategoryChips || T018e TemplateSearch
```

## Implementation strategy

1. **MVP first**: Phase 2 + US1 (onboarding/settings) so a new user can configure the book.
2. **Then US2**: template-driven QuickAdd (frecuentes → mini-form → burst) — **not** EntryBuilder.
3. **Then US3**: feedback via saldos + dashboard.
4. **Never** ship Pacho in functional pages in this sprint.
5. Backend follow-ups T004–T006 already done; keep plantillas/apuntes clients honest in T018b.

## Suggested MVP slice

T001–T016 + T032–T038 + T018–T020 (onboarding delta + frequent-plantilla apunte path + burst) before full category/search polish and entities/dashboard.
