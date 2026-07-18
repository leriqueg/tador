# Data Model: Sprint 07 - Frontend PRO ligero

Conceptual planning model. Schema changes are minimal.

## BookConfig / mode

- `mode`: `hogar` | `pro` — drives namespace guard (`/hogar/*` vs `/pro/*`).

## Entidad (organization capabilities)

- Existing `TipoEntidad` includes `organization`.
- **Add** capabilities storage (preferred: `capabilities Json` string[] on `Entidad`, or boolean columns).
- Capabilities used in 007:
  - `can_be_customer`
  - `can_be_supplier`
  - `is_employment_dependency` (0–3 orgs per user recommended)

Validation: checked when creating apunte that requires a role — **not** retroactive.

## EntryBuilderSession (UI state)

- `operationType`: INGRESO | EGRESO | TRANSFERENCIA
- `accountId` / subtype
- `entityId` optional
- `concept`, `amount`
- Sticky: last `accountId` per `operationType` (client storage OK for MVP)

## Apunte / Asiento

- Unchanged ownership; EntryBuilder posts apunte (± templateCode) or manual entry lines.
- Manual: balanced lines only.

## CuentaUsuario (PRO tree)

- Display: codigo, nombre, tipo, parent, saldo when available.
- Create under allowed mothers: incomeCategory, expenseCategory, bridge, etc.
- bank/card/wallet_platform: entity provision only.

## Relationships

- UI namespaces consume same user-scoped APIs.
- Employer org linked only by capability flag + optional use in salary apuntes.
