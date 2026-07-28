# Hogar / PRO UI density

**Policy parent:** [ADR 0007](../../docs/adr/0007-ui-catalog-governance.md)  
**Mode intent:** [`specs/foundation/modos-hogar-pro.md`](../../specs/foundation/modos-hogar-pro.md)

Product presentation rules for density and viewport. This is **governance documentation**, not a Cursor agent rule file. Agents discover it via ADR 0007, `ui-catalog-governance`, view docs, and `AGENTS.md`.

## Modes (reminder)

- **Hogar** (`/hogar/*`): clarity over detail. QuickAdd. Simple reading.
- **PRO** (`/pro/*`): control over simplicity. EntryBuilder + manual escape. More options visible.
- Same domain APIs; difference is **presentation, routes, and density**.

## Density by surface (viewport)

| Surface | Hogar | PRO mobile | PRO desktop |
|---------|-------|------------|-------------|
| Captura (entries) | Compact QuickAdd | EntryBuilder usable for quick/concrete captures | EntryBuilder + room for path/context |
| Historial apuntes | Narrow, filterable list | Same usability as Hogar (quick check) | **Must use width**: more columns, filters visible, denser rows — do not clone Hogar `max-w-lg` |
| Reportes / analysis / charts | Simple panels; readable charts | Usable, not optimal | Primary consumption — denser tables/charts |
| Cuentas | Grouped balances, no codes | — | Tree + codes (`AccountsTreePro`) |

If PRO and Hogar share a page component only via `namespace`, treat identical desktop density as **debt** (see [`ui-exceptions.md`](./ui-exceptions.md)), not as the target.

## Charts (P&G period flow)

| Mode | Component | Behavior |
|------|-----------|----------|
| Hogar | `HogarIncomeExpenseBars` | Adjacent income (green) / expense (rose) bars; no Y tick labels (tooltip for values); enter animation. **No** cumulative net line. |
| PRO | `ProIncomeExpenseBars` | Same visual as Hogar until accounting defines “neto arrastrado” for the line series. Separate module so PRO can grow without forking Hogar. |

Decisions and TODOs for these charts live in the view docs (`views/hogar-finances-pyg.md`, `views/pro-finances-pyg.md`) and the inventory — not in SpecKit unless the API contract changes.
