# Operator bootstrap & password policy (013)

**Date**: 2026-07-22  
**Status**: Accepted

## Summary

The first `superadmin` operator is created **automatically after database migration** when no operator exists. Credentials are environment-specific; staging and production require a **password change on first login**.

---

## Bootstrap flow

```text
prisma migrate deploy (or migrate dev)
        ↓
ensureBootstrapOperator()   ← idempotent, runs post-migrate
        ↓
  count(operators) > 0 ?  → skip
        ↓
  create superadmin
        ↓
  email  ← ADMIN_INITIAL_EMAIL (required staging/prod; default dev)
  password ← see table below
  mustChangePassword ← false (dev) | true (staging/prod)
        ↓
  if generated password → log ONCE to stdout (never persist plaintext)
```

**Idempotent rule**: if any `Operator` row exists, bootstrap does nothing (no password overwrite on redeploy).

**Manual override**: `npm run admin:bootstrap` remains available for disaster recovery or local re-seeding (same logic as `ensureBootstrapOperator`).

---

## Policy by environment

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| `ADMIN_INITIAL_EMAIL` | Optional; default `admin@localhost` | **Required** | **Required** |
| Initial password | Fixed dev default (`dev-admin`) or `ADMIN_INITIAL_PASSWORD` in `.env.local` | Random generated **or** `ADMIN_INITIAL_PASSWORD` from vault | Random generated **or** vault secret |
| `mustChangePassword` | **`false`** | **`true`** | **`true`** |
| Password in deploy log | N/A (known dev password) | Yes, if auto-generated (one-time) | Yes, if auto-generated (capture in deploy output / secret) |
| Fail if email missing | No (use default) | **Yes** | **Yes** |

### Initial password sources (staging/prod)

Priority order:

1. **`ADMIN_INITIAL_PASSWORD`** in secret manager — acceptable temporary password; operator must change on first login.
2. **Auto-generated** (32+ char random) — **preferred** when no vault temp password is set; printed once to deploy log; `mustChangePassword=true`.

Do **not** commit initial passwords to git. Do **not** leave a permanent default password in production env files.

### Development ergonomics

Developers should log in immediately after migrate without a password-change step:

- Email: `admin@localhost` (or `ADMIN_INITIAL_EMAIL`)
- Password: `dev-admin` (documented in `quickstart.md` and `.env.example` comments only)
- `mustChangePassword=false`

---

## First login behavior

### `mustChangePassword=false` (dev)

Normal login → admin dashboard.

### `mustChangePassword=true` (staging/prod)

1. Operator submits email + initial password (from vault or deploy log).
2. API returns `200` with `{ mustChangePassword: true }` and a **short-lived setup session** or requires change before issuing full `admin_session`.
3. UI shows **Cambiar contraseña** (no other nav until complete).
4. `POST /api/admin/auth/change-password` with `currentPassword` + `newPassword`.
5. On success: set `mustChangePassword=false`, `passwordChangedAt=now()`, issue normal session → dashboard.

**New password rules (operator)**: minimum 12 characters (stricter than product's 8); complexity rules deferred to auth-hardening TODO.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ADMIN_INITIAL_EMAIL` | staging/prod | Pre-filled operator identity; no registration form |
| `ADMIN_INITIAL_PASSWORD` | No | Optional vault temp password; if unset, generate random |
| `APP_ENV` or `NODE_ENV` | Yes | Drives `mustChangePassword` and dev defaults (`development` vs `production`) |

`ADMIN_BOOTSTRAP_*` names are **deprecated** in favor of `ADMIN_INITIAL_*` (alias supported one release for compatibility if already documented elsewhere).

---

## Integration points

| Location | Responsibility |
|----------|----------------|
| `backend/prisma/seed/ensure-bootstrap-operator.ts` | Core idempotent logic |
| `backend/scripts/admin/bootstrap-operator.ts` | CLI wrapper calling same function |
| Post-migrate hook or `server.ts` startup (dev only) | Call `ensureBootstrapOperator` when `operators` table empty |
| Release job after `migrate deploy` | Run `npm run admin:bootstrap` in staging/prod pipelines |

**Recommendation**: staging/prod run bootstrap as an **explicit release step** after migrate (so deploy logs capture generated password). Dev may call on server startup for convenience.

---

## Auth hardening — deferred (not MVP)

Tracked in [auth-hardening-todo.md](./auth-hardening-todo.md). MVP includes Argon2, rate limit, `mustChangePassword` by environment, and manual operator block via `blockedAt`.

---

## References

- [data-model.md](./data-model.md) — `Operator` fields
- [contracts/behavior.md](./contracts/behavior.md) — CC-ADMIN-011, CC-ADMIN-012
- [research.md](./research.md) — R-010, R-011
