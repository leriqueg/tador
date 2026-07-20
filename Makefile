# TADOR — Makefile
# ────────────────────────────────────────────────────────
# Default targets = desarrollo local (compose.yaml).
# staging-* = VPS / RSH (compose.staging.yaml). Ver docs/deploy/rsh-vps-app-example/.

COMPOSE = docker compose
# E2E stack: same services, but backend points at tador_test (isolated from tador_dev).
COMPOSE_E2E = $(COMPOSE) -f compose.yaml -f compose.e2e.yaml
RUN_BACKEND = $(COMPOSE) run --rm backend
RUN_BACKEND_E2E = $(COMPOSE_E2E) run --rm backend
EXEC_BACKEND = $(COMPOSE) exec backend

# Staging (VPS): override with `make staging-up STAGING_ENV=.env.staging`
STAGING_ENV ?= .env
COMPOSE_STG = docker compose --env-file $(STAGING_ENV) -f compose.staging.yaml
COMPOSE_STG_SEED = $(COMPOSE_STG) -f compose.staging.seed.yaml
RUN_STG_SEED = $(COMPOSE_STG_SEED) run --rm seed

# ─── Base de datos ─────────────────────────────────────

.PHONY: db-up
db-up:                    ## Levanta PostgreSQL en Docker
	$(COMPOSE) up -d postgres
	@echo "Esperando a que postgres esté healthy..."
	@sleep 3
	@$(COMPOSE) exec postgres pg_isready -U tador -d tador_dev 2>/dev/null || \
		until $(COMPOSE) exec postgres pg_isready -U tador -d tador_dev 2>/dev/null; do \
			sleep 1; \
		done

.PHONY: db-migrate
db-migrate:               ## Ejecuta migraciones Prisma (dev)
	$(RUN_BACKEND) npm run db:migrate

.PHONY: db-seed
db-seed:                  ## Siembra datos de catálogo global
	$(RUN_BACKEND) npm run seed:catalogos

.PHONY: db-setup
db-setup: db-up db-migrate db-seed  ## Postgres + migraciones + seed

.PHONY: db-reset
db-reset:                 ## Resetea DB: borra esquema, migra y seedea
	$(RUN_BACKEND) node scripts/run-with-db-url.mjs npx prisma migrate reset --force
	$(MAKE) db-seed

.PHONY: db-generate
db-generate:              ## Regenera Prisma Client
	$(RUN_BACKEND) npm run db:generate

.PHONY: db-studio
db-studio:                ## Abre Prisma Studio
	$(COMPOSE) run --rm -p 5555:5555 backend \
		npm run db:studio -- --hostname 0.0.0.0 --port 5555

# ─── Servidores ────────────────────────────────────────

.PHONY: up
up:                       ## Levanta todos los servicios (Docker)
	$(COMPOSE) up -d

.PHONY: down
down:                     ## Detiene todos los servicios
	$(COMPOSE) down

.PHONY: rebuild
rebuild:                  ## Reconstruye imágenes de desarrollo
	$(COMPOSE) build

.PHONY: dev-backend
dev-backend:              ## Arranca backend en modo watch (contenedor)
	$(COMPOSE) up backend

.PHONY: dev-frontend
dev-frontend:             ## Arranca frontend en modo watch (contenedor)
	$(COMPOSE) up frontend

.PHONY: storybook
storybook:                ## Arranca el catálogo de componentes en localhost:6006
	cd frontend && npm run storybook

.PHONY: build
build:                    ## Compila TypeScript (backend)
	$(RUN_BACKEND) npx tsc

# ─── Tests ─────────────────────────────────────────────
# DATABASE_URL is resolved inside the app/tests from POSTGRES_* pieces
# (Docker host = postgres, host/CI = localhost). No Makefile URL required.
#
# E2E runs inside the compose network (frontend / backend DNS), not localhost.
# That mirrors CI: stack + runner containers on one network.
#
# Integration targets regenerate Prisma Client in the same container run so the
# anonymous /app/node_modules volume cannot serve a client older than schema.prisma.

.PHONY: test
test: db-up               ## Tests de integración (Postgres + Fastify)
	$(RUN_BACKEND) sh -c 'npx prisma generate && npm run test:integration'

.PHONY: test-unit
test-unit:                ## Tests unitarios de dominio (sin DB)
	$(RUN_BACKEND) npm run test:unit

.PHONY: test-watch
test-watch: db-up         ## Tests de integración en modo watch
	$(RUN_BACKEND) sh -c 'npx prisma generate && npm run test:integration -- --watch'

.PHONY: test-frontend
test-frontend:            ## Vitest unit + integration (contenedor frontend)
	$(COMPOSE) run --rm --no-deps frontend npm run test

.PHONY: test-db-ensure
test-db-ensure: db-up     ## Asegura que exista la DB tador_test
	@$(COMPOSE) exec -T postgres \
		psql -U tador -d tador_dev -tc "SELECT 1 FROM pg_database WHERE datname='tador_test'" \
		| grep -q 1 || $(COMPOSE) exec -T postgres \
		psql -U tador -d tador_dev -c "CREATE DATABASE tador_test;"

