# Behavioral Contracts: Admin Platform (013)

**Date**: 2026-07-22  
**Status**: Draft

Contracts describe observable behavior for tests and implementation. HTTP status codes follow existing Fastify conventions.

## CC-ADMIN-001 — Operator authentication

**Given** valid operator credentials  
**When** `POST /api/admin/auth/login`  
**Then** response `200` with operator profile (no password hash)  
**And** `Set-Cookie: admin_session=...` with `httpOnly`, `sameSite=lax`, `secure` in production

**Given** invalid credentials  
**When** login  
**Then** `401` with generic message (no email enumeration)

**Given** blocked operator  
**When** login  
**Then** `403`

---

## CC-ADMIN-002 — Authorization fail-closed

**Given** no `admin_session` cookie  
**When** any `/api/admin/*` except login  
**Then** `401`

**Given** product user session cookie only  
**When** any `/api/admin/*`  
**Then** `403`

**Given** operator with role `support`  
**When** `POST /api/admin/users/:id/block`  
**Then** `403`

---

## CC-ADMIN-003 — User block

**Given** active user with N active sessions  
**When** `admin` calls block with optional `reason`  
**Then** `User.blockedAt` is set  
**And** all `Session` rows for user are deleted  
**And** `AdminAuditLog` entry `user.block` created  
**And** subsequent product login returns generic failure

**Given** already blocked user  
**When** block called again  
**Then** `200` idempotent (no error)

---

## CC-ADMIN-004 — Force password recovery

**Given** active user  
**When** `admin` calls force-password-recovery  
**Then** recovery token created via existing `AuthToken` flow  
**And** all product sessions revoked  
**And** password is NOT returned in response  
**And** audit log `user.force_password_recovery`

---

## CC-ADMIN-005 — Global account validation

**Given** invalid 8-digit code or postable child under non-group parent  
**When** create or update  
**Then** `400` with domain validation errors  
**And** no partial DB write

**Given** global account with `lineas` or `activaciones`  
**When** delete requested  
**Then** `409` with dependency summary

---

## CC-ADMIN-006 — Template preview parity

**Given** plantilla `pagar_servicios` and mode `hogar`  
**When** `POST /api/admin/templates/pagar_servicios/preview` with canonical test payload  
**Then** response matches legacy `/api/dev/plantillas-admin/.../preview` structure  
**And** no `Asiento` or `Apunte` persisted

---

## CC-ADMIN-007 — Statistics aggregation

**Given** date range `2026-07-01` to `2026-07-07` and `granularity=day`  
**When** `GET /api/admin/statistics/overview`  
**Then** response contains 7 buckets with non-negative integer counts  
**And** sum of `apuntesCreated` equals count of apuntes with `createdAt` in range (UTC)

---

## CC-ADMIN-008 — Deployment profile product

**Given** `DEPLOYMENT_PROFILE=product`  
**When** server starts  
**Then** `/api/admin/*` routes are not registered  
**And** `/api/dev/*` routes are not registered

**Given** `DEPLOYMENT_PROFILE=admin`  
**When** server starts  
**Then** only `/api/admin/*`, `/health`, and required infra routes register  
**And** product `/api/apuntes` etc. are not registered

---

## CC-ADMIN-009 — Audit log immutability

**Given** any admin mutation  
**When** operation succeeds  
**Then** exactly one `AdminAuditLog` row with `operatorId`, `action`, `targetType`, `targetId`, `createdAt`

**Given** audit log row  
**When** update or delete attempted via API  
**Then** no endpoint exists in MVP (DB append-only by convention)

---

## CC-ADMIN-010 — Rate limiting

**Given** repeated failed admin logins  
**When** threshold exceeded  
**Then** `429` on `/api/admin/auth/login` (stricter limit than product auth)
