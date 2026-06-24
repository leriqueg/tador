# Tareas: Sprint 01 — Plataforma base

## Revisión de Carga de Trabajo

| Campo | Valor |
|-------|-------|
| Líneas estimadas cambiadas | 800–1200 |
| Riesgo de presupuesto 400 líneas | Alto |
| PR encadenados recomendados | Sí |
| Estrategia de entrega | ask-always |
| Estrategia de cadena | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Unidades de trabajo sugeridas

| Unidad | Objetivo | PR | Base |
|--------|----------|----|------|
| 1 | Scaffold + Docker + Prisma (infra fundacional) | PR 1 | main |
| 2 | Dominio + Infra (entidades, auth, tenant, sesión) | PR 2 | main |
| 3 | API + Tests + verificación | PR 3 | main |

---

## Fase 1: Setup — Proyecto, Docker, Prisma, Fastify, Vitest

- [x] 1.1 Inicializar `backend/package.json` con Node 20+ (LTS), TypeScript ESM, Fastify, Prisma, Argon2, Zod, Pino, Vitest
- [x] 1.2 Configurar `backend/tsconfig.json` ESM strict, `backend/vitest.config.ts`, `backend/.env`
- [x] 1.3 Crear `backend/prisma/schema.prisma`: User (id, email, passwordHash, verifiedAt), Book (id, userId, createdAt), BookConfig (id, bookId, currency, locale, format, currencyLocked), Session (id, userId, token, expiresAt)
- [x] 1.4 Ejecutar `prisma migrate dev --name init`, verificar conexión PostgreSQL
- [x] 1.5 Crear `backend/src/server.ts` con Fastify bootstrap + `GET /health`
- [x] 1.6 Actualizar `compose.yaml` con PostgreSQL 18 + backend app service

## Fase 2: Dominio

- [x] 2.1 `backend/src/domain/user.ts` — entidad User con email, passwordHash, verifiedAt
- [x] 2.2 `backend/src/domain/auth.ts` — hashPassword/verifyPassword con Argon2, generación de tokens
- [x] 2.3 `backend/src/domain/book.ts` — Book, BookConfig, regla FR-006 (moneda bloqueada)
- [x] 2.4 `backend/src/domain/tenant.ts` — guard `ensureOwnership()`

## Fase 3: Infraestructura

- [x] 3.1 `backend/src/infrastructure/repositories/user-repo.ts` — Prisma User CRUD
- [x] 3.2 `backend/src/infrastructure/repositories/book-repo.ts` — Prisma Book+BookConfig CRUD
- [x] 3.3 `backend/src/infrastructure/services/email-service.ts` — stub console.log (verificación, recovery)
- [x] 3.4 `backend/src/infrastructure/services/session-service.ts` — crear/validar/expirar sesión DB

## Fase 4: API — Endpoints

- [x] 4.1 Crear `backend/src/api/routes/auth.ts`: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- [x] 4.2 Crear `backend/src/api/routes/verification.ts`: `GET /auth/verify/:token`, `POST /auth/resend-verification`
- [x] 4.3 Crear `backend/src/api/routes/recovery.ts`: `POST /auth/recovery/request`, `POST /auth/recovery/reset`
- [x] 4.4 Crear `backend/src/api/routes/book.ts`: `GET /book`, `PATCH /book/config` + auth middleware + tenant middleware

## Fase 5: Tests de integración

- [x] 5.1 US1: registro + verificación email + denegar acceso libro sin verificar
- [x] 5.2 US2: login exitoso + login inválido + flujo recovery parcial
- [x] 5.3 US3: usuario B no puede leer ni modificar datos de A (SC-002)
- [x] 5.4 Edge cases: email duplicado, recovery de email no registrado, sesión inválida, auth requerida

## Fase 6: Docker, entorno y cierre

- [x] 6.1 Completar `backend/Dockerfile` multistage (build + production)
- [x] 6.2 compose.yaml con backend service + healthcheck en postgres
- [x] 6.3 Suite completa pasa: `vitest run` — 10/10 tests pasan
