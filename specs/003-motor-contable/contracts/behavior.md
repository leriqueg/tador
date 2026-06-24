# Contract: Sprint 03 - Motor contable

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
- Out-of-scope MVP modules are not required for this sprint to complete.
