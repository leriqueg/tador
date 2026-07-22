# Environment files — which one when

**Fecha:** 2026-07-14

**Última actualización:** 2026-07-22

La configuración se separa para que Docker, las herramientas locales, Vitest y
los despliegues no compartan por accidente una base de datos ni expongan
secretos al frontend. Los archivos `*.example` son contratos versionados; los
archivos con valores reales permanecen ignorados por Git.

## Quick path

| I am… | Use | Points at |
|-------|-----|-----------|
| Developing with `docker compose up` | Root `.env` | `tador_dev` (Compose → postgres + backend) |
| Running Prisma directly **on the host** | `backend/.env` or exported variables | `localhost:5432/tador_dev` |
| Running integration tests | `backend/.env.test` | `tador_test` (same Postgres instance, other DB) |
| Running admin UI locally | `admin-ui/` + `npm run dev` | Vite `:5174`, proxies `/api/admin` |
| Preparing production configuration | `.env.production.example` | Variable contract, without real secrets |
| Deploying staging / production | Secret manager / platform env | Dedicated staging/prod services |

Never put backend secrets in `VITE_*` vars. The browser only sees Vite-prefixed values.

---

## Archivos y plantillas

### 1. Root `.env` (+ `.env.example`)

**Consumer:** Docker Compose (auto-loaded from repo root).

**Typical keys:**

```env
POSTGRES_DB=tador_dev
POSTGRES_USER=tador
POSTGRES_PASSWORD=…
POSTGRES_PORT=5432
SESSION_SECRET=…
# Admin platform (013) — optional locally; defaults documented in auth-bootstrap.md
# DEPLOYMENT_PROFILE=full
# OPERATOR_SESSION_SECRET=…
# ADMIN_CORS_ORIGIN=http://localhost:5174
# ADMIN_INITIAL_EMAIL=admin@localhost
# ADMIN_INITIAL_PASSWORD=dev-admin
```

### Admin platform variables (013)

| Variable | Local / dev | Staging / production |
|----------|-------------|----------------------|
| `DEPLOYMENT_PROFILE` | `full` (default) registers product + admin routes | `product` on edge nodes; `admin` on private admin instance |
| `OPERATOR_SESSION_SECRET` | Distinct from `SESSION_SECRET`; fallback only in non-prod | Required strong secret; never reuse product session secret |
| `ADMIN_CORS_ORIGIN` | `http://localhost:5174` | Exact HTTPS origin of admin-ui |
| `ADMIN_INITIAL_EMAIL` | Optional; default `admin@localhost` | **Required** for bootstrap |
| `ADMIN_INITIAL_PASSWORD` | Optional; default `dev-admin` | Optional vault temp; else auto-generated once |

Policy detail: `specs/013-admin-platform/auth-bootstrap.md`. Quickstart: `specs/013-admin-platform/quickstart.md`.

Compose uses the root `.env` for **interpolation** and injects only the
variables listed under each service's `environment:` block. Uncommenting
`REQUIRE_EMAIL_VERIFICATION`, email settings or `APP_PUBLIC_URL` in root
`.env` does **not** reach the backend unless `compose.yaml` also maps them.

The **frontend** service does **not** receive `POSTGRES_*` or
`SESSION_SECRET`; it gets `VITE_PROXY_TARGET` (Vite proxy only) and
`CHOKIDAR_USEPOLLING`. Optional published ports: `BACKEND_PORT`,
`FRONTEND_PORT`.

Copy from `.env.example`. Keep the real `.env` gitignored.

Note: `make db-up` and `make test-db-ensure` still hardcode user/database
`tador` / `tador_dev`. Changing those names only in `.env` can break those
targets.

### 2. `backend/.env` (+ `backend/.env.example`)

**Consumer:** Prisma ejecutado directamente en `backend/` y procesos del host a
los que se cargue el archivo explícitamente.

**Typical keys:**

```env
DATABASE_URL=postgresql://tador:…@localhost:5432/tador_dev
SESSION_SECRET=…
PORT=3000
HOST=0.0.0.0
```

Use `localhost` because Postgres port is published on the machine. Inside the
backend **container**, Compose injects `POSTGRES_HOST=postgres` and
`ensureDatabaseUrl()` aligns hostnames for wrapped Prisma commands
(`db:migrate`, `db:studio`, `seed:catalogos`). Never rely on `localhost`
from inside the container network.

El servidor Fastify no carga `backend/.env` por sí mismo. Para arrancarlo en el
host hay que exportar las variables o usar un mecanismo explícito como
`node --env-file=.env …`. Los targets habituales del Makefile ejecutan el
backend en Compose y no necesitan este archivo.

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

`backend/.env.test` is recommended locally. It is not mandatory: if missing,
Vitest warns and can still run from CI-injected variables or defaults. When
the file exists, dotenv loads it with `override: true`, so it wins over shell
exports for the keys it defines.

