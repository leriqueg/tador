# TADOR Frontend

**Fecha de corte:** 2026-07-18

**Última actualización:** 2026-07-22

React + Vite + Tailwind v4 client for the Hogar experience (Sprint 06).

## Design system

The UI follows the TADOR Finanzas design system:

| Resource | Path |
|----------|------|
| **Canonical spec** (colors, typography, spacing, guidelines) | [`specs/foundation/mockup/stitch/DESIGN.md`](../specs/foundation/mockup/stitch/DESIGN.md) |
| **TypeScript tokens** | [`src/design/tokens.ts`](src/design/tokens.ts) |
| **CSS theme** (Tailwind `@theme`) | [`src/globals.css`](src/globals.css) |
| **Component library (SoT)** | Storybook (`npm run storybook`) — prefer **canonical** stories |
| **View docs** (per-route UI contract) | [`docs/views/index.md`](docs/views/index.md) |
| **UI exceptions** | [`docs/ui-exceptions.md`](docs/ui-exceptions.md) |
| **Component inventory** (thin index → stories) | [`docs/component-inventory.md`](docs/component-inventory.md) |
| **Hogar/PRO density rules** | [`../specs/foundation/modos-hogar-pro.md`](../specs/foundation/modos-hogar-pro.md), `.cursor/rules/hogar-pro-ui-density.mdc` |
| **Governance** | ADR 0006 · agents in [`../AGENTS.md`](../AGENTS.md) |
| **Sprint 06 route ↔ API map** | [`specs/006-frontend-hogar/inventory-vistas-endpoints.md`](../specs/006-frontend-hogar/inventory-vistas-endpoints.md) |

### Typography

- **Manrope** — headings (`font-headline`, `text-headline-*`, `text-display-lg`, `text-title-md`)
- **Work Sans** — body and labels (`font-body`, `text-body-*`, `text-label-*`, `text-caption`)

### Key principles (from DESIGN.md)

- Teal primary (`#006565` / container `#008080`) with warm Sandy Brown and Coral accents
- 8px spacing grid, generous padding, ambient shadows (no pure black)
- Rounded corners (0.5rem base); Spanish neutral voice (tuteo, no voseo)

Stitch mockup pages may add typography extensions (`headline-xl`, `headline-md`) documented in `tokens.ts`.

## Scripts

```bash
npm run dev              # Vite dev server (port 5173)
npm run build            # Production build
npm run storybook        # Component library (port 6006)
npm run build-storybook  # Static Storybook export
npm run lint             # Oxlint
```

## Pages (phase 1)

- `/` — Landing
- `/login` — Login
- `/register` — Register
- `/faq` — FAQ

API proxy: `/auth`, `/book`, `/api`, `/health` → backend (`VITE_PROXY_TARGET`, default `http://localhost:3000`). Document navigations (`Accept: text/html`) stay on the SPA.
