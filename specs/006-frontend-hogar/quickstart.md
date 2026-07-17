# Quickstart: Sprint 06 - Frontend Hogar

Validate the Hogar loop (onboarding → apuntes → resumen/estado) with Docker Compose.

## Preconditions

- Docker Desktop running
- Repo at `sprint/006-frontend-hogar` (or merged `main`)

## Stack

```bash
# From repo root
docker compose up -d postgres backend frontend
# First time / after schema changes:
make db-migrate
make db-seed
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:3000/health  

## Story checks (manual)

1. **Primer uso** — Register → onboarding (modo/moneda/TZ + medios opcionales) → Resumen.
2. **Apuntes** — `/entries`: tile frecuente → monto → Guardar (y “registrar otro”).
3. **Estado** — `/dashboard` hub; `/finances` → P&G / Balance / Revisar apuntes.

## Automated tests

```bash
# Frontend unit + integration (no DB)
cd frontend && npm ci && npm run test

# Backend
make test-unit
make test            # integration on tador_test

# E2E Playwright on tador_test (compose network; does not pollute tador_dev)
make test-e2e
```

## Expected Result

Demonstrable Hogar MVP without PRO EntryBuilder, Pacho, or documentary CxC.
