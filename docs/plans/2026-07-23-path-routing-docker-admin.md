# Plan: Path routing + admin-ui in Docker (staging-ready)

**Date:** 2026-07-23  
**Branch context:** `feature/admin_platform`  
**Goal:** Complement separate `admin-ui` / `frontend` / `backend` services with path-based reverse-proxy contracts so local Docker and staging (HAProxy → nginx) publish by **path**, not by exposing Vite ports.

**Out of scope (deferred):** IP allowlist / VPN lock-down for admin UI. Admin UI is **open** at this stage; document the future ACL hook only.

**Assumptions**

- Backend remains **one** Fastify process; admin API stays under `/api/admin/*`.
- Product auth/book paths that are not under `/api` today (`/auth`, `/book`) keep working via nginx.
- Same public host can serve product + admin via paths; security hardening comes later.

---

## Target URL map

| Public path | Upstream (compose service) | Notes |
|-------------|----------------------------|--------|
| `/api/*` | `backend:3000` | Includes `/api/admin/*` |
| `/auth/*`, `/book/*`, `/health` | `backend:3000` | Match current Vite proxy |
| `/webapp/*` | `frontend` | Product SPA; Vite `base` + Router `basename` |
| `/admin-ui/*` | `admin-ui` | Operator SPA; Vite `base` + Router `basename` |
| `/` | nginx | Landing or `302 → /webapp/` (decide in W1) |

Local ports (`5173`/`5174`/`3000`) remain for direct debugging; **staging does not need them published**.

---

## Workload / delivery

- Prefer **work-unit commits** on `feature/admin_platform` (or a follow-up branch).
- Estimated size: medium–high → slice by work unit below; each unit is one subagent batch.
- Orchestrator runs units **in order** unless marked `[P]` (parallel after W1).

---

## Work units (subagent slices)

### W1 — Contract & docs (orchestrator or docs subagent)

**Outcome:** Written contract for nginx/HAProxy + env vars; no behavior change yet.

- [ ] Decide root `/` behavior: redirect to `/webapp/` vs small landing.
- [ ] Document path map in `docs/dockerizacion.md` (or short `docs/deploy-path-routing.md`).
- [ ] Extend `.env.example` / `.env.production.example` with:
  - `VITE_BASE_PATH` / documented bases `/webapp/` and `/admin-ui/`
  - `ADMIN_CORS_ORIGIN` / `CORS_ORIGIN` for same-origin proxy case
  - `DEPLOYMENT_PROFILE=full` for local all-in-one
- [ ] Note deferred: “Future: restrict `/admin-ui` and `/api/admin` by IP at nginx/HAProxy.”

**Verify:** Doc review only.  
**Subagent:** `generalPurpose` (docs) or parent.

---

### W2 — Product SPA base `/webapp/`

**Outcome:** `frontend/` builds and runs under `/webapp/`.

- [ ] `vite.config.ts`: `base: process.env.VITE_BASE_PATH ?? '/'` (dev default `/` **or** `/webapp/` — pick one; prefer env so local without nginx can stay `/`).
- [ ] `App.tsx`: `BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}` (or explicit `VITE_ROUTER_BASENAME`).
- [ ] Fix any absolute `/...` asset or `navigate` that bypasses basename.
- [ ] Update Playwright / E2E base URL notes if paths change.
- [ ] Update `frontend` healthcheck / compose env if needed.

**Verify:** `cd frontend && VITE_BASE_PATH=/webapp/ npm run build`; smoke open `/webapp/`.  
**Subagent:** `generalPurpose` (frontend) — **do not** touch admin-ui.

---

### W3 — Admin SPA base `/admin-ui/` + Dockerfile

**Outcome:** `admin-ui/` has production-capable image and path base.

- [ ] Mirror `frontend/Dockerfile` pattern for `admin-ui/Dockerfile` (dev target first; optional static prod stage later).
- [ ] `vite.config.ts`: `base` from env (`/admin-ui/` behind proxy).
- [ ] `BrowserRouter` basename aligned with `BASE_URL`.
- [ ] Keep proxy to `/api/admin`, `/health` for direct Vite access.
- [ ] `admin-ui` `package.json` scripts unchanged except build env docs.

**Verify:** `VITE_BASE_PATH=/admin-ui/ npm run build` in `admin-ui/`.  
**Subagent:** `generalPurpose` (admin-ui) — **[P]` with W2**.

---

### W4 — Compose: `admin-ui` service

**Outcome:** `make up` starts postgres + backend + frontend + admin-ui.

- [ ] Add `admin-ui` service to `compose.yaml` (port `5174` published for local only).
- [ ] Env: `VITE_PROXY_TARGET=http://backend:3000`, `VITE_BASE_PATH` optional for path mode.
- [ ] `depends_on` backend healthy.
- [ ] Named volume for `admin-ui` node_modules.
- [ ] Makefile: document `admin-ui` in help / no new target required if covered by `up`.
- [ ] Backend compose env: `DEPLOYMENT_PROFILE=full`, `ADMIN_CORS_ORIGIN` includes `http://localhost:5174` and future public origin.

