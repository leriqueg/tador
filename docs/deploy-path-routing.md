# Path routing (staging / HAProxy → nginx)

**Dev:** no local gateway. `make up` starts the full stack (including admin-ui)
on published ports (`5173` product, `5174` admin, `3000` API). Optional:
`make dev-admin-ui` if only the admin SPA needs a foreground restart.  
**Staging:** `make staging-up` starts the full stack; path map via frontend
nginx (`/admin-ui/` → `admin-ui:80`). Do not publish Vite ports publicly.

**Security:** admin UI is **open** at this stage. IP/VPN allowlist for `/admin-ui/` and `/api/admin/` is deferred (see TODO in nginx snippets).

## Staging public path map

| Public path | Upstream | App |
|-------------|----------|-----|
| `/api/*` | `backend:3000` | Fastify (product + admin API) |
| `/auth/*`, `/book/*`, `/health` | `backend:3000` | Product auth/book (not under `/api`) |
| `/webapp/*` | `frontend` | Product SPA (`VITE_BASE_PATH=/webapp/`) |
| `/admin-ui/*` | `admin-ui` | Operator SPA (`VITE_BASE_PATH=/admin-ui/`) |
| `/` | nginx | `302` → `/webapp/` |

Snippet: [`deploy-nginx-path-routing.snippet.conf`](./deploy-nginx-path-routing.snippet.conf)  
Reference config (unused in local compose): `docker/nginx/default.conf`

## Local development ports

| Surface | URL |
|---------|-----|
| Product | http://localhost:5173/ |
| Admin | http://localhost:5174/login |
| API | http://localhost:3000/ |

Compose defaults `VITE_BASE_PATH=/` for both SPAs. For staging builds, set `FRONTEND_BASE_PATH=/webapp/` and `ADMIN_UI_BASE_PATH=/admin-ui/`.

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_BASE_PATH` / `FRONTEND_BASE_PATH` / `ADMIN_UI_BASE_PATH` | Vite `base` + React Router basename |
| `VITE_PROXY_TARGET` | Dev proxy to backend (`http://backend:3000`) |
| `CORS_ORIGIN` | Product browser origins |
| `ADMIN_CORS_ORIGIN` | Admin UI origins |
| `DEPLOYMENT_PROFILE` | `full` locally so `/api/admin` registers |

```text
# TODO(security): later restrict /admin-ui/ and /api/admin/ by IP or VPN at HAProxy/nginx.
```
