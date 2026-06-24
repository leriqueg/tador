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

- [ ] 1.1 Inicializar `backend/package.json` con Node 24, TypeScript ESM, Fastify, Prisma, Argon2, Zod, Pino, Vitest
- [ ] 1.2 Configurar `backend/tsconfig.json` ESM strict, `backend/vitest.config.ts`, `backend/.env`
- [ ] 1.3 Crear `backend/prisma/schema.prisma`: Usuario (id, email, hash, verificado), Libro (id, usuarioId, creado), ConfiguracionLibro (id, libroId, moneda, formato), Sesion (id, usuarioId, token, expira)
- [ ] 1.4 Ejecutar `prisma migrate dev --name init`, verificar conexión PostgreSQL
- [ ] 1.5 Crear `backend/src/server.ts` con Fastify bootstrap + `GET /health`
- [ ] 1.6 Crear `backend/docker-compose.yaml` con PostgreSQL 18 + app service

## Fase 2: Dominio — TDD (RED → GREEN)

- [ ] 2.1 RED + impl: `backend/src/domain/usuario.ts` — entidad Usuario con email, hash, verificado
- [ ] 2.2 RED + impl: `backend/src/domain/auth.ts` — hashPassword/verifyPassword con Argon2
- [ ] 2.3 RED + impl: `backend/src/domain/libro.ts` — Libro, ConfiguracionLibro, regla FR-006 (moneda bloqueada)
- [ ] 2.4 RED + impl: `backend/src/domain/tenant.ts` — tipo TenantId, guard `ensureOwnership()`

## Fase 3: Infraestructura — TDD (RED → GREEN)

- [ ] 3.1 RED + impl: `backend/src/infrastructure/repositorios/usuario.repo.ts` — Prisma Usuario CRUD
- [ ] 3.2 RED + impl: `backend/src/infrastructure/repositorios/libro.repo.ts` — Prisma Libro+Config CRUD
- [ ] 3.3 RED + impl: `backend/src/infrastructure/servicios/email.service.ts` — stub envío (verificación, recovery)
- [ ] 3.4 RED + impl: `backend/src/infrastructure/servicios/session.service.ts` — crear/validar/expirar sesión DB

## Fase 4: API — Endpoints

- [ ] 4.1 Crear `backend/src/api/routes/auth.ts`: `POST /auth/register`, `POST /auth/login`, `POST /auth/recovery`
- [ ] 4.2 Crear `backend/src/api/routes/libro.ts`: `GET /libro/config`, `PUT /libro/config`
- [ ] 4.3 Implementar `backend/src/api/middleware/tenant.ts` — validar tenant en cada request autenticado
- [ ] 4.4 Registrar rutas en `server.ts`, verificar montaje con Fastify

## Fase 5: Tests de integración

- [ ] 5.1 US1: registro + verificación email + configurar moneda del libro
- [ ] 5.2 US2: login exitoso + flujo recovery completo
- [ ] 5.3 US3: usuario B no puede leer ni modificar datos de A (SC-002)
- [ ] 5.4 Edge cases: email duplicado, recovery de email no registrado, moneda bloqueada post-actividad, sesión vencida

## Fase 6: Docker, entorno y cierre

- [ ] 6.1 Completar `backend/Dockerfile` multistage (build + production)
- [ ] 6.2 Verificar migración automática + healthcheck en docker-compose
- [ ] 6.3 Suite completa pasa: `vitest run`