Create it with:

```bash
cp backend/.env.test.example backend/.env.test
```

List databases in the container:

```bash
docker exec tador-postgres psql -U tador -d postgres -c "\l"
```

You should see both `tador_dev` (app) and `tador_test` (Vitest).

### 4. `.env.production.example`

**Consumer:** ninguno directamente. Es el contrato versionado para configurar
un secret manager o crear un `.env.production` ignorado en el host:

```bash
cp .env.production.example .env.production
```

No se debe pasar este archivo a `docker compose` actual: `compose.yaml` y el
Dockerfile del frontend siguen orientados a desarrollo. En un despliegue real,
la plataforma debe inyectar sus valores al proceso backend.

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
- [ ] Prefer `backend/.env.test` (from `.env.test.example`) before local integration tests
- [ ] After tests, your login in the app still works (if not, tests hit the wrong DB — bug)

---

## Staging (when you deploy)

Do **not** copy local `.env` files into the image or commit them.

Prefer platform secrets (Fly, Railway, ECS, K8s Secret, etc.):

| Variable | Staging meaning |
|----------|-----------------|
| `DATABASE_URL` | Staging Postgres, isolated from local/test/production |
| `SESSION_SECRET` | Strong random; **different** from local |
| `NODE_ENV=production` | Must be exactly `production`; values like `staging` keep non-production cookie/admin behavior |
| `CORS_ORIGIN` | Exact HTTPS origin(s) allowed to send credentials |
| `COOKIE_SECURE` | `true` behind HTTPS; **`false` on plain HTTP** demos or browsers reject the session cookie |
| `ENABLE_PLANTILLAS_ADMIN` | **Deprecated (013)** — legacy `/api/dev/plantillas-admin` is hard-disabled when `NODE_ENV=production` or `DEPLOYMENT_PROFILE=product`. Prefer operator RBAC via `/api/admin/templates/*` |
| `LOG_LEVEL` | Runtime log level; normally `info` |
| `DEPLOYMENT_PROFILE` | `full` \| `product` \| `admin` — which API surfaces register (see 013) |
| `OPERATOR_SESSION_SECRET` | Admin session cookie signing; **distinct** from `SESSION_SECRET` |
| `ADMIN_CORS_ORIGIN` | Exact origin(s) for admin-ui credentials (e.g. `https://admin.staging…`) |
| `ADMIN_INITIAL_EMAIL` | **Required** staging/prod — first superadmin email (bootstrap) |
| `ADMIN_INITIAL_PASSWORD` | Optional vault temp password; if unset, bootstrap generates one |

Optional later: a **server-side** `.env.staging` only on the host, never in git — same shape as production.

The frontend currently uses relative `/api` and `/auth` requests. Production
hosting should therefore route those paths to Fastify under the same public
origin. `VITE_PROXY_TARGET` is a Vite development-server setting, not a
production API URL. No DB password or session secret belongs in the frontend
build.

`APP_PUBLIC_URL`, `EMAIL_PROVIDER`, `EMAIL_FROM` and `SMTP_*` appear in the
local example as planned post-MVP configuration, but the backend does not
consume them yet. They must not be treated as an implemented email integration.

**Checklist**

- [ ] Staging DB ≠ local `tador_dev` / `tador_test`
- [ ] Secrets set in the platform, not in the repo
- [ ] Legacy plantillas admin: leave unset / false; use admin-ui templates instead
- [ ] Smoke: register/login, one apunte, dashboard
- [ ] Admin smoke (if profile includes admin): operator login, users list, template preview

---

## Production

The repository has a production stage for the backend image, but it does not
yet define a complete production deployment. The frontend image serves Vite in
development mode, there is no production Compose manifest, and email remains a
stub. `.env.production.example` documents the intended runtime variables; it
does not make the stack production-ready by itself.

### Recomendaciones para implementar el ambiente

1. **Definir la topología.** Build the SPA as static assets and serve it from a
   CDN or reverse proxy. Route `/api/*` and `/auth/*` to Fastify under the same
   HTTPS origin when possible; this matches the current relative API client and
   simplifies credentialed cookies.
2. **Endurecer el arranque.** Validate production variables with a schema and
   fail closed when `NODE_ENV` is not exactly `production`, or when
   `DATABASE_URL`, `SESSION_SECRET` or `CORS_ORIGIN` are absent, use
   placeholders, or contain development values. Set `NODE_ENV=production` in
   the deployment runtime: the backend production Docker stage does not set it
   by itself. Remove the `change-me-in-production` fallback in production.
3. **Corregir logging productivo.** Fastify currently always configures
   `pino-pretty`, while the production image installs production dependencies
   only and `pino-pretty` is a development dependency. Use structured JSON
   logging in production and pretty output only in development.
