# Environment files — which one when

**Fecha:** 2026-07-14

**Última actualización:** 2026-07-20

La configuración se separa para que Docker, las herramientas locales, Vitest y
los despliegues no compartan por accidente una base de datos ni expongan
secretos al frontend. Los archivos `*.example` son **contratos versionados**;
los archivos con valores reales permanecen ignorados por Git.

## Quick path

| I am… | Copy from (versioned) | To (gitignored) | Points at |
|-------|----------------------|-----------------|-----------|
| Developing with `docker compose up` | `.env.example` | `.env` | `tador_dev` + `compose.yaml` |
| Prisma on the **host** | `backend/.env.example` | `backend/.env` | `localhost:5432/tador_dev` |
| Integration tests | `backend/.env.test.example` | `backend/.env.test` | `tador_test` |
| Staging VPS (HAProxy) | `.env.staging.example` | `.env.staging` (or `.env.prod.nesistel`) | `tador_staging` + `compose.staging.yaml` |
| Final production | `.env.production.example` | secret manager / `.env.production` | production DB + same topology |

Never put backend secrets in `VITE_*` vars. The browser only sees Vite-prefixed values.

### Mapa mental de los tres contratos raíz

| File | Environment | Domain example | Compose |
|------|-------------|----------------|---------|
| `.env.example` → `.env` | **Development** (laptop) | `http://localhost:5173` | `compose.yaml` |
| `.env.staging.example` → `.env.staging` | **Staging / QA** on a VPS | `https://tador.example.tel` | `compose.staging.yaml` |
| `.env.prod.nesistel` | Staging instance for **nesisstel** | `https://tador.nesis.tel` | same staging Compose |
| `.env.production.example` → vault / `.env.production` | **Production** (real users) | `https://app.example.com` | staging Compose shape or future `compose.production.yaml` |

`.env.prod.nesistel` is **not** a second product mode: it is a concrete staging
file for one network (nesisstel). Keep it gitignored; regenerate secrets there.

---

## Archivos y plantillas

### 1. Root `.env` (+ `.env.example`) — development only

**Consumer:** `compose.yaml` (auto-loads `.env` from repo root).

**Typical keys:** `POSTGRES_*`, `SESSION_SECRET`, `CORS_ORIGIN`, optional
`BACKEND_PORT` / `FRONTEND_PORT`.

Compose injects only the variables listed under each service's `environment:`
block. Uncommenting email/`APP_PUBLIC_URL` in `.env` does **not** reach the
backend unless `compose.yaml` also maps them.

Copy:

```bash
cp .env.example .env
```

Note: `make db-up` / `make test-db-ensure` still hardcode `tador` / `tador_dev`.

### 2. `backend/.env` (+ `backend/.env.example`)

**Consumer:** Prisma on the host (not the usual Compose path).

Use `localhost` because Postgres is published on the machine. Inside the
backend **container**, Compose sets `POSTGRES_HOST=postgres`.

### 3. `backend/.env.test` (+ `backend/.env.test.example`)

**Consumer:** Vitest integration. Must **never** target `tador_dev`.

### 4. `.env.staging.example` (+ host `.env.staging` / `.env.prod.nesistel`)

**Consumer:** `compose.staging.yaml` on the VPS.

```bash
cp .env.staging.example .env.staging
# fill REPLACE_* — or maintain a named copy such as .env.prod.nesistel

docker compose --env-file .env.staging -f compose.staging.yaml up -d --build
docker compose --env-file .env.staging -f compose.staging.yaml run --rm backend \
  npx prisma migrate deploy
```

Required shape (aligned with production): `NODE_ENV`, `HOST`, `PORT`,
`LOG_LEVEL`, `POSTGRES_*`, `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`,
`ENABLE_PLANTILLAS_ADMIN`, `REQUIRE_EMAIL_VERIFICATION`, optional
`BACKEND_HOST_PORT` / `FRONTEND_HOST_PORT` for loopback publish to HAProxy.

Guide: [`deploy/haproxy-same-origin.md`](deploy/haproxy-same-origin.md).

### 5. `.env.production.example` (+ vault / `.env.production`)

**Consumer:** final production deploy — same *variable contract* as staging,
different secrets, DB and public origin.

It is intentionally a **template**, not a running Compose file by itself.
Use it when you promote beyond staging (managed Postgres with TLS is typical).

