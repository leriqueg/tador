---
name: ui-storybook-sync
description: "Trigger: Storybook sync, UI audit, polish Storybook to front, view docs, ui-exceptions, promote component, Hogar PRO density. Govern Storybook↔frontend alignment."
license: Apache-2.0
metadata:
  author: leriqueg
  version: "2.0"
---

## Activation Contract

Use for UI audits, Storybook↔frontend alignment, view-doc updates, exceptions, or polish that moves **canonical Storybook → product**.

## Hard Rules

- Policy: `docs/adr/0006-ui-catalog-governance.md` + `.cursor/rules/ui-catalog-governance.mdc` + density rule.
- **Polish / apply direction:** Storybook **canonical** → frontend. Do not wire **reference** stories as-is; elevate look into a data-driven canonical component.
- **Sync direction** (drift catch): frontend → Storybook when product changed first; record debt/exceptions.
- Prefer reuse of canonical components. Page-only composition OK in `pages/`. New reusable UI ships with a story in the same work unit.
- **Promote at 3 uses** (or Hogar+PRO): extract to `components/` + Storybook + inventory.
- Exceptions only via `frontend/docs/ui-exceptions.md` (not per-exception ADRs).
- Density: `.cursor/rules/hogar-pro-ui-density.mdc`.

## Decision Gates

| Situation | Action |
|-----------|--------|
| Canonical story exists, product differs strongly | Align product **or** add `ui-exceptions` row with exit criteria |
| Only reference story exists (mock) | Elevate to canonical + wire; keep/retire reference |
| Pattern used 3+ times, no story | Promote to Storybook + inventory |
| PRO desktop = Hogar width on lists/reports | Mark `debt:pro-desktop-density` in view + inventory |
| User asks audit | Walk `frontend/docs/views/index.md` view-by-view |

## Execution Steps

### Mode A — Audit (default when user says auditoría / review UI)

1. Read `references/docs.md`, ADR 0006, density + catalog rules.
2. Pick views from `frontend/docs/views/index.md` (or the route the user named).
3. For each view: read page module, list components used, map to stories + class (`canonical`/`reference`/`page-only`).
4. Check states (loading/empty/error/populated) and density.
5. Update the view doc (composition, gaps, audit log, status).
6. Update `ui-exceptions.md` / inventory if needed.
7. Output a priority table: reuse | elevate | promote | exception | density debt.

### Mode B — Apply polish (Storybook → front)

1. Require a target view or component from an audit gap.
2. Implement using canonical story look; wire real data/props.
3. Update stories if API shape forced a better canonical API.
4. Clear or update exception rows; refresh view doc + inventory.
5. `cd frontend && npm run build-storybook` when stories change.

### Mode C — Sync drift (front → Storybook)

1. Diff components vs stories vs inventory.
2. Add/update stories; classify `canonical` vs `reference`.
3. Record remaining debt; do not pretend alignment.

## Output Contract

Return:
- Mode used (A/B/C).
- Views/components touched.
- Gaps: elevate / promote / exception / density.
- Whether Storybook build ran and result.

## References

- `references/docs.md`
