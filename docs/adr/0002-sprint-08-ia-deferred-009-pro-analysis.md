# ADR 0002: Sprint 08 IA deferred; Sprint 09 PRO analysis in MVP sequence

## Status

Accepted.

## Date

2026-07-17

## Context

After Sprint 07 (PRO ligero: EntryBuilder, namespaces, account tree), two candidates competed for the next slot:

1. **Sprint 08 — IA v0** (`specs/008-ia-v0/`): local NL → plantilla suggestions.
2. **Sprint 09 — Frontend PRO avanzado** (`specs/009-frontend-pro-avanzado/`): bank/card/portfolio analysis, financial plantillas, P&G filters.

IA v0 needs a local model runtime, structured-output guardrails, and confirmation UX on top of an already busy MVP. The product still lacked a clear **PRO vs Hogar** differentiation beyond capture density.

## Decision

- **Keep directory numbers as-is** (do not renumber folders).
- **Sprint 08 IA v0 is out of the MVP closure criteria** — deferred for complexity and deadline. Spec retained for post-MVP.
- **Sprint 09 PRO avanzado follows Sprint 07** in the delivery sequence: analysis surfaces + financial plantillas + attribution rules that make PRO meaningfully different from Hogar.
- MVP still closes without IA; MVP **should** include 009 capabilities once 007 is done.

## Consequences

- Roadmap docs (`mvp-scope.md`, `estrategia-incremental-sprints.md`, `modos-hogar-pro.md`) treat 008 as excluded and 009 as the next PRO slice.
- No physical move of `008-ia-v0` ↔ `009-frontend-pro-avanzado`.
- Implementation work for analysis lives under branch/spec **009**.