.PHONY: test-e2e
test-e2e: test-db-ensure  ## E2E Playwright en red Docker sobre tador_test (no toca tador_dev)
	$(COMPOSE_E2E) up -d --force-recreate postgres backend frontend
	$(RUN_BACKEND_E2E) npm run db:migrate:deploy
	$(RUN_BACKEND_E2E) npm run seed:catalogos
	$(COMPOSE_E2E) --profile e2e run --rm --build e2e
	@echo "Restaurando backend/frontend a tador_dev..."
	$(COMPOSE) up -d --force-recreate backend frontend

.PHONY: test-e2e-host
test-e2e-host: test-db-ensure ## E2E desde el host (backend → tador_test, Vite → localhost)
	$(COMPOSE_E2E) up -d --force-recreate postgres backend
	$(RUN_BACKEND_E2E) npm run db:migrate:deploy
	$(RUN_BACKEND_E2E) npm run seed:catalogos
	@echo "Backend E2E en http://localhost:3000 (DB tador_test)"
	cd frontend && npm run test:e2e
	@echo "Restaurando backend a tador_dev..."
	$(COMPOSE) up -d --force-recreate backend

# ─── Migración demo test20260719 ───────────────────────
# Requiere DEMO_SEED_ENABLED=true y credenciales en
# migrations/test20260719/.env (ver .env.example).

MIGRATE_TEST_VOL = -v "$(CURDIR)/migrations:/migrations:ro"
# Credenciales se leen desde /migrations/test20260719/.env (dotenv en el script).
RUN_MIGRATE_TEST = $(COMPOSE) run --rm $(MIGRATE_TEST_VOL) \
	-e DEMO_SEED_ENABLED=true \
	-e NODE_ENV=development \
	-e MIGRATE_DATA_DIR=/migrations/test20260719

.PHONY: migrate-test20260719-dry
migrate-test20260719-dry: ## Dry-run expansión CSV + users (sin postear)
	$(RUN_MIGRATE_TEST) -e MIGRATE_DRY_RUN=true backend npm run migrate:test20260719

.PHONY: migrate-test20260719
migrate-test20260719:     ## Importa demo users + asientos test20260719
	$(RUN_MIGRATE_TEST) backend npm run migrate:test20260719

# ─── Staging / RSH (VPS) ───────────────────────────────
# Requiere red Docker externa rsh-net-prod y STAGING_ENV con secretos.
# Primera vez en el host: make staging-up && make staging-db-setup
# Demo asientos (opcional): make staging-demo-migrate

.PHONY: staging-up
staging-up:               ## Levanta stack staging (build + up)
	$(COMPOSE_STG) up -d --build

.PHONY: staging-down
staging-down:             ## Detiene stack staging (conserva volúmenes)
	$(COMPOSE_STG) down

.PHONY: staging-restart
staging-restart:          ## Reinicia contenedores staging sin rebuild
	$(COMPOSE_STG) restart

.PHONY: staging-ps
staging-ps:               ## Estado de contenedores staging
	$(COMPOSE_STG) ps

.PHONY: staging-logs
staging-logs:             ## Logs staging (follow)
	$(COMPOSE_STG) logs -f

.PHONY: staging-db-setup
staging-db-setup:         ## Staging: migrate deploy + generate + seed catálogo
	$(COMPOSE_STG) run --rm backend npx prisma migrate deploy
	$(RUN_STG_SEED) sh -c 'npm ci && npx prisma generate && npm run seed:catalogos'

.PHONY: staging-demo-migrate
staging-demo-migrate:     ## Staging: usuarios demo + asientos test20260719
	$(RUN_STG_SEED) sh -c 'npm ci && npx prisma generate && npm run migrate:test20260719'

# ─── Calidad ───────────────────────────────────────────

.PHONY: typecheck
typecheck:                ## Verifica TypeScript sin emitir
	$(RUN_BACKEND) npx tsc --noEmit

.PHONY: lint-backend
lint-backend:             ## oxlint del backend
	$(RUN_BACKEND) sh -c 'test -x node_modules/.bin/oxlint || npm ci; npm run lint'

.PHONY: lint-frontend
lint-frontend:            ## oxlint del frontend
	$(COMPOSE) run --rm --no-deps frontend npm run lint

.PHONY: coverage-backend
coverage-backend:         ## Cobertura unitaria del backend (domain + application)
	$(RUN_BACKEND) sh -c 'test -d node_modules/@vitest/coverage-v8 || npm ci; npm run test:coverage'

.PHONY: check
check: typecheck test     ## Typecheck + tests

# ─── Utilidades ────────────────────────────────────────

.PHONY: ps
ps:                       ## Muestra contenedores activos
	$(COMPOSE) ps

.PHONY: logs
logs:                     ## Logs de todos los servicios
	$(COMPOSE) logs -f

.PHONY: logs-backend
logs-backend:             ## Logs del backend
	$(COMPOSE) logs -f backend

.PHONY: logs-frontend
logs-frontend:            ## Logs del frontend
	$(COMPOSE) logs -f frontend

.PHONY: shell-backend
shell-backend:            ## Shell interactivo en el backend
	$(EXEC_BACKEND) sh

.PHONY: clean
clean:                    ## Limpia artefactos de build
	$(RUN_BACKEND) rm -rf dist

.PHONY: help
help:                     ## Muestra esta ayuda
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | \
		sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'
