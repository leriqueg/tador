# Quickstart: Sprint 07 - Frontend PRO ligero

## Preconditions

- Sprint 06 Hogar usable.
- Docker stack up; seeded catalog.
- Branch `sprint/007-frontend-pro-ligero`.

## Validation Path

1. Create user → onboarding **PRO** + dependencia → employer org → `/pro/dashboard` with starter accounts (billetera + categorías).
2. Second user → PRO freelance **or none** → completes without clients; same starter accounts.
3. User with **both** dependencia + freelance → employers created; no clients asked.
4. `/pro/entries` → **decision graph** (012): Ingreso → origen (sueldo/cliente/otro) → cuentas → save → burst.
   Subtype chips / plantilla catalog as primary UX are **superseded** by 012.
5. Rama con Entidad → crear en `/pro/entities` (organization + caps) o JIT EntryBuilder (polish T042).
6. `/pro/entries/manual` → balanced OK; unbalanced rejected.
7. `/pro/accounts` → codes visible; create under mother; bank manual fails.
8. Visit `/hogar/entries` while PRO → redirect `/pro/entries`.
9. P&G/Balance under `/pro/finances/*` match Hogar content level.

## Playwright — PRO apunte (T039)

```bash
cd frontend && npm run test:e2e -- e2e/pro-quickstart.spec.ts
```

Expect: chromium-pro project saves an EntryBuilder income apunte after setup seeds starter accounts.

## Smoke tests (T028)

Integration (no stack required):

```bash
cd frontend && npm run test -- --run src/pages/pro/quickstart-smoke.integration.test.tsx
```

Broader PRO slice:

```bash
cd frontend && npm run test -- --run src/pages/pro/
```

Playwright (requires auth setup + running stack):

```bash
cd frontend && npm run test:e2e -- e2e/pro-quickstart.spec.ts
```

## Expected Result

PRO ligero demonstrable without 009 analysis or 008 IA.
