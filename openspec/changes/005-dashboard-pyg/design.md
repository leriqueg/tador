# Design: Sprint 05 — Dashboard PYG y Posición

## Technical Approach

Create a **dedicated `DashboardReportService`** in `application/` for the two read-only dashboard queries. Follow the existing pattern where `accounting-service.ts` uses Prisma directly with raw SQL via `$queryRaw` for complex aggregations. Add `decimal.js` for monetary computation. The existing `GET /api/reports/pyg` endpoint is extended to match the new response contract; `GET /api/reports/position` is new.

The service is stateless, receives `bookId` (resolved from authenticated user), and returns API-ready types. Account classification follows the existing first-digit-of-codigo rule (`classifyAccount()`) combined with CuentaUsuario's `tipoCuenta` enum.

## Architecture Decisions

### Decision: New report service vs extending accounting-service.ts

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Add methods to existing 1083-line `accounting-service.ts` | No new files, but SRP violation and harder to test | ❌ |
| New `DashboardReportService` in application layer | 2 new files, clean separation, testable in isolation | ✅ |

**Rationale**: Dashboard queries are read-only aggregations with different concerns than entry/period mutation. Separate service keeps each file focused.

### Decision: Data access for aggregation queries

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Prisma ORM with `.groupBy()` / `.aggregate()` | Type-safe but limited for window functions / LEFT JOIN series | ❌ |
| Raw SQL via `prisma.$queryRaw` | Full SQL power, matches existing `getMonthlyBalances` pattern | ✅ |

**Rationale**: Generating 12-month series with LEFT JOIN and Top 10 with window functions is cleaner in SQL. The existing codebase already uses `$queryRaw` for monthly balances.

### Decision: Decimal handling

| Option | Tradeoff | Decision |
|--------|----------|----------|
| JS `number` (current pattern via `toNumber()`) | Works for MVP but float rounding risks | ❌ |
| `decimal.js` for computation, `number` for API response | Constitution mandate, safe financial math | ✅ |

**Rationale**: Constitution v1.5.0 mandates `decimal.js` for monetary values. Add to `package.json`, use `Decimal` for intermediate aggregation, convert to `number` only at the API boundary.

### Decision: Position account classification

| CuentaUsuario.tipoCuenta | Classification | Rule |
|--------------------------|---------------|------|
| `bank`, `wallet` | Available | Liquid assets — always available |
| `card` | Check CuentaGlobal codigo | 1xxx→Available, 2xxx→Payable |
| `bridge`, `incomeCategory`, `expenseCategory` | Excluded | Never in position totals |
| Any with `entidadId` + asset globals (1xxx) | Receivable | Money owed to user |
| Any with liability globals (2xxx) | Payable | Money user owes |

**Rationale**: Uses both `tipoCuenta` (user intent) and `CuentaGlobal.codigo` (accounting classification) for reliable categorization.

## Data Flow

```
Client ←→ Fastify Route (reports.ts)
              │
              v
         Auth Middleware ──→ request.userId
              │
              v
         getBookId(userId) ──→ Prisma Book lookup
              │
              v
    DashboardReportService
         │            │
    getPyGReport    getPositionReport
         │            │
    prisma.$queryRaw  prisma.$queryRaw
         │            │
    Decimal.js calc   Decimal.js calc
         │            │
    PyGReportDTO     PositionReportDTO
```

### PYG Query Strategy

1. Select `lineas_asiento` joined to `asientos`, `cuentas_usuario`, `cuentas_globales`
2. Filter by bookId, year, non-voided, non-bridge, tipoCuenta IN (incomeCategory, expenseCategory)
3. Aggregate monthly: LEFT JOIN `generate_series(1,12)` for zero months
4. Top 10: `ROW_NUMBER() OVER (ORDER BY SUM(...) DESC)` with LIMIT 10
5. Compute in `Decimal`, export as `number`

### Position Query Strategy

1. Aggregate `lineas_asiento` balance for each CuentaUsuario
2. Filter non-voided, exclude bridge/income/expense tipoCuenta
3. Classify by tipoCuenta + CuentaGlobal codigo prefix
4. Return grouped totals + individual breakdown

## File Changes

| File | Action | Description |
|------|--------|------------|
| `backend/src/application/dashboard-report-service.ts` | Create | Service interface + implementation for PYG and Position queries |
| `backend/src/api/routes/reports.ts` | Modify | Add `GET /api/reports/position` route, update PYG response to new contract |
| `backend/src/server.ts` | Modify | Wire `DashboardReportService` into the server |
| `backend/package.json` | Modify | Add `decimal.js` dependency |
| `backend/tests/dashboard-report.test.ts` | Create | Integration tests for both endpoints |

## Interfaces / Contracts

```typescript
// ---- DTOs (API response shapes) ----

interface PyGMonthlySeriesEntry {
  month: number;     // 1-12
  income: number;    // Decimal as number
  expenses: number;  // Positive value
  balance: number;   // May be negative
}

interface PyGTopEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  accumulated: number;
}

interface PyGReportDTO {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  monthlySeries: PyGMonthlySeriesEntry[];
  topIncome: PyGTopEntry[];
  topExpenses: PyGTopEntry[];
}

interface PositionBreakdownEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: number;
}

interface PositionReportDTO {
  totalAvailable: number;
  totalReceivables: number;
  totalPayables: number;
  netPosition: number;
  breakdown: {
    available: PositionBreakdownEntry[];
    receivables: PositionBreakdownEntry[];
    payables: PositionBreakdownEntry[];
  };
}

// ---- Service interface ----

interface DashboardReportService {
  getPyGReport(bookId: string, year: number): Promise<PyGReportDTO>;
  getPositionReport(bookId: string): Promise<PositionReportDTO>;
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Integration | PYG totals, monthly series (12 months), Top 10 ordering | `buildApp()` + `app.inject()` — create entries via API, assert response |
| Integration | Position totals (available/receivables/payables) | Create accounts + entries for each category, assert classification |
| Integration | Edge cases: empty year, bridge accounts excluded, zero months | Existing `setupTestAccounts()` pattern with specific scenarios |
| Integration | Tenant isolation | Create two users with data, verify cross-tenant leak returns 404/empty |

Follow existing test patterns in `tests/motor-contable.test.ts`: `createTestApp()`, `registerAndVerify()`, `setupTestAccounts()`, assertions via `app.inject()`.

## Migration / Rollout

No migration required. The new endpoint and the updated PYG endpoint are additive — the old `getPyG()` in `accounting-service.ts` remains for backward compatibility until the frontend switches to the new contract.

## Open Questions

None. Spec, foundation docs, and existing codebase provide sufficient context.
