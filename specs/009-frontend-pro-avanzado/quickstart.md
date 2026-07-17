# Quickstart: Sprint 09

1. Re-seed catalogos (nombres Servicios financieros / Ganancias por invertir).
2. PRO user: create bank entity → register `comision_bancaria` → open `/pro/analysis/banks` → see commission under that bank; gains separate if any.
3. Transfer between banks → entityId not auto-forced by FR-009.
4. Card: list month via apuntes filter.
5. P&G PRO: filter by entityId changes totals.

```bash
npm --prefix backend run seed:catalogos   # with DB up
cd frontend && npm run test -- --run
```
