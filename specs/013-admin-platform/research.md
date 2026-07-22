# Research & Decision Log: Admin Platform (013)

**Date**: 2026-07-22  
**Status**: Accepted for planning

## R-001 — Monorepo module vs separate project

**Decision**: Admin lives in the same repository as a new module (`admin-ui/` + `api/routes/admin/`).

**Alternatives considered**:

| Option | Pros | Cons |
|--------|------|------|
| Same monorepo (chosen) | Shared domain, types, tests; single PR workflow | Larger repo |
| Separate repo | Isolation | Duplication, drift, double maintenance |
| Third-party admin (Retool, etc.) | Fast CRUD | Less control, still needs API, vendor lock-in |

**Rationale**: TADOR already uses Clean Architecture with explicit boundaries; a separate deploy unit does not require a separate codebase.

---

## R-002 — Operator identity vs `systemRole` on `User`

**Decision**: Separate `Operator` entity; product `User` is never an admin by role flag.

**Alternatives**:

| Option | Verdict |
|--------|---------|
| `User.systemRole` enum | Rejected — blurs customer vs operator sessions |
| Separate `Operator` table (chosen) | Clear separation, distinct cookies, independent lockout |
| External IdP only | Deferred to phase 5 (SSO) |

---

## R-003 — Admin backend must use shared application layer

**Decision**: Admin mutations go through `application/admin/*` use cases that call existing domain rules and repositories.

**Rejected**: Admin service with direct Prisma/SQL bypass “because it is internal.”

**Rationale**: `CuentaGlobal` validation, idempotency, and future invariants must not fork. Direct DB access increases credential blast radius without improving safety.

---

## R-004 — Deployment profiles for edge future

**Decision**: Introduce `DEPLOYMENT_PROFILE` env: `product` | `admin` | `full`.

| Profile | Registers |
|---------|-----------|
| `full` (dev default) | Product + admin routes |
| `product` | Hogar/PRO API only |
| `admin` | Admin API only |

**Rationale**: Supports future architecture (N edge product nodes, 1 internal admin instance) without splitting the repository.

---

## R-005 — Migrate plantillas dev tool, don't rewrite

**Decision**: Refactor `plantillas-admin.ts` into admin module; parity tests against existing suite.

**Rationale**: Tool is already implemented and tested (`backend/tests/plantillas.test.ts` admin block). Migration reduces delivery risk.

---

## R-006 — Statistics: query-first, rollup later

**Decision**: MVP uses indexed SQL aggregation on `Session`, `Apunte`, `User.createdAt`.

**Trigger for rollups**: p95 query time > 2s on staging with 12 months data.

**Optional**: Read replica for admin statistics only (no writes).

---

## R-007 — Network security is not optional in production

**Decision**: Document requirement for VPN, IP allowlist, or private ingress for admin UI in production.

**Not sufficient**: RBAC alone on a public URL.

---

## R-008 — Cookie and session separation

**Decision**:

- Product: existing session cookie (unchanged).
- Admin: `admin_session` + optional separate `OPERATOR_SESSION_SECRET`.

Prevents cookie confusion and allows independent session TTL and revocation.

---

## R-009 — Audit log content

**Decision**: Store redacted JSON snapshots; never store passwords, tokens, or full session values.

**Retention**: 1 year default; configurable per environment.

---

## Open questions (for `/speckit-clarify` if needed)

| ID | Question | Default if unanswered |
|----|----------|----------------------|
| Q1 | SSO provider for operators? | Email/password MVP; SSO phase 5 |
| Q2 | Soft vs hard delete for `CuentaGlobal`? | Hard delete only when zero deps; else `409` |
| Q3 | Operator session TTL? | 8 hours |

No blocking clarifications required to proceed to `/speckit-tasks`.
