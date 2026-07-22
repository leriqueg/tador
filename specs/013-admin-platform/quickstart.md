# Quickstart: Admin Platform (013) — planning stub

**Status**: Not implemented yet. This document will be updated when Phase 0 lands.

## Intended local development (future)

```bash
# Terminal 1 — backend (full profile)
cd backend
DEPLOYMENT_PROFILE=full npm run dev

# Terminal 2 — admin UI
cd admin-ui
npm run dev

# Bootstrap first operator (once)
cd backend
ADMIN_BOOTSTRAP_EMAIL=ops@example.com \
ADMIN_BOOTSTRAP_PASSWORD='...' \
npm run admin:bootstrap
```

## Environment variables (planned)

| Variable | Purpose |
|----------|---------|
| `DEPLOYMENT_PROFILE` | `full` \| `product` \| `admin` |
| `OPERATOR_SESSION_SECRET` | Admin session signing (distinct from `SESSION_SECRET`) |
| `ADMIN_CORS_ORIGIN` | Admin UI origin for CORS |
| `ADMIN_BOOTSTRAP_EMAIL` | One-time superadmin seed |
| `ADMIN_BOOTSTRAP_PASSWORD` | One-time superadmin seed |

## URLs (planned)

| Surface | Dev URL |
|---------|---------|
| Admin UI | `http://localhost:5174` (separate Vite port) |
| Admin API | `http://localhost:3000/api/admin/*` |
| Product UI | `http://localhost:5173` (unchanged) |

## Verification checklist (post-implementation)

- [ ] Operator can log in; product user cannot access `/api/admin/users`
- [ ] Block user → product login fails
- [ ] Template preview matches legacy dev tool output
- [ ] `DEPLOYMENT_PROFILE=product` → admin routes 404
- [ ] Audit log entry on block action
