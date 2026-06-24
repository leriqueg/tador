# Research: Sprint 02 - Catálogos base

## Decision: Sprint boundary

Catalog setup only; excludes journal entries, templates and formal CxC/CxP.

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
