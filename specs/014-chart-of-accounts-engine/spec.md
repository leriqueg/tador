# Feature Specification: Chart of Accounts Engine (014)

**Feature Branch**: `feat/chart-of-accounts-engine`  
**Created**: 2026-08-01  
**Status**: Draft (pre-Speckit — do not treat as Speckit SoT until `/speckit.specify`)  
**Input**: Needs for a backend chart engine with cascade reparent/recode, dry-run, and future versioning; admin-ui as client.

## Purpose

Provide a **Chart of Accounts Engine** in the TADOR backend that owns global catalog invariants and structural mutations. The admin platform (013) becomes a client of this engine. Phase 1 mutates the single live chart in place (pre-production). Phase 2 packages the same commands into chart releases and migration jobs.

## User Scenarios & Testing

### User Story 1 — Structural reparent with cascade recode (Priority: P1)

As a catalog administrator, I need to move an account (or subtree) under a new parent and have codes recalculated, so the tree stays consistent with `[A][BBB][C][DDD]` without losing account identity.

**Independent Test**: Dry-run shows old→new codes for node + descendants; apply persists `parentId` + `codigo`, keeps `id`; journal lines still resolve by id.

**Acceptance Scenarios**:

1. **Given** a postable account under group A, **When** operator reparents it under group B (same class), **Then** its `codigo` (and children’s) update to B’s group segment with free sequences; `id` unchanged.
2. **Given** a reparent that would change class digit `[A]`, **When** dry-run or apply is requested, **Then** the engine rejects with a domain error (no partial write).
3. **Given** plantillas referencing old group codes in the affected set, **When** dry-run runs, **Then** the impact list includes those plantilla codes.

### User Story 2 — Command-oriented API + audit (Priority: P1)

As an engineer, I need structural changes expressed as explicit commands with audit, so CLI/batch and future releases reuse the same path as the UI.

**Independent Test**: `reparent` / `recode` / `create` produce mutation log + `AdminAuditLog` (or dedicated chart mutation log); generic PATCH is not the only way to change hierarchy.

**Acceptance Scenarios**:

1. **Given** an authenticated admin operator, **When** they `POST .../reparent` with `dryRun: true`, **Then** no DB mutation occurs and a preview payload is returned.
2. **Given** `dryRun: false`, **When** apply succeeds, **Then** an append-only record of the op exists with before/after snapshots.

### User Story 3 — Fluid tree editing in admin-ui (Priority: P1)

As an operator on desktop, I need a hierarchical chart UI to create, rename, reparent, and preview impact, so I can correct the catalog before production users arrive.

**Independent Test**: Tree view loads full chart; reparent flow shows preview then apply; mobile layout remains usable (AppShell collapse).

### User Story 4 — Chart releases & partial migration (Priority: P2 — specify now, implement later)

As an operations lead, I need versioned chart releases and the ability to apply migrations partially (by op subset or by book), so production catalog changes are governed.

**Independent Test** (Phase 2): Publish draft ops as release vN→vN+1; apply job can target one book or a subset of ops; dry-run available under maintenance.

**Acceptance Scenarios** (Phase 2):

1. **Given** a draft release with N ops, **When** published, **Then** the live chart is not mutated until apply.
2. **Given** two books, **When** migration is partial by book, **Then** book A can be on release v2 while book B remains on v1 (if multi-release binding is chosen — see ADR 0008).

## Requirements

### Functional

- **FR-001**: System MUST expose chart commands: at least `create`, `rename`, `reparent`, `recode`, `deprecate` (Phase 1 may map deprecate to soft-flag or delete-with-deps guard).
- **FR-002**: `reparent` MUST cascade recode for the node and descendants according to foundation rules in `specs/foundation/plan-de-cuentas/reglas-plan-cuentas.md`.
- **FR-003**: System MUST NOT allow changing accounting class `[A]` via reparent/recode on an existing node.
- **FR-004**: System MUST keep `CuentaGlobal.id` stable across reparent/recode.
- **FR-005**: System MUST NOT rewrite `LineaAsiento` account FKs as part of normal recode.
- **FR-006**: Dry-run MUST report affected accounts, proposed codes, plantilla `groupCode` hits, and optional `CuentaUsuario.codigo` impacts.
- **FR-007**: Admin HTTP adapters MUST call the chart application service; no Prisma chart mutations in route handlers.
- **FR-008**: All applied structural commands MUST be audit-logged.
- **FR-009** (Phase 2): System SHOULD persist command batches as `ChartRelease` artifacts reusing Phase 1 op schema.
- **FR-010** (Phase 2): System SHOULD support maintenance/batch apply of a release.

### Non-functional

- Desktop-first admin UX; usable on narrow viewports.
- Exact money rules unchanged (engine does not compute balances).
- Spanish operator labels; English code identifiers and routes.

## Key Entities (Phase 1)

- **CuentaGlobal** (existing): id, parentId, codigo, nombre, esPostable, …
- **ChartCommand**: serializable op (`type`, payload, optional `dryRun`)
- **ChartImpactPreview**: proposed mutations + dependency hits
- **ChartMutationLog** (new or via AdminAuditLog with structured payload): append-only applied ops

## Key Entities (Phase 2 — reserved)

- **ChartRelease**: version, status (`draft`\|`published`\|`applied`), ops[]
- **Book.chartReleaseId** (optional binding strategy — ADR)

## Assumptions

- Pre-production: single live chart; in-place apply is acceptable.
- Cross-class correction = deprecate + create new account (not move).
- Plantillas remain JSON in repo in Phase 1; impact is advisory unless a rewrite helper is explicitly scoped.
- Contra-income metadata is optional Phase 1 field, inert until report engine consumes it.

## Out of Scope (Phase 1)

- Speckit-generated tasks (until draft approved).
- Full multi-version coexistence in product reports.
- Impersonation / tenant chart forks.
- Automatic rewrite of all plantilla JSON in git from admin UI.

## References

- [needs.md](./needs.md)
- [research.md](./research.md)
- [ADR 0008](../../docs/adr/0008-chart-of-accounts-engine.md)
- [reglas-plan-cuentas.md](../foundation/plan-de-cuentas/reglas-plan-cuentas.md)
- [013 admin inventory](../013-admin-platform/inventory-views-endpoints.md) — current CRUD surface to evolve
