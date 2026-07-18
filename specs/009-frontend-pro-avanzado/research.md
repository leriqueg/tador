# Research: Sprint 09 - Frontend PRO avanzado

## Decision: Attribution via entityId (not full expense×bank join)

Derive `apunte.entityId` from bank/card `CuentaUsuario.entidadId` on income/expense posts. Query costs by entityId + `62010001–03`. Transfers excluded.

**Rejected**: Classify all expenses that credit a bank as “bank cost” — pollutes with groceries etc. and does not scale.

## Decision: No bridge for bank P&G

Bank = balance; fee = PYG category. Analytical “cost of bank” is a filter, not a bridge.

## Decision: Reuse APIs where possible

| Need | API |
|------|-----|
| Monthly bank balance | `GET /api/balances/:id/monthly` |
| Card movements | `GET /api/apuntes?accountId=&dateFrom=&dateTo=` |
| P&G filters | Extend `GET /api/reports/pyg` |
| Portfolio by entity | Extend position or thin `portfolio` sibling |
| Cost totals by entity+category | Aggregate in report helper or filtered apuntes sum |

## Decision: Catalog names

`62010000` Servicios financieros; `41120002` Ganancias por invertir. Obsolete `plan-de-cuentas-seed.csv` deleted.

## Decision: Keep 008/009 numbers

ADR 0002 — IA deferred; 009 is next PRO slice.
