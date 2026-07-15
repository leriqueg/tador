# Data Model: Sprint 06 - Frontend Hogar

Conceptual model for planning. Field-level schema lives in Prisma / APIs.

## Pantalla Hogar

- **Purpose**: Supports Sprint 06 - Frontend Hogar.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.

## Libro / BookConfig (onboarding)

- **Fields captured**: `mode`, `currency`, `timeZone`, `onboardingCompletedAt`.
- **Timezone**: IANA string from curated list; browser default preferred.
- **Initialized**: `onboardingCompletedAt !== null`.

## Billetera virtual (CuentaUsuario)

- `tipoCuenta`: `wallet`
- `parentGroupCodigo` / `globalId`: under `11110000` (Efectivo / billeteras)
- Onboarding MAY create 0–2 extras beyond plan default

## Tarjeta Hogar (CuentaUsuario)

- `tipoCuenta`: `card`
- `parentGroupCodigo` / `globalId`: under `21200000` (Tarjetas de crédito)
- `metadata` (JSON, optional):
  - `network`: `VISA` | `MASTERCARD` | `AMEX` | `OTRO`
  - `lastFour`: string (≤4 digits)
  - `cutoffDay`: integer 1–31
- `entidadId`: optional `issuer` (auto from characteristic name)
- **MUST NOT** require a bank account

## Transferencia (plantilla)

- Selectable groups: efectivo/billeteras, bancos, CxC personales, CxP personales
- Invariant: origin account id ≠ destination account id (V10)

## Formulario de apunte / Saldos / Dashboard

- Unchanged conceptual ownership from prior draft; UI concepts consume user-scoped backend data.

## Relationships

- UI concepts consume backend data owned by the authenticated user.
- Card/wallet creation does not depend on prior bank entities in Hogar onboarding.
