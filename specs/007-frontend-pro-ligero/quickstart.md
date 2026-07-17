# Quickstart: Sprint 07 - Frontend PRO ligero

## Preconditions

- Sprint 06 Hogar usable.
- Docker stack up; seeded catalog.
- Branch `sprint/007-frontend-pro-ligero`.

## Validation Path

1. Create user → onboarding **PRO** + dependencia → employer org → `/pro/dashboard`.
2. Second user → PRO freelance → completes without clients.
3. `/pro/entries` → EntryBuilder ingreso → save → burst.
4. Rama con Entidad → JIT organization/person.
5. `/pro/entries/manual` → balanced OK; unbalanced rejected.
6. `/pro/accounts` → codes visible; create under mother; bank manual fails.
7. Visit `/hogar/entries` while PRO → redirect `/pro/entries`.
8. P&G/Balance under `/pro/finances/*` match Hogar content level.

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
