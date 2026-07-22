# Storybook information architecture

**Última actualización:** 2026-07-22  
**Policy:** [ADR 0007](../../docs/adr/0007-ui-catalog-governance.md)

Two layers in the sidebar:

| Layer | Folders | Purpose |
|-------|---------|---------|
| **Catalog** | `Foundations`, `Primitives`, `Patterns`, `Charts` | Reusable pieces (`canonical`) |
| **Views** | `Hogar/*`, `PRO/*`, `Marketing/*` | Compositions for real routes |
| **Experimental** | `Experimental/*` | Post-MVP / `reference` only |

## Sidebar map

```text
Foundations/Branding
Primitives/Inputs
Patterns/Shells | DashboardWidgets | AccountBanking | RecentEntries
Charts/Donut              ← canonical BreakdownDonut
Charts/Reference          ← Stitch mocks (do not wire)
Hogar/ShellAndPanels | QuickAdd | FinancesPyg
PRO/EntryBuilder | ManualEntry | AccountsTreePro | FinancesPyg | Analysis
Marketing/Landing
Experimental/Pacho
```

## Story class

- **canonical** — use or elevate product toward this.
- **reference** — mock only (`Charts/Reference`, legacy ApunteForm demo, Pacho).

## View compositions

- `Hogar/FinancesPyg` and `PRO/FinancesPyg`: **two** donuts — Top egresos + Top ingresos — stacked in a **column** (not a generic Ingresos/Gastos toggle).

## Related

- Inventory: [`component-inventory.md`](./component-inventory.md)
- Views: [`views/index.md`](./views/index.md)
- Exceptions: [`ui-exceptions.md`](./ui-exceptions.md)
