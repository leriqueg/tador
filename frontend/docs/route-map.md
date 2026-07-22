# Route map — Hogar vs PRO namespaces

Canonical UI paths after Sprint 007. Source of truth for guards: `src/lib/namespace-guard.ts`, `src/lib/namespace-paths.ts`. Mode from `BookConfig.mode`.

## Namespaces

| Mode | Prefix | Shell |
|------|--------|-------|
| Hogar | `/hogar/*` | `AppShell mode="hogar"` |
| PRO | `/pro/*` | `AppShell mode="pro"` (+ `data-mode="pro"` theme) |

Legacy unprefixed routes (`/dashboard`, `/entries`, …) redirect to the active mode namespace.

## Parallel routes

| Capability | Hogar | PRO |
|------------|-------|-----|
| Hub | `/hogar/dashboard` | `/pro/dashboard` |
| Captura | `/hogar/entries` (QuickAdd) | `/pro/entries` (EntryBuilder) |
| Asiento manual | — | `/pro/entries/manual` |
| Finanzas landing | `/hogar/finances` | `/pro/finances` |
| P&G | `/hogar/finances/pyg` | `/pro/finances/pyg` |
| Balance / posición | `/hogar/finances/balance` | `/pro/finances/balance` |
| Historial apuntes | `/hogar/finances/apuntes` | `/pro/finances/apuntes` |
| Cuentas | `/hogar/accounts` | `/pro/accounts` (códigos + árbol) |
| Entidades | `/hogar/entities` | `/pro/entities` |
| Ajustes | `/hogar/settings` | `/pro/settings` |

Shared pre-mode: `/onboarding`, `/login`, `/register`, landing.

## View docs (UI contracts)

Per-route purpose, composition, and audit status: [`views/index.md`](./views/index.md).  
Exceptions (product ≠ Storybook): [`ui-exceptions.md`](./ui-exceptions.md).  
Policy: [`docs/adr/0006-ui-catalog-governance.md`](../../docs/adr/0006-ui-catalog-governance.md).

## Specs

- Inventory Hogar: `specs/006-frontend-hogar/inventory-vistas-endpoints.md`
- Inventory PRO: `specs/007-frontend-pro-ligero/inventory-vistas-endpoints.md`
- Modos / QuickAdd vs EntryBuilder: `specs/foundation/modos-hogar-pro.md`
