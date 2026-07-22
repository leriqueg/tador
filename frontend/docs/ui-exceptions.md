# UI exceptions (frontend ≠ Storybook)

**Policy:** [ADR 0006](../../docs/adr/0006-ui-catalog-governance.md).  
**Do not** file a new ADR for each exception — add a row here.

| Date | View / surface | Component in product | Canonical / reference story | Why allowed | Exit criteria |
|------|----------------|----------------------|-----------------------------|-------------|---------------|
| 2026-07-22 | `/hogar/finances/pyg`, `/pro/finances/pyg` | `SimplePieChart` | DataViz/Advanced → `PeriodBreakdownDonut` (**reference**) | MVP shipped a data-driven pie before elevating the donut look | Elevate brand donut (or restyle pie) to **canonical** + wire P&G; remove or retarget reference story |
| 2026-07-22 | `/pro/finances/apuntes` | `FinancesApuntes` + `RecentEntriesList` | Shared/Entries | Shared Hogar-width layout via `namespace` | PRO desktop dense historial; mark inventory debt cleared |

## Rules of thumb

- Empty table is the goal for intentional forks; density debt may remain listed until polished.
- When exit criteria are met, **delete the row** (or move to a short “Resolved” note at the bottom).
- Promote-to-Storybook work closes exceptions that existed because no canonical story existed.
