# TADOR

![GitHub last commit](https://img.shields.io/github/last-commit/leriqueg/tador)
![GitHub repo size](https://img.shields.io/github/repo-size/leriqueg/tador)
![GitHub](https://img.shields.io/github/license/leriqueg/tador)

<!-- Calidad, seguridad y pruebas -->
[![CI](https://github.com/leriqueg/tador/actions/workflows/ci.yml/badge.svg)](https://github.com/leriqueg/tador/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-162%20passing%20%2F%20165-yellow)](docs/testing-strategy.md)
[![Test pyramid](https://img.shields.io/badge/70%2F20%2F10-68%20unit%20%7C%2092%20int%20%7C%205%20e2e-informational)](docs/testing-strategy.md)
[![Typecheck](https://img.shields.io/badge/typecheck-strict-3178C6?logo=typescript&logoColor=white)](docs/quality-tooling.md)
[![Lint](https://img.shields.io/badge/lint-oxlint-6a5acd)](docs/quality-tooling.md)
[![Security](https://img.shields.io/badge/security-JudgmentDay%20pending-orange)](docs/security.md)

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
| **09** | **Frontend PRO avanzado** | **🔄 Activo** |

La IA v0 (`specs/008-ia-v0/`) está excluida del MVP por ADR 0002. El backend contable y sus reportes se mantienen compartidos por los modos Hogar y PRO.

En julio de 2026 se completó la remediación de Clean Architecture del backend: las capas de aplicación y API ya no dependen directamente de Prisma, SQL, Argon2 ni detalles de infraestructura. La validación de cierre cubre 95 tests unitarios y 111 tests de integración.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + TypeScript + Fastify + Prisma + PostgreSQL |
| Frontend | React + TypeScript + Vite + Mantine + Zustand + React Query |
| Infraestructura | Docker + PostgreSQL 18.4 |
| Cálculos financieros | decimal.js |

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

## Calidad, seguridad y pruebas

TADOR se desarrolla con **TDD** y una pirámide de pruebas 70/20/10. Estado actual:

| Dimensión | Estado | Detalle |
|-----------|--------|---------|
| **Pruebas** | 165 casos · **162 passing** (3 fallos Position en dashboard-report) | [`docs/testing-strategy.md`](docs/testing-strategy.md) |
| **Calidad** | TypeScript strict, oxlint, Vitest, Playwright, CI en cada PR | [`docs/quality-tooling.md`](docs/quality-tooling.md) |
| **Seguridad** | *Secure-by-design*; auditoría **JudgmentDay** pendiente | [`docs/security.md`](docs/security.md) |
| **Entrega** | Checklist de requisitos de publicación | [`docs/delivery-checklist.md`](docs/delivery-checklist.md) |

Los badges de la cabecera reflejan calidad, seguridad y pruebas y enlazan a cada
documento técnico. El badge de seguridad quedará como *JudgmentDay pending* hasta
ejecutar la auditoría del ecosistema *gentleman-ia* al cierre de la implementación.

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

[MIT](LICENSE)
