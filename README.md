# TADOR

TADOR es una aplicación web en etapa de diseño para facilitar la economía del hogar y permitir que una persona crezca hacia un control financiero profesional ligero, sin tener que cambiar de herramienta.

## Origen

La idea nace de la experiencia usando **Conta Hogar**, un software sencillo que permitía registrar apuntes, organizar cuentas, revisar saldos y hacer traspasos de forma rápida. TADOR le debe mucho a esa inspiración: la velocidad de captura, el lenguaje cotidiano y la idea de que una herramienta financiera personal no debe sentirse como un ERP.

Con el tiempo aparecieron necesidades que Conta Hogar no cubría bien: tarjetas de crédito, cuentas puente, reportes por periodo, separación clara entre balance y PYG, uso profesional independiente, entidades, cuentas por cobrar/pagar y una base contable más sólida.

## Visión

TADOR busca conservar la sencillez de los apuntes rápidos, pero con un motor interno basado en asientos contables balanceados. El usuario Hogar debería poder registrar cosas como “gasté dinero”, “recibí dinero” o “compré con tarjeta” sin pensar en contabilidad; el usuario PRO podrá ver y controlar más detalle cuando lo necesite.

TADOR responde dos preguntas distintas con una sola base contable:

1. **¿Cómo va mi dinero?** — ingresos, gastos y resultado del ejercicio (PYG).
2. **¿Qué tengo y qué debo?** — efectivo, bancos, deudas por cobrar y deudas por pagar (Balance).

Desde el MVP, el motor soporta registrar deudas por cobrar y por pagar como cuentas de balance vinculadas a Entidades: una tarjeta de crédito es una deuda con su emisor, un préstamo a una persona es una cuenta por cobrar. El análisis documental formal (facturas, vencimientos, estados de cuenta por cliente o proveedor) llegará después, pero sobre este mismo motor, sin migraciones de concepto.

Los modos Hogar y PRO son niveles de expectativa del usuario, no niveles de precio: cambian la densidad de la UI y las plantillas visibles, nunca el modelo de datos. El cambio de modo debe ser inmediato y sin pérdida de historial. En el futuro, el modo podría convertirse en un factor de valor por suscripción, pero esa decisión no debe afectar el diseño del motor.

La meta es construir una herramienta:

- simple para el hogar,
- extensible para uso profesional,
- segura para datos financieros personales,
- preparada para multiusuario,
- basada en un plan de cuentas claro,
- capaz de crecer mediante plantillas y entidades,
- con un dashboard que combine resultado del ejercicio (PYG) y posición financiera (qué tengo / qué debo).

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
