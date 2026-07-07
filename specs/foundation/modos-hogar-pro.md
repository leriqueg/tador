# Modos Hogar y PRO

| Campo | Valor |
|-------|-------|
| **Documento** | Definición de modos Hogar y PRO |
| **Versión** | 1.0.0 |
| **Última actualización** | 2026-07-07 |
| **Estado** | Aprobado |
| **Relación** | Complementa la constitución y el documento `mvp-scope.md` |

---

## Propósito

Este documento define qué significa cada modo de TADOR desde la perspectiva del usuario, qué necesidades de información resuelve cada uno y cómo se diferencian. No define implementación técnica ni UI específica; establece la intención de producto que guía las decisiones de diseño y desarrollo.

---

## Definición conceptual

La intención de **HOGAR** es dar una visión simple y rápida de la salud financiera personal: cuánto entra, cuánto sale, cuánto queda y qué deudas existen.

La intención de **PRO** es ayudar a controlar actividad económica con más precisión, incluyendo cobros pendientes, pagos pendientes, activos y efecto real de decisiones como comprar equipos o financiarse.

---

## Modo HOGAR

### Para quién

Una persona o familia que solo quiere entender si vive bien financieramente. Sin interés ni necesidad de pensar como contador.

### Preguntas que responde

- ¿Cuánto gano?
- ¿Cuánto gasto?
- ¿En qué se va el dinero?
- ¿Al final del mes estoy mejor o peor?

### Necesidades de información

- Saldo disponible real.
- Gastos por categoría.
- Deudas y tarjetas por pagar.
- Tendencia de ahorro o déficit.
- Alertas simples sobre exceso de gasto.

### Principio de diseño

La claridad es más importante que el detalle técnico. Si el usuario compra una laptop o paga una deuda, la app debe ayudarle a entender el impacto en su dinero, no complicarlo con demasiadas capas contables.

---

## Modo PRO

### Para quién

Alguien que usa la app como apoyo a una actividad económica: profesional independiente, pequeño negocio o persona que necesita ordenar mejor sus finanzas operativas.

### Preguntas que responde

- ¿Cuánto cobré?
- ¿Cuánto me deben?
- ¿Cuánto debo?
- ¿Qué tengo en activos?
- ¿Qué parte fue gasto real y qué parte fue inversión o compra de un bien?

### Necesidades de información

- Cuentas por cobrar.
- Cuentas por pagar.
- Control de efectivo y bancos.
- Seguimiento de activos durables.
- Lectura más fina de rentabilidad y liquidez.

### Principio de diseño

PRO no solo quiere ver "si hubo gasto", sino qué tipo de movimiento fue. Por ejemplo, comprar una laptop no debería verse solo como pérdida del mes; puede ser un activo que se usa durante años y luego se deprecia o incluso se vende.

---

## Diferencia fundamental

| Dimensión | HOGAR | PRO |
|-----------|-------|-----|
| **Pregunta central** | ¿Estoy bien con mi dinero? | ¿Cómo está funcionando mi actividad económica y qué compromisos tengo? |
| **Nivel de profundidad** | Decisión rápida y comprensión inmediata | Contexto operativo para no confundir rentabilidad con liquidez ni gasto con inversión |
| **Postura** | Simplifica para que cualquiera entienda su situación | Agrega separación entre dinero, deuda, activos y resultado |

> **No es una relación incompleta/completa.** Hogar no es una versión "limitada" de PRO. Cada modo resuelve una necesidad distinta. Hogar da **paz mental**; PRO da **control económico**.

---

## Lo que cada modo necesita ver

### HOGAR

| Indicador | ¿Qué responde? |
|-----------|----------------|
| Ingresos | ¿Cuánto me ingresó en el período? |
| Gastos | ¿Cuánto gasté en el período? |
| Saldo disponible | ¿Cuánto efectivo tengo ahora? |
| Deudas | ¿Cuánto debo en tarjetas, préstamos, etc.? |
| Ahorro neto | ¿Gasté menos de lo que gané? |
| Gastos por categoría | ¿En qué se me va la plata? |
| Tendencia mensual | ¿Voy mejor o peor que meses anteriores? |
| Alerta de exceso | ¿Estoy gastando más de lo que ingresa? |

### PRO

| Indicador | ¿Qué responde? |
|-----------|----------------|
| Ingresos cobrados | ¿Cuánto ingresó efectivamente? |
| Ingresos por cobrar | ¿Cuánto me deben? |
| Gastos pagados | ¿Cuánto salió efectivamente? |
| Gastos por pagar | ¿Cuánto debo pagar? |
| Activos | ¿Qué tengo (efectivo + cuentas por cobrar)? |
| Pasivos | ¿Qué debo (total deudas)? |
| Resultado del ejercicio | ¿Gané o perdí en el período? |
| Flujo de caja | ¿Entró más de lo que salió? |
| Gastos por categoría | Desglose con separación gasto real vs inversión |
| Rentabilidad | Relación entre ingresos y gastos |
| Liquidez | Capacidad de pago inmediato |

---

## Relación con el modelo de datos

Ambos modos operan sobre el **mismo modelo de datos**. No existe un modelo "Hogar" y otro "PRO". La diferencia es exclusivamente de presentación y densidad de información.

El backend expone APIs que sirven ambos modos. La UI decide qué mostrar y cómo mostrarlo según el modo activo del usuario.

---

## Relación con los sprints

| Sprint | Capacidad | Relación con modos |
|--------|-----------|-------------------|
| 05 — Dashboard PYG | Reporte único obligatorio | Define los datos que ambos modos consumen (API + data contracts) |
| 06 — Frontend Hogar | UI mobile-first | Implementa la experiencia HOGAR sobre los mismos datos |
| 07 — Frontend PRO ligero | UI con mayor control | Implementa la experiencia PRO sobre los mismos datos |
| 08 — IA v0 | Asistente local | Sugiere plantillas en Modo Hogar |

El sprint 05 entrega las APIs y consultas que ambos modos consumen. Los sprints 06 y 07 construyen las experiencias de cada modo sobre esa misma base.

---

## Historial de cambios

| Fecha | Versión | Cambio |
|------|---------|--------|
| 2026-07-07 | 1.0.0 | Definición inicial de modos Hogar y PRO |
