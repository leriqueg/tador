# Contract: Sprint 05 - Dashboard PYG y Posición

This contract describes observable behavior, not implementation details.

## Inputs

- Authenticated user context when runtime data is involved.
- User-provided data required by the sprint's stories (ejercicio for PYG panel; position uses current saldos at query time).

## Outputs

- PYG panel: annual totals, monthly series, Top 10 breakdowns for the selected ejercicio.
- Position panel: aggregated available, receivable and payable totals at query time.
- Validation feedback when inputs are incomplete, unauthorized, or violate sprint rules.

## Invariants

- Data from one user is never exposed to another user.
- Financial behavior never bypasses accounting integrity rules.
- PYG totals never include balance-only or bridge account movements.
- Position totals never include income/expense account movements.
- Out-of-scope MVP modules (formal CxC/CxP documents, third-party statements) are not required for this sprint to complete.
