# Data Model: Chart of Accounts Engine (014)

## Schema deltas

### `CuentaGlobal` (extend)

| Field | Type | Notes |
|-------|------|-------|
| `deprecatedAt` | `DateTime?` | Soft deprecate; null = active |
| `reportRole` | enum `normal` \| `contra` | Default `normal`; inert for P&G in 014 |

Prisma:

```prisma
enum ReportRole {
  normal
  contra
  @@map("report_role")
}

model CuentaGlobal {
  // ... existing fields
  deprecatedAt DateTime?
  reportRole   ReportRole @default(normal)
}
```

Migration: additive, default backfill `normal`, `deprecatedAt` null.

## Application DTOs (not persisted)

### `ChartCommandType`

`create` | `rename` | `reparent` | `recode` | `deprecate`

### `ChartImpactPreview`

```ts
{
  dryRun: true;
  command: ChartCommandType;
  accountChanges: Array<{
    id: string;
    nombre: string;
    codigoBefore: string;
    codigoAfter: string;
    parentIdBefore: string | null;
    parentIdAfter: string | null;
  }>;
  userAccountChanges?: Array<{
    id: string;
    userId: string;
    codigoBefore: string | null;
    codigoAfter: string | null;
  }>;
  plantillaHits: Array<{ code: string; groupCodes: string[] }>;
  warnings: string[];
}
```

### `ChartCommandResult`

Same shape with `dryRun: false` plus applied account snapshots.

## Relationships

- Journal lines continue to FK `cuentaGlobalId` — unchanged on recode.
- Activations FK `globalId` — unchanged.
- Plantillas remain file-based string codes — impact only.

## Validation rules

- Codigo: `/^\d{8}$/`, group iff ends with `000`.
- Class digit immutable on reparent/recode.
- No cycles; parent must be non-postable (except null root if allowed for class roots).
- Unique `codigo` after proposed map.
- Deprecate sets `deprecatedAt = now()`; idempotent if already set.

## Phase 2 (not in MVP schema)

`ChartRelease`, `ChartReleaseOp` — reserved; do not create in 014 migration.
