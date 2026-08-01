# Tasks: Chart of Accounts Engine (014)

**Input**: Design documents from `/specs/014-chart-of-accounts-engine/`  
**Branch**: `feat/chart-of-accounts-engine`  
**Prerequisites**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/behavior.md](./contracts/behavior.md)

**Tests**: REQUIRED — TDD. Write failing unit/integration tests before implementation per story.

**Organization**: US1–US3 are MVP. US4 (releases) is documentation-only — no implement tasks.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

**Purpose**: Wire feature as active Speckit plan; scaffolding folders.

- [ ] T001 Update `.specify/feature.json` to `specs/014-chart-of-accounts-engine` and refresh agent context via `update-agent-context.sh`
- [ ] T002 [P] Create `backend/src/domain/chart/` and `backend/src/application/chart/` directories (placeholder `.gitkeep` or first module files)
- [ ] T003 [P] Create `backend/tests/unit/chart/` directory

---

## Phase 2: Foundational (Blocking)

**Purpose**: Schema + domain primitives — blocks all stories.

- [ ] T004 Add `ReportRole` enum and `CuentaGlobal.deprecatedAt` / `reportRole` in `backend/prisma/schema.prisma` per data-model.md
- [ ] T005 Run Prisma migration for chart fields in `backend/prisma/migrations/`
- [ ] T006 [P] Extend `backend/src/domain/cuenta-global.ts` with `ReportRole`, `deprecatedAt`, helpers `classDigit`, `groupSegment`, `isSameClass`
- [ ] T007 [P] Unit RED→GREEN: class/codigo helpers in `backend/tests/unit/chart/codigo-segments.test.ts`
- [ ] T008 Implement pure cascade planner in `backend/src/domain/chart/cascade-recode.ts` (subtree map old→new codes; reject cross-class/cycle inputs as pure validation helpers)
- [ ] T009 Unit RED→GREEN: cascade cases (leaf reparent, group BBB rewrite, uniqueness) in `backend/tests/unit/chart/cascade-recode.test.ts`
- [ ] T010 Extend `GlobalAccountAdminRepository` / add `ChartRepository` port in `backend/src/application/ports/chart-repository.ts` (list tree, update many codes/parents, list user accounts by global ids, transaction)
- [ ] T011 Implement Prisma chart repository in `backend/src/infrastructure/repositories/chart-repository.ts`
- [ ] T012 Wire chart repo in `backend/src/server.ts` composition root (inject later into routes)

**Checkpoint**: Migration applied locally; domain cascade unit tests green.

---

## Phase 3: User Story 1 — Reparent cascade (P1) 🎯

**Goal**: `reparent` command with dry-run + apply + cascade codes; id stable; cross-class fail.

**Independent Test**: CC-CHART-002, CC-CHART-003, CC-CHART-001

### Tests US1

- [ ] T013 [P] [US1] Unit RED: dry-run planner integration with fake tree in `backend/tests/unit/chart/chart-reparent.test.ts`
- [ ] T014 [P] [US1] Integration RED: reparent dry-run no DB change in `backend/tests/admin/chart-commands.test.ts`
- [ ] T015 [P] [US1] Integration RED: reparent apply keeps id, changes codigo+parent in `backend/tests/admin/chart-commands.test.ts`
- [ ] T016 [P] [US1] Integration RED: cross-class → 400 in `backend/tests/admin/chart-commands.test.ts`
- [ ] T017 [P] [US1] Integration RED: cycle → 400 in `backend/tests/admin/chart-commands.test.ts`

### Implementation US1

- [ ] T018 [US1] Implement `ChartCommandService.reparent` in `backend/src/application/chart/chart-command-service.ts` (dryRun, cascadeUserCodigos default true, plantilla impact via plantillas loader)
- [ ] T019 [US1] Implement plantilla impact helper in `backend/src/application/chart/chart-plantilla-impact.ts`
- [ ] T020 [US1] Add route `POST /api/admin/chart/commands/reparent` in `backend/src/api/routes/admin/chart-commands.ts`
- [ ] T021 [US1] Register chart-commands routes in `backend/src/api/routes/admin/index.ts` with `requireRole('admin')`
- [ ] T022 [US1] Audit apply via `AdminAuditService` action `chart.reparent`
- [ ] T023 [US1] GREEN: run unit chart + `tests/admin/chart-commands.test.ts` US1 cases

