# Tasks: Sprint 05 — Dashboard PYG y Posición (follow-up)

La implementación principal del Sprint 05 ya está en el backend. Este archivo registra **deuda de contrato** detectada al planificar Sprint 06.

## Follow-up (deuda para Sprint 06)

### Query param PYG: `year` vs `año`

- Spec / FR-API-001: `GET /api/reports/pyg?year={year}`
- Runtime actual: `backend/src/api/routes/reports.ts` lee `query.año` (también en balance sheet)

- [ ] F1 Actualizar `backend/src/api/routes/reports.ts` para leer `year` como query canónico en `/api/reports/pyg` y `/api/reports/balance`
- [ ] F2 Aceptar `año` solo como alias deprecado (si viene `year`, gana `year`; si solo `año`, usarlo)
- [ ] F3 Actualizar tests de integración / contrato que envíen `año` para usar `year` (mantener un caso de alias si se conserva compat)
- [ ] F4 Verificar que el cliente frontend Sprint 06 llame con `?year=`
