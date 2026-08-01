# 014 — Chart of Accounts Engine (Plan de cuentas)

**Status**: Implemented (MVP Phase 1) — Speckit complete; releases deferred.  
**Branch**: `feat/chart-of-accounts-engine`  
**Depends on**: Spec 013 (admin platform), Spec 002 (catálogos), foundation `plan-de-cuentas`  
**Speckit**: specify / plan / tasks done. Implement MVP delivered on this branch.

## Artifacts

| File | Role |
|------|------|
| [needs.md](./needs.md) | Product / operational needs (why now, why later) |
| [spec.md](./spec.md) | Draft feature specification (manual; not Speckit-generated) |
| [research.md](./research.md) | Decision log and alternatives |
| [../../docs/adr/0008-chart-of-accounts-engine.md](../../docs/adr/0008-chart-of-accounts-engine.md) | Architecture ADR |

## Intent (one line)

Backend **chart engine** (domain + application commands, dry-run, cascade recode) that admin-ui consumes — not a thin CRUD UI. Versioned releases are phase 2 of the same command language.

## Suggested Speckit entry (later)

When approved: run Speckit against this folder to produce `plan.md` / `tasks.md` / contracts, then implement TDD on this branch (or a numbered `014-*` feature branch).