4. **Usar secretos administrados.** Inject `DATABASE_URL` and
   `SESSION_SECRET` from the deployment platform or vault. Generate a different
   session secret per environment, restrict access, and document rotation.
5. **Aislar y proteger PostgreSQL.** Use managed Postgres with TLS, a
   least-privilege application role, private networking, encrypted backups and
   a restore drill. Never reuse `tador_dev` or `tador_test`.
6. **Automatizar releases.** Build immutable images, run
   `prisma migrate deploy` as a one-off release job, smoke-test `/health`, and
   retain a tested rollback procedure. Do not run development migrations at
   application startup.
7. **Reemplazar el email stub antes de habilitar verificación.** The current
   adapter logs verification and recovery tokens and builds localhost links.
   Implement a reputable provider, redact tokens from logs, and then set
   `REQUIRE_EMAIL_VERIFICATION=true`. Until then, keep it `false`.
8. **Cerrar superficies de desarrollo.** Do not rely on
   `ENABLE_PLANTILLAS_ADMIN` (deprecated); production / `DEPLOYMENT_PROFILE=product`
   already hard-disable `/api/dev/plantillas-admin`. Do not publish PostgreSQL or
   Prisma Studio; expose only HTTPS through the proxy/load balancer.
9. **Añadir operación y observabilidad.** Define readiness, centralized logs
   with redaction and retention, metrics/alerts, resource limits, graceful
   shutdown and incident ownership.

**Checklist**

- [ ] Frontend static build and same-origin reverse proxy are defined
- [ ] Production startup rejects missing, weak or development configuration
- [ ] Secrets are generated independently and stored in a vault/platform
- [ ] Database TLS, least privilege, backups and restore are verified
- [ ] Release migrations and rollback are tested
- [ ] Production logs are structured and contain no tokens or secrets
- [ ] Real email delivery is implemented before verification is enabled
- [ ] Only HTTPS is public; DB and administration ports stay private
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
DEPLOYMENT_PROFILE=full
OPERATOR_SESSION_SECRET=local-dev-admin-session-not-for-deploy
ADMIN_CORS_ORIGIN=http://localhost:5174
ADMIN_INITIAL_EMAIL=admin@localhost
ADMIN_INITIAL_PASSWORD=dev-admin
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
NODE_ENV=production
DATABASE_URL=postgresql://tador_stg:…@stg-db.example:5432/tador_staging?sslmode=require
SESSION_SECRET=<environment-specific-random-value>
CORS_ORIGIN=https://staging.tador.example
COOKIE_SECURE=true
# ENABLE_PLANTILLAS_ADMIN deprecated — ignored when NODE_ENV=production
# ENABLE_PLANTILLAS_ADMIN=false
REQUIRE_EMAIL_VERIFICATION=false
DEPLOYMENT_PROFILE=full
OPERATOR_SESSION_SECRET=<distinct-from-session-secret>
ADMIN_CORS_ORIGIN=https://admin.staging.tador.example
ADMIN_INITIAL_EMAIL=ops@example.com
# ADMIN_INITIAL_PASSWORD from vault, or omit to auto-generate once
```

**Production (platform env — illustrative)**

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgresql://tador_app:…@prod-db.example:5432/tador?sslmode=require
SESSION_SECRET=<at-least-32-random-bytes>
CORS_ORIGIN=https://app.tador.example
COOKIE_SECURE=true
# ENABLE_PLANTILLAS_ADMIN deprecated — production hard-disables legacy plantillas admin
REQUIRE_EMAIL_VERIFICATION=false
# Edge product node:
DEPLOYMENT_PROFILE=product
# Admin private node (separate deploy):
# DEPLOYMENT_PROFILE=admin
# OPERATOR_SESSION_SECRET=<at-least-32-random-bytes>
# ADMIN_CORS_ORIGIN=https://admin.tador.example
# ADMIN_INITIAL_EMAIL=ops@example.com
```

For an **HTTP-only demo** host (no TLS), set `COOKIE_SECURE=false` and put the
exact `http://…` origin in `CORS_ORIGIN`; otherwise the browser never stores
`session_token` and every authenticated request returns 401.

---

## Mental model

| Layer | Config source | Database |
|-------|---------------|----------|
| Compose local | `/.env` | `tador_dev` |
| Host Node/Prisma | Explicitly loaded `backend/.env` | `tador_dev` via `localhost` |
| Vitest integration | `backend/.env.test` | `tador_test` |
| Staging deploy | Platform secrets | Staging DB |
| Production template | `.env.production.example` | No real credentials |
| Production deploy | Platform secrets / ignored host file | Production DB |

Same Postgres **container** locally can host both `tador_dev` and `tador_test`. Staging/prod should be **other servers** (or at least other instances), configured only outside the repo.

Version 1.2 (2026-07-22) — admin platform env vars (013)