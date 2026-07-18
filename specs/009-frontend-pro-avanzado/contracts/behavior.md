# Contract: Sprint 09 - Frontend PRO avanzado

## Invariants

- Tenant isolation; balanced entries; transfer-like plantillas never get FR-009 auto-entityId.
- Costs and investment gains never silently netted in UI.
- No `/api/.../cargos` endpoint.

## Auto-entityId (POST /api/apuntes)

1. Template kind ingreso/egreso (not transfer-like) + missing body.entityId + exactly one distinct `entidadId` from bank/card lines → persist that entityId.
2. Two distinct bank/card entidadIds without body.entityId → 400.
3. Transfer-like plantillas (`transferencia`, `deposito_bancario`, `retiro_bancario`, `pago_tarjeta`, `prestamo_otorgado`, `cobro_prestamo`) → leave entityId as client sent (optional) without auto-fill from FR-009. The counterpart (person/card issuer) already lives on the line account, so the bank must not be mistaken for the entity.
4. Plantilla with `entity.requiresCapability` (e.g. `registrar_sueldo` → `is_employment_dependency`) → never auto-fill from bank/card; entityId is only the explicit related party (employer). Omitting it leaves entityId null so V11 does not run against the bank.

## Duplicate-request strategy (Constitution IX)

`POST /api/apuntes` MUST accept an idempotency key (via `idempotencyKey` in the body or the `Idempotency-Key` header) and persist it on the underlying `Asiento.idempotencyKey` (unique).

1. First request with a given key → create asiento + apunte, respond `201`.
2. Repeat with the same key → replay the first apunte without creating a new one, respond `200`.
3. Concurrent duplicate racing on the unique key (`P2002`) → the loser re-reads and replays the winner, respond `200`.
4. Requests without a key still work (no dedup); clients SHOULD send one per capture attempt so retries/double-submits collapse to a single apunte.

## Analysis reads

1. Banks monthly: balances monthly 200.
2. Costs/yield: filterable by entityId + year; separate totals.
3. Cards list: apuntes by accountId + date range.
4. Portfolio: receivables vs payables grouped by entity.
5. P&G: optional accountId/entityId query params on PRO path.
