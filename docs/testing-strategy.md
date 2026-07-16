# Estrategia de pruebas — TADOR (70 / 20 / 10)

**Última actualización:** 2026-07-16  
**Última verificación de suites:** 2026-07-16

TADOR se ha construido con **TDD** y una **pirámide de pruebas** clásica: una base
amplia de tests unitarios rápidos y aislados, una capa intermedia de tests de
integración que cablean módulos reales (Prisma + Fastify, o componentes React +
hooks), y una punta delgada de tests **end-to-end** que ejercen recorridos de
usuario completos en un navegador real.

Este documento describe qué se prueba en cada capa, con qué herramientas, y el
**conteo real** de casos a la fecha del sprint `010-seguridad-calidad-y-tests`.

---

## Resumen ejecutivo

| Capa | Objetivo 70/20/10 | Casos reales | Cuota real | Herramientas |
|------|-------------------|--------------|------------|--------------|
| **Unitarias** | ~70 % | **68** | 41 % | Vitest (node + jsdom) |
| **Integración** | ~20 % | **92** | 56 % | Vitest + Prisma/Fastify · Testing Library |
| **E2E** | ~10 % | **5** | 3 % | Playwright (Chromium) |
| **Total** | 100 % | **165** | 100 % | — |

### Verificación 2026-07-16

Ejecución real (Docker, sin Make en Windows):

| Suite | Resultado |
|-------|-----------|
| Backend unit (`npm run test:unit`) | **55 passed** |
| Backend integration (`npm run test:integration`) | **83 passed / 3 failed** (86) |
| Frontend Vitest (`npm run test`) | **19 passed** |
| E2E Playwright | no re-ejecutado en esta verificación (conteo estático: 5) |

**Fallos abiertos** (todos en `backend/tests/dashboard-report.test.ts`, Position):

1. `should classify bank/wallet as Available, card 1xxx as Available, card 2xxx as Payable` — `totalAvailable` esperado 1800, recibido 800  
2. `should classify entity-linked asset accounts as Receivable` — `breakdown.receivables` length 2 vs 1  
3. `should exclude income/expense accounts from Position totals` — `totalAvailable` esperado 700, recibido 0  

Hasta que se corrijan, el badge del README usa **162 passing / 165 cases** (55+83+19+5 E2E asumidos). Tras el fix: volver a correr suites y aplicar [`update-procedure.md`](../specs/010-seguridad-calidad-y-tests/update-procedure.md).

> **Lectura honesta de la pirámide.** El objetivo pedagógico es 70/20/10. Hoy la
> distribución está invertida hacia integración (56 %) porque el **motor contable**
> y las **plantillas** —el corazón del dominio financiero— se validan
> deliberadamente contra Postgres real (asientos balanceados, aislamiento por
> tenant, idempotencia), donde el valor de la prueba es máximo. Es una desviación
> consciente: preferimos integración de alto valor sobre unidad artificial en la
> lógica de dinero. La deuda a saldar es **subir cobertura unitaria** (ver
> "Backlog de pruebas").

---

## Conteo detallado por archivo

### Backend — Unitarias (55) · `backend/tests/unit/**` · sin DB

| Archivo | Casos | Qué cubre |
|---------|-------|-----------|
| `entidad.test.ts` | 8 | Reglas de entidades (clientes/proveedores) |
| `cuenta-usuario.test.ts` | 8 | Cuentas de usuario del plan contable |
| `activacion-cuenta-global.test.ts` | 7 | Activación de cuentas de catálogo global |
| `money.test.ts` | 6 | Aritmética decimal exacta (`decimal.js`) |
| `tag.test.ts` | 5 | Etiquetas de apuntes |
| `cuenta-global.test.ts` | 5 | Catálogo global de cuentas |
| `apunte-list-filters.test.ts` | 5 | Filtros de listado de apuntes |
| `resolve-database-url.test.ts` | 5 | Resolución segura de `DATABASE_URL` |
| `plantilla-account-resolver.test.ts` | 3 | Resolución de cuentas en plantillas |
| `book.test.ts` | 3 | Configuración del libro (moneda, redondeo) |

### Backend — Integración (86) · `backend/tests/*.test.ts` · Postgres real (`tador_test`)

| Archivo | Casos | Qué cubre |
|---------|-------|-----------|
| `plantillas.test.ts` | 34 | Plantillas MVP: resolución de cuentas y generación de asientos |
| `motor-contable.test.ts` | 21 | Asientos balanceados, idempotencia, aislamiento por tenant |
| `plataforma-base.test.ts` | 12 | Registro, login, sesiones, `/auth/me` |
| `catalogos-base.test.ts` | 11 | Siembra y consulta de catálogos base |
| `dashboard-report.test.ts` | 8 | Reportes PYG y posición (`/api/reports/*`) |

