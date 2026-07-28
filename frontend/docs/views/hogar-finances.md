# View: `/hogar/finances`

| Field | Value |
|-------|-------|
| Route | `/hogar/finances` |
| Mode | `hogar` |
| Page module | `frontend/src/pages/Finances.tsx` |
| Shell | `AppShell mode="hogar"` |
| Audit status | audited |
| Last audit | 2026-07-27 |

## Purpose

Hub “Estado”: elegir P&G, Balance o historial de apuntes.

## Primary use case

1. Entender las tres revisiones posibles.
2. Navegar a la superficie elegida.

## APIs / data

| Need | Source |
|------|--------|
| None | Navigation only |

## Composition (must use)

| Role | Component / story | Class |
|------|-------------------|-------|
| Shell | `AppShell` | canonical |
| Cards | Inline `Link` + `Icon` | page-only |
| Primitives | `Icon` | canonical |

## Density

- Mobile/Desktop: `max-w-lg` card stack — OK for Hogar hub.

## States to cover

- [x] Loading (auth/gate)
- [ ] Empty — N/A
- [ ] Error — N/A
- [x] Populated

## Gaps / exceptions

| Priority | Type | Finding | Action |
|----------|------|---------|--------|
| P3 | story | No `Hogar/Finances` view story | Optional; low value (nav hub) |

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-27 | audited | Aligned enough; no catalog fork. |
