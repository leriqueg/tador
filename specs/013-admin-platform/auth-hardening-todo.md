# Auth hardening — deferred (013)

**Date**: 2026-07-22  
**Status**: TODO (post-MVP / 013b)

Rigorous controls not required for the first admin platform release. MVP uses the product auth baseline (Argon2, rate limit, generic login errors) plus operator-specific rules in [auth-bootstrap.md](./auth-bootstrap.md).

---

## Operators (`Operator`)

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| T-OP-01 | Lockout after N failed logins (e.g. 5 in 15 min) | Medium | `lockedUntil` or temporary `blockedAt`; distinct from manual block |
| T-OP-02 | Self-service password recovery (email link) | Medium | Needs real email provider; until then another `superadmin` resets |
| T-OP-03 | MFA / TOTP for `admin` and `superadmin` | High (prod) | Phase 5 in plan.md |
| T-OP-04 | Password complexity (uppercase, digit, symbol) | Low | MVP: min 12 chars on change only |
| T-OP-05 | Password history (no reuse last N) | Low | |
| T-OP-06 | Session listing + revoke per operator | Low | |
| T-OP-07 | SSO / OIDC (Google Workspace) | Medium | Phase 5 |

---

## Product users (`User`)

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| T-USR-01 | Lockout after N failed logins | Medium | Same pattern as T-OP-01 |
| T-USR-02 | `blockedAt` enforced at login | **MVP** | Part of 013 US2 — not deferred |
| T-USR-03 | Stronger password policy | Low | MVP stays at 8 chars |
| T-USR-04 | `REQUIRE_EMAIL_VERIFICATION=true` in prod | Medium | Depends on real email adapter |

---

## Included in MVP (not TODO)

- Argon2 hashing (product + operator)
- Rate limit on `/api/admin/auth/login` (stricter than product)
- `mustChangePassword` staging/prod; `false` in dev
- Auto-bootstrap first `superadmin` post-migrate
- Manual user block + force recovery from admin UI
- `AdminAuditLog` on privileged mutations
- Operator manual block via `blockedAt`
