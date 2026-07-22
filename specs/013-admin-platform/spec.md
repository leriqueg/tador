# Feature Specification: Admin Platform (013)

**Feature Branch**: `013-admin-platform`  
**Created**: 2026-07-22  
**Status**: Draft (planning)  
**Input**: Internal operations platform for system user administration, global chart of accounts, template testing (migrated from dev tool), and usage statistics.

## Purpose

Provide TADOR operators with a **single internal administration surface** to manage platform-wide data and support end users, without exposing admin capabilities in the Hogar/PRO product UI or on public edge deployments.

This capability is **post-MVP** and replaces the interim HTML dev tool at `/api/dev/plantillas-admin` with a proper admin module gated by operator identity, roles, and audit logging.

## User Scenarios & Testing

### User Story 1 — Operator authentication (Priority: P1)

As a TADOR operator, I need to sign in to the admin platform with credentials and permissions separate from product users, so that customer sessions cannot access administrative actions.

**Why this priority**: Without operator identity and authorization, every other admin capability is unsafe.

**Independent Test**: An operator with valid credentials reaches the admin dashboard; a product user session or anonymous caller cannot access any `/api/admin/*` route.

**Acceptance Scenarios**:

1. **Given** valid operator credentials, **When** the operator signs in, **Then** an admin session is created and the dashboard loads.
2. **Given** a Hogar/PRO user session only, **When** they request `/api/admin/users`, **Then** the system responds with forbidden and records no mutation.
3. **Given** an operator signs out, **When** they retry an admin action, **Then** the session is rejected.

---

### User Story 2 — System user support (Priority: P1)

As a support operator, I need to search users, block/unblock accounts, and trigger password recovery, so that I can help customers without direct database access.

**Why this priority**: User lockout and credential issues are the most common operational incidents.

**Independent Test**: Operator finds a user by email, blocks them, verifies login fails, unblocks, and triggers a password reset flow that invalidates existing sessions.

**Acceptance Scenarios**:

1. **Given** an active user, **When** an operator blocks the account, **Then** all active product sessions are revoked and subsequent login fails with a generic message.
2. **Given** a blocked user, **When** an operator unblocks the account, **Then** the user can sign in again.
3. **Given** a user who forgot their password, **When** an operator triggers forced recovery, **Then** a recovery token flow is initiated, existing sessions are invalidated, and the action is audit-logged.
4. **Given** an operator without `admin` role, **When** they attempt a block action, **Then** the action is denied.

---

### User Story 3 — Global chart of accounts maintenance (Priority: P2)

As a catalog administrator, I need to view and maintain `CuentaGlobal` entries (hierarchy, codes, postable flag), so that the shared chart stays consistent for all tenants and plantillas.

**Why this priority**: Global accounts underpin templates and user activations; errors propagate to all users.

**Independent Test**: Operator creates or edits a global account respecting code/hierarchy rules; invalid changes are rejected; dependent usage count is visible before destructive actions.

**Acceptance Scenarios**:

1. **Given** a valid parent group account, **When** an operator adds a postable child with a valid 8-digit code, **Then** the account is persisted and visible in the catalog tree.
2. **Given** a global account referenced by user activations or journal lines, **When** an operator attempts hard delete, **Then** the system blocks deletion and shows dependency summary.
3. **Given** an invalid code or non-postable parent misuse, **When** an operator submits the form, **Then** domain validation errors are returned without partial persistence.

---

### User Story 4 — Template testing workspace (Priority: P2)

As a template maintainer, I need the existing plantillas admin tool (list, preview, readiness, mock asiento) inside the admin platform, so that template QA does not depend on dev-only routes.

**Why this priority**: Tool already exists; migration reduces risk and closes a dev surface in production.

**Independent Test**: Operator opens template list, runs preview/readiness for a template in Hogar and PRO modes, and receives the same results previously available at `/api/dev/plantillas-admin`.

**Acceptance Scenarios**:

1. **Given** operator with `support` or higher role, **When** they open Templates, **Then** all versioned plantillas are listed with status and modes.
2. **Given** a selected template, **When** operator runs preview, **Then** resolved accounts and mock journal lines are shown without persisting data.
3. **Given** production deployment, **When** `ENABLE_PLANTILLAS_ADMIN` is false, **Then** legacy `/api/dev/plantillas-admin` remains unreachable while admin routes work for authorized operators.

---

### User Story 5 — Usage statistics (Priority: P3)

As an operations lead, I need dashboards for logins and apuntes created per day, week, and month, so that I can monitor adoption and activity trends.

**Why this priority**: Read-only analytics; valuable but not blocking for support operations.

**Independent Test**: Operator selects a date range and sees aggregated counts matching known seed/test activity within documented tolerance.

**Acceptance Scenarios**:

1. **Given** sessions and apuntes in the database, **When** an operator views the daily report, **Then** counts of distinct active users and new apuntes match aggregated queries.
2. **Given** a week or month filter, **When** the operator switches granularity, **Then** buckets align to book timezone policy (MVP: UTC) and labels are unambiguous.
3. **Given** an operator with read-only `support` role, **When** they open statistics, **Then** they see aggregates only (no raw PII export in MVP).

### Edge Cases

