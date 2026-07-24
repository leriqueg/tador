# UI exceptions (frontend ≠ Storybook)

**Policy:** [ADR 0006](../../docs/adr/0006-ui-catalog-governance.md).  
**Do not** file a new ADR for each exception — add a row here.

| Date | View / surface | Component in product | Canonical / reference story | Why allowed | Exit criteria |
|------|----------------|----------------------|-----------------------------|-------------|---------------|
| 2026-07-22 | `/hogar/finances/pyg`, `/pro/finances/pyg` | `SimplePieChart` | **Canonical:** Charts/Donut + Hogar\|PRO/FinancesPyg (column). **Reference:** Charts/Reference → PeriodBreakdownDonut | Product still on old pie; Storybook composition ready | Replace pies with `BreakdownDonut` ×2 in column; remove exception |
| 2026-07-22 | `/pro/finances/apuntes` | `FinancesApuntes` + `RecentEntriesList` | Patterns/RecentEntries | Shared Hogar-width layout via `namespace` | PRO desktop dense historial |

## Rules of thumb

- Empty table is the goal for intentional forks; density debt may remain listed until polished.
- When exit criteria are met, **delete the row** (or move to a short “Resolved” note at the bottom).
- Promote-to-Storybook work closes exceptions that existed because no canonical story existed.
