# ADR 0008: Chart of Accounts Engine

## Status

Accepted (Phase 1 implemented 2026-08-01) — draft paired with `specs/014-chart-of-accounts-engine/` (pre-Speckit).

## Date

2026-08-01

## Context

TADOR maintains a shared global chart (`CuentaGlobal`) used by activations, journal lines, plantillas, and reports. Spec 013 added admin CRUD, but structural edits (reparent, renumber) need domain-grade handling:

- Codes follow `[A][BBB][C][DDD]` (`specs/foundation/plan-de-cuentas/reglas-plan-cuentas.md`).
- Journal history references **account id**, not code.
- Plantillas and some analytics reference **code**.
- Production will eventually forbid hot unstructured edits; we will need governed migrations (releases, batch, possibly partial by book).
- Today there are **no production end users**, so fluid in-place correction is acceptable and valuable.

Admin-ui must not own these rules. A backend engine is required.

## Decision

1. **Introduce a Chart of Accounts Engine** in `backend` application + domain (e.g. `application/chart/`, `domain/chart/`), separate from the double-entry accounting engine.

2. **Stable identity = `CuentaGlobal.id`**. `codigo` is a mutable semantic address subject to domain rules. Reparent/recode MUST NOT change id and MUST NOT rewrite `LineaAsiento` FKs.

3. **Command language** as the sole structural mutation API:
   - `create`, `rename`, `reparent`, `recode`, `deprecate` (exact set refined in Speckit).
   - Every command supports **`dryRun`** returning impact (accounts, proposed codes, plantilla hits, user-code impacts).
   - HTTP admin routes and future CLI/jobs are adapters over the same application service.

4. **Hard invariant**: accounting class digit `[A]` cannot change on an existing node via reparent/recode. Cross-class corrections use deprecate + create.

5. **Phase 1**: apply commands **in-place** to the single live chart (pre-prod). Persist applied ops in audit / mutation log with before/after.

6. **Phase 2 (designed for, not built in Phase 1)**: package the same ops into **`ChartRelease`** (`draft` → `published` → `applied`). Support maintenance/batch apply and **partial** application (op subset and/or per-book binding — choose in Speckit; prefer starting with global cutover + op-subset, add `Book.chartReleaseId` only if multi-version coexistence is required).

7. **Admin-ui** (013) evolves to a **client** of the engine (tree + preview + apply). It is not the source of cascade logic.

8. **Out of engine core**: contra-income / payroll netting report semantics (future PRO). Optional inert metadata on accounts may be added so the editor can capture intent early without changing P&G yet.

## Alternatives considered

### A. Keep enriching 013 CRUD only

Rejected. PATCH-centric CRUD encouraged inconsistent parent/code pairs and does not yield a release/migration story.

### B. Version every chart row from day one (full multi-plan)

Rejected for Phase 1. High schema and reporting cost before any production tenant exists. Op-log + later `ChartRelease` achieves the same endgame cheaper.

### C. Bind plantillas to UUID groups immediately as Phase 1 prerequisite

Deferred. Correct long-term; Phase 1 delivers impact preview on `groupCode` and may include a follow-up task to migrate templates to stable ids.

### D. Put cascade logic in admin-ui

Rejected. Violates Clean Architecture; cannot be reused by batch/CLI; unsafe for concurrent operators.

## Consequences

### Positive

- One backend authority for catalog integrity.
- Same commands power fluid pre-prod editing and future governed migrations.
- History preserved via UUID; semantic address can evolve.
- Clear boundary vs accounting engine (asientos/saldos).

### Negative / trade-offs

- Plantilla code refs remain fragile until id-binding or release-time rewrite.
- Phase 1 mutation log must be designed carefully so Phase 2 releases are not a rewrite.
- Operators must learn dry-run → apply; no “silent” hierarchy drag without preview.

## Compliance

- Clean Architecture: domain rules in chart domain/application; admin routes as adapters.
- Constitution: no silent rewrite of posted journal history.
- Security: admin RBAC from 013; structural commands require `admin`+.

## References

- `specs/014-chart-of-accounts-engine/`
- `specs/013-admin-platform/` (CRUD baseline)
- `docs/adr/0006-admin-platform-architecture.md`
- `specs/foundation/plan-de-cuentas/reglas-plan-cuentas.md`
