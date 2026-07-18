# Inventory: Sprint 09 vistas ↔ endpoints

| Ruta | Propósito | APIs |
|------|-----------|------|
| `/pro/analysis/banks` | Saldos + costos + ganancias | balances monthly; cost aggregate; apuntes |
| `/pro/analysis/cards` | Movimientos + intereses/multas | apuntes; cost aggregate |
| `/pro/analysis/portfolio` | CxC vs CxP por entidad | position/portfolio |
| `/pro/finances/pyg` | + filtros PRO | reports/pyg?accountId&entityId |

## Plantillas nuevas

| code | Debe | Haber |
|------|------|-------|
| `comision_bancaria` | 62010001 | 11120000 |
| `interes_tarjeta` | 62010002 | 21200000 |
| `multa_financiera` | 62010003 | 11120000 / 21200000 |
| `ganancia_inversion` | 11120000 o 112x | 41120002 |

## Gaps

- [ ] Auto-entityId in apuntes route
- [ ] P&G filter params
- [ ] Portfolio-by-entity response
- [ ] Analysis pages + nav
- [ ] EntryBuilder branches / QuickAdd discovery for new plantillas
