# ADR 0006: Admin platform architecture

## Status

Accepted for planning (013-admin-platform). Implementation pending.

## Date

2026-07-22

## Context

TADOR needs an internal administration platform for:

- system user support (block, password recovery);
- global chart of accounts (`CuentaGlobal`);
- template testing (migrating the dev HTML tool);
- usage statistics.

The product will eventually deploy as multiple edge instances (Hogar/PRO only) with **no admin surface** on public nodes. The organization will run **one admin instance** on a private network.

Today, a dev-only plantillas tool exists at `/api/dev/plantillas-admin`, gated by `ENABLE_PLANTILLAS_ADMIN` or non-production `NODE_ENV`. There is no operator RBAC, no audit log, and no separation between product and admin identity.

Constraints from the constitution and security baseline:

- fail-closed authorization;
- tenant isolation on product routes;
- Clean Architecture (domain rules not in controllers);
- no dev surfaces in production;
- accounting invariants must not be bypassed by admin shortcuts.

## Decision

1. **Monorepo module** — Add `admin-ui/` and `backend/src/api/routes/admin/` in the existing repository. Do not create a separate project.

2. **Separate operator identity** — Introduce `Operator` and `OperatorSession` distinct from product `User` and `Session`. Admin uses its own cookie (`admin_session`) and optional separate session secret.

3. **Shared domain/application layer** — All admin mutations execute through `application/admin/*` use cases that reuse existing domain validation and repositories. Admin services MUST NOT bypass business rules with ad-hoc SQL.

4. **RBAC** — Minimum roles: `support`, `admin`, `superadmin`. Every `/api/admin/*` route checks role after operator authentication.

5. **Audit** — Append-only `AdminAuditLog` for all admin mutations.

6. **Deployment profiles** — `DEPLOYMENT_PROFILE` controls which route sets register at startup:
   - `product` — Hogar/PRO API only (edge-safe);
   - `admin` — admin API only (internal instance);
   - `full` — both (local development).

7. **Network controls** — Production admin MUST be reachable only via VPN, IP allowlist, or private ingress in addition to RBAC.

8. **Statistics** — MVP uses aggregated queries on existing tables; optional rollups or read replica later.

9. **Retire dev plantillas route** — After parity, `/api/dev/plantillas-admin` is disabled in production; functionality lives under `/api/admin/templates/*`.

## Alternatives considered

### A. `systemRole` column on product `User`

Rejected. Mixes customer and operator sessions; increases risk of privilege confusion and accidental admin self-assignment through product registration.

### B. Separate repository for admin

Rejected for current stage. Would duplicate types, domain rules, and migration workflow without meaningful security gain if admin still needs the same database and rules.

### C. Admin backend with direct database access

Rejected. Violates single source of business truth; requires elevated DB credentials; bypasses `CuentaGlobal` validation and future accounting guards.

### D. Third-party low-code admin (Retool, AdminJS)

Deferred. Could accelerate early CRUD but adds vendor dependency, still requires secure API design, and fits poorly with TADOR's domain-heavy chart and template preview requirements.

### E. Admin-only database

Rejected. Would require sync/replication complexity for statistics and user support. Single PostgreSQL with application-layer boundaries is sufficient.

## Consequences

### Positive

- Clear security boundary: operator vs customer identity.
- Edge deployments can omit admin code paths via deployment profile.
- Audit trail for compliance and incident response.
- Template tool graduates from dev hack to supported internal product.
- Future split deploy (product-api vs admin-api) does not require repo split.

### Negative / trade-offs

- Additional schema (operators, sessions, audit) to migrate and secure.
- Operators with cross-tenant read access must be tightly controlled and trained.
- Two frontends to maintain (`frontend/` and `admin-ui/`), though both can share design tokens.

### Follow-up

- Implement phases per `specs/013-admin-platform/plan.md`.
- Update `docs/environment-files.md` with admin env vars when Phase 0 lands.
- Update active plan in `.cursor/rules/specify-rules.mdc` at implementation start.

## References

- `specs/013-admin-platform/spec.md`
- `specs/013-admin-platform/plan.md`
- `specs/013-admin-platform/research.md`
- `docs/security.md`
- `specs/foundation/mvp-scope.md` (admin panel post-MVP)
