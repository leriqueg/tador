# Contract: EntryBuilder decision graph

**Updated**: 2026-07-21

## Inputs

- Graph definition (static).
- Accounts (user + postable globals), entities.
- User choices along nodes.

## Outputs

- `ApunteSubmitPayload` → `POST /api/apuntes`.
- Visible question/options per current node.

## Invariants

- No plantilla catalog as primary PRO UX.
- Salary leaf requires employer capability at submit (backend V11).
- Debit ≠ credit when both set.
- Tenant isolation unchanged.

## API

Unchanged: `POST /api/apuntes`, `GET /api/plantillas/:code` optional for enrichment later.