```bash
cp .env.production.example .env.production   # host only, never commit
```

---

## Developer (local)

```text
docker compose up
       │
       ├─ reads /.env          ← from .env.example
       ├─ postgres: tador_dev (+ tador_test via init SQL)
       ├─ backend: development image + hot reload
       └─ frontend: Vite (target development) + proxy → backend:3000
```

**Checklist**

- [ ] Root `.env` exists (from `.env.example`)
- [ ] App UI / API use `tador_dev`
- [ ] Prefer `backend/.env.test` before local integration tests
- [ ] After tests, login still works (wrong DB if not)

---

## Staging (VPS + HAProxy)

Do **not** copy local `.env` into the image or commit site files.

| Variable | Staging meaning |
|----------|-----------------|
| `DATABASE_URL` / `POSTGRES_*` | Staging Postgres (`tador_staging`), isolated |
| `SESSION_SECRET` | Strong random; **different** from local |
| `NODE_ENV=production` | Exact value required for secure cookies |
| `CORS_ORIGIN` | Exact HTTPS origin (`https://tador.nesis.tel`, …) |
| `ENABLE_PLANTILLAS_ADMIN=false` | Admin routes closed |
| `LOG_LEVEL` | Usually `info` |

The SPA uses relative `/api` and `/auth`. HAProxy routes those paths to
Fastify under the same public origin. `VITE_PROXY_TARGET` is **dev-only**.

**Checklist**

- [ ] Staging DB ≠ `tador_dev` / `tador_test`
- [ ] Secrets only on the host / vault
- [ ] Smoke: `/health`, login, one apunte, dashboard
- [ ] Ports 3000/8080 bound to `127.0.0.1` only

---

## Production

Same topology as staging (HAProxy same-origin + Docker) unless you move to
managed Postgres / another orchestrator. Use `.env.production.example` as the
contract; inject via vault.

| Still required before calling it “prod-ready” | Notes |
|-----------------------------------------------|-------|
| Real email adapter | Keep `REQUIRE_EMAIL_VERIFICATION=false` until then |
| Structured JSON logging | Avoid relying on `pino-pretty` in prod image |
| Backups + restore drill | Postgres |
| Fail-closed startup | Reject weak `SESSION_SECRET` / missing `CORS_ORIGIN` |

**Checklist**

- [ ] Frontend static build + same-origin reverse proxy
- [ ] Secrets independent from staging
- [ ] Only HTTPS public; DB private
- [ ] Migrations via `prisma migrate deploy` one-shot

---

## Examples side by side

**Local Docker (`.env` from `.env.example`)**

```env
POSTGRES_DB=tador_dev
POSTGRES_USER=tador
POSTGRES_PASSWORD=tador_dev_password
POSTGRES_PORT=5432
SESSION_SECRET=local-dev-only-not-for-deploy
CORS_ORIGIN=http://localhost:5173,http://frontend:5173
```

**Staging (`.env.staging` from `.env.staging.example`)**

```env
NODE_ENV=production
DATABASE_URL=postgresql://tador_stg:…@postgres:5432/tador_staging
SESSION_SECRET=<openssl rand -base64 48>
CORS_ORIGIN=https://tador.example.tel
ENABLE_PLANTILLAS_ADMIN=false
REQUIRE_EMAIL_VERIFICATION=false
BACKEND_HOST_PORT=3000
FRONTEND_HOST_PORT=8080
```

**Production (from `.env.production.example`)**

```env
NODE_ENV=production
DATABASE_URL=postgresql://tador_app:…@db.example.com:5432/tador?sslmode=require
SESSION_SECRET=<at-least-32-random-bytes>
CORS_ORIGIN=https://app.example.com
ENABLE_PLANTILLAS_ADMIN=false
REQUIRE_EMAIL_VERIFICATION=false
```

---

## Mental model

| Layer | Config source | Database | Compose |
|-------|---------------|----------|---------|
| Local Compose | `/.env` | `tador_dev` | `compose.yaml` |
| Host Prisma | `backend/.env` | `tador_dev` via localhost | — |
| Vitest | `backend/.env.test` | `tador_test` | — |
| Staging VPS | `.env.staging` / `.env.prod.nesistel` | `tador_staging` | `compose.staging.yaml` |
| Production | vault / `.env.production` | production DB | same shape / managed DB |

Version 1.2 (2026-07-20)
