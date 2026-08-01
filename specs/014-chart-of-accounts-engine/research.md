# Research: Chart of Accounts Engine (014)

**Date**: 2026-08-01  
**Status**: Phase 0 complete (clarifications locked)

## Current binding model

| Consumer | Binds by | Implication of recode |
|----------|----------|------------------------|
| `LineaAsiento` | `cuentaGlobalId` / `cuentaId` | Stable — no FK rewrite |
| Plantillas | `groupCode` / `groupCodes` | Breaks until updated; dry-run lists hits |
| P&G / Balance | First digit of `codigo` | Safe if `[A]` immutable |
| Hardcoded analysis | Literal codes | Alias/update later |
| `CuentaUsuario.codigo` | From parent global | Cascade optional on apply |

## Decisions (locked)

| Topic | Choice | Rationale |
|-------|--------|-----------|
| Identity | UUID stable; codigo mutable | History intact |
| Phase 1 apply | In-place single chart | No prod users |
| API | Commands + `dryRun` | UI/CLI/future releases |
| Cross-class | Reject | Accounting integrity |
| User codigo cascade | Dry-run always; apply `cascadeUserCodigos` default **true** | Pre-prod fluidity |
| Deprecate | Soft `deprecatedAt` | Keep hard delete with deps |
| `reportRole` | `normal`\|`contra` inert | Future PRO; capture intent now |
| Phase 2 releases | Documented only; global cutover + op subset later | Avoid multi-plan cost |
| Plantillas | Impact advisory | No git rewrite from admin |

## Recode algorithm (research)

Global postable under parent group `P` with codigo `A BBB 0 000`:

- Child globals: `A BBB 0 DDD` with DDD from free 001–999 (skip used).
- Group nodes (`…000`) keep sequence 000 when they are the group itself; when moving a **group** under a new parent, regenerate `[BBB]` from parent’s class family rules:

**MVP rule (014)**:

1. New parent must be non-postable group.
2. Moved node’s `[A]` must equal new parent’s `[A]`.
3. If moved node is a **group** (`…000`): assign next free group code under same class — **simplification for 014**: groups keep their `[BBB]` if still unique under class; only leaf `[DDD]` reassigned when parent group’s `[BBB]` differs.

Practical MVP cascade:

- Determine target parent group codigo `Tp = A BBB 0 000`.
- For each node in subtree (pre-order):
  - If node is the root being moved and is postable: `newCodigo = Tp[0..4] + '0' + nextFreeDDD(Tp)`.
  - If node is group being moved: require new parent is class root or higher group; set codigo to next free `A xxx 0 000` under class — **014 simplification**: moving groups only allowed when new parent shares same `[A]` and is an ancestor-eligible group; regenerate all descendant leaf codes under the moved group’s **existing** `[BBB]` if parent change doesn’t change BBB; if BBB must change (parent has different BBB), rewrite moved group to parent’s BBB only when moved node is **postable leaf**; **group reparent** assigns new BBB = next free group under class digit, then rewrite all descendants’ BBB segment.

Documented algorithm in domain `cascade-recode.ts` with unit tests as source of truth.

## Alternatives rejected

1. Code-only identity — rejected (UUID lines already).
2. Full versioning Phase 1 — rejected.
3. Cascade logic in admin-ui — rejected.
4. Silent parent change without recode — rejected.

## Open → closed

All prior open questions closed in spec Clarifications session 2026-08-01.
