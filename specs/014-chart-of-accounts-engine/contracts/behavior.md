# Behavioral Contracts: Chart of Accounts Engine (014)

**Date**: 2026-08-01  
**Status**: Speckit Phase 1

## CC-CHART-001 — Dry-run is side-effect free

**Given** admin operator  
**When** any chart command with `dryRun: true`  
**Then** `200` with impact preview  
**And** no `CuentaGlobal` / `CuentaUsuario` row changes  
**And** no new `AdminAuditLog` for apply (preview may omit audit or use non-mutating trace — MVP: **no audit on dry-run**)

---

## CC-CHART-002 — Reparent cascade keeps id, changes codigo

**Given** postable account P under group A, same class as group B  
**When** `reparent` apply to `newParentId = B`  
**Then** `P.id` unchanged  
**And** `P.parentId = B`  
**And** `P.codigo` updated to B’s `[A][BBB][0][DDD]` free sequence  
**And** descendants’ codes updated consistently  
**And** `LineaAsiento.cuentaGlobalId` for P unchanged  
**And** audit `chart.reparent` written

---

## CC-CHART-003 — Cross-class rejected

**Given** account with class digit `4`  
**When** reparent under parent with class digit `6`  
**Then** `400`  
**And** no DB mutation

---

## CC-CHART-004 — Cycle rejected

**Given** account G with child C  
**When** reparent G under C  
**Then** `400` cycle error  
**And** no DB mutation

---

## CC-CHART-005 — RBAC

**Given** operator role `support`  
**When** chart command mutate  
**Then** `403`

**Given** `admin` or `superadmin`  
**When** command  
**Then** allowed (subject to validation)

---

## CC-CHART-006 — Deprecate soft

**Given** account without deps requirement for soft flag  
**When** `deprecate` apply  
**Then** `deprecatedAt` set  
**And** account row remains  
**And** hard `DELETE` still 409 when deps exist (013)

---

## CC-CHART-007 — User codigo cascade

**Given** `CuentaUsuario` under affected global  
**When** reparent apply with `cascadeUserCodigos: true` (default)  
**Then** user `codigo` rewritten to new user-scope pattern under new group prefix  
**When** `cascadeUserCodigos: false`  
**Then** user codes unchanged; preview still lists would-be changes when dry-run

---

## HTTP surface (MVP)

| Method | Path | Body highlights |
|--------|------|-----------------|
| `POST` | `/api/admin/chart/commands/reparent` | `{ accountId, newParentId, dryRun, cascadeUserCodigos? }` |
| `POST` | `/api/admin/chart/commands/recode` | `{ accountId, newCodigo?, dryRun, cascadeUserCodigos? }` |
| `POST` | `/api/admin/chart/commands/create` | create fields + `dryRun` |
| `POST` | `/api/admin/chart/commands/rename` | `{ accountId, nombre, descripcion?, dryRun }` |
| `POST` | `/api/admin/chart/commands/deprecate` | `{ accountId, dryRun }` |
| `GET` | `/api/admin/global-accounts` | existing; include new fields |

Existing CRUD PATCH may remain for non-structural fields (`nombre`, `descripcion`, `reportRole`) or route through `rename` / dedicated patch — prefer commands for structural; allow PATCH for `reportRole` + metadata.
