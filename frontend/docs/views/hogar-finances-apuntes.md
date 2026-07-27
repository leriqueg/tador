# View: `/hogar/finances/apuntes`

| Field | Value |
|-------|-------|
| Route | `/hogar/finances/apuntes` |
| Mode | `hogar` |
| Page module | `frontend/src/pages/FinancesApuntes.tsx` (`namespace="hogar"`) |
| Shell | `AppShell mode="hogar"` |
| Audit status | audited |
| Last audit | 2026-07-27 |

## Purpose

Buscar, filtrar y corregir apuntes del historial (lenguaje claro, ancho móvil).

## Primary use case

1. Filtrar por descripción, fechas, monto y cuenta.
2. Ver resultados y abrir edición de un apunte con plantilla.
3. Volver al hub Estado.

## APIs / data

| Need | Source |
|------|--------|
| Lista filtrable | `GET /api/apuntes?…` |
| Cuentas (filtro) | `GET /api/accounts` |
| Editar | navigate → `paths.editApunte(id)` |

## Composition (must use)

| Role | Component / story | Class |
|------|-------------------|-------|
| Shell | `AppShell` · Patterns/Shells | canonical |
| Filters | `TextInput`, `Button` · Primitives/Inputs | canonical |
| Errors | `ValidationMessage` | canonical |
| Results | `RecentEntriesList` · Patterns/RecentEntries | canonical |
| Filter panel | Inline page composition | page-only |

## Density

- Mobile: `max-w-lg` — **correct** for Hogar (clarity).
- Desktop: same narrow width — OK for Hogar (not a workstation).
- PRO-specific: N/A — see [`pro-finances-apuntes.md`](./pro-finances-apuntes.md).

## States to cover

- [x] Loading (“Buscando…” / gate loading)
- [x] Empty (`RecentEntriesList` emptyMessage)
- [x] Error (`ValidationMessage`)
- [x] Populated

## Gaps / exceptions

| Priority | Type | Finding | Action |
|----------|------|---------|--------|
| P2 | promote? | Filter panel is page-only; also used by PRO via same page | Watch 3-use / extract `ApuntesFilterPanel` if PRO density fork needs shared filters |
| P2 | story | No view story `Hogar/FinancesApuntes` (only list pattern) | Optional: add view composition story when polishing PRO |
| — | — | No strong Storybook↔product fork for Hogar | — |

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-27 | audited | Hogar density OK. Shared page with PRO drives PRO debt. |
