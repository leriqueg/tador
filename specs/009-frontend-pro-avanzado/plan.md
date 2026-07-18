# Implementation Plan: Sprint 09 - Frontend PRO avanzado

**Branch**: `sprint/009-frontend-pro-avanzado` | **Date**: 2026-07-17 | **Spec**: [spec.md](./spec.md)

## Summary

PRO analysis routes (banks/cards/portfolio), financial plantillas, auto-`entityId` on income/expense apuntes from bank/card accounts, P&G filters, catalog label updates. No IA (008). No “cargos” endpoint. No renumbering of 008/009 (ADR 0002).

## Technical Context

**Language/Version**: TypeScript — backend Node; frontend React 19 + Vite 8  
**Primary Dependencies**: Fastify, Prisma, PostgreSQL; React Router, Tailwind v4  
**Storage**: Prisma; plantillas JSON; chart from `plan-de-cuentas-final-seed.json`  
**Testing**: Vitest unit/integration TDD; Playwright smoke optional  
**Constraints**: Exact decimal money; tenant isolation; transferencias excluded from auto-entityId  

## Constitution Check

All gates PASS for Sprint 09 scope (analysis + plantillas; no ERP; no autonomous AI).

## Project Structure

```text
specs/009-frontend-pro-avanzado/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── inventory-vistas-endpoints.md, tasks.md
└── contracts/behavior.md

backend/src/plantillas/{comision-bancaria,interes-tarjeta,multa-financiera,ganancia-inversion}.json
frontend/src/pages/pro/analysis/
```

## Phase 0 / 1

See research, data-model, contracts, inventory, quickstart.
