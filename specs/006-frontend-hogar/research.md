# Research: Sprint 06 - Frontend Hogar

## Decision: Sprint boundary

Hogar UI only; excludes PRO screens and IA.

**Rationale**: Prevents broad MVP specs and keeps each sprint independently plannable.

**Alternatives considered**: Full MVP planning in one spec.

## Decision: Testing posture

Use TDD for backend behavior once Sprint 01 establishes test tooling. Frontend: smoke/manual + Storybook for capture components.

**Rationale**: Constitution requires test-first core behavior and tenant/accounting protection.

**Alternatives considered**: Manual testing only.

## Decision: Tenant/privacy default

All user-owned data must be scoped by authenticated user.

**Rationale**: Financial data is private and multiuser from the MVP.

**Alternatives considered**: Add tenant scoping later.

## Decision: Captura Hogar = template-driven quick capture (2026-07-13)

Hogar does **not** use PRO EntryBuilder. Daily capture is plantilla-first with three discovery layers (frequent tiles → kind+category chips → typeahead) and a mini-form (account, amount, short description). Burst action: “Guardar y registrar otro”.

**Rationale**: Persona Hogar thinks in named intents (“pagué el supermercado”), not transaction taxonomy. Recognition over recall; Hick’s law via stratified navigation. Same capture motor as PRO with steps pre-answered by plantilla JSON.

**Alternatives considered**:
- Reuse PRO sequential builder for Hogar — rejected: forces abstract classification (INGRESO/EGRESO) before intent.
- Flat grid of 20+ plantilla buttons — rejected: cognitive overload.
- Dry multi-field form as primary Hogar UX — rejected: feels accounting-like; plantilla already resolves structure.

**Reference**: `specs/foundation/modos-hogar-pro.md` § Diferencia fundamental; mockup `apuntes_tador`.

## Decision: Shared capture motor, mode-specific presentation

One `POST /api/apuntes` path; UI presentation differs by `BookConfig.mode`. PRO EntryBuilder is specified in Sprint 07 and must not ship as Hogar UX in 006.

**Rationale**: DRY + Clean Architecture — accounting rules stay in plantillas/backend.

**Alternatives considered**: Separate Hogar-only write API — rejected as unnecessary duplication.

## Decision: Plantillas list light + detail enrich (2026-07-13)

Entries loads `GET /api/plantillas?mode=hogar` for discovery, then `GET /api/plantillas/:code` when selecting. Hides empty category chips using catalog codes. Diagnóstico: `/api/dev/plantillas-admin` (004 §12).