**Checkpoint**: Reparent dry-run/apply/cross-class/cycle green.

---

## Phase 4: User Story 2 — Full command API (P1)

**Goal**: create, rename, recode, deprecate with same dry-run/audit/RBAC pattern.

**Independent Test**: CC-CHART-001, CC-CHART-005, CC-CHART-006, CC-CHART-007

### Tests US2

- [ ] T024 [P] [US2] Integration RED: support role → 403 on reparent in `backend/tests/admin/chart-commands.test.ts`
- [ ] T025 [P] [US2] Integration RED: deprecate sets `deprecatedAt` in `backend/tests/admin/chart-commands.test.ts`
- [ ] T026 [P] [US2] Integration RED: recode apply + uniqueness conflict 400
- [ ] T027 [P] [US2] Integration RED: cascadeUserCodigos false leaves user codes unchanged

### Implementation US2

- [ ] T028 [US2] Implement `create`, `rename`, `recode`, `deprecate` on `ChartCommandService`
- [ ] T029 [US2] Routes for create/rename/recode/deprecate in `chart-commands.ts`
- [ ] T030 [US2] PATCH `reportRole` on existing global-accounts update path or rename command extension in `admin-global-account-service.ts` / domain
- [ ] T031 [US2] GREEN: US2 integration cases

**Checkpoint**: All command endpoints behave per contracts.

---

## Phase 5: User Story 3 — Admin tree UI (P1)

**Goal**: Hierarchical browser + reparent preview modal.

**Independent Test**: Manual/quickstart + build; optional component smoke.

- [ ] T032 [P] [US3] Extend `admin-ui` API types for chart commands in `admin-ui/src/services/admin-api.ts`
- [ ] T033 [US3] Replace flat table with tree in `admin-ui/src/pages/GlobalAccounts.tsx` (Mantine Tree or nested list)
- [ ] T034 [US3] Add `admin-ui/src/components/ChartReparentModal.tsx` (parent select, dry-run preview, confirm apply)
- [ ] T035 [US3] Update `GlobalAccountForm.tsx` for `reportRole` + deprecate action
- [ ] T036 [US3] `admin-ui` build + lint green

**Checkpoint**: Operator can preview and apply reparent from UI.

---

## Phase 6: Polish

- [ ] T037 [P] Update `specs/014-chart-of-accounts-engine/quickstart.md` with verified commands
- [ ] T038 [P] Mark ADR 0008 status Accepted (Phase 1 implemented)
- [ ] T039 Run full `npm run test:unit` + admin chart integration + `admin-ui` build
- [ ] T040 Update `specs/014-chart-of-accounts-engine/README.md` status to Implemented (MVP)

---

## Dependencies

```text
Phase 1 Setup → Phase 2 Foundational → US1 → US2 → US3 → Polish
US4 releases: no code tasks (ADR only)
```

## Parallel opportunities

- T002–T003 after T001
- T006–T007 parallel; T013–T017 parallel after T012
- T024–T027 parallel after US1 green
- T032 parallel with late US2

## Implementation strategy

1. MVP = Phase 1–3 (foundation + reparent)  
2. Then US2 commands  
3. Then US3 UI  
4. Commit per story checkpoint: `feat(chart): …`

## Task summary

| Phase | Tasks | Story |
|-------|------:|-------|
| 1 Setup | T001–T003 | — |
| 2 Foundational | T004–T012 | — |
| 3 US1 Reparent | T013–T023 | P1 |
| 4 US2 Commands | T024–T031 | P1 |
| 5 US3 UI | T032–T036 | P1 |
| 6 Polish | T037–T040 | — |
| **Total** | **40** | |

**Gentleman.AI / TDD**: For each task group — RED tests → minimal GREEN → refactor → mark `[x]` → commit work unit.
