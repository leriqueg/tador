# TADOR

![GitHub last commit](https://img.shields.io/github/last-commit/leriqueg/tador)
![GitHub repo size](https://img.shields.io/github/repo-size/leriqueg/tador)
![GitHub](https://img.shields.io/github/license/leriqueg/tador)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma)
![Fastify](https://img.shields.io/badge/Fastify-000000?logo=fastify)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

TADOR es una aplicación web en etapa de diseño para facilitar la economía del hogar y permitir que una persona crezca hacia un control financiero profesional ligero, sin tener que cambiar de herramienta.

## Origen

La idea nace de la experiencia usando **Conta Hogar**, un software sencillo que permitía registrar apuntes, organizar cuentas, revisar saldos y hacer traspasos de forma rápida. TADOR le debe mucho a esa inspiración: la velocidad de captura, el lenguaje cotidiano y la idea de que una herramienta financiera personal no debe sentirse como un ERP.

Con el tiempo aparecieron necesidades que Conta Hogar no cubría bien: tarjetas de crédito, cuentas puente, reportes por periodo, separación clara entre balance y PYG, uso profesional independiente, entidades, cuentas por cobrar/pagar y una base contable más sólida.

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

## Estado actual — Sprint 05 completado ✅

| Sprint | Nombre | Estado |
|--------|--------|--------|
| 00 | Foundation Spec Kit | ✅ Completado |
| 01 | Plataforma base | ✅ Completado |
| 02 | Catálogos base | ✅ Completado |
| 03 | Motor contable | ✅ Completado |
| 04 | Plantillas MVP | 🔄 Pendiente |
| **05** | **Dashboard PYG** | **✅ Completado** |
| 06 | Frontend Hogar | ⏳ Pendiente |
| 07 | Frontend PRO ligero | ⏳ Pendiente |
| 08 | IA v0 | ⏳ Pendiente |

El **Sprint 05** entrega el dashboard obligatorio del MVP con dos paneles:

- **Panel PYG**: ingresos, gastos, resultado neto, evolución mensual (12 meses con gráfico), Top 10 de ingresos y egresos.
- **Panel de posición**: disponible (efectivo, bancos), por cobrar, por pagar, posición neta y desglose por cuenta individual.

Ambos paneles se sirven desde una API común (`GET /api/reports/pyg`, `GET /api/reports/position`) que alimenta tanto la vista Hogar como la vista PRO. Las diferencias de presentación entre modos se resuelven en el frontend.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + TypeScript + Fastify + Prisma + PostgreSQL |
| Frontend | React + TypeScript + Vite + Mantine + Zustand + React Query |
| Infraestructura | Docker |
| IA local | Modelo local pequeño (sugerencia de plantillas en Modo Hogar) |
| Cálculos financieros | decimal.js |

---

## Arquitectura

Clean Architecture con dependencias dirigidas hacia el dominio:

```
api/ → application/ → domain/
 ↑          ↑
infrastructure/
```

Las reglas contables (balance de asientos, tenant isolation, idempotencia) viven en `domain/`. Los casos de uso viven en `application/`. La infraestructura (Prisma, Fastify) implementa interfaces definidas en dominio/aplicación.

---

## Documentación del MVP, concepto original.

| Documento | Ubicación |
|-----------|-----------|
| Constitución del proyecto | `.specify/memory/constitution.md` |
| Definición de modos Hogar y PRO | `specs/foundation/modos-hogar-pro.md` |
| Alcance MVP | `specs/foundation/mvp-scope.md` |
| Specs por sprint | `specs/{sprint}-*/spec.md` |
| Diseño y tareas | `openspec/changes/{sprint}-*/` |

---

## Licencia

[MIT](LICENSE)
