# Tasks: Admin Platform (013)

**Input**: Design documents from `/specs/013-admin-platform/`  
**Branch**: `013-admin-platform` (implement locally with Gentleman.AI + TDD)  
**Prerequisites**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/behavior.md](./contracts/behavior.md)

**Tests**: REQUIRED — TADOR constitution + spec FR-014. Write failing integration/unit tests before implementation per phase.

**Organization**: Tasks grouped by user story (US1–US5). Complete Phase 1–2 before any story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no incomplete dependencies)
- **[Story]**: Maps to spec.md user stories

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold `admin-ui/` and document admin env vars.

- [x] T001 Create `admin-ui/` Vite + React 19 + TypeScript ESM project mirroring `frontend/` toolchain in `admin-ui/package.json`
- [x] T002 [P] Add `admin-ui/vite.config.ts` with dev port `5174` and proxy `/api/admin` → backend
- [x] T003 [P] Add `admin-ui/tsconfig.json`, `admin-ui/tsconfig.app.json`, `admin-ui/tsconfig.node.json` aligned with `frontend/`
- [x] T004 [P] Scaffold `admin-ui/src/main.tsx`, `admin-ui/src/App.tsx`, Mantine provider, React Router shell in `admin-ui/src/`
- [x] T005 [P] Add root `package.json` workspace script or `docs` note for `cd admin-ui && npm run dev` in `specs/013-admin-platform/quickstart.md`
- [x] T006 Document admin env vars (`DEPLOYMENT_PROFILE`, `OPERATOR_SESSION_SECRET`, `ADMIN_CORS_ORIGIN`, `ADMIN_INITIAL_*`) in `docs/environment-files.md` per `auth-bootstrap.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, audit, middleware, deployment profile — **blocks all user stories**.

**⚠️ CRITICAL**: No US work until this phase checkpoint passes.

### Schema & domain

- [x] T007 Add `OperatorRole` enum, `Operator` (incl. `mustChangePassword`, `passwordChangedAt`), `OperatorSession`, `AdminAuditLog` models and `User.blockedAt` / `User.blockedReason` in `backend/prisma/schema.prisma` per `data-model.md`
- [x] T008 Run Prisma migration for admin tables in `backend/prisma/migrations/`
- [x] T009 [P] Add `backend/src/domain/operator.ts` with `OperatorRole` type and role-order helpers (`support` < `admin` < `superadmin`)
- [x] T010 [P] Extend `backend/src/domain/user.ts` with `isUserBlocked(user)` helper
- [x] T011 [P] Add `OperatorRepository` port in `backend/src/application/ports/operator-repository.ts`
- [x] T012 [P] Add `AdminAuditLogRepository` port in `backend/src/application/ports/admin-audit-repository.ts`
- [x] T013 Implement `PrismaOperatorRepository` in `backend/src/infrastructure/repositories/operator-repository.ts`
- [x] T014 Implement `PrismaAdminAuditRepository` in `backend/src/infrastructure/repositories/admin-audit-repository.ts`

### Application services (foundation)

- [x] T015 Implement `AdminAuditService` append API in `backend/src/application/admin/admin-audit-service.ts` (redact secrets/tokens from payloads)
- [x] T016 Implement `OperatorAuthApplicationService` skeleton (login/logout/me) in `backend/src/application/admin/operator-auth-service.ts`

### HTTP infrastructure

- [x] T017 Implement `createOperatorAuthMiddleware` in `backend/src/api/routes/admin/middleware/require-operator.ts` (reads `admin_session` cookie)
- [x] T018 [P] Implement `requireRole(...roles)` factory in `backend/src/api/routes/admin/middleware/require-role.ts`
- [x] T019 Add `DEPLOYMENT_PROFILE` parsing (`full` \| `product` \| `admin`) and route gating helper in `backend/src/server.ts`
- [x] T020 Create `registerAdminRoutes` entry in `backend/src/api/routes/admin/index.ts` (registers only when profile allows admin)
- [x] T021 Wire `registerAdminRoutes` from `backend/src/server.ts` with `ADMIN_CORS_ORIGIN` when profile includes admin
- [x] T022 [P] Add stricter rate limit for `POST /api/admin/auth/login` in `backend/src/api/routes/admin/auth.ts` (reuse `@fastify/rate-limit` pattern from product auth)

### Bootstrap & wiring

- [x] T023 Implement `ensureBootstrapOperator()` in `backend/prisma/seed/ensure-bootstrap-operator.ts` per `auth-bootstrap.md` (idempotent; dev vs staging/prod policy)
- [x] T024 [P] Add CLI wrapper `backend/scripts/admin/bootstrap-operator.ts` + `npm run admin:bootstrap` in `backend/package.json`
- [x] T025 [P] Invoke `ensureBootstrapOperator()` after migrate in dev startup or document release-step for staging/prod in `quickstart.md`
- [x] T026 Inject operator repos and admin services in `backend/src/server.ts` composition root

### Foundational tests (RED first)

- [x] T027 [P] Integration RED: anonymous `GET /api/admin/auth/me` → 401 in `backend/tests/admin/auth.test.ts`
- [x] T028 [P] Integration RED: product user session cannot access `/api/admin/auth/me` → 403 in `backend/tests/admin/auth.test.ts`
- [x] T029 Integration RED: `DEPLOYMENT_PROFILE=product` does not register `/api/admin/*` in `backend/tests/admin/deployment-profile.test.ts`
- [x] T030 [P] Integration RED: `ensureBootstrapOperator` creates superadmin when empty; skips when operator exists in `backend/tests/admin/bootstrap.test.ts`

**Checkpoint**: Migration applied, middleware exists, admin routes gated by profile, foundational tests written (may still fail until US1).

---

## Phase 3: User Story 1 — Operator authentication (Priority: P1) 🎯 MVP

**Goal**: Operators sign in with separate identity; product sessions cannot access admin.

**Independent Test**: Valid operator → dashboard; invalid/product session → denied (CC-ADMIN-001, CC-ADMIN-002).

### Tests for US1 ⚠️

- [x] T031 [P] [US1] Integration RED: operator login sets `admin_session` cookie in `backend/tests/admin/auth.test.ts`
- [x] T032 [P] [US1] Integration RED: operator logout clears session in `backend/tests/admin/auth.test.ts`
- [x] T033 [P] [US1] Integration RED: blocked operator login → 403 in `backend/tests/admin/auth.test.ts`
- [x] T034 [P] [US1] Integration RED: operator with `mustChangePassword=true` cannot access `/api/admin/users` until password changed in `backend/tests/admin/auth.test.ts`

### Implementation for US1

- [x] T035 [US1] Complete `OperatorAuthApplicationService` (login/logout/me/changePassword) in `backend/src/application/admin/operator-auth-service.ts` with `mustChangePassword` gate per `auth-bootstrap.md`
- [x] T036 [US1] Implement `POST /api/admin/auth/login`, `logout`, `GET /me`, `POST /change-password` in `backend/src/api/routes/admin/auth.ts`
- [x] T037 [US1] Set `admin_session` cookie (`httpOnly`, `sameSite=lax`, `secure` in prod) in `backend/src/api/routes/admin/auth.ts`
- [x] T038 [US1] GREEN: run `backend/tests/admin/auth.test.ts` through T034
- [x] T039 [P] [US1] Create `admin-ui/src/services/admin-api.ts` with credentials fetch wrapper for `/api/admin/*`
- [x] T040 [P] [US1] Create `admin-ui/src/state/operator-session.ts` (or context) for authenticated operator + `mustChangePassword` flag
- [x] T041 [US1] Implement `admin-ui/src/pages/Login.tsx` (email/password, Spanish labels)
- [x] T042 [US1] Implement `admin-ui/src/pages/ChangePassword.tsx` (forced when `mustChangePassword`; min 12 chars)
- [x] T043 [US1] Implement protected route wrapper and `admin-ui/src/pages/Dashboard.tsx` stub with operator name + role
- [x] T044 [US1] Wire routes in `admin-ui/src/App.tsx` (`/login`, `/change-password`, `/` dashboard)

**Checkpoint**: Operator can log in via UI; staging policy forces password change; product session blocked from admin API.

---

## Phase 4: User Story 2 — System user support (Priority: P1)

**Goal**: Search users, block/unblock, force password recovery with audit trail.

**Independent Test**: Block user → login fails → unblock → recovery triggered → audit log entry (CC-ADMIN-003, CC-ADMIN-004).

### Tests for US2 ⚠️

- [x] T045 [P] [US2] Integration RED: `GET /api/admin/users` search by email in `backend/tests/admin/users.test.ts`
- [x] T046 [P] [US2] Integration RED: block revokes sessions + sets `blockedAt` in `backend/tests/admin/users.test.ts`
- [x] T047 [P] [US2] Integration RED: blocked user product login fails generically in `backend/tests/admin/users.test.ts`
- [x] T048 [P] [US2] Integration RED: `support` role denied on block → 403 in `backend/tests/admin/users.test.ts`
- [x] T049 [P] [US2] Integration RED: force recovery creates `AuthToken` + revokes sessions + audit log in `backend/tests/admin/users.test.ts`

### Implementation for US2

- [x] T050 [US2] Implement `AdminUserApplicationService` in `backend/src/application/admin/admin-user-service.ts` (list, get, block, unblock, forceRecovery — uses existing `AuthToken` flow)
- [x] T051 [US2] Enforce `blockedAt` check in `backend/src/application/auth-service.ts` `login()` with generic error
- [x] T052 [US2] Implement user routes in `backend/src/api/routes/admin/users.ts` per `inventory-views-endpoints.md`
- [x] T053 [US2] Register users routes in `backend/src/api/routes/admin/index.ts` with `requireRole('support')` read / `requireRole('admin')` mutate
- [x] T054 [US2] Call `AdminAuditService` on block, unblock, force-recovery in `admin-user-service.ts`
- [x] T055 [US2] GREEN: run `backend/tests/admin/users.test.ts`
- [x] T056 [P] [US2] Implement `admin-ui/src/pages/Users.tsx` (search, pagination, blocked filter)
- [x] T057 [US2] Implement `admin-ui/src/pages/UserDetail.tsx` with block/unblock/force-recovery actions (admin role only)
- [x] T058 [US2] Wire `/users` and `/users/:id` routes in `admin-ui/src/App.tsx`

**Checkpoint**: Full user support workflow from admin UI; audit entries on mutations.

---

## Phase 5: User Story 4 — Template testing workspace (Priority: P2)

**Goal**: Migrate plantillas dev tool to `/api/admin/templates/*` with parity.

**Independent Test**: Preview/readiness matches legacy dev tool; no persistence (CC-ADMIN-006).

*Note: Executed before US3 per plan.md phase order (lower migration risk before chart CRUD).*

### Tests for US4 ⚠️

- [x] T059 [P] [US4] Copy/adapt plantillas admin tests to `backend/tests/admin/templates.test.ts` targeting `/api/admin/templates/*` with operator auth
- [x] T060 [P] [US4] Integration RED: preview response parity with legacy `/api/dev/plantillas-admin` for `pagar_servicios` hogar mode
- [x] T061 [P] [US4] Integration RED: unauthenticated template preview → 401

### Implementation for US4

- [x] T062 [US4] Extract shared preview/readiness logic from `backend/src/api/routes/plantillas-admin.ts` into `backend/src/application/admin/admin-template-service.ts`
- [x] T063 [US4] Implement routes in `backend/src/api/routes/admin/templates.ts` (`GET` list, `GET` detail, `GET` readiness, `POST` preview)
- [x] T064 [US4] Register templates routes in `backend/src/api/routes/admin/index.ts` (`requireRole('support')`)
- [x] T065 [US4] GREEN: run `backend/tests/admin/templates.test.ts` and existing `plantillas.test.ts` admin parity block
- [x] T066 [US4] Hard-disable `registerPlantillasAdminRoutes` when `NODE_ENV=production` OR `DEPLOYMENT_PROFILE=product` in `backend/src/server.ts`
- [x] T067 [P] [US4] Implement `admin-ui/src/pages/Templates.tsx` (list with modes/status)
- [x] T068 [US4] Implement `admin-ui/src/pages/TemplatePreview.tsx` (readiness + mock asiento panel)
- [x] T069 [US4] Wire `/templates` and `/templates/:code` in `admin-ui/src/App.tsx`

**Checkpoint**: Template QA available in admin UI; dev route unreachable in prod profile.

---

## Phase 6: User Story 3 — Global chart maintenance (Priority: P2)

**Goal**: CRUD `CuentaGlobal` with domain validation and dependency guards.

**Independent Test**: Valid create/update; invalid code rejected; delete blocked when dependents exist (CC-ADMIN-005).

### Tests for US3 ⚠️

- [x] T070 [P] [US3] Integration RED: create postable child under valid parent in `backend/tests/admin/global-accounts.test.ts`
- [x] T071 [P] [US3] Integration RED: invalid 8-digit code → 400 in `backend/tests/admin/global-accounts.test.ts`
- [x] T072 [P] [US3] Integration RED: delete with `activaciones` or `lineas` → 409 with dependency summary
- [x] T073 [P] [US3] Integration RED: `support` role denied on create → 403

### Implementation for US3

- [x] T074 [US3] Implement `AdminGlobalAccountApplicationService` in `backend/src/application/admin/admin-global-account-service.ts` (reuse `domain/cuenta-global` validation)
- [x] T075 [US3] Implement routes in `backend/src/api/routes/admin/global-accounts.ts` (list tree, get, create, patch, delete)
- [x] T076 [US3] Register global-accounts routes in `backend/src/api/routes/admin/index.ts` (`requireRole('admin')`)
- [x] T077 [US3] Audit all mutations via `AdminAuditService`
- [x] T078 [US3] GREEN: run `backend/tests/admin/global-accounts.test.ts`
- [x] T079 [P] [US3] Implement `admin-ui/src/pages/GlobalAccounts.tsx` (tree/table browser)
- [x] T080 [US3] Implement `admin-ui/src/pages/GlobalAccountForm.tsx` (create/edit with validation errors from API)
- [x] T081 [US3] Wire `/global-accounts`, `/global-accounts/new`, `/global-accounts/:id/edit` in `admin-ui/src/App.tsx`

**Checkpoint**: Operators can maintain global chart safely from admin UI.

---

## Phase 7: User Story 5 — Usage statistics (Priority: P3)

**Goal**: Dashboards for registrations, logins, active users, apuntes by day/week/month.

**Independent Test**: Aggregates match direct DB counts for fixture data (CC-ADMIN-007).

### Tests for US5 ⚠️

- [x] T082 [P] [US5] Integration RED: `GET /api/admin/statistics/overview` returns daily buckets in `backend/tests/admin/statistics.test.ts`
- [x] T083 [P] [US5] Unit RED: week/month bucketing helper in `backend/tests/unit/admin-statistics-bucketing.test.ts`
- [x] T084 [P] [US5] Integration RED: empty range returns zero-filled series, not 500

### Implementation for US5

- [x] T085 [US5] Implement bucketing utilities in `backend/src/application/admin/admin-statistics-bucketing.ts` (UTC MVP)
- [x] T086 [US5] Implement `AdminStatisticsApplicationService` in `backend/src/application/admin/admin-statistics-service.ts` (queries on `User`, `Session`, `Apunte`)
- [x] T087 [US5] Add indexes if needed via migration on `sessions.createdAt`, `apuntes.createdAt`, `users.createdAt` in `backend/prisma/schema.prisma`
- [x] T088 [US5] Implement routes in `backend/src/api/routes/admin/statistics.ts`
- [x] T089 [US5] Register statistics routes in `backend/src/api/routes/admin/index.ts` (`requireRole('support')`)
- [x] T090 [US5] GREEN: run statistics tests
- [x] T091 [US5] Implement `admin-ui/src/pages/Statistics.tsx` (granularity toggle + date range + summary cards/table)
- [x] T092 [US5] Wire `/statistics` route and nav link in `admin-ui/src/App.tsx`

**Checkpoint**: Usage dashboard loads within SC-005 target on staging-scale fixtures.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Audit log UI, docs, security hardening, quickstart validation.

- [x] T093 [P] Implement `GET /api/admin/audit` paginated endpoint in `backend/src/api/routes/admin/audit.ts` (`requireRole('superadmin')`)
- [x] T094 [P] Implement `admin-ui/src/pages/AuditLog.tsx` (superadmin only nav item)
- [x] T095 [P] Unit tests for `requireRole` ordering edge cases in `backend/tests/unit/require-role.test.ts`
- [x] T096 Security test: 100% admin route probe matrix (anon, product session, wrong role) in `backend/tests/admin/security-matrix.test.ts`
- [x] T097 Update `specs/013-admin-platform/quickstart.md` with verified local commands
- [x] T098 Update `docs/security.md` admin section (operator auth, audit, deployment profile)
- [x] T099 [P] Add admin nav shell (AppShell) in `admin-ui/src/components/AdminLayout.tsx` with role-aware menu per `inventory-views-endpoints.md`
- [x] T100 Run full backend test suite + `admin-ui` build; fix regressions
- [x] T101 Remove or deprecate `ENABLE_PLANTILLAS_ADMIN` docs references in favor of operator RBAC in `docs/environment-files.md`

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) — BLOCKS all stories
    ↓
Phase 3 (US1 Auth) — MVP 🎯
    ↓
Phase 4 (US2 Users) — depends on US1 operator auth + T051 blocked login
    ↓
Phase 5 (US4 Templates) — depends on US1; parallel with US3 after US1 if staffed
    ↓
Phase 6 (US3 Global chart) — depends on US1; parallel with US4 after US1
    ↓
Phase 7 (US5 Statistics) — depends on US1
    ↓
Phase 8 (Polish)
```

### User Story Dependencies

| Story | Depends on | Independent test |
|-------|------------|------------------|
| US1 | Phase 2 | Operator login; product session denied |
| US2 | US1 | Block/unblock/recovery + audit |
| US4 | US1 | Template preview parity |
| US3 | US1 | Chart CRUD + validation |
| US5 | US1 | Statistics aggregates |

### Within Each Story

1. Write tests (RED)
2. Application service
3. HTTP routes
4. GREEN backend tests
5. Admin UI pages
6. Manual smoke via quickstart

### Parallel Opportunities

- **Phase 1**: T002–T004 parallel after T001
- **Phase 2**: T009–T012, T017–T018, T027–T029 parallel within phase
- **After US1**: US4 (templates) and US3 (chart) can proceed in parallel on different developers
- **US5**: T082–T084 parallel

---

## Parallel Example: User Story 2

```bash
# Tests first (parallel):
T045  GET /api/admin/users search
T046  block revokes sessions
T047  blocked login fails
T048  support role denied
T049  force recovery + audit

# UI (parallel after backend GREEN):
T056  Users.tsx
# T057 depends on T056 patterns — sequential
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 → Phase 2 → Phase 3 (US1)
2. **STOP**: operator login works; security tests pass
3. Demo/admin bootstrap on staging

### Incremental Delivery (recommended)

1. US1 → US2 (operational support minimum)
2. US4 (template QA — migrate dev tool)
3. US3 (chart maintenance)
4. US5 (analytics)
5. Phase 8 polish

### Gentleman.AI / TDD workflow

For each task group:

1. Pick next unchecked task in order
2. Write/adjust failing test (tasks marked RED)
3. Implement minimal code to GREEN
4. Commit: `feat(admin): <task-id> <short description>`
5. Mark task `[x]` in this file

---

## Task Summary

| Phase | Tasks | Story |
|-------|------:|-------|
| 1 Setup | T001–T006 | — |
| 2 Foundational | T007–T030 | — |
| 3 US1 Auth | T031–T044 | P1 MVP |
| 4 US2 Users | T045–T058 | P1 |
| 5 US4 Templates | T059–T069 | P2 |
| 6 US3 Chart | T070–T081 | P2 |
| 7 US5 Statistics | T082–T092 | P3 |
| 8 Polish | T093–T101 | — |
| **Total** | **101** | |

**Suggested MVP scope**: T001–T044 (Setup + Foundation + US1).  
**Operational minimum**: through T058 (+ US2).  
**Full 013 MVP**: through T092; T093–T101 recommended before production admin deploy.

---

## Notes

- Do not add Prisma calls in `backend/src/api/routes/admin/*.ts` — use application services only.
- Product routes in `frontend/` must not link to admin UI.
- Use `DEPLOYMENT_PROFILE=product` in CI to assert admin routes stay unregistered.
- Spanish operator UI labels; English code paths and identifiers.
