# ADR 0007: UI catalog governance (Storybook → frontend)

## Status

Accepted.

## Date

2026-07-22

## Context

Stitch mockups and Storybook produced polished UI patterns, but product pages sometimes shipped alternate implementations (e.g. `PeriodBreakdownDonut` in Storybook vs `SimplePieChart` in `/finances/pyg`). SpecKit features are heavy for visual consistency work. We need durable, agent-operable rules without a SpecKit “design system” sprint.

## Decision

1. **Storybook** is the executable source of truth for reusable UI patterns and primitives.
2. **`frontend/docs/views/`** is the source of truth for each route: purpose, use case, components/stories, density, gaps.
3. **`frontend/docs/component-inventory.md`** remains a thin index (path ↔ story ↔ status ↔ story class).
4. **Story classes:**
   - `canonical` — may/must be used in product; data-driven or ready to wire.
   - `reference` — visual/mock only; do not wire as-is; elevate look into a canonical component when adopting.
5. **Reuse over reinvent:** prefer existing canonical components/stories. Page-only composition may live in `pages/` without a story. New reusable patterns ship with a story in the same work unit.
6. **Promote after 3 uses:** if the same UI pattern appears in 3+ distinct pages/components (or in both Hogar and PRO), extract to `components/` + Storybook + inventory.
7. **Exceptions:** record in `frontend/docs/ui-exceptions.md` (not a new ADR per exception). ADRs only for policy changes.
8. **Polish direction:** **Storybook → frontend** (align product to canonical stories). Front → Storybook sync remains for catching drift and documenting debt.
9. **No SpecKit feature** required for catalog/inventory-only governance; use skill/agent `ui-storybook-sync` / `ui-design-governance`.

## Consequences

- Audits are per-view against `views/*.md` + Storybook.
- Density Hogar/PRO rules stay in `.cursor/rules/hogar-pro-ui-density.mdc` and `modos-hogar-pro.md`.
- Agents must refuse strong visual forks without an exception row or a promote/elevate plan.
