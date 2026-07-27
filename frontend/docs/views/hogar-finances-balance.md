# View: `/hogar/finances/balance`

| Field | Value |
|-------|-------|
| Route | `/hogar/finances/balance` |
| Mode | `hogar` |
| Page module | `frontend/src/pages/FinancesBalance.tsx` |
| Shell | `AppShell mode="hogar"` |
| Audit status | audited |
| Last audit | 2026-07-27 |

## Purpose

Ver disponible, por cobrar y deudas (posición).

## Primary use case

1. Leer posición agregada.
2. Ver desglose / hint de endeudamiento.

## APIs / data

| Need | Source |
|------|--------|
| Posición | `GET /api/reports/position` |

## Composition (must use)

| Role | Component / story | Class |
|------|-------------------|-------|
| Shell | `AppShell` | canonical |
| Position | `PositionPanel` · Hogar/ShellAndPanels | canonical |
| Errors | `ValidationMessage` | canonical |
| Breakdown / hint | Inline on page | page-only |

## Density

- `max-w-2xl` — OK for Hogar.

## States to cover

- [x] Loading
- [ ] Empty (weak if zeros — panel still renders)
- [x] Error
- [x] Populated

## Gaps / exceptions

| Priority | Type | Finding | Action |
|----------|------|---------|--------|
| P2 | story | No dedicated `Hogar/FinancesBalance` view story | Optional composition story |
| P3 | states | Empty/zero messaging could be clearer | Low priority |

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-27 | audited | Uses canonical PositionPanel; no strong visual fork. |