**Verify:** `docker compose config` + `make up` + curl admin container.  
**Subagent:** `generalPurpose` (infra) — depends on W3 Dockerfile existing.

---

### W5 — Local nginx (path router) for Docker

**Outcome:** One entrypoint (e.g. `:8080`) mimics staging path map.

- [ ] Add `docker/nginx/default.conf` (or `nginx.conf`) with locations:
  - `/api/`, `/auth/`, `/book/`, `/health` → `backend:3000`
  - `/webapp/` → `frontend:5173` (dev) **or** static root when prod image exists
  - `/admin-ui/` → `admin-ui:5174`
  - `/` → `302 /webapp/`
- [ ] Add `gateway` (nginx) service to `compose.yaml`; publish `8080:80`.
- [ ] Document: “Try staging-like URLs at http://localhost:8080/webapp/ and …/admin-ui/”.
- [ ] Vite HMR behind subpath may need `server.origin` / HMR settings — document caveats; acceptable if gateway is for smoke, not HMR.

**Verify:** Browser smoke via `:8080` paths (login product + admin).  
**Subagent:** `generalPurpose` (infra) — depends on W2–W4.

---

### W6 — Staging contract snippet (no IP restriction)

**Outcome:** Drop-in nginx location block for HAProxy→nginx host (Nesis/staging), without ACL.

- [ ] Add `docs/deploy-nginx-path-routing.snippet.conf` (or section in deploy doc) with the same locations pointing at upstream names used in staging.
- [ ] Comment block: `# TODO(security): allowlist IPs for /admin-ui/ and /api/admin/`.
- [ ] Align cookie/`CORS_ORIGIN` notes for same-origin proxy (`CORS_ORIGIN=https://staging-host`).

**Verify:** Doc-only; human applies on staging host.  
**Subagent:** `generalPurpose` (docs) — **[P]` after W1; finalize after W5**.

---

### W7 — Verification & quickstart

**Outcome:** Specs/quickstart match reality; minimal regression check.

- [ ] Update `specs/013-admin-platform/quickstart.md` with compose + gateway URLs.
- [ ] Update `docs/dockerizacion.md` topology diagram (add admin-ui + gateway).
- [ ] Run: backend admin integration subset **or** manual smoke checklist.
- [ ] Confirm product E2E still documented (base URL may stay direct `:5173` for now).

**Verify:** Checklist in PR description.  
**Subagent:** `generalPurpose` or parent; optional `sdd-verify`-style smoke.

---

## Orchestration protocol

```text
Parent (you)
  ├─ W1 contract          → commit
  ├─ parallel: W2 + W3    → commits
  ├─ W4 compose           → commit
  ├─ W5 local nginx       → commit
  ├─ W6 staging snippet   → commit
  └─ W7 verify/docs       → commit / PR note
```

**Per subagent prompt must include**

1. Worktree/repo: `/home/lerique/Documents/dev/personal/tador` on `feature/admin_platform` (or current admin branch).
2. Allowed edit roots for that unit only.
3. Explicit **non-goals** (no IP ACL; no Nest rename; no merging admin into `frontend/`).
4. Verify commands for the unit.
5. Do **not** git push unless parent asks; commit only if parent says so.

**Risk flags**

- Vite HMR behind `/webapp/` subpath is flaky → prefer gateway for build/smoke, direct ports for day-to-day UI work.
- Product routes `/auth` and `/book` must stay on nginx or login breaks.
- `basename` + `base` mismatch → blank page; always set both from the same env.

---

## Success criteria

- [ ] `docker compose up` brings admin-ui without host-only `npm run dev` requirement.
- [ ] Path contract documented and reproducible via local nginx `:8080`.
- [ ] Product usable under `/webapp/`, admin under `/admin-ui/` when using gateway.
- [ ] Staging snippet ready for HAProxy→nginx **without** IP restriction (TODO commented).
- [ ] Security restriction explicitly deferred, not forgotten.

---

## Next action for orchestrator

**Completed 2026-07-23** on `feature/admin_platform`: W1–W7 implemented (path bases, compose admin-ui + gateway, nginx snippets, docs).

Start **W1** (contract), then launch **W2** and **W3** in parallel via Task subagents.
