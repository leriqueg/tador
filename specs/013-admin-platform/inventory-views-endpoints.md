# Inventory: Admin UI Views & API Endpoints (013)

**Date**: 2026-07-22  
**Status**: Draft

## Admin UI Views (`admin-ui/`)

| Route | View | Role min | Description |
|-------|------|----------|-------------|
| `/login` | Login | — | Operator email/password |
| `/change-password` | Change password | `support` | Forced when `mustChangePassword=true` (staging/prod first login) |
| `/` | Dashboard | `support` | Summary cards: users total, blocked count, apuntes today, quick links |
| `/users` | Users list | `support` | Search by email, filter active/blocked, pagination |
| `/users/:id` | User detail | `support` | Profile, books summary, sessions count, last activity |
| `/users/:id` (actions) | User actions | `admin` | Block, unblock, force password recovery |
| `/global-accounts` | Global chart tree | `admin` | Hierarchical `CuentaGlobal` browser |
| `/global-accounts/new` | Create account | `admin` | Form with parent picker, code validation |
| `/global-accounts/:id/edit` | Edit account | `admin` | Edit name, description, postable; dependency warning |
| `/templates` | Templates list | `support` | All plantillas: code, name, modes, status |
| `/templates/:code` | Template preview | `support` | Readiness, enriched accounts, mock asiento (no persist) |
| `/statistics` | Usage dashboard | `support` | Charts/tables: day, week, month granularity |
| `/audit` | Audit log | `superadmin` | Filterable mutation history (phase 1b or phase 5) |
| `/operators` | Operator management | `superadmin` | CRUD operators, role assignment (phase 5) |

### Navigation structure

```text
Dashboard
├── Users
├── Global accounts      (admin+)
├── Templates
├── Statistics
├── Audit                (superadmin)
└── Operators            (superadmin, later)
```

### UI conventions

- Spanish labels for operators (product language).
- English route paths and code identifiers.
- Mantine layout: AppShell + Nav + DataTable patterns consistent with `frontend/`.
- No links back to Hogar/PRO except optional “open product” env URL for support context.

---

## Reports & Metrics (`/statistics`)

| Report | Granularity | Metrics | Data source |
|--------|-------------|---------|-------------|
| Activity overview | Day / Week / Month | New registrations (`User.createdAt`) | `users` |
| Login activity | Day / Week / Month | Sessions created (`Session.createdAt`) | `sessions` |
| Active users | Day / Week / Month | Distinct `userId` with session or apunte in bucket | `sessions`, `apuntes` |
| Apuntes volume | Day / Week / Month | Count `Apunte.createdAt` | `apuntes` |

### API query params (planned)

- `from`, `to` — ISO date range (max 366 days MVP)
- `granularity` — `day` \| `week` \| `month`
- `timezone` — default `UTC` (align with `BookConfig.timeZone` later)

### Export

- MVP: on-screen only.
- Future: CSV export for operators with `admin` role, audit-logged.

---

## API Endpoints (`/api/admin/*`)

### Auth

| Method | Path | Role | Operation |
|--------|------|------|-----------|
| `POST` | `/api/admin/auth/login` | — | Operator login |
| `POST` | `/api/admin/auth/logout` | `support` | Invalidate operator session |
| `GET` | `/api/admin/auth/me` | `support` | Current operator profile + role + `mustChangePassword` |
| `POST` | `/api/admin/auth/change-password` | `support`* | Change password (`currentPassword`, `newPassword`); required when `mustChangePassword` |

\* Role `support` minimum, but only reachable when authenticated; `mustChangePassword` operators may access only auth + change-password routes until complete.

### Users

| Method | Path | Role | Operation |
|--------|------|------|-----------|
| `GET` | `/api/admin/users` | `support` | List/search users |
| `GET` | `/api/admin/users/:id` | `support` | User detail |
| `POST` | `/api/admin/users/:id/block` | `admin` | Block + revoke sessions |
| `POST` | `/api/admin/users/:id/unblock` | `admin` | Unblock |
| `POST` | `/api/admin/users/:id/force-password-recovery` | `admin` | Trigger recovery + revoke sessions |

### Global accounts

| Method | Path | Role | Operation |
|--------|------|------|-----------|
| `GET` | `/api/admin/global-accounts` | `admin` | Tree or flat list |
| `GET` | `/api/admin/global-accounts/:id` | `admin` | Detail + dependency counts |
| `POST` | `/api/admin/global-accounts` | `admin` | Create |
| `PATCH` | `/api/admin/global-accounts/:id` | `admin` | Update |
| `DELETE` | `/api/admin/global-accounts/:id` | `admin` | Soft-delete or hard-delete if no deps |

### Templates

| Method | Path | Role | Operation |
|--------|------|------|-----------|
| `GET` | `/api/admin/templates` | `support` | List plantillas (from repo loader) |
| `GET` | `/api/admin/templates/:code` | `support` | Detail + enriched metadata |
| `GET` | `/api/admin/templates/:code/readiness` | `support` | Readiness summary per mode |
| `POST` | `/api/admin/templates/:code/preview` | `support` | Mock asiento (body: mode, sample inputs) |

### Statistics

| Method | Path | Role | Operation |
|--------|------|------|-----------|
| `GET` | `/api/admin/statistics/overview` | `support` | Combined metrics series |
| `GET` | `/api/admin/statistics/users` | `support` | Registration series |
| `GET` | `/api/admin/statistics/sessions` | `support` | Login series |
| `GET` | `/api/admin/statistics/apuntes` | `support` | Apunte series |

### Audit (superadmin)

| Method | Path | Role | Operation |
|--------|------|------|-----------|
| `GET` | `/api/admin/audit` | `superadmin` | Paginated audit log |

### Operators (superadmin, later phase)

| Method | Path | Role | Operation |
|--------|------|------|-----------|
| `GET` | `/api/admin/operators` | `superadmin` | List operators |
| `POST` | `/api/admin/operators` | `superadmin` | Create operator |
| `PATCH` | `/api/admin/operators/:id` | `superadmin` | Update role / block |

---

## Data Operations Summary

| Domain entity | Read | Create | Update | Delete | Notes |
|---------------|------|--------|--------|--------|-------|
| `User` | support+ | — | admin (block) | — | No delete in MVP |
| `Session` (product) | support+ | — | admin (revoke all) | — | Via block/recovery |
| `CuentaGlobal` | admin+ | admin | admin | admin | Domain-validated |
| `Plantilla` (JSON) | support+ | — | — | — | Preview only |
| `Apunte` / `Asiento` | — | — | — | — | Not mutated by admin MVP |
| `Operator` | superadmin | superadmin | superadmin | — | Later phase |
| `AdminAuditLog` | superadmin | system | — | — | Append-only |

---

## Retired / Deprecated Surfaces

| Old | New | Sunset |
|-----|-----|--------|
| `GET /api/dev/plantillas-admin` | `GET /api/admin/templates` + UI | After phase 2 parity |
| `ENABLE_PLANTILLAS_ADMIN` | Operator RBAC | Flag removed after migration |

Product routes (`/api/*`, `/auth/*`) remain unchanged.
