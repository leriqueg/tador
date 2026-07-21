# Tasks: Sprint 07 - Frontend PRO ligero

**Updated**: 2026-07-18

**Input**: Design documents from `/specs/007-frontend-pro-ligero/`  
**Prerequisites**: Sprint 06 Hogar closed.

**Tests**: TDD — write failing tests before production code for backend capabilities and EntryBuilder state machine; integration/E2E after unit green.

## Phase 1 — Setup

- [x] T001 Update `.cursor/rules/specify-rules.mdc` active plan → `007-frontend-pro-ligero`
- [x] T002 [P] Document route map in `frontend/docs/` (or extend component-inventory) for `/hogar/*` + `/pro/*`
- [x] T003 [P] Add PRO shell theme tokens (distinct accent) in `frontend/src/` CSS variables without breaking Hogar

## Phase 2 — Foundational (blocking)

- [x] T004 Backend TDD: Entidad `capabilities` (Json string[] or equivalent) on Prisma + migration; domain validation helpers
- [x] T005 Backend TDD: `POST/PATCH /api/entities` accept/return capabilities; reject invalid capability tokens
- [x] T006 Backend TDD: apunte/entry path rejects salary-like ops missing `is_employment_dependency` when required by plantilla/rule (minimal rule hook)
- [x] T007 Frontend: `ModeNamespaceGuard` + legacy redirects (`/dashboard` → `/hogar|pro/dashboard` by mode) in `frontend/src/App.tsx` (or router module)
- [x] T008 Migrate existing Hogar routes to `/hogar/*` and update AppShell nav links + tests that hardcode paths

**Checkpoint**: Capabilities API green; Hogar still works under `/hogar/*`.

## Phase 3 — US0 Namespace + US1 Onboarding PRO

- [x] T009 [US0] E2E/unit: mode mismatch redirects between namespaces
- [x] T010 [US1] Extend `OnboardingWizard` PRO branch: optional employment dependency → create organization + `is_employment_dependency`
- [x] T011 [US1] Freelance path: complete onboarding without clients; land `/pro/dashboard`
- [x] T012 [US1] MUST NOT show clients/suppliers steps in PRO onboarding

## Phase 4 — US2 EntryBuilder

- [x] T013 [P] [US2] Unit: EntryBuilder step state machine (advance/back/edit/burst) in `frontend/src/components/entry-builder/`
- [x] T014 [US2] Page `/pro/entries` wires EntryBuilder; hide QuickAdd
- [x] T015 [US2] Submit → `POST /api/apuntes` (± templateCode); decimal money; ValidationMessage
- [x] T016 [US2] Burst “Guardar y registrar otro”
- [x] T017 [US2] JIT entity inline (organization/person + capabilities); Storybook
- [x] T018 [US2] Block salary path without employer capability + CTA

## Phase 5 — US3 Manual entry

- [x] T019 [US3] Page `/pro/entries/manual` + ManualEntryForm (lines, live difference)
- [x] T020 [US3] TDD/integration: balanced `POST /api/entries` OK; unbalanced rejected
- [x] T021 [US3] Closed period / foreign account errors surfaced

## Phase 6 — US4 Accounts tree

- [x] T022 [US4] `/pro/accounts` tree with codes, parent, saldo when available
- [x] T023 [US4] Create under allowed mother; bank/card still 422
- [x] T024 [P] [US4] Storybook AccountsTreePro

## Phase 7 — US5 Finances base + polish

- [x] T025 [US5] Mount `/pro/finances`, `pyg`, `balance`, `apuntes` reusing Hogar panels (no 009 modules)
- [x] T026 [US5] `/pro/dashboard` hub parity with Hogar data, PRO chrome
- [x] T027 [P] Update `specs/006` inventory note: legacy paths redirect to `/hogar/*`
- [x] T028 Quickstart smoke + Playwright: guard + EntryBuilder ingreso + manual reject
- [x] T029 Polish: sticky account defaults; abandon warning; a11y focus/`aria-live`

## Dependencies

- T004–T006 before T010/T017/T018
- T007–T008 before all `/pro` pages
- US2 (T013–T018) before polish T029
- US5 can parallel US3/US4 after T007

## Parallel examples

- T002 || T003 after T001
- T013 || T019 scaffolding after T007
- T022 || T025 after T007

## Implementation strategy

1. Foundations (capabilities + namespace migration) first — protects Hogar.
2. EntryBuilder vertical slice next (MVP demo).
3. Manual + tree.
4. Finances/dashboard chrome.
5. E2E quickstart.

**Out of sprint**: 009 analysis, 008 IA, conciliación.

## Follow-up (2026-07-18 — hardening PRO)

- [x] T030 Mantener Idempotency-Key estable por intento en EntryBuilder
- [x] T031 Mantener Idempotency-Key estable por intento en asiento manual
- [x] T032 Exponer toggle “Impedir saldo negativo” en árbol de cuentas PRO
- [x] T033 Configurar políticas tenant-safe para cuentas de usuario y globales
- [x] T034 Probar interacción de toggles de política

## Follow-up (2026-07-20 — onboarding seed + perfil laboral)

- [x] T035 Onboarding PRO: perfil laboral con checkboxes independientes (dependencia / freelance / ambos / ninguno); copy alineado a público objetivo
- [x] T036 Al completar onboarding (Hogar + PRO): seed billetera default + categorías mínimas ingreso/gasto vía `POST /api/accounts`
- [x] T037 EntryBuilder `CuentasStep`: empty state + CTA cuando no hay opciones de debe/haber
- [x] T038 Unit/integration: wizard perfiles + seed en página Onboarding; e2e helper seedea lo mismo
- [x] T039 Playwright: EntryBuilder INGRESO guarda apunte en libro PRO recién onboardado
- [x] T040 Actualizar quickstart + inventory (`/pro/entities` sigue placeholder; JIT follow-up)

## Follow-up (2026-07-20 — /pro/entities)

- [x] T041 `/pro/entities`: reutilizar UI Hogar (sin rediseño) + tipo `organization` con capacidades
- [x] T043 `/pro/accounts`: mostrar hijas globales posteables (catálogo, no editables) y luego cuentas del libro
- [x] T044 EntryBuilder PRO: incluir globales posteables en opciones (parity Hogar plantillas `availableAccounts`)
- [ ] T042 JIT EntryBuilder polish (definir con producto; fuera de este corte)
