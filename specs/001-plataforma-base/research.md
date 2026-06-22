# Research: Sprint 01 - Plataforma base

## Decision: Sprint boundary

Backend-facing product foundation; excludes chart of accounts and accounting entries.

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

## Decision: Auth method

Use email/password with recovery for MVP.

**Rationale**: User explicitly requested normal email account and password recovery.

**Alternatives considered**: OAuth/social login first.
