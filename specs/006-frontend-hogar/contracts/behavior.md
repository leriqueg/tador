# Contract: Sprint 06 - Frontend Hogar

This contract describes observable behavior, not implementation details.

## Inputs

- Authenticated user context when runtime data is involved.
- User-provided data required by the sprint's stories.
- For apuntes (US2): plantilla code, account selection, amount, short description, optional date (default today).

## Outputs

- User-visible result that satisfies the acceptance scenarios in [spec.md](../spec.md).
- Validation feedback when inputs are incomplete, unauthorized, or violate sprint rules.
- On successful apunte: confirmation region + updated recent list; optional burst reset (keep plantilla + account).

## Invariants

- Data from one user is never exposed to another user.
- Financial behavior never bypasses accounting integrity rules (plantillas + backend only).
- Hogar capture never displays account codes or ledger lines.
- Out-of-scope MVP modules (PRO EntryBuilder, IA, documentary CxC) are not required for this sprint to complete.

## US2 — QuickAdd / Entries (Hogar) observable contract

### Discovery

1. Screen `/entries` shows ≤6 frequent plantilla tiles (usage ranking or curated fallback).
2. Kind segment: Gasto | Ingreso | Transferencia.
3. Category chips (≤6) filter plantillas for the active kind; at most ~3 plantillas shown per category view.
4. Typeahead search resolves plantilla by name/synonym.
5. Deep link `/entries/new?plantilla=<code>` opens mini-form with that plantilla selected.

### Mini-form

1. Fields: account (sticky default = last used when available), amount, short description; date defaults to today.
2. Submit disabled until request starts; spinner while in flight.
3. Success → confirmation (live region) + recent list refresh.
4. “Guardar y registrar otro” → same plantilla + account retained; amount and description cleared; focus amount.
5. Missing required account for plantilla → everyday-language error + path to create/select account (no codes).

### Non-goals (this sprint)

- EntryBuilder progressive disclosure (Sprint 07).
- Showing asiento lines or account codes in capture UI.
