# Apply progress: 013-admin-platform

**Date**: 2026-07-22  
**Branch / worktree**: `feature/admin_platform` @ `/home/lerique/Documents/dev/personal/tador-feature-admin_platform`  
**Mode**: Strict TDD  
**Workload**: `size:exception` accepted; chain strategy `feature-branch-chain`  
**Status**: **archived** — Phases 1–8 complete (T001–T101); verify PASS WITH WARNINGS; archived 2026-07-22 → `openspec/changes/archive/2026-07-22-013-admin-platform/`.

## Completed

| Phase | Tasks | Notes |
|-------|-------|-------|
| 1 Setup | T001–T006 | `admin-ui/` Vite+React19+Mantine scaffold; env docs |
| 2 Foundation | T007–T030 | Schema/migration, ports, middleware, profile, bootstrap, RED→GREEN |
| 3 US1 Auth | T031–T044 | Operator auth API + admin-ui login/change-password/dashboard |
| 4 US2 Users | T045–T058 | Block/unblock/force-recovery + Users UI |
| 5 US4 Templates | T059–T069 | `/api/admin/templates/*`, UI, legacy hard-disable |
| 6 US3 Chart | T070–T081 | Global accounts CRUD + validation + UI |
| 7 US5 Statistics | T082–T092 | Bucketing, overview API, indexes migration file, Statistics UI |
| 8 Polish | T093–T101 | Audit, security matrix, AdminLayout, docs, suite + build |

**Count**: 101 / 101

## Verify follow-up (2026-07-22 narrow apply)

Critical verify gap (`verify-report.md`): US2.2 unblock had no automated coverage despite route/service/UI existing.

| Fix | Status | Notes |
|-----|--------|-------|
| [x] US2.2 unblock integration (clears `blockedAt`/`blockedReason`, product login succeeds, `user.unblock` audit) | Done | `users.test.ts` — no production code change (already GREEN) |
| [x] US2.2 triangulation: support denied on unblock → 403 | Done | Same file |
| [x] US5.2 week/month overview API (optional PARTIAL) | Done | `statistics.test.ts` |
| [x] CC-ADMIN-008 `DEPLOYMENT_PROFILE=admin` route smoke (optional PARTIAL) | Done | `deployment-profile.test.ts` |
| [x] Re-run `sdd-verify` | Done | PASS WITH WARNINGS — see verify-report.md; archived |

**No new task IDs invented** — documented as verify follow-up under polish.

## Resume point

