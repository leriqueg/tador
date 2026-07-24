# Quickstart: Admin Platform (013)

**Status**: Implemented through Phase 8 (T001–T101) + Docker `admin-ui` service.

## Local development (Docker — recommended)

```bash
# From repo root
make db-setup    # postgres + migrate + catalog seed
make up          # postgres, backend, frontend, admin-ui

# Optional: ensure bootstrap operator exists
cd backend && npm run admin:bootstrap
```

| Surface | URL |
|---------|-----|
| Product UI | http://localhost:5173/ |
| Admin UI | http://localhost:5174/login |
| API | http://localhost:3000/api/… |

Staging path map (HAProxy → nginx): [`docs/deploy-path-routing.md`](../../docs/deploy-path-routing.md).

### Dev credentials (after bootstrap)

| Field | Value |
|-------|-------|
| Admin URL | `http://localhost:5174/login` |
| Email | `admin@localhost` (or `ADMIN_INITIAL_EMAIL`) |
| Password | `dev-admin` |
| Change password on login | **No** in local (`mustChangePassword=false`) |

## Without Docker (host)

```bash
# Terminal 1 — backend
cd backend
DEPLOYMENT_PROFILE=full npm run dev

# Terminal 2 — product
cd frontend && npm run dev

# Terminal 3 — admin UI
cd admin-ui && npm run dev
```

## Staging / production bootstrap

```bash
cd backend
npm run db:migrate:deploy
npm run admin:bootstrap
```

Apply nginx path map from [`docs/deploy-nginx-path-routing.snippet.conf`](../../docs/deploy-nginx-path-routing.snippet.conf) behind HAProxy.  
**Do not** publish Vite ports publicly. Set `FRONTEND_BASE_PATH=/webapp/` and `ADMIN_UI_BASE_PATH=/admin-ui/` on those builds.

| Variable | Required | Purpose |
|----------|----------|---------|
| `ADMIN_INITIAL_EMAIL` | **Yes** | Pre-created superadmin email |
| `ADMIN_INITIAL_PASSWORD` | No | Vault temp password; if omitted, random password generated and logged **once** |
| `DEPLOYMENT_PROFILE` | Yes | `full` / `admin` / `product` |
| `OPERATOR_SESSION_SECRET` | Yes | Admin session signing (distinct from `SESSION_SECRET`) |
| `ADMIN_CORS_ORIGIN` | Yes | Admin UI origin(s) for CORS |

**Security note:** admin UI is open in this stage. Later restrict `/admin-ui/` and `/api/admin/` by IP/VPN at HAProxy/nginx.

**First login (staging/prod)**: forced password change (min 12 chars) before data routes.

## Verified smoke paths

1. Admin login → Panel (role-aware nav)
2. Usuarios → search / block / force recovery (admin+)
3. Plantillas → list + preview
4. Cuentas globales → create postable child (admin+)
5. Estadísticas → day range overview
6. Auditoría → superadmin only

## Tests

```bash
cd backend
npm run test:unit -- tests/unit/require-role.test.ts tests/unit/admin-statistics-bucketing.test.ts
npm run test:integration -- tests/admin/
cd ../admin-ui && npm run build
cd ../frontend && npm run build
```

## Notes

- Legacy `/api/dev/plantillas-admin` is not available in production or `DEPLOYMENT_PROFILE=product`.
