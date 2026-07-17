# Contract: Sprint 07 - Frontend PRO ligero

Observable behavior (not implementation).

## Inputs

- Authenticated user; `BookConfig.mode`.
- EntryBuilder fields; manual entry lines; account create under parent; optional employer org on onboarding.

## Outputs

- Redirects to correct namespace; saved apunte/asiento; account tree with codes; validation errors in everyday language.

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

1. Optional “¿relación de dependencia?” → create `organization` + `is_employment_dependency`.
2. Skip clients/suppliers.
3. Freelance without orgs → allowed; stamp onboarding complete → `/pro/dashboard`.

## US2 — EntryBuilder

1. Steps 1–5 as in spec; prior steps editable.
2. Burst keeps type + account.
3. JIT entity: name + minimal capabilities.
4. Salary without employer capability → block + CTA.

## US3 — Manual entry

1. Balanced → 201/200 persist.
2. Unbalanced → 4xx, no persist.

## US4 — Accounts tree

1. Codes visible.
2. Create under allowed parent.
3. bank/card manual → 422.

## US5 — Finances

1. P&G / Balance / apuntes history available under `/pro/finances/*` without 009 analysis modules.
