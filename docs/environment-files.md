# Environment files — which one when

**Fecha:** 2026-07-14

**Última actualización:** 2026-07-16

Config is split so Docker, local Node, Vitest, and future deploys never share the wrong database or leak secrets into the frontend.

## Quick path

| I am… | Use | Points at |
|-------|-----|-----------|
| Developing with `docker compose up` | Root `.env` | `tador_dev` (Compose → postgres + backend) |
| Running Prisma/Node **on the host** against published Postgres | `backend/.env` | `localhost:5432/tador_dev` |
| Running integration tests | `backend/.env.test` | `tador_test` (same Postgres instance, other DB) |
| Staging / production | Host secrets / platform env — **not** these local files | Staging/prod database URLs |

Never put backend secrets in `VITE_*` vars. The browser only sees Vite-prefixed values.

---

## The three local files

### 1. Root `.env` (+ `.env.example`)

**Consumer:** Docker Compose (auto-loaded from repo root).

**Typical keys:**

```env
POSTGRES_DB=tador_dev
POSTGRES_USER=tador
POSTGRES_PASSWORD=…
POSTGRES_PORT=5432
SESSION_SECRET=…
```

Compose substitutes them into `postgres` and `backend` in `compose.yaml`. The **frontend** service does **not** receive `POSTGRES_*` or `SESSION_SECRET` — only things like `VITE_PROXY_TARGET`.

Copy from `.env.example`. Keep the real `.env` gitignored.

### 2. `backend/.env` (+ `backend/.env.example`)

**Consumer:** Backend tools on the host (Prisma, occasional `npm` outside Compose) that expect a full URL.

**Typical keys:**

```env
DATABASE_URL=postgresql://tador:…@localhost:5432/tador_dev
SESSION_SECRET=…
PORT=3000
HOST=0.0.0.0
```

Use `localhost` because Postgres port is published on the machine. Inside the backend **container**, Compose injects `POSTGRES_HOST=postgres` and `ensureDatabaseUrl()` rewrites any mounted `DATABASE_URL=@localhost` to the Compose hostname — never call localhost from inside the container.

### 3. `backend/.env.test` (+ `backend/.env.test.example`)

**Consumer:** Vitest integration (`vitest.integration.config.ts`).

**Typical keys:**

```env
POSTGRES_USER=tador
POSTGRES_PASSWORD=…
POSTGRES_TEST_DB=tador_test
SESSION_SECRET=test-secret-for-integration-tests
# Optional remote test DB:
# DATABASE_URL=postgresql://…@test-host:5432/tador_test
```

Must **never** target `tador_dev`. Cleanup in tests deletes users/books/apuntes **only after** `SELECT current_database()` confirms `tador_test`.

List databases in the container:

```bash
docker exec tador-postgres psql -U tador -d postgres -c "\l"
```

You should see both `tador_dev` (app) and `tador_test` (Vitest).

---

## Developer (local)

```text
docker compose up
       │
       ├─ reads /.env
       ├─ postgres: database tador_dev (+ creates tador_test once via init SQL)
       ├─ backend: POSTGRES_* + SESSION_SECRET from Compose
       └─ frontend: only VITE_* (proxy to backend)

npm run test:integration   (inside backend container or make test)
       │
       └─ reads backend/.env.test → tador_test
```

**Checklist**

- [ ] Root `.env` exists (from `.env.example`)
- [ ] App UI / API use `tador_dev`
- [ ] `backend/.env.test` exists (from `.env.test.example`) before integration tests
- [ ] After tests, your login in the app still works (if not, tests hit the wrong DB — bug)

---

## Staging (when you deploy)

Do **not** copy local `.env` files into the image or commit them.

Prefer platform secrets (Fly, Railway, ECS, K8s Secret, etc.):

| Variable | Staging meaning |
|----------|-----------------|
| `DATABASE_URL` or `POSTGRES_*` | Staging Postgres (own instance or schema) |
| `SESSION_SECRET` | Strong random; **different** from local |
| `NODE_ENV=production` (or staging flag) | Disables plantillas-admin unless you opt in |
| `APP_PUBLIC_URL` | Public HTTPS URL of the staging frontend |
| Email SMTP_* | Staging mailbox / Mailtrap, not prod |

Optional later: a **server-side** `.env.staging` only on the host, never in git — same shape as production.

Frontend build: only public `VITE_*` (API base URL if not same-origin). No DB password, no session secret.

**Checklist**

- [ ] Staging DB ≠ local `tador_dev` / `tador_test`
- [ ] Secrets set in the platform, not in the repo
- [ ] `ENABLE_PLANTILLAS_ADMIN` off unless you explicitly need it
- [ ] Smoke: register/login, one apunte, dashboard

---

## Production

Same as staging, stricter:

- New `SESSION_SECRET` (never reuse staging/local)
- Managed Postgres backups / least-privilege DB user
- `REQUIRE_EMAIL_VERIFICATION` and real email provider when product requires it
- No `/api/dev/*` exposed (admin gate is off when `NODE_ENV=production` unless forced)

**Checklist**

- [ ] Secrets rotated and stored in a vault/platform
- [ ] CI uses a **separate** test DB (or ephemeral Postgres), still via `DATABASE_URL` / `.env.test` pattern — never prod
- [ ] Frontend CDN/build has zero backend secrets

---

## Examples side by side

**Local Docker (root `.env`)**

```env
POSTGRES_DB=tador_dev
POSTGRES_USER=tador
POSTGRES_PASSWORD=tador_dev_password
POSTGRES_PORT=5432
SESSION_SECRET=local-dev-only-not-for-deploy
```

**Local host Prisma (`backend/.env`)**

```env
DATABASE_URL=postgresql://tador:tador_dev_password@localhost:5432/tador_dev
SESSION_SECRET=local-dev-only-not-for-deploy
PORT=3000
HOST=0.0.0.0
```

**Tests (`backend/.env.test`)**

```env
POSTGRES_USER=tador
POSTGRES_PASSWORD=tador_dev_password
POSTGRES_TEST_DB=tador_test
SESSION_SECRET=test-secret-for-integration-tests
```

**Staging (platform env — illustrative)**

```env
DATABASE_URL=postgresql://tador_stg:…@stg-db.example:5432/tador_staging
SESSION_SECRET=<long-random>
NODE_ENV=production
APP_PUBLIC_URL=https://staging.tador.example
```

**Production (platform env — illustrative)**

```env
DATABASE_URL=postgresql://tador_app:…@prod-db.example:5432/tador
SESSION_SECRET=<different-long-random>
NODE_ENV=production
APP_PUBLIC_URL=https://app.tador.example
REQUIRE_EMAIL_VERIFICATION=true
```

---

## Mental model

| Layer | Config source | Database |
|-------|---------------|----------|
| Compose local | `/.env` | `tador_dev` |
| Host Node/Prisma | `backend/.env` | `tador_dev` via `localhost` |
| Vitest integration | `backend/.env.test` | `tador_test` |
| Staging deploy | Platform secrets | Staging DB |
| Production deploy | Platform secrets | Production DB |

Same Postgres **container** locally can host both `tador_dev` and `tador_test`. Staging/prod should be **other servers** (or at least other instances), configured only outside the repo.

Version 1.0 (2026-07-14)