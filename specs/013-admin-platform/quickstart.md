# Quickstart: Admin Platform (013)

**Status**: Planning — update when Phase 0 lands.

## Local development (future)

```bash
# Terminal 1 — backend
cd backend
DEPLOYMENT_PROFILE=full npm run dev
# First migrate creates operator automatically (dev policy)

# Terminal 2 — admin UI
cd admin-ui
npm run dev
```

### Dev credentials (after first migrate)

| Field | Value |
|-------|-------|
| URL | `http://localhost:5174/login` |
| Email | `admin@localhost` (or `ADMIN_INITIAL_EMAIL`) |
| Password | `dev-admin` |
| Change password on login | **No** (`mustChangePassword=false`) |

Optional override in `backend/.env.local` (gitignored):

```bash
ADMIN_INITIAL_EMAIL=you@localhost
ADMIN_INITIAL_PASSWORD=dev-admin
```

## Staging / production bootstrap

Runs automatically after `prisma migrate deploy` via release job or `npm run admin:bootstrap`.

| Variable | Required | Purpose |
|----------|----------|---------|
| `ADMIN_INITIAL_EMAIL` | **Yes** | Pre-created superadmin email |
| `ADMIN_INITIAL_PASSWORD` | No | Vault temp password; if omitted, random password generated and logged **once** |
| `mustChangePassword` | — | Always `true` (not an env var; driven by `NODE_ENV`) |

**First login (staging/prod)**:

1. Use email from `ADMIN_INITIAL_EMAIL`.
2. Use password from vault **or** one-time value from deploy log.
3. UI forces **Cambiar contraseña** before dashboard.
4. New password: minimum 12 characters.

## Other environment variables

| Variable | Purpose |
|----------|---------|
| `DEPLOYMENT_PROFILE` | `full` \| `product` \| `admin` |
| `OPERATOR_SESSION_SECRET` | Admin session signing (distinct from `SESSION_SECRET`) |
| `ADMIN_CORS_ORIGIN` | Admin UI origin for CORS |

## URLs

| Surface | Dev URL |
|---------|---------|
| Admin UI | `http://localhost:5174` |
| Admin API | `http://localhost:3000/api/admin/*` |
| Product UI | `http://localhost:5173` |

## Manual bootstrap (recovery)

```bash
cd backend
ADMIN_INITIAL_EMAIL=ops@example.com \
ADMIN_INITIAL_PASSWORD='optional-temp-from-vault' \
npm run admin:bootstrap
```

Idempotent: skips if any operator already exists.

## Verification checklist

- [ ] After migrate, dev login works with `admin@localhost` / `dev-admin`
- [ ] Staging profile: login returns `mustChangePassword` until change completes
- [ ] Product user cannot access `/api/admin/users`
- [ ] `DEPLOYMENT_PROFILE=product` → admin routes 404

See [auth-bootstrap.md](./auth-bootstrap.md) for full policy.
