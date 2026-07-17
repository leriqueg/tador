# Research: Sprint 07 - Frontend PRO ligero

## Decision: Sprint boundary

Light PRO UI only; excludes ERP, invoices and advanced reports.

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

## Decision: Captura PRO = EntryBuilder (2026-07-13)

Primary daily capture is **progressive disclosure / narrative form** (EntryBuilder): Tipo → cuenta/subtipo → (Entidad si aplica) → concepto → monto. Completed steps stay visible and editable. Burst: “Guardar y registrar otro”. Manual asiento remains escape hatch.

**Rationale**: PRO persona still is not a full accountant; sequential filtered choices give validity-by-construction and teach the model. Dry multi-field form rejected as primary UX. Hogar plantilla UX must not be reused as the only PRO path, nor EntryBuilder shipped as Hogar UX (see Sprint 06).

**Alternatives considered**:
- Dry form + “guardar y escribir otro” only — rejected as primary; kept as behavior once steps are filled / via burst.
- AI free-text (`registro_pro_asistente_ia_tador`) — post-MVP / Sprint 08; not Sprint 07 EntryBuilder.
- Same Hogar tile grid for PRO — rejected: PRO needs branching (préstamo + entidad) and more control.

**Reference**: `specs/foundation/modos-hogar-pro.md`; mockup `registro_pro_plantillas_tador`.
