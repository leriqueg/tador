# Feature Specification: Chart of Accounts Engine (014)

**Feature Branch**: `feat/chart-of-accounts-engine`  
**Created**: 2026-08-01  
**Status**: Specified (Speckit)  
**Input**: Backend chart engine with cascade reparent/recode, dry-run, command API, admin-ui client; future releases designed but not built in MVP.

## Clarifications

### Session 2026-08-01

- Q: ¿Reescribir `CuentaUsuario.codigo` en cascada? → A: Dry-run siempre reporta impacto. Apply usa `cascadeUserCodigos` (default **true** en Phase 1 / pre-prod).
- Q: ¿Deprecate vs delete? → A: Phase 1 añade `deprecatedAt` (soft). Delete hard sigue con guard de dependencias (013).
- Q: ¿Releases parciales Phase 2? → A: Global cutover + subset de ops. `Book.chartReleaseId` **diferido** (no en 014 MVP).
- Q: ¿`reportRole` contra-ingreso? → A: Campo opcional `normal` \| `contra` (default `normal`), **inerte** para P&G en 014; solo editable/persistido.
- Q: ¿Scope MVP? → A: Phase 1 only (commands + UI). ChartRelease tables/jobs = out of MVP tasks (documented in ADR/plan).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Reparent with cascade recode (Priority: P1)

As a catalog administrator, I need to move an account under a new parent and have codes recalculated for the node and descendants, so the chart stays consistent with `[A][BBB][C][DDD]` without losing account identity.

**Why this priority**: Core structural fix for a misplaced catalog before production users.

**Independent Test**: Dry-run returns old→new codes; apply persists `parentId` + `codigo`, keeps `id`; existing journal lines still resolve by id.

**Acceptance Scenarios**:

1. **Given** a postable under group A, **When** reparent to group B (same class `[A]`), **Then** codes update under B’s `[BBB]` with free `[DDD]` sequences; `id` unchanged.
2. **Given** a reparent that would change class `[A]`, **When** dry-run or apply, **Then** `400` domain error and no DB write.
3. **Given** plantillas with `groupCode` in the affected code set, **When** dry-run, **Then** impact lists those plantilla codes.
4. **Given** `cascadeUserCodigos: true`, **When** apply reparent, **Then** user accounts hanging under affected globals get new `codigo` values consistent with the new parent group.

---

### User Story 2 — Command API, dry-run, audit (Priority: P1)

As an engineer/operator tooling consumer, I need structural mutations as explicit commands with dry-run and audit, so UI, CLI, and future releases share one path.

**Independent Test**: `POST .../commands/reparent` with `dryRun: true` mutates nothing; `false` applies and audits.

**Acceptance Scenarios**:

1. **Given** admin operator, **When** `dryRun: true`, **Then** `200` preview only; DB unchanged.
2. **Given** `dryRun: false`, **When** apply succeeds, **Then** `AdminAuditLog` (and structured mutation payload) records before/after.
3. **Given** support role, **When** structural command, **Then** `403`.
4. **Given** create/rename/recode/deprecate commands, **When** validated, **Then** same dry-run/apply/audit pattern.

---

### User Story 3 — Admin tree UI (Priority: P1)

As an operator on desktop, I need a hierarchical chart UI to browse, create, rename, reparent (with preview), and deprecate, so I can correct the catalog fluently.

**Why this priority**: Without UI, the engine is unused for day-to-day catalog work.

**Independent Test**: Tree loads; reparent modal shows preview then apply; AppShell remains usable on narrow widths.

**Acceptance Scenarios**:

1. **Given** admin role, **When** opens Global accounts, **Then** sees expandable tree (not only flat table).
2. **Given** selecting move, **When** chooses new parent, **Then** sees impact preview before confirm.
3. **Given** support role, **When** opens chart routes, **Then** read-only or denied mutate (aligned with 013 RBAC).

---

### User Story 4 — Chart releases (Priority: P2 — specify only, not MVP implement)

As an operations lead, I need versioned releases of command batches for governed production migrations later.

**Why this priority**: Design constraint for op schema; implementation deferred.

**Independent Test**: Deferred — ADR 0008 + plan document op schema compatibility only.

**Acceptance Scenarios**: Documented in ADR; no MVP code required.

---

### Edge Cases

- Reparent into own descendant → reject (cycle).
- Reparent onto postable parent → reject (parent must be group / non-postable).
- Recode to existing codigo → reject uniqueness.
- Concurrent two operators editing same node → last-write-wins with audit; prefer `updatedAt` check if cheap.
- Empty chart / leaf-only move → still works.
- Deprecated account → excluded from default plantilla availability matching when `deprecatedAt` set.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Chart engine MUST expose commands: `create`, `rename`, `reparent`, `recode`, `deprecate`.
- **FR-002**: `reparent` MUST cascade recode node + descendants per foundation segmentation rules.
- **FR-003**: Engine MUST reject class `[A]` changes on existing nodes via reparent/recode.
- **FR-004**: `CuentaGlobal.id` MUST remain stable across reparent/recode.
- **FR-005**: Engine MUST NOT rewrite `LineaAsiento` FKs on recode.
- **FR-006**: Dry-run MUST report affected accounts, proposed codes, plantilla `groupCode` hits, and user-codigo impacts.
- **FR-007**: Admin HTTP MUST call chart application services only (no Prisma in routes).
- **FR-008**: Applied commands MUST audit via `AdminAuditLog` with structured before/after.
- **FR-009**: `cascadeUserCodigos` MUST default true in Phase 1 apply; dry-run always lists would-be user code changes.
- **FR-010**: `deprecatedAt` soft-deprecate MUST be supported; hard delete keeps 013 dependency guards.
- **FR-011**: Optional `reportRole` (`normal` \| `contra`) MUST persist; P&G behavior unchanged in 014.
- **FR-012**: Admin-ui MUST provide tree + reparent preview/apply for admin+.

### Key Entities

- **CuentaGlobal** (extended): + `deprecatedAt?`, + `reportRole`
- **ChartCommand** / impact preview DTOs (application)
- Existing **AdminAuditLog** for applied ops

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Reparent+cascade of a subtree ≤ 50 nodes completes apply in < 3s on local/staging fixtures.
- **SC-002**: 100% of dry-run requests leave DB unchanged (integration assertion).
- **SC-003**: 100% of applied structural commands produce audit entries.
- **SC-004**: Cross-class attempts fail closed in unit + integration tests.
- **SC-005**: Operator completes move+preview+apply in admin-ui without manual codigo typing.

## Assumptions

- Pre-production single live chart; in-place apply OK.
- Plantilla JSON remains in repo; Phase 1 impact is advisory (no auto git rewrite).
- ChartRelease persistence is out of 014 MVP implementation.

## Out of Scope (MVP)

- `ChartRelease` tables / batch jobs / per-book binding.
- Rewriting plantilla files from admin UI.
- Changing P&G for `reportRole=contra`.
- Speckit clarify beyond locked session above.

## References

- [needs.md](./needs.md)
- [research.md](./research.md)
- [ADR 0008](../../docs/adr/0008-chart-of-accounts-engine.md)
- [reglas-plan-cuentas.md](../foundation/plan-de-cuentas/reglas-plan-cuentas.md)
- [013 admin](../013-admin-platform/spec.md)
