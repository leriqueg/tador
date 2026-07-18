# Implementation Plan: Sprint 07 - Frontend PRO ligero

**Branch**: `sprint/007-frontend-pro-ligero` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-frontend-pro-ligero/spec.md`

## Summary

Ship **PRO ligero**: namespaces `/pro/*` (and migrate Hogar to `/hogar/*` with mode guards), EntryBuilder capture, account tree with codes, manual balanced entry, optional employer org on PRO onboarding. Keep P&G/Balance conceptually identical to Hogar. Advanced analysis → `009-frontend-pro-avanzado`. IA v0 (`008`) excluded from MVP.

## Technical Context

**Language/Version**: TypeScript — backend Node.js; frontend React 19 + Vite 8

**Primary Dependencies**: Fastify, Prisma, PostgreSQL (backend); React, React Router, Tailwind v4 (frontend). Design-system in `frontend/src/components/` + Storybook.

**Storage**: PostgreSQL via Prisma; plantillas JSON under `backend/src/plantillas/`. Entidad capabilities: extend model (Json or flags) for `organization`.

**Testing**: Backend Vitest (unit + integration); frontend Vitest + Storybook for EntryBuilder; Playwright smoke for namespace guard + capture. **TDD** for backend capability validation and frontend builder state where practical.

**Target Platform**: Linux-hosted web app; Docker Compose; mobile-first + desktop.

**Project Type**: Web application (`backend/` + `frontend/`)

**Performance Goals**: Typical PRO income via EntryBuilder &lt; 60s; interactive on pilot data.

**Constraints**: Tenant isolation; exact decimal money; no QuickAdd as PRO primary; no 009 analysis; no IA; same domain APIs for both modes.

**Scale/Scope**: MVP PRO ligero only.

## Constitution Check

- **MVP Scope & Sprint Fit**: PASS — advanced analysis and IA deferred.
- **Tenant & Privacy**: PASS — user-scoped.
- **Accounting Integrity**: PASS — apuntes/asientos via engine.
- **Plantilla Discipline**: PASS — EntryBuilder may omit templateCode when lines are valid.
- **Plan de Cuentas & Entidades**: PASS — organization + capabilities; entity-provisioned accounts unchanged.
- **PYG vs Balance**: PASS — unchanged panels in 007.
- **TDD & Tests**: PASS — tasks include test-first for capability validation and builder invariants.
- **AI Safety**: PASS — IA out of MVP.
- **Concurrency & Idempotency**: PASS — reuse apunte/entry idempotency patterns.
- **Secure Design & Architecture**: PASS — Clean Architecture; mode guard is presentation only.
- **Maintainability Standards**: PASS — separate page trees per namespace.
- **Dependency Hygiene**: PASS — no new prerelease deps planned.

## Project Structure

```text
specs/007-frontend-pro-ligero/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── inventory-vistas-endpoints.md
├── tasks.md
└── contracts/
    └── behavior.md

frontend/src/pages/hogar/ …   # migrated Hogar pages
frontend/src/pages/pro/ …     # PRO pages
frontend/src/components/entry-builder/
```

## Phase 0 / Phase 1

See [research.md](./research.md), [data-model.md](./data-model.md), [contracts/behavior.md](./contracts/behavior.md), [quickstart.md](./quickstart.md), [inventory-vistas-endpoints.md](./inventory-vistas-endpoints.md).

## Post-Design Constitution Check

All gates remain PASS for Sprint 07 ligero scope.
