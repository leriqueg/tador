# Tasks: Sprint 09 - Frontend PRO avanzado

**Tests**: TDD — failing tests before production code for auto-entityId, plantillas, P&G filters, analysis aggregations.

## Phase 1 — Catalog & docs

- [x] T001 Rename chart labels (Servicios financieros, Comisiones, Intereses, Ganancias por invertir) in final CSV/JSON + backend/data copy
- [x] T002 Delete obsolete `plan-de-cuentas-seed.csv`; document source of truth in `reglas-plan-cuentas.md`
- [x] T003 ADR 0002 + roadmap notes (008 out / 009 next); no folder renumber
- [x] T004 Update `.cursor/rules/specify-rules.mdc` active plan → 009

## Phase 2 — Foundational backend

- [x] T005 [P] Unit: pure helper `resolveApunteEntityId({ templateCode, lines, explicitEntityId })` — income/expense auto; transferencia no-op; ambiguity 400
- [x] T006 Wire helper into `POST /api/apuntes`; integration tests
- [x] T007 [P] Plantillas JSON: `comision_bancaria`, `interes_tarjeta`, `multa_financiera`, `ganancia_inversion` + loader tests
- [x] T008 Extend `GET /api/reports/pyg` with optional `accountId` / `entityId` filters + tests
- [x] T009 Portfolio-by-entity: extend position or `GET /api/reports/portfolio` + tests
- [x] T010 [P] Cost/yield aggregate helper (entityId + year + category codes) used by analysis (unit tests)

## Phase 3 — US5 capture

- [x] T011 EntryBuilder / plantilla discovery includes new financial plantillas (PRO)
- [x] T012 Hogar QuickAdd: new plantillas available when `modes` includes hogar (if applicable) or PRO-only — follow plantilla `modes` field

## Phase 4 — US1–US3 analysis UI

- [x] T013 Nav link(s) under PRO to analysis section
- [x] T014 Page `/pro/analysis/banks` (monthly chart + cost/yield panels)
- [x] T015 Page `/pro/analysis/cards` (apuntes list + cost panels)
- [x] T016 Page `/pro/analysis/portfolio` (CxC vs CxP by entity)

## Phase 5 — US4 P&G filters + polish

- [x] T017 PRO P&G UI filters account/entity; Hogar unchanged
- [x] T018 Quickstart smoke tests (integration)
- [x] T019 Polish empty states (bank without entidadId)

## Dependencies

T005–T006 before T011/T014. T007 before T011. T008 before T017. T009 before T016.
