# Implementation Plan: Sprint 06 - Frontend Hogar

**Branch**: `sdd/definiciones` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-frontend-hogar/spec.md`

## Summary

Build the simple mobile-first Hogar experience for onboarding, guided account creation, **template-driven Apuntes** (three-layer discovery + mini-form + burst), balances and dashboard.

**Capture decision (2026-07-13)**: Hogar = plantillas / recognition-over-recall. PRO EntryBuilder is **out of scope** (see `007-frontend-pro-ligero`). Shared write path via plantillas API.

**Onboarding delta (2026-07-14)**: Wizard = modo → moneda + TZ (browser default, lista NA/SA/EU) → banco + billeteras virtuales opcionales → tarjetas opcionales. Crear medios vía `POST /api/entities` (provisión atómica). Billetera del plan = sin entidad.

**Ajustes / Entidades / Cuentas (2026-07-14 evening)**:
- `/settings`: moneda readonly; TZ + `fullName` editables; sin email/password.
- `/entities`: bank | card_issuer | wallet_platform | person (+ organization PRO).
- `/accounts` Hogar: solo `incomeCategory` / `expenseCategory` (sin saldo hero). Puentes = PRO.
- Manual `POST /api/accounts` de bank/card → 422.

**Dashboard / Finances delta (2026-07-16)**:
- `/dashboard` = hub (mes default vía `monthlySeries`; toggle año; posición; tip).
- `/finances` landing → `/finances/pyg` | `/finances/balance` | `/finances/apuntes`.
- Captura solo en `/entries`. Top 10 fijo. Endeudamiento solo front (sin FR).
- API: filtros en `GET /api/apuntes`; P&G/position existentes; serie diaria mes = follow-up si falta.

## Technical Context

**Language/Version**: TypeScript — backend Node.js; frontend React 19 + Vite 8

**Primary Dependencies**: Fastify, Prisma, PostgreSQL (backend); React, React Router, Tailwind v4 (frontend). Design-system components in `frontend/src/components/` + Storybook.

**Storage**: PostgreSQL via Prisma; plantilla definitions as versioned JSON under `backend/src/plantillas/`

**Testing**: Backend Vitest (unit + integration in Docker); frontend Vitest (unit ~70% / integration ~20%) + Playwright E2E (~10%, `make test-e2e` on `tador_test`); Storybook for capture components

**Target Platform**: Linux-hosted web app; local Docker Compose; mobile-first browser clients

**Project Type**: Web application with backend API and frontend client

**Performance Goals**: Register common expense via frequent tile in &lt;30s; interactive feel on pilot data

**Constraints**: Tenant isolation; no account codes in Hogar UI; exact decimal money; no Pacho in functional pages; no EntryBuilder in this sprint

**Scale/Scope**: MVP/pilot; Sprint 06 Hogar only


## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **MVP Scope & Sprint Fit**: PASS — this plan covers one sprint/capability only and keeps out-of-scope work explicit.
- **Tenant & Privacy**: PASS — user-owned data is scoped by authenticated user whenever the sprint touches runtime data.
- **Accounting Integrity**: PASS — any financial behavior routes through balanced Asientos or declares no accounting impact.
- **Plantilla Discipline**: PASS — common operations are modeled through versioned Plantillas when applicable.
- **Plan de Cuentas & Entidades**: PASS — global chart, user accounts and Entidades remain separate concepts.
- **PYG vs Balance**: PASS — PYG reporting is separated from balance, bridge and payment accounts.
- **TDD & Tests**: PASS — each sprint defines test obligations; Sprint 01 establishes runnable tooling.
- **AI Safety**: PASS — IA v0 only suggests templates and never persists accounting directly.
- **Concurrency & Idempotency**: PASS — mutating backend behavior must define duplicate-request and concurrent update handling before implementation.
- **Secure Design & Architecture**: PASS — plans must preserve Clean Architecture boundaries, authorization, validation, privacy-safe logs, and fail-closed tenant access.
- **Maintainability Standards**: PASS — implementation must follow SOLID/DRY with judgment, English code/endpoint naming, and rare English comments for complex procedures only.
- **Dependency Hygiene**: PASS — package additions must use stable releases, lock exact resolved versions, avoid prerelease/untested packages, and prefer reputable OSS/framework features.


## Project Structure

### Documentation (this feature)

```text
specs/006-frontend-hogar/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── behavior.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── state/
└── tests/

specs/
└── foundation/
```

**Structure Decision**: Use a web application layout with separate `backend/` and `frontend/` roots when implementation begins. Foundation and sprint specs remain under `specs/`.


## Complexity Tracking

No constitution violations are currently planned. Any future violation must document why it is required and what simpler alternative was rejected.


## Phase 0 Research

See [research.md](./research.md). All planning clarifications are resolved for this draft plan.

## Phase 1 Design

See [data-model.md](./data-model.md), [quickstart.md](./quickstart.md), and contracts under [contracts/](./contracts/) when applicable.

**Pre-implementation inventory** (routes ↔ mockups ↔ APIs): [inventory-vistas-endpoints.md](./inventory-vistas-endpoints.md).  
**Component inventory** (Storybook definitions): [`frontend/docs/component-inventory.md`](../../frontend/docs/component-inventory.md).  
**Tasks**: [tasks.md](./tasks.md).

## Post-Design Constitution Check

- **MVP Scope & Sprint Fit**: PASS — design artifacts remain scoped to `Sprint 06 - Frontend Hogar`.
- **Tenant & Privacy**: PASS — privacy/tenant impact is documented for this sprint.
- **Accounting Integrity**: PASS — accounting impact is either absent or routed through balanced Asientos.
- **TDD & Tests**: PASS — test expectations are documented for planning and task generation.
- **Concurrency & Idempotency**: PASS — implementation tasks must cover duplicate submissions and concurrent writes when mutating state.
- **Secure Design & Architecture**: PASS — design must maintain secure boundaries and Clean Architecture separation.
