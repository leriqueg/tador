# Implementation Plan: Sprint 08 - IA v0

**Branch**: `sdd/definiciones` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-ia-v0/spec.md`

## Summary

Add a local AI interpreter that suggests known templates and prefilled fields with user confirmation.

## Technical Context

**Language/Version**: TypeScript on Node.js (exact versions to be pinned during Sprint 01 setup)

**Primary Dependencies**: Fastify, Prisma, PostgreSQL for backend; React, Vite, Mantine, Zustand and React Query for frontend when frontend sprints begin

**Storage**: PostgreSQL via Prisma for product data; JSON files in repo for MVP template definitions until a later persistence decision

**Testing**: Test runner to be established in Sprint 01; backend behavior requires TDD once tooling exists

**Target Platform**: Linux-hosted web application, local Docker development, browser clients mobile-first plus desktop support

**Project Type**: Web application with backend API and frontend client

**Performance Goals**: MVP user flows should feel interactive for a personal finance book; dashboard and balances should load within normal web-app expectations for pilot data

**Constraints**: Tenant isolation, privacy-safe logs, stable per-book currency, balanced accounting entries, no autonomous AI execution

**Scale/Scope**: MVP/pilot scale for personal and light professional use; one sprint per spec


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
specs/008-ia-v0/
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

## Post-Design Constitution Check

- **MVP Scope & Sprint Fit**: PASS — design artifacts remain scoped to `Sprint 08 - IA v0`.
- **Tenant & Privacy**: PASS — privacy/tenant impact is documented for this sprint.
- **Accounting Integrity**: PASS — accounting impact is either absent or routed through balanced Asientos.
- **TDD & Tests**: PASS — test expectations are documented for planning and task generation.
- **Concurrency & Idempotency**: PASS — implementation tasks must cover duplicate submissions and concurrent writes when mutating state.
- **Secure Design & Architecture**: PASS — design must maintain secure boundaries and Clean Architecture separation.
