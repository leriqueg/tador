# Path routing (HAProxy → nginx → Docker services)

**Status:** local gateway implemented; staging applies the same path map.  
**Security:** admin UI is **open** at this stage. IP/VPN allowlist for `/admin-ui/` and `/api/admin/` is deferred (see TODO in nginx snippets).

## Public path map

| Public path | Upstream | App |
|-------------|----------|-----|
| `/api/*` | `backend:3000` | Fastify (product + admin API) |
| `/auth/*`, `/book/*`, `/health` | `backend:3000` | Product auth/book (not under `/api`) |
| `/webapp/*` | `frontend:5173` | Product SPA (Vite `base` `/webapp/`) |
| `/admin-ui/*` | `admin-ui:5174` | Operator SPA (Vite `base` `/admin-ui/`) |
| `/` | nginx | `302` → `/webapp/` |

Local **gateway**: `http://localhost:8080` (compose service `gateway`).  
Direct ports `5173` / `5174` / `3000` remain for debugging; prefer gateway for staging-like smoke.

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_BASE_PATH` | Vite `base` + React Router basename (`/webapp/` or `/admin-ui/`) |
| `VITE_PROXY_TARGET` | Dev proxy target inside compose (`http://backend:3000`) |
| `CORS_ORIGIN` | Product browser origins (include `http://localhost:8080` when using gateway) |
| `ADMIN_CORS_ORIGIN` | Admin UI origins (include gateway + `:5174`) |
| `DEPLOYMENT_PROFILE` | `full` locally so `/api/admin` registers |

## Staging

Use [`docs/deploy-nginx-path-routing.snippet.conf`](./deploy-nginx-path-routing.snippet.conf) behind HAProxy. Do **not** publish Vite ports publicly; nginx reaches containers on the internal network.

```text
# TODO(security): later restrict /admin-ui/ and /api/admin/ by IP or VPN at HAProxy/nginx.
```
