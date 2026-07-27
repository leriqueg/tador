# UI exceptions (frontend ≠ Storybook)

**Policy:** [ADR 0007](../../docs/adr/0007-ui-catalog-governance.md).  
**Do not** file a new ADR for each exception — add a row here.

| Date | View / surface | Component in product | Canonical / reference story | Why allowed | Exit criteria |
|------|----------------|----------------------|-----------------------------|-------------|---------------|
| 2026-07-22 | `/pro/finances/apuntes` | `FinancesApuntes` (`max-w-lg`) + `RecentEntriesList` | Patterns/RecentEntries (Hogar width); target: PRO/FinancesApuntes dense composition | Shared page via `namespace`; mobile OK, desktop clones Hogar | PRO desktop: wider layout + dense rows/table; view story then wire; clear this row |

## Rules of thumb

- Empty table is the goal for intentional forks; density debt may remain listed until polished.
- When exit criteria are met, **delete the row** (or move to a short “Resolved” note at the bottom).
- Promote-to-Storybook work closes exceptions that existed because no canonical story existed.
