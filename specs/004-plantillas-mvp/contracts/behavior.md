# Contract: Sprint 04 - Plantillas MVP

**Updated**: 2026-07-18

This contract describes observable behavior, not implementation details.

## Inputs

- Authenticated user context when runtime data is involved.
- User-provided data required by the sprint's stories.

## Outputs

- User-visible result that satisfies the acceptance scenarios in [spec.md](../spec.md).
- Validation feedback when inputs are incomplete, unauthorized, or violate sprint rules.

## Invariants

- Data from one user is never exposed to another user.
- Financial behavior never bypasses accounting integrity rules.
- `POST /api/apuntes` crea Asiento + líneas + Apunte atómicamente.
- Una Idempotency-Key repetida o concurrente retorna el Apunte existente sin duplicar.
- Las plantillas heredan V12 del motor: no confirman saldos naturales negativos en cuentas protegidas salvo política explícitamente desactivada.
- Out-of-scope MVP modules are not required for this sprint to complete.

## Plantillas catalog (observable)

- `GET /api/plantillas` returns a light catalog: metadata and lines **without** `availableAccounts`.
- `GET /api/plantillas/:code` returns the same plantilla **with** `availableAccounts` resolved for the authenticated user.
- Dev-only diagnostic: `GET/POST /api/dev/plantillas-admin*` (gate by env / non-production); not a product surface. Full admin UI is post-MVP.