- Operator session expires mid-mutation → transaction rolls back; user sees re-auth prompt.
- Concurrent operators edit the same `CuentaGlobal` → last-write-wins with optimistic conflict detection or updated-at check; both actions audit-logged.
- Blocking a user while they have an in-flight apunte write → block takes effect for new auth; in-flight idempotent writes complete or fail per existing concurrency rules.
- Statistics on empty database → zero states with clear copy, not errors.
- Chart edit that would break an active plantilla reference → validation warns before save.

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a dedicated admin UI not linked from Hogar/PRO navigation.
- **FR-002**: System MUST authenticate operators separately from product users (distinct identity model or distinct auth flow).
- **FR-003**: System MUST enforce role-based authorization on every admin route (`support`, `admin`, `superadmin` minimum set).
- **FR-004**: System MUST audit-log every admin mutation (actor, action, target, timestamp, before/after snapshot where applicable).
- **FR-005**: Operators with `admin` role MUST list/search product users by email and account status.
- **FR-006**: Operators with `admin` role MUST block and unblock users; block MUST revoke all product sessions.
- **FR-007**: Operators with `admin` role MUST trigger password recovery for a user without revealing or setting passwords in clear text.
- **FR-008**: Operators with `admin` role MUST manage `CuentaGlobal` CRUD through domain validation rules in `specs/foundation/plan-de-cuentas/reglas-plan-cuentas.md`.
- **FR-009**: System MUST prevent hard deletion of global accounts with dependents (activations, journal lines, children).
- **FR-010**: System MUST migrate plantillas admin capabilities from `/api/dev/plantillas-admin` to `/api/admin/templates/*`.
- **FR-011**: System MUST expose usage reports: logins (session creations), distinct active users, apuntes created — aggregatable by day, week, month.
- **FR-012**: Product API deployments MUST be able to omit admin route registration via deployment profile (future edge-safe builds).
- **FR-013**: Admin mutations on tenant data MUST intentionally bypass tenant scope through explicit admin application services, never via accidental missing filters.
- **FR-014**: System MUST fail closed: missing role, blocked operator, or invalid session → deny admin access.

### Constitution Alignment

- **Tenant & Privacy**: Admin reads cross-tenant data by design; access is limited to authenticated operators, roles, audit trail, and network controls. Statistics MUST aggregate by default; exporting identifiable user lists is out of MVP scope unless explicitly authorized.
- **Accounting Impact**: Global chart edits may affect future postings and template resolution; they MUST NOT silently rewrite posted journal history. Template preview MUST NOT persist asientos.
- **MVP/Sprint Boundary**: Post-MVP internal platform. Replaces dev-only plantillas HTML tool. Does not include customer-facing features, billing, or full ITSM.
- **Testing Obligation**: Integration tests for authz boundaries, user block/recovery, chart validation, template preview parity, and statistics aggregation. E2E smoke for operator login and one admin workflow per phase.
- **Concurrency & Idempotency**: User block and session revocation MUST be idempotent. Chart updates MUST validate referential integrity in a transaction.
- **Secure Design & Maintainability**: Admin routes live in `api/routes/admin/*`; use cases in `application/admin/*`; shared domain rules reused — no raw SQL bypass. English code identifiers; Spanish operator-facing labels acceptable.
- **Dependency Hygiene**: No new packages unless justified in plan; stable releases only.

### Key Entities

- **Operator**: Internal user of the admin platform (email, password hash or SSO subject, role, status).
- **OperatorSession**: Admin session token, distinct from product `Session`.
- **AdminAuditLog**: Append-only record of privileged actions.
- **User** (existing): Product end user; gains `blockedAt` / `blockedReason` (or equivalent).
- **CuentaGlobal** (existing): Platform-wide chart node.
- **Usage aggregates**: Derived metrics from `Session.createdAt`, `Apunte.createdAt`, `User.createdAt`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Authorized operators complete user lookup and block/unblock in under 2 minutes end-to-end.
- **SC-002**: 100% of admin mutations produce an audit log entry inspectable by `superadmin`.
- **SC-003**: Unauthorized callers (anonymous, product session, wrong role) receive denial on 100% of admin route probes in security tests.
- **SC-004**: Template preview parity: results match legacy dev tool for the canonical plantilla set used in regression tests.
- **SC-005**: Usage dashboard loads aggregated metrics for 90-day window in under 5 seconds on staging-scale data (target for implementation planning).

## Assumptions

- Operator count is small (single digits); no public self-registration for admin.
- MVP operator auth is email/password with Argon2, same crypto standards as product; SSO is a later phase.
- One admin deployment per organization; not replicated to edge nodes.
- Statistics use primary database with indexed aggregation in MVP; read replica or rollups deferred until volume requires.
- Admin UI is a separate Vite app (`admin-ui/`) sharing Mantine/design tokens where practical.
- Plantillas remain JSON in repo in MVP; admin template UI is test/preview only, not live JSON editing in database.

## Out of Scope (MVP of 013)

- Customer impersonation (“login as user”).
- Bulk user import/export.
- Editing plantilla JSON files in production from UI (preview/test only).
- Billing, subscriptions, feature flags console.
- MFA / SSO (planned phase 2).
- Separate physical database for admin.

## Dependencies

- Existing auth infrastructure (Argon2, session patterns, `AuthToken` recovery flow).
- `CuentaGlobal` domain and seed (`004`, `002`).
- Plantillas admin implementation (`004` §12, `plantillas-admin.ts`).
- Security baseline (`011`, `docs/security.md`).

## References

- [plan.md](./plan.md) — technical plan and phasing
- [data-model.md](./data-model.md) — entities and schema deltas
- [inventory-views-endpoints.md](./inventory-views-endpoints.md) — UI views and API surface
- [contracts/behavior.md](./contracts/behavior.md) — behavioral contracts
- [research.md](./research.md) — decision log
- [docs/adr/0006-admin-platform-architecture.md](../../docs/adr/0006-admin-platform-architecture.md)
