# Quickstart: Admin Platform (013)

**Status**: Implemented through Phase 8 (T001–T101). Apply pending DB migration for statistics indexes if not yet deployed.

## Local development

```bash
# Terminal 1 — Postgres (reuse existing tador-postgres if present)
# make db-up   # may conflict if container already running

# Terminal 2 — backend
cd backend
npx prisma migrate deploy   # includes admin tables + statistics indexes
DEPLOYMENT_PROFILE=full npm run dev

# Terminal 3 — admin UI
cd admin-ui
npm install
npm run dev
# → http://localhost:5174 (proxies /api/admin → backend :3000)
```

### Dev credentials (after bootstrap)

| Field | Value |
|-------|-------|
| URL | `http://localhost:5174/login` |
| Email | `admin@localhost` (or `ADMIN_INITIAL_EMAIL`) |
| Password | `dev-admin` / `dev-admin-password` (see seed) |
| Change password on login | **No** in local (`mustChangePassword=false`) |

Optional override in `backend/.env.local` (gitignored):

```bash
ADMIN_INITIAL_EMAIL=you@localhost
ADMIN_INITIAL_PASSWORD=dev-admin
OPERATOR_SESSION_SECRET=dev-operator-secret-change-me
ADMIN_CORS_ORIGIN=http://localhost:5174
DEPLOYMENT_PROFILE=full
```

## Verified smoke paths

1. Login → Panel (role-aware nav)
2. Usuarios → search / block / force recovery (admin+)
3. Plantillas → list + preview with sample `userId` (no persist)
4. Cuentas globales → create postable child (admin+)
5. Estadísticas → day range overview
6. Auditoría → superadmin only

## Staging / production bootstrap

```bash
cd backend
npm run db:migrate:deploy
npm run admin:bootstrap
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `ADMIN_INITIAL_EMAIL` | **Yes** | Pre-created superadmin email |
| `ADMIN_INITIAL_PASSWORD` | No | Vault temp password; if omitted, random password generated and logged **once** |
| `DEPLOYMENT_PROFILE` | Yes | `full` / `admin` / `product` |
| `OPERATOR_SESSION_SECRET` | Yes | Distinct from product `SESSION_SECRET` |
| `ADMIN_CORS_ORIGIN` | Yes | Admin UI origin |

**First login (staging/prod)**: forced password change (min 12 chars) before data routes.

## Tests

```bash
cd backend
npm run test:unit -- tests/unit/require-role.test.ts tests/unit/admin-statistics-bucketing.test.ts tests/unit/cuenta-global.test.ts
npm run test:integration -- tests/admin/
cd ../admin-ui && npm run build
```

## Notes

- Legacy `/api/dev/plantillas-admin` is not available in production or `DEPLOYMENT_PROFILE=product`.
- Prefer `/api/admin/templates/*` with operator auth.
- Do not commit secrets. Delivery: `size:exception` + `feature-branch-chain` (no auto-commit in apply).
