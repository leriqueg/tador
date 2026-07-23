# Quickstart: Admin Platform (013)

**Status**: Implemented through Phase 8 (T001–T101) + path routing / Docker gateway.

## Local development (Docker — recommended)

```bash
# From repo root
make db-setup    # postgres + migrate + catalog seed
make up          # postgres, backend, frontend, admin-ui, gateway

# Optional: ensure bootstrap operator exists
cd backend && npm run admin:bootstrap
```

| Surface | URL |
|---------|-----|
| **Gateway (staging-like)** | http://localhost:8080/ → redirects to `/webapp/` |
| Product UI | http://localhost:8080/webapp/ |
| Admin UI | http://localhost:8080/admin-ui/login |
| Direct product Vite | http://localhost:5173/webapp/ |
| Direct admin Vite | http://localhost:5174/admin-ui/login |
| API | http://localhost:3000/api/… |

Path contract: [`docs/deploy-path-routing.md`](../../docs/deploy-path-routing.md).

### Dev credentials (after bootstrap)

| Field | Value |
|-------|-------|
| Admin URL | `http://localhost:8080/admin-ui/login` |
| Email | `admin@localhost` (or `ADMIN_INITIAL_EMAIL`) |
| Password | `dev-admin` |
| Change password on login | **No** in local (`mustChangePassword=false`) |

## Without Docker (host)

```bash
# Terminal 1 — backend
cd backend
DEPLOYMENT_PROFILE=full npm run dev

# Terminal 2 — product (optional base)
cd frontend
VITE_BASE_PATH=/webapp/ npm run dev

# Terminal 3 — admin UI
cd admin-ui
VITE_BASE_PATH=/admin-ui/ npm run dev
```

## Staging / production bootstrap

```bash
cd backend
npm run db:migrate:deploy
npm run admin:bootstrap
```

Apply nginx path map from [`docs/deploy-nginx-path-routing.snippet.conf`](../../docs/deploy-nginx-path-routing.snippet.conf) behind HAProxy.  
**Do not** publish Vite ports publicly.

| Variable | Required | Purpose |
|----------|----------|---------|
| `ADMIN_INITIAL_EMAIL` | **Yes** | Pre-created superadmin email |
| `ADMIN_INITIAL_PASSWORD` | No | Vault temp password; if omitted, random password generated and logged **once** |
| `DEPLOYMENT_PROFILE` | Yes | `full` / `admin` / `product` |
| `OPERATOR_SESSION_SECRET` | Yes | Admin session signing (distinct from `SESSION_SECRET`) |
| `ADMIN_CORS_ORIGIN` | Yes | Admin UI origin(s) for CORS |
| `FRONTEND_BASE_PATH` | No | Default `/webapp/` in compose |
| `ADMIN_UI_BASE_PATH` | No | Default `/admin-ui/` in compose |

**Security note:** admin UI is open in this stage. Later restrict `/admin-ui/` and `/api/admin/` by IP/VPN at HAProxy/nginx.

**First login (staging/prod)**: forced password change (min 12 chars) before data routes.

## Verified smoke paths

1. Gateway `/` → `/webapp/`
2. Admin login → Panel (role-aware nav)
3. Usuarios → search / block / force recovery (admin+)
4. Plantillas → list + preview
5. Cuentas globales → create postable child (admin+)
6. Estadísticas → day range overview
7. Auditoría → superadmin only

## Tests

```bash
cd backend
npm run test:unit -- tests/unit/require-role.test.ts tests/unit/admin-statistics-bucketing.test.ts
npm run test:integration -- tests/admin/
cd ../admin-ui && VITE_BASE_PATH=/admin-ui/ npm run build
cd ../frontend && VITE_BASE_PATH=/webapp/ npm run build
```

## Notes

- Legacy `/api/dev/plantillas-admin` is not available in production or `DEPLOYMENT_PROFILE=product`.
- HMR through the gateway can be flaky; use direct `:5173` / `:5174` for day-to-day UI work.