> Corren en serie (`fileParallelism: false`, `singleFork`) contra `tador_test`.
> `vitest.integration.config.ts` **rechaza arrancar** si `DATABASE_URL` apunta a
> `tador_dev`/`postgres`, para no contaminar la base de desarrollo.

### Frontend — Unitarias (13) · `frontend/src/**/*.test.ts` · jsdom, sin red

| Archivo | Casos | Qué cubre |
|---------|-------|-----------|
| `lib/finance.test.ts` | 10 | `monthFromSeries`, `leverageRatio`, `leverageHint`, `formatMoney` |
| `lib/post-auth-redirect.test.ts` | 2 | Libro sin inicializar → `/onboarding`; si no → `/dashboard` |
| `lib/api.test.ts` | 1 | Forma de `ApiRequestError` |

### Frontend — Integración (6) · `frontend/src/**/*.integration.test.tsx` · Testing Library

| Archivo | Casos | Qué cubre |
|---------|-------|-----------|
| `pages/Dashboard.integration.test.tsx` | 3 | Página Resumen con `useAuth`/`useBookGate`/`reports` mockeados |
| `pages/Finances.integration.test.tsx` | 3 | Drill-down Estado → P&G / Balance |

### E2E (5) · `frontend/e2e/**/*.spec.ts` · Playwright + Vite + backend real

| Archivo | Casos | Qué cubre |
|---------|-------|-----------|
| `hogar.spec.ts` | 2 | Shell autenticado: Resumen, Estado, Apuntes |
| `smoke.spec.ts` | 2 | Marketing: titular y CTA de login |
| `auth-guest.spec.ts` | 1 | Validación de credenciales inválidas |

> El proyecto `setup` (`auth.setup.ts`) prepara un usuario autenticado vía API y
> guarda `storageState`; no es un caso de prueba de negocio y no se contabiliza.

---

## Cómo ejecutar cada capa

```bash
# Backend
make test-unit          # Unitarias de dominio (sin DB)
make test               # Integración (Postgres + Fastify)

# Frontend
make test-frontend      # Vitest unit + integration (contenedor)
cd frontend && npm run test:coverage   # con cobertura V8

# E2E (aislado en tador_test)
make test-e2e           # Playwright en red Docker
make test-e2e-host      # Playwright desde el host (Vite → localhost)
```

En CI (`.github/workflows/ci.yml`) se ejecutan en cada PR: **typecheck + unitarias
+ integración** de backend y frontend. Los E2E se corren bajo demanda con
`make test-e2e` (necesitan el stack Docker completo).

---

## Aislamiento de base de datos

| Suite | Base de datos | Nota |
|-------|---------------|------|
| Backend unitarias | ninguna | Dominio puro |
| Backend integración (`make test`) | **`tador_test`** | Vitest lo fuerza; nunca toca `tador_dev` |
| Frontend Vitest | ninguna | Mocks |
| Frontend E2E (`make test-e2e`) | **`tador_test`** | vía `compose.e2e.yaml` |

El detalle específico del frontend (host vs Docker, proxy de Vite, variables de
entorno de Playwright) está en `frontend/docs/testing-strategy.md`.

---

## Principios TDD aplicados

- **Rojo → verde → refactor** en dominio y aplicación: la lógica contable se
  escribió guiada por casos canónicos (`specs/foundation/casos-canonicos-demo.md`).
- **Una aserción por nivel**: la unidad prueba la matemática, la integración prueba
  el cableado, el E2E prueba el camino de producto. Se evita duplicar la misma
  aserción en varias capas.
- **Fail-closed en datos por tenant**: el motor contable rechaza operaciones que
  crucen tenants; hay tests de integración que lo verifican explícitamente.
- **Dinero exacto**: toda la aritmética monetaria usa `decimal.js` y se cuantiza a
  los dígitos ISO 4217 de la moneda del libro (MVP: USD, 2), cubierto por
  `money.test.ts`.

---

## Backlog de pruebas (deuda técnica reconocida)

1. **Subir cobertura unitaria** de casos de uso de aplicación para acercar la
   distribución al 70/20/10.
2. **Umbrales de cobertura** en CI (backend aún no reporta cobertura; frontend
   tiene `@vitest/coverage-v8` disponible pero sin umbral obligatorio).
3. **E2E en CI** con el perfil Docker (`make test-e2e`) como job opcional/nightly.
4. **Snapshot/visual testing** de componentes vía Storybook cuando el catálogo de
   UI se estabilice.
