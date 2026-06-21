# TADOR

TADOR es una aplicación web en etapa de diseño para facilitar la economía del hogar y permitir que una persona crezca hacia un control financiero profesional ligero, sin tener que cambiar de herramienta.

## Origen

La idea nace de la experiencia usando **Conta Hogar**, un software sencillo que permitía registrar apuntes, organizar cuentas, revisar saldos y hacer traspasos de forma rápida. TADOR le debe mucho a esa inspiración: la velocidad de captura, el lenguaje cotidiano y la idea de que una herramienta financiera personal no debe sentirse como un ERP.

Con el tiempo aparecieron necesidades que Conta Hogar no cubría bien: tarjetas de crédito, cuentas puente, reportes por periodo, separación clara entre balance y PYG, uso profesional independiente, entidades, cuentas por cobrar/pagar y una base contable más sólida.

## Visión

TADOR busca conservar la sencillez de los apuntes rápidos, pero con un motor interno basado en asientos contables balanceados. El usuario Hogar debería poder registrar cosas como “gasté dinero”, “recibí dinero” o “compré con tarjeta” sin pensar en contabilidad; el usuario PRO podrá ver y controlar más detalle cuando lo necesite.

La meta es construir una herramienta:

- simple para el hogar,
- extensible para uso profesional,
- segura para datos financieros personales,
- preparada para multiusuario,
- basada en un plan de cuentas claro,
- capaz de crecer mediante plantillas y entidades,
- con un dashboard PYG mínimo para entender ingresos, gastos y resultado del ejercicio.

## Stack previsto

Frontend:

- React
- TypeScript
- Vite
- Mantine
- Zustand
- React Query

Backend:

- Node.js
- Fastify
- PostgreSQL
- Prisma

Infraestructura:

- Docker

IA local:

- modelo local pequeño
- uso inicial como interpretador de lenguaje natural
- sugerencia de plantillas en Modo Hogar

## Estado actual

El proyecto está en fase foundation. Todavía no hay implementación de producto; los documentos iniciales viven en `specs/foundation/` y sirven como insumo para que Spec Kit ayude a definir constitución, specs y fases del MVP.

La primera etapa técnica se enfocará en backend con TDD. Luego vendrá el frontend base y, al cierre del MVP, una capa de IA local para interpretar frases simples y sugerir apuntes/plantillas sin ejecutar contabilidad de forma autónoma.
