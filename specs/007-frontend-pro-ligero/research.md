# Research: Sprint 07 - Frontend PRO ligero

## Decision: Separate frontend namespaces

`/hogar/*` and `/pro/*` with mode guard redirects. Avoids `if (mode)` god-pages; allows distinct shell/color. Backend APIs stay shared.

**Alternatives**: Same routes densified by mode — rejected (SOLID/composability).

## Decision: EntryBuilder write path

Primary: build valid apunte → `POST /api/apuntes` with or without `templateCode`. Escape: `POST /api/entries` (manual). Do not require loading-all-templates-and-pruning as the only algorithm; optional hybrid later.

**Alternatives**: Template-filter-only — deferred; free-compose first.

## Decision: P&G/Balance unchanged

Analysis banks/cards/cartera → Sprint 009. Prevents scope explosion.

## Decision: organization + capabilities

Collapse client/supplier into `organization` with `can_be_customer`, `can_be_supplier`, `is_employment_dependency`. Validate on apunte submit only.

**Rationale**: Same legal entity can change role over time; no retroactive rewrite.

## Decision: PRO onboarding

Ask employment dependency only → create employer org. No clients/suppliers in onboarding. Freelance may finish empty-handed. Clients/suppliers JIT in EntryBuilder with careful inline UI.

## Decision: IA / 008

Excluded from MVP (time). Spec retained.

## Decision: Testing posture

TDD for capability checks (backend) and EntryBuilder step machine (unit). Integration for apunte/entry. E2E smoke for guards + one happy path.
