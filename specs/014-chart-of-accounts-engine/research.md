# Research: Chart of Accounts Engine (014)

**Date**: 2026-08-01

## Current binding model

| Consumer | Binds by | Implication of recode |
|----------|----------|------------------------|
| `LineaAsiento` | `cuentaGlobalId` / `cuentaId` | Stable — no FK rewrite needed |
| Plantillas | `groupCode` / `groupCodes` (string) | Breaks until updated or aliased |
| P&G / Balance | First digit of `codigo` at read time | Safe if class `[A]` immutable |
| Hardcoded analysis | Literal codes (`62010001`, …) | Need alias or update |
| `CuentaUsuario.codigo` | Assigned from parent global at create | May drift after parent recode |

## Decision summary

See [ADR 0008](../../docs/adr/0008-chart-of-accounts-engine.md).

| Topic | Choice | Why |
|-------|--------|-----|
| Identity | UUID stable; codigo mutable | History intact; address can move |
| Phase 1 apply | In-place on single chart | No prod users yet |
| API shape | Commands + dryRun | Same path for UI/CLI/releases |
| Versioning | Phase 2, same op schema | Avoid multi-plan complexity now |
| Cross-class | Reject | Accounting integrity |
| Plantillas | Impact preview Phase 1; id-binding later | Lowest risk |

## Alternatives rejected (short)

1. **Code-only identity (no UUID FK)** — Rejected; already on UUID lines; would destroy history on renumber.
2. **Full versioning in Phase 1** — Rejected; cost without prod tenants.
3. **UI-only cascade (compute codes in React)** — Rejected; rules must live in domain.
4. **Silent parent change without recode** — Rejected; violates foundation segmentation.

## Open questions (resolve in Speckit clarify)

1. On cascade, should `CuentaUsuario.codigo` be rewritten automatically or only reported?
2. Deprecate vs hard-delete policy when deps exist (013 already blocks delete).
3. Phase 2: book-level release binding vs global cutover only?
4. Should Phase 1 add inert `reportRole: normal | contra` on `CuentaGlobal` for future payroll netting?
