# Tasks: Dashboard PYG y Posición

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~750–850 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (PYG) → PR 2 (Position) |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + PYG endpoint | PR 1 → main | Service interface, DTOs, `decimal.js`, PYG raw SQL, route update, PYG tests |
| 2 | Position endpoint | PR 2 → main | `getPositionReport()`, account classification, position route, position tests |

## Phase 1: Foundation

- [x] 1.1 Add `decimal.js` to `backend/package.json` dependencies and install
- [x] 1.2 Create `backend/src/application/dashboard-report-service.ts` with DTOs (`PyGReportDTO`, `PositionReportDTO`, nested types) and `DashboardReportService` interface with `getPyGReport()` + `getPositionReport()`

## Phase 2: Core — PYG Implementation

- [x] 2.1 Implement `getPyGReport()`: raw SQL joining `lineas_asiento` → `asientos` → `cuentas_usuario` → `cuentas_globales`, filter by bookId + year, exclude voided + bridge + balance accounts
- [x] 2.2 Add 12-month series via `generate_series(1,12)` LEFT JOIN with `Decimal.js` aggregation for income/expense/balance per month (zero-fill)
- [x] 2.3 Add Top 10 income + Top 10 expense via `ROW_NUMBER() OVER (ORDER BY SUM(credito-debito) DESC)` with `LIMIT 10`, tie-break alphabetical
- [x] 2.4 Compute totals with `Decimal.js` and convert to `number` at API boundary

## Phase 3: Core — Position Implementation

- [x] 3.1 Implement `getPositionReport()`: raw SQL aggregating `lineas_asiento` balances per `CuentaUsuario`, exclude voided + bridge/income/expense accounts
- [x] 3.2 Implement classification: `tipoCuenta=bank|wallet` → Available; `card` + `codigo 1xxx` → Available, `card` + `2xxx` → Payable; `entidadId` + `1xxx` codigo → Receivable; `2xxx` → Payable
- [x] 3.3 Return aggregated totals (`totalAvailable`, `totalReceivables`, `totalPayables`, `netPosition`) + individual per-account breakdown in each category

## Phase 4: API Wiring

- [x] 4.1 Modify `backend/src/api/routes/reports.ts`: update `GET /api/reports/pyg` to call `DashboardReportService.getPyGReport()` with new contract response; add `GET /api/reports/position` handler calling `DashboardReportService.getPositionReport()`
- [x] 4.2 Modify `backend/src/server.ts`: import, create, and wire `DashboardReportService` → pass to `registerReportRoutes()`

## Phase 5: Testing

- [x] 5.1 Integration test PYG: annual totals match created income/expense entries, 12-month series includes zero months, Top 10 ordered by accumulated descending
- [x] 5.2 Integration test Position: bank/wallet → Available, cards with 1xxx/2xxx → correct bucket, entidad+asset → Receivable, liability → Payable, breakdown per account matches balances
- [x] 5.3 Edge cases: empty year returns zeros, bridge accounts excluded from PYG, income/expense accounts excluded from Position, tenant isolation (user A data not visible to user B)
