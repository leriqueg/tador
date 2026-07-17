# Contract: Sprint 09 - Frontend PRO avanzado

## Invariants

- Tenant isolation; balanced entries; transfers never get FR-009 auto-entityId.
- Costs and investment gains never silently netted in UI.
- No `/api/.../cargos` endpoint.

## Auto-entityId (POST /api/apuntes)

1. Template kind ingreso/egreso (not `transferencia`) + missing body.entityId + exactly one distinct `entidadId` from bank/card lines → persist that entityId.
2. Two distinct bank/card entidadIds without body.entityId → 400.
3. Transferencia → leave entityId as client sent (optional) without auto-fill from FR-009.

## Analysis reads

1. Banks monthly: balances monthly 200.
2. Costs/yield: filterable by entityId + year; separate totals.
3. Cards list: apuntes by accountId + date range.
4. Portfolio: receivables vs payables grouped by entity.
5. P&G: optional accountId/entityId query params on PRO path.
