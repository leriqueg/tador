# API Contract: Sprint 02 - Catálogos base

HTTP JSON API under `/api/*`. Auth via session cookie from Sprint 01. All routes require authenticated user unless noted.

## Common

### Headers

| Header | Required | Purpose |
|--------|----------|---------|
| `Cookie` | Yes | Session from `/auth/login` |
| `Idempotency-Key` | No | On mutating POST/PATCH; unique per user per operation |

### Error shape

```json
{ "error": "Human-readable message", "code": "OPTIONAL_MACHINE_CODE" }
```

| Status | When |
|--------|------|
| 400 | Validation failure |
| 401 | Missing/invalid session |
| 404 | Resource not found or not owned by user |
| 409 | Uniqueness conflict, cap exceeded, immutable field change |
| 422 | Business rule violation (wrong family/group pairing) |

---

## Chart

### GET `/api/chart`

Returns global chart merged with user activations.

**Response 200**

```json
{
  "chart": [
    {
      "id": "cuid",
      "codigo": "11120000",
      "nombre": "Bancos",
      "esPostable": false,
      "entityRequirement": "ConEntidadAutomatica",
      "requiredEntityFamily": "financial_entity"
    }
  ],
  "activations": [
    {
      "id": "cuid",
      "globalId": "cuid",
      "activa": true,
      "nombreOverride": null
    }
  ]
}
```

### POST `/api/chart/:globalId/activate`

Activate a global postable account for the user.

**Body** (optional)

```json
{ "nombreOverride": "My checking" }
```

**Response 200**: `{ "activation": { ... } }`

**Errors**: 404 if globalId invalid; 409 if already activated.

### POST `/api/chart/:globalId/deactivate`

Deactivate user activation (does not delete global row).

**Response 200**: `{ "activation": { "activa": false } }`

---

## User accounts (guided creation)

### GET `/api/accounts`

List user-owned accounts (includes entity-provisioned and wallet/bridge).

**Response 200**

```json
{
  "accounts": [
    {
      "id": "cuid",
      "codigo": "11120000.001",
      "nombre": "Banco Pichincha",
      "tipoCuenta": "bank",
      "entidadId": "cuid",
      "isEntityProvisioned": true,
      "activa": true
    }
  ]
}
```

### POST `/api/accounts`

Create user-provisioned account (wallet, bridge, income/expense category) **without** Entidad.

**Body**

```json
{
  "tipoCuenta": "wallet",
  "nombre": "Efectivo billetera",
  "globalId": "cuid",
  "codigoPersonalizado": null
}
```

**Response 201**: `{ "account": { ... } }`

**Errors**: 422 if parent group requires `ConEntidadAutomatica` (must use entity flow instead).

---

## Entities

### GET `/api/entities`

List user entities with provisioned account summary.

**Response 200**

```json
{
  "entities": [
    {
      "id": "cuid",
      "nombre": "María López",
      "family": "natural_person",
      "targetGroupCode": "11210000",
      "provisionedAccountId": "cuid",
      "provisionedAccount": {
        "id": "cuid",
        "codigo": "11210000.001",
        "nombre": "María López"
      }
    }
  ]
}
```

### POST `/api/entities`

Register Entidad and auto-provision custom account (atomic).

**Headers**: `Idempotency-Key` recommended.

**Body**

```json
{
  "nombre": "María López",
  "family": "natural_person",
  "targetGroupCode": "11210000",
  "notas": "optional"
}
```

**Response 201**

```json
{
  "entity": { "id": "...", "nombre": "...", "family": "...", "targetGroupCode": "...", "provisionedAccountId": "..." },
  "provisionedAccount": { "id": "...", "codigo": "11210000.001", "nombre": "María López" }
}
```

**Errors**

| Code | Condition |
|------|-----------|
| 409 | Duplicate `(user, family, name)` |
| 409 | 1000th entity for family |
| 422 | `targetGroupCode` not `ConEntidadAutomatica` for family |
| 422 | Family/group mismatch per seed metadata |

**Invariants**: No DELETE route in MVP. No PATCH of `family`, `targetGroupCode`, or `provisionedAccountId`.

### PATCH `/api/entities/:id`

Rename entity; sync provisioned account display name.

**Body**

```json
{ "nombre": "María López G." }
```

**Response 200**: `{ "entity": { ... }, "provisionedAccount": { "nombre": "María López G." } }`

**Errors**: 409 if new name collides within same family.

---

## Tags

### GET `/api/tags`

**Response 200**: `{ "tags": [{ "id": "...", "nombre": "..." }] }`

### POST `/api/tags`

**Body**: `{ "nombre": "Vacaciones" }`

**Response 201**: `{ "tag": { ... } }`

**Errors**: 409 duplicate `(user, nombre)`.

### DELETE `/api/tags/:id`

Tags may be deleted (unlike Entidades).

**Response 204**

---

## Reference (internal / admin seed)

`EntityFamilyMapping` is loaded at seed time; no public CRUD in MVP. Exposed optionally via:

### GET `/api/entity-families` (optional)

**Response 200**

```json
{
  "families": [
    {
      "slug": "financial_entity",
      "label": "Entidad financiera",
      "allowedTargetGroups": ["11120000", "11130000"]
    }
  ]
}
```

---

## Tenant isolation

All `:id` lookups MUST verify `userId` matches session. Cross-user access returns 404 (not 403) to avoid enumeration.

## Mode invariance

Same endpoints and payloads in Hogar and PRO; no mode header required for catalog operations.
