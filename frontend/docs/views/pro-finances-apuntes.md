# View: `/pro/finances/apuntes`

| Field | Value |
|-------|-------|
| Route | `/pro/finances/apuntes` |
| Mode | `pro` |
| Page module | `frontend/src/pages/pro/ProFinancesApuntes.tsx` → `FinancesApuntes namespace="pro"` |
| Shell | `AppShell mode="pro"` |
| Audit status | debt |
| Last audit | 2026-07-27 |

## Purpose

Historial operativo PRO: filtrar y corregir apuntes con más contexto en desktop.

## Primary use case

1. Filtrar por descripción, fechas, monto y cuenta (misma API que Hogar).
2. En desktop, revisar muchos resultados con más columnas / densidad.
3. Editar apuntes con plantilla.

## APIs / data

| Need | Source |
|------|--------|
| Lista filtrable | `GET /api/apuntes?…` |
| Cuentas (filtro) | `GET /api/accounts` |
| Editar | `paths.editApunte(id)` |

## Composition (must use)

| Role | Component / story | Class |
|------|-------------------|-------|
| Shell | `AppShell mode="pro"` | canonical |
| Filters + list today | Shared `FinancesApuntes` @ `max-w-lg` | **debt** vs density rule |
| Results | `RecentEntriesList` · Patterns/RecentEntries | canonical list · **not** dense desktop |
| Story target | Patterns/RecentEntries → “PRO desktop placeholder” | documents intent only |

## Density

- Mobile: same as Hogar — usable for quick checks (**OK**).
- Desktop: **`max-w-lg` + card rows = clone Hogar** — violates density rule (`debt:pro-desktop-density`).
- Target desktop: wider canvas (`max-w-5xl`+), filters visible in a denser bar, table-like rows (fecha, concepto, monto, cuenta/template, acciones).

## States to cover

- [x] Loading
- [x] Empty
- [x] Error
- [x] Populated (Hogar-shaped)

## Gaps / exceptions

| Priority | Type | Finding | Action |
|----------|------|---------|--------|
| **P0** | density | `ProFinancesApuntes` reuses Hogar layout verbatim | Split PRO composition: wider layout + dense list/table on `md+`; keep mobile usable |
| **P0** | elevate | `RecentEntriesList` is single-column card; Storybook only has placeholder width | Add canonical dense variant or `ApuntesHistoryTable` + stories under `PRO/FinancesApuntes` |
| P1 | promote | Filter block duplicated conceptually for both modes | Extract shared filters; PRO may show more fields later |
| P2 | data | List shows concept/date/amount only; PRO desktop could show account/template | Extend row/table when elevating |

Logged in [`../ui-exceptions.md`](../ui-exceptions.md).

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-27 | debt | Confirmed exception: shared `FinancesApuntes` + `max-w-lg`. Next polish: Storybook view → product. |
