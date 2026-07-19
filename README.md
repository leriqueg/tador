# TADOR

**Fecha de corte:** 2026-07-18

**Última actualización:** 2026-07-19

![GitHub last commit](https://img.shields.io/github/last-commit/leriqueg/tador)
![GitHub repo size](https://img.shields.io/github/repo-size/leriqueg/tador)
![GitHub](https://img.shields.io/github/license/leriqueg/tador)

<!-- Calidad, seguridad y pruebas -->
[![CI](https://github.com/leriqueg/tador/actions/workflows/ci.yml/badge.svg)](https://github.com/leriqueg/tador/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-368%20passing-brightgreen)](docs/testing-strategy.md)
[![Test pyramid](https://img.shields.io/badge/70%2F20%2F10-179%20unit%20%7C%20180%20int%20%7C%209%20E2E-informational)](docs/testing-strategy.md)
[![Typecheck](https://img.shields.io/badge/typecheck-strict-3178C6?logo=typescript&logoColor=white)](docs/quality-tooling.md)
[![Coverage](https://img.shields.io/badge/coverage%20FE-49%25%20lines-yellow)](docs/software-quality-report.md)
[![Lint](https://img.shields.io/badge/lint-oxlint%20BE%2BFE-6a5acd)](docs/quality-tooling.md)
[![Security](https://img.shields.io/badge/security-OWASP%20baseline%20approved-brightgreen)](docs/software-quality-report.md)

<!-- Stack -->
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma)
![Fastify](https://img.shields.io/badge/Fastify-000000?logo=fastify)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

TADOR es una aplicación web en desarrollo para facilitar la economía del hogar y permitir que una persona crezca hacia un control financiero profesional ligero, sin tener que cambiar de herramienta.

## Origen

La idea nace de la experiencia usando software de 2015, que permitía registrar apuntes, organizar cuentas, revisar saldos y hacer traspasos de forma rápida. TADOR le debe mucho a esa inspiración: la velocidad de captura, el lenguaje cotidiano y la idea de que una herramienta financiera personal no debe sentirse como un ERP.

Con el tiempo aparecieron necesidades que el software no cubría bien: movimientos en tarjetas de crédito, cuentas puente, reportes por periodo, separación clara entre balance y PYG, uso profesional independiente, entidades, cuentas por cobrar/pagar y una base contable más sólida.

## Visión

TADOR busca conservar la sencillez de los apuntes rápidos, pero con un motor interno basado en asientos contables balanceados. El usuario Hogar debería poder registrar cosas como “gasté dinero”, “recibí dinero” o “compré con tarjeta” sin pensar en contabilidad; el usuario PRO podrá ver y controlar más detalle cuando lo necesite.

---

## Documentación del proyecto

La [guía documental](docs/README.md) organiza el proyecto en siete ejes:

- [arquitectura de software](docs/arquitectura-software.md);
- [metodología con GitHub Spec-Kit, Gentleman.AI y TDD](docs/spec-driven-development.md);
- [diseño visual: de Stitch a Storybook](docs/diseno-visual-y-storybook.md);
- [dominio y motor contable](docs/motor-contable/README.md);
- [calidad de software](docs/software-quality-report.md);
- [seguridad](docs/security.md);
- [Dockerización y reproducibilidad](docs/dockerizacion.md).

---

## Modos de uso — Hogar y PRO

TADOR ofrece dos modos sobre un mismo motor contable. Ambos operan con los mismos datos; solo cambia la densidad de la UI y los indicadores que se muestran.

### HOGAR — Paz mental

Pensado para una persona o familia que quiere entender si vive bien financieramente, sin pensar como contador.

**Preguntas que responde:**
- ¿Cuánto gano y cuánto gasto?
- ¿En qué se va la plata?
- ¿Cuánto tengo disponible y cuánto debo?
- ¿Al final del mes estoy mejor o peor?

**Indicadores:** ingresos, gastos, saldo disponible, deudas, ahorro neto, tendencia mensual, alertas de exceso de gasto.

### PRO — Control económico

Pensado para profesionales independientes, pequeños negocios o quienes necesitan ordenar finanzas operativas con más precisión.

**Preguntas que responde:**
- ¿Cuánto cobré, cuánto me deben y cuánto debo?
- ¿Qué tengo en activos y qué debo en pasivos?
- ¿Qué fue gasto real y qué fue inversión?
- ¿Cómo está mi rentabilidad y liquidez?

**Indicadores:** ingresos cobrados y por cobrar, gastos pagados y por pagar, activos, pasivos, flujo de caja, resultado del ejercicio, desglose por cuenta.


---

## Estado actual

| Sprint | Nombre | Estado |
|--------|--------|--------|
| 00 | Foundation Spec Kit | ✅ Completado |
| 01 | Plataforma base | ✅ Completado |
| 02 | Catálogos base | ✅ Completado |
| 03 | Motor contable | ✅ Completado |
| 04 | Plantillas MVP | ✅ Completado |
| 05 | Dashboard PYG | ✅ Completado |
| 06 | Frontend Hogar | ✅ Completado |
| 07 | Frontend PRO ligero | ✅ Completado |
| 09 | Frontend PRO avanzado | ✅ Completado |
| 010 / 011 | Clean Architecture + calidad/seguridad | ✅ Completado |

La IA v0 (`specs/008-ia-v0/`) está excluida del MVP por ADR 0002. El backend contable y sus reportes se mantienen compartidos por los modos Hogar y PRO.

En julio de 2026 se completó la remediación de Clean Architecture del backend: las capas de aplicación y API ya no dependen directamente de Prisma, SQL, Argon2 ni detalles de infraestructura. La evidencia histórica de cierre reporta 96 unitarios y 112 de integración (véase `docs/software-quality-report.md`); cualquier re-ejecución debe contrastarse con el commit actual.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Node.js 22 + TypeScript + Fastify + Prisma + PostgreSQL |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Infraestructura | Docker Compose + PostgreSQL 18.4 |
| Cálculos financieros | `decimal.js` en validaciones críticas; persistencia `NUMERIC` / Prisma `Decimal` |

---

## Arquitectura

El backend aplica Clean Architecture con dependencias dirigidas hacia el dominio:

```
api/ → application/ → domain/
         ↑
infrastructure/
```

Responsabilidades:

- `domain/`: entidades, value objects y reglas contables puras.
- `application/`: casos de uso y puertos; no conoce Prisma, Fastify ni Argon2.
- `infrastructure/`: repositorios Prisma, SQL y servicios que implementan los puertos de aplicación.
- `api/`: adaptadores HTTP delgados; autentican, validan, invocan casos de uso y traducen respuestas.
- `server.ts`: composition root donde se conectan puertos, adaptadores y rutas.

El aislamiento por tenant, la idempotencia, las transacciones, los advisory locks y el control de periodos se preservan en los límites de aplicación e infraestructura. Los importes usan aritmética decimal exacta.

La dirección de dependencias se protege con tests de arquitectura en `backend/tests/unit/architecture-boundaries.test.ts`.

---

## Desarrollo y verificación

Los comandos de backend se ejecutan en Docker:

```bash
make up          # levanta la aplicación
make typecheck   # verifica TypeScript
make test-unit   # tests unitarios
make test        # tests de integración con PostgreSQL
make check       # typecheck + integración
```

`make test` regenera Prisma Client dentro del mismo contenedor antes de ejecutar la suite, evitando desalineaciones con `schema.prisma`. Los tests de integración operan exclusivamente sobre `tador_test`.

El pipeline de GitHub Actions ejecuta typecheck, tests unitarios e integración con PostgreSQL 18.4.

---

## Inicio rápido con Docker

**Requisitos:** Docker con Compose y `make`.

```bash
cp .env.example .env
make db-setup
make up
```

Después del arranque:

- frontend: `http://localhost:5173`;
- API: `http://localhost:3000`;
- health check: `http://localhost:3000/health`.

La configuración local, de pruebas y de un futuro despliegue se explica en
[`docs/environment-files.md`](docs/environment-files.md). Los valores de ejemplo
son exclusivos de desarrollo y no deben reutilizarse en producción.

## Estructura del repositorio

```text
backend/       API, aplicación, dominio, infraestructura, Prisma y pruebas
frontend/      SPA React, componentes, páginas y pruebas
specs/         especificaciones, planes, contratos y tareas por capacidad
docs/          arquitectura, ADRs, calidad, seguridad y motor contable
docker/        inicialización de servicios de infraestructura
.github/       integración continua
```

---

## Calidad, seguridad y pruebas

TADOR se desarrolla con **TDD** y una pirámide de pruebas 70/20/10. Estado actual:

| Dimensión | Estado | Detalle |
|-----------|--------|---------|
| **Pruebas** | **368 passing** (96+112 BE, 83+68 FE, 9 E2E) · 2026-07-18 | [`docs/testing-strategy.md`](docs/testing-strategy.md) |
| **Calidad** | Typecheck PASS; oxlint BE/FE; FE coverage ~49 % (gate ≥45 %); Vitest 4 | [`docs/quality-tooling.md`](docs/quality-tooling.md) |
| **Seguridad** | OWASP baseline **aprobado** (helmet, rate-limit, CORS, AuthToken, ZAP 0 FAIL) | [`docs/security.md`](docs/security.md) |
| **Informe** | Evaluación + remediaciones fechadas 2026-07-18 | [`docs/software-quality-report.md`](docs/software-quality-report.md) |
| **Entrega** | Checklist de requisitos de publicación | [`docs/delivery-checklist.md`](docs/delivery-checklist.md) |

Los badges de la cabecera reflejan el **cierre aprobado** del **2026-07-18**
(368 tests; OWASP baseline). Detalle:
[`docs/software-quality-report.md`](docs/software-quality-report.md).

Para **recontar tests / actualizar badges** o **cerrar brechas de tooling**, ver
[`specs/011-seguridad-calidad-y-tests/`](specs/011-seguridad-calidad-y-tests/).

---
## Documentación

| Documento | Ubicación |
|-----------|-----------|
| Constitución del proyecto | `.specify/memory/constitution.md` |
| Definición de modos Hogar y PRO | `specs/foundation/modos-hogar-pro.md` |
| Alcance MVP | `specs/foundation/mvp-scope.md` |
| Specs por sprint | `specs/{sprint}-*/spec.md` |
| Arquitectura y stack | `specs/foundation/stack-architecture.md` |
| Remediación de Clean Architecture | `specs/010-audit-clean-architecture/2026-07-18/` |

---

## Licencia

MIT. El archivo `LICENSE` todavía debe incorporarse al repositorio antes de la
publicación final.
