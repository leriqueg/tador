# Tasks: EntryBuilder decision graph (012)

**Tests**: TDD — walker unit first; EntryBuilder integration; DB integration salary apunte.

## Phase 1 — Speckit & docs

- [x] T001 Create `specs/012-entry-builder-decision-graph/` (spec, plan, research, data-model, contracts)
- [x] T002 [P] Update `.cursor/rules/specify-rules.mdc` active plan → 012
- [x] T003 [P] Note in `modos-hogar-pro.md`: EntryBuilder = decision graph; plantillas = leaves

## Phase 2 — Foundational walker (blocking)

- [x] T004 Unit RED: decision-walker advance/back/choice/leaf payload
- [x] T005 Implement `decision-graph.ts` (INGRESO sueldo/cliente/otro + minimal EGRESO/TRANSFER)
- [x] T006 Implement `decision-walker.ts` GREEN + burst

## Phase 3 — US1 UI

- [x] T007 Rewrite `EntryBuilder.tsx` to render current graph node (choice/entity/account/concept/amount)
- [x] T008 Account options filtered by node `groupCodes` / `tipoCuenta`
- [x] T009 Entity step + capability gate + JIT CTA (reuse EntityJitForm)
- [x] T010 Integration: EntryBuilder sueldo path reaches submit with `registrar_sueldo`

## Phase 4 — Backend / DB

- [x] T011 Add `pro` to `registrar-sueldo.json` modes
- [x] T012 DB integration: PRO-style salary apunte OK; missing capability 4xx

## Phase 5 — Polish

- [x] T013 EGRESO/TRANSFER minimal subgraph wired
- [x] T014 Quickstart + update 007 inventory note (superseded UX)
- [x] T015 Remove obsolete subtype-chip UX / update financial-plantillas usage
  (UI removed; legacy `entry-builder-state` marked deprecated for unit-only)

## Dependencies

T004–T006 before T007. T011 before T012. T007 before T010.
