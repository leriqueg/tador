# TADOR — Makefile
# ────────────────────────────────────────────────────────
# Comandos rápidos para desarrollo local.

BACKEND = backend
COMPOSE = docker compose

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
	cd $(BACKEND) && npx prisma migrate dev

.PHONY: db-seed
db-seed:                  ## Siembra datos de catálogo global
	cd $(BACKEND) && npx tsx prisma/seed/catalogos.ts

.PHONY: db-setup
db-setup: db-up db-migrate db-seed  ## Postgres + migraciones + seed

.PHONY: db-reset
db-reset:                 ## Resetea DB: borra esquema, migra y seedea
	cd $(BACKEND) && npx prisma migrate reset --force
	$(MAKE) db-seed

.PHONY: db-studio
db-studio:                ## Abre Prisma Studio
	cd $(BACKEND) && npx prisma studio

# ─── Servidor ──────────────────────────────────────────

.PHONY: dev
dev:                      ## Arranca backend en modo watch
	cd $(BACKEND) && npx tsx watch src/server.ts

.PHONY: build
build:                    ## Compila TypeScript
	cd $(BACKEND) && npx tsc

# ─── Tests ─────────────────────────────────────────────

.PHONY: test
test:                     ## Tests de integración (todos)
	cd $(BACKEND) && npx vitest run --config vitest.integration.config.ts

.PHONY: test-watch
test-watch:               ## Tests en modo watch
	cd $(BACKEND) && npx vitest --config vitest.integration.config.ts

# ─── Calidad ───────────────────────────────────────────

.PHONY: typecheck
typecheck:                ## Verifica TypeScript sin emitir
	cd $(BACKEND) && npx tsc --noEmit

.PHONY: check
check: typecheck test     ## Typecheck + tests

# ─── Utilidades ────────────────────────────────────────

.PHONY: ps
ps:                       ## Muestra contenedores activos
	$(COMPOSE) ps

.PHONY: logs
logs:                     ## Logs del backend
	$(COMPOSE) logs -f backend

.PHONY: clean
clean:                    ## Limpia artefactos de build
	cd $(BACKEND) && rm -rf dist

.PHONY: help
help:                     ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
		sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
