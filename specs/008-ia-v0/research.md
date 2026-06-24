# Research: Sprint 08 - IA v0

## Decision: Sprint boundary

AI interpretation only; excludes autonomous accounting decisions.

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

## Decision: AI authority

AI returns suggestions only; backend validates and user confirms.

**Rationale**: Constitution forbids autonomous accounting execution.

**Alternatives considered**: Let model create entries directly.
