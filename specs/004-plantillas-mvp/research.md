# Research: Sprint 04 - Plantillas MVP

## Decision: Sprint boundary

Template execution only; excludes frontend flows and IA interpretation.

**Rationale**: Prevents broad MVP specs and keeps each sprint independently plannable.

**Alternatives considered**: Full MVP planning in one spec.

## Decision: Testing posture

Use TDD for backend behavior once Sprint 01 establishes test tooling.

**Rationale**: Constitution requires test-first core behavior and tenant/accounting protection.

**Alternatives considered**: Manual testing only.

## Decision: Tenant/privacy default

All user-owned data must be scoped by authenticated user.

**Rationale**: Financial data is private and multiuser from the MVP.

**Alternatives considered**: Add tenant scoping later.

## Decision: Template storage

Keep MVP templates as versioned JSON in repo.

**Rationale**: User prefers JSON first and DB persistence later.

**Alternatives considered**: Persist templates in DB from day one.

## Decision: List vs detail enrichment (2026-07-13)

`GET /api/plantillas` returns light catalog. `GET /api/plantillas/:code` resolves `availableAccounts` using an in-memory chart index (one `findMany` globals + one user-accounts query). Avoids N+1 ancestor walks that made list ~6–7s for ~10KB.

**Rationale**: Discovery UI only needs code/name; account picks happen after selection.

**Plantillas Admin**: `/api/dev/plantillas-admin` for readiness, empty categories, and journal preview; full admin frontend is post-MVP.
