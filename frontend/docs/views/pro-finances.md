# View: `/pro/finances`

| Field | Value |
|-------|-------|
| Route | `/pro/finances` |
| Mode | `pro` |
| Page module | `frontend/src/pages/pro/ProFinances.tsx` → `Finances namespace="pro"` |
| Shell | `AppShell mode="pro"` |
| Audit status | audited |
| Last audit | 2026-07-27 |

## Purpose

Hub Estado PRO (mismas tres puertas que Hogar).

## Primary use case

1. Elegir P&G, Balance o Revisar apuntes en modo PRO.

## Composition (must use)

| Role | Component / story | Class |
|------|-------------------|-------|
| Same as Hogar hub | [`hogar-finances.md`](./hogar-finances.md) | — |

## Density

- Hub cards at `max-w-lg` — acceptable (chooser, not report workstation).
- Downstream: P&G aligned; **apuntes** still density debt.

## Gaps / exceptions

None on the hub itself.

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-27 | audited | Shared hub OK; debt lives in apuntes child. |
