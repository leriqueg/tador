# Quickstart: 012 — EntryBuilder decision graph

## Preconditions

- Stack up; catalog seeded.
- PRO book with starter accounts (onboarding or e2e helper).

## Manual path (sueldo)

1. `/pro/entries` → **Ingreso** → **Cobré un sueldo**.
2. Employer org (JIT or `/pro/entities` with `is_employment_dependency`).
3. Liquidity + income category under 4101 → concepto → monto → **Guardar**.
4. Expect apunte with `templateCode: registrar_sueldo`.

## Manual path (otro ingreso)

1. **Ingreso** → **Otro ingreso** → Billetera → Otros ingresos → concepto → monto → **Guardar**.
2. Free-form lines (no templateCode).

## Tests

```bash
# Walker + account filter units
cd frontend && npm run test -- --run src/components/entry-builder/

# EntryBuilder + quickstart integration
cd frontend && npm run test -- --run \
  src/components/entry-builder/EntryBuilder.integration.test.tsx \
  src/pages/pro/quickstart-smoke.integration.test.tsx

# DB: salary leaf + capability
cd backend && npm run test -- tests/entry-builder-graph.test.ts

# E2E (stack + auth setup)
cd frontend && npm run test:e2e -- e2e/pro-quickstart.spec.ts
```