None — SDD cycle archived. Next: human commit / PR; staging/prod `prisma migrate deploy` for stats indexes.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| T009 | `backend/tests/unit/operator.test.ts` | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 6 cases | ✅ Clean |
| T010 | `backend/tests/unit/user-blocked.test.ts` | Unit | ✅ auth-service unit updated | ✅ Written | ✅ Passed | ✅ 2 cases | ➖ None needed |
| T015 | `backend/tests/unit/admin-audit-service.test.ts` | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 2 cases | ✅ Clean |
| T019 | `backend/tests/unit/deployment-profile.test.ts` | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 5 cases | ✅ Clean |
| T027–T028 | `backend/tests/admin/auth.test.ts` | Integration | N/A (new) | ✅ Written | ✅ Passed | ✅ 2 cases | ✅ Clean |
| T029 | `backend/tests/admin/deployment-profile.test.ts` | Integration | N/A (new) | ✅ Written | ✅ Passed | ➖ Single | ➖ None needed |
| T030 | `backend/tests/admin/bootstrap.test.ts` | Integration | N/A (new) | ✅ Written | ✅ Passed | ✅ 2 cases | ✅ Clean |
| T031–T034 | `backend/tests/admin/auth.test.ts` | Integration | ✅ foundation suite | ✅ Written | ✅ Passed | ✅ 4 cases | ✅ Password gate |
| T045–T049 | `backend/tests/admin/users.test.ts` | Integration | ✅ auth suite | ✅ Written | ✅ Passed | ✅ 5 cases | ✅ Query port |
| T059–T061, T065–T066 | `backend/tests/admin/templates.test.ts` | Integration | ✅ users/auth suite | ✅ Written | ✅ Passed | ✅ 5 cases | ✅ Shared service |
| T070–T073, T078 | `backend/tests/admin/global-accounts.test.ts` | Integration | ✅ templates suite | ✅ Written | ✅ Passed | ✅ 4 cases | ✅ Port/repo |
| T083 | `backend/tests/unit/admin-statistics-bucketing.test.ts` | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 3 cases | ✅ Clean |
| T082, T084, T090 | `backend/tests/admin/statistics.test.ts` | Integration | ✅ prior admin | ✅ Written | ✅ Passed | ✅ 2 cases | ✅ Read port |
| T095 | `backend/tests/unit/require-role.test.ts` | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 4 cases | ➖ None needed |
| T096 | `backend/tests/admin/security-matrix.test.ts` | Integration | ✅ admin suite | ✅ Written | ✅ Passed | ✅ 3 probes | ➖ None needed |
| T001–T006, T007–T008, T011–T026, T035–T044, T050–T058, T062–T064, T067–T069, T074–T077, T079–T081, T085–T089, T091–T094, T097–T101 | structural / UI / docs under tests above | Mixed | — | ✅ Covered by suite or structural | ✅ | Triangulation skipped: scaffold/wiring/docs | — |
| **Verify-gap US2.2** | `backend/tests/admin/users.test.ts` | Integration | ✅ 5/5 users suite | ✅ Written (asserted nested `user.blockedAt`; first RED was wrong response shape) | ✅ Passed — production unblock already correct | ✅ + support 403 denied | ➖ None needed |
| **Verify-gap US5.2 API** | `backend/tests/admin/statistics.test.ts` | Integration | ✅ T082/T084 | ✅ Written | ✅ Passed (no prod change) | ✅ week + month | ➖ None needed |
| **Verify-gap CC-ADMIN-008 admin** | `backend/tests/admin/deployment-profile.test.ts` | Integration | ✅ T029 | ✅ Written | ✅ Passed (no prod change) | ➖ Single smoke | ➖ None needed |

### Test Summary

- **Admin integration tests passing**: 32 (`tests/admin/*`) — was 28; +4 (US2.2×2, US5.2 week/month, admin profile)
- **Unit tests passing**: 126 (full unit suite; unchanged this batch)
- **Plantillas Admin legacy block**: 3 passed
- **admin-ui build**: ✅ (prior verify)
- **Layers used**: Unit, Integration
- **Approval tests**: None (no pure refactor-only tasks)
- **Pure functions**: `compareOperatorRoles`, `operatorHasAtLeast`, `isUserBlocked`, `parseDeploymentProfile`, audit redaction, `isValidGlobalAccountCodigo`, `validateGlobalAccountCreate`, `buildUtcBuckets`, `assignToBucket`

### Verify-gap batch test commands

```text
# Safety net
npx vitest run --config vitest.integration.config.ts tests/admin/users.test.ts
# → 5 passed (baseline)

# After new tests
npx vitest run --config vitest.integration.config.ts \
  tests/admin/users.test.ts \
  tests/admin/statistics.test.ts \
  tests/admin/deployment-profile.test.ts
# → 12 passed (7 users + 3 statistics + 2 deployment-profile)
```

## Deviations from design

- `admin-ui` mirrors frontend toolchain (Vite/React 19/TS) and adds Mantine + TanStack Query as planned.
- Template preview requires sample product `userId` in body/query for account resolution (parity with legacy user-scoped enrichment).
- Statistics indexes migration created (`20260722183333_admin_statistics_created_at_indexes`) but `prisma migrate deploy` was blocked by auto-review — file is present; deploy before verify/staging.
- Engram unavailable — progress persisted on filesystem only.
- Verify-gap batch: **tests only** — unblock/week/admin-profile production code already matched design; no service/route edits.

## Issues / blockers

- Engram MCP `serverStatus: error` — no `mem_save` / `mem_update` (filesystem `apply-progress.md` only).
- Do **not** commit unless user requests (per apply instructions).
- Staging/prod still need `prisma migrate deploy` for statistics indexes (from prior verify).

## Next recommended

`sdd-verify`
