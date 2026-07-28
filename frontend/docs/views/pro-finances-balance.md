# View: `/pro/finances/balance`

| Field | Value |
|-------|-------|
| Route | `/pro/finances/balance` |
| Mode | `pro` |
| Page module | `frontend/src/pages/pro/ProFinancesBalance.tsx` → `FinancesBalance namespace="pro"` |
| Shell | `AppShell mode="pro"` |
| Audit status | audited |
| Last audit | 2026-07-27 |

## Purpose

Balance / posición en PRO (misma página que Hogar hoy).

## Composition (must use)

| Role | Component / story | Class |
|------|-------------------|-------|
| Same as Hogar | [`hogar-finances-balance.md`](./hogar-finances-balance.md) | — |

## Density

- Shared `max-w-2xl` — acceptable for MVP (panel, not historial table).
- Not flagged as hard debt (unlike apuntes); optional widen later if PRO needs more breakdown columns.

## Gaps / exceptions

| Priority | Type | Finding | Action |
|----------|------|---------|--------|
| P2 | density | Identical Hogar width | Optional PRO desktop widen; not blocking |

## Audit log

| Date | Result | Notes |
|------|--------|-------|
| 2026-07-27 | audited | No exception row; soft optional density only. |
