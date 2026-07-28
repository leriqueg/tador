# Contract: Sprint 07 - Frontend PRO ligero

**Updated**: 2026-07-20

Observable behavior (not implementation).

## Inputs

- Authenticated user; `BookConfig.mode`.
- EntryBuilder fields; manual entry lines; account create under parent; optional employer org on onboarding; work-profile flags.

## Outputs

- Redirects to correct namespace; saved apunte/asiento; account tree with codes; validation errors in everyday language.
- After onboarding: starter wallet + income/expense categories present.

## Invariants

- Tenant isolation.
- No unbalanced asientos.
- Hogar never served EntryBuilder as primary capture; PRO never served QuickAdd as primary.
- Capability checks only at write time for the current apunte.
- Entity-provisioned account types not created via raw account POST.

## US0 — Namespace guard

1. `mode=pro` + `/hogar/X` → `/pro/X` (mapped).
2. `mode=hogar` + `/pro/X` → `/hogar/X`.
3. Legacy unprefixed routes MAY redirect to mode namespace during migration.

## US1 — Onboarding PRO

1. Independent flags: dependency and/or freelance (or neither). Dependency → create `organization` + `is_employment_dependency` (1–3).
2. Skip clients/suppliers.
3. Freelance or neither without orgs → allowed; stamp onboarding complete → `/pro/dashboard`.
4. Completing onboarding (Hogar or PRO) seeds billetera default + minimal income/expense categories.

## US2 — EntryBuilder

1. Steps 1–5 as in spec; prior steps editable.
2. Burst keeps type + account.
3. JIT entity: name + minimal capabilities.
4. Salary without employer capability → block + CTA.
5. Un intento reutiliza su Idempotency-Key tras error y la descarta solo al confirmar éxito.
6. Empty account options → clear empty state + CTA toward Cuentas/Entidades.

## US3 — Manual entry

1. Balanced → 201/200 persist.
2. Unbalanced → 4xx, no persist.
3. Envío/retry usa Idempotency-Key estable por intento.

## US4 — Accounts tree

1. Codes visible.
2. Create under allowed parent.
3. bank/card manual → 422.
4. Cuentas protegidas muestran “Impedir saldo negativo”; activo por defecto.
5. Cambiar la política actualiza `CuentaUsuario` o la activación per-user de una `CuentaGlobal`.

## US5 — Finances

1. P&G / Balance / apuntes history available under `/pro/finances/*` without 009 analysis modules.
