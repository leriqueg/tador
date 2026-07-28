# Implementation Plan: EntryBuilder decision graph

**Branch**: `feat/entry-builder-decision-graph` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

## Summary

Replace PRO EntryBuilder “subtype chips + two global account selects” with a **static decision graph**. Plantillas remain **leaf recipes**. No IA. Reuse `POST /api/apuntes`.

## Technical Context

**Language**: TypeScript — frontend React 19; backend Node (plantilla modes only).

**Primary artifacts**:
- `frontend/src/components/entry-builder/decision-graph.ts` — graph definition (INGRESO MVP + minimal EGRESO/TRANSFER)
- `frontend/src/components/entry-builder/decision-walker.ts` — pure state machine
- `frontend/src/components/entry-builder/EntryBuilder.tsx` — UI walks nodes
- `backend/src/plantillas/registrar-sueldo.json` — add `pro` to modes

**Testing**: Vitest unit (walker/graph); frontend integration (EntryBuilder path); backend integration DB (`plantillas` / new `entry-builder-graph.test.ts`) for salary apunte.

**Constraints**: No new apunte API; no 008 IA; Hogar QuickAdd unchanged.

## Constitution Check

- MVP scope: PASS (INGRESO graph; other ops minimal)
- Plantilla discipline: PASS (leaves only)
- TDD: PASS
- AI safety: PASS (out)

## Project Structure (touched)

```text
specs/012-entry-builder-decision-graph/
frontend/src/components/entry-builder/
  decision-graph.ts
  decision-walker.ts
  decision-walker.test.ts
  EntryBuilder.tsx
  EntryBuilder.integration.test.tsx
backend/src/plantillas/registrar-sueldo.json
backend/tests/entry-builder-graph.test.ts
```

## Implementation strategy

1. Spec/plan/tasks (this folder).
2. RED: walker unit tests.
3. GREEN: graph + walker.
4. Wire EntryBuilder UI.
5. Plantilla modes + DB integration salary.
6. Update `.cursor/rules/specify-rules.mdc` active plan → 012.
