# Needs: Chart of Accounts Engine

**Date**: 2026-08-01  
**Audience**: Product + engineering  
**Context**: No production end users yet; catalog still being corrected. Admin platform (013) already exposes basic `CuentaGlobal` CRUD.

## Problem

The global chart has misplaced accounts and missing concepts. Operators need **fluid structural editing** (move under another parent, renumber, create families) without breaking the dual identity model:

- **Stable identity**: `CuentaGlobal.id` (UUID) — journal lines and activations reference this.
- **Semantic address**: `codigo` `[A][BBB][C][DDD]` — plantillas (`groupCode`), reports, PRO UX, analysis codes.

Today’s admin CRUD can change `parentId` without recalculating `codigo`, and cannot change `codigo` on edit. That is unsafe and incomplete.

## Needs (now — Phase 1)

| ID | Need | Priority |
|----|------|----------|
| N1 | Tree browser + structural edit in admin-ui (desktop-first, mobile-usable) | P1 |
| N2 | **Reparent** with automatic **cascade recode** (account + descendants); id unchanged | P1 |
| N3 | Hard reject **cross-class** moves (e.g. pasivo → activo; first digit `[A]` immutable for an existing node unless explicit deprecate+create) | P1 |
| N4 | **Dry-run / impact preview** before apply (children codes, plantilla `groupCode` hits, user account codes) | P1 |
| N5 | Backend **command API** (not generic PATCH-as-source-of-truth); same commands usable by UI, CLI, batch | P1 |
| N6 | Append-only mutation log / audit of every structural op | P1 |
| N7 | Keep seed JSON / foundation CSV in sync path documented (operator edits must be exportable or reverse-synced later) | P2 |

## Needs (later — Phase 2, design for now)

| ID | Need | Priority |
|----|------|----------|
| N8 | **Chart releases** (`draft` → `published`) built from the same op language | P2 |
| N9 | **Partial migration**: apply a subset of ops, or migrate books independently | P2 |
| N10 | Maintenance / batch apply under deploy freeze | P2 |
| N11 | Optional `codigo` aliases for transition lookups | P3 |

## Needs (related, out of engine core — track separately)

| ID | Need | Notes |
|----|------|-------|
| N12 | Contra-income / payroll netting (sueldo − SS − multas → neto) | Report semantics + catalog flags; motor P&G / PRO. May add optional account metadata in Phase 1 UI as inert config. |
| N13 | Migrate plantillas from `groupCode` string → stable group id | Reduces fragility of recode; follow-up. |

## Non-goals (Phase 1)

- Rewriting historical `LineaAsiento` FKs when codes change.
- Multi-country charts.
- Customer-facing chart editor.
- Full Speckit task generation until this draft is approved.

## Success signals

- Operator can reorganize a whole income/expense family in one dry-run + apply without manual code editing.
- No posted line loses its account id after reparent/recode.
- Plantilla breakage is visible in preview before apply.
- Phase 2 can store Phase 1 ops as a release diff without redesigning the domain.
