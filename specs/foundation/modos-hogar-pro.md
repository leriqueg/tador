# Modos Hogar y PRO

| Campo | Valor |
|-------|-------|
| **Documento** | Definición de modos Hogar y PRO |
| **Versión** | 1.4.0 |
| **Última actualización** | 2026-07-22 |
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
- **Cuentas por cobrar / por pagar informales** (p. ej. “le presté a un amigo y me ha ido pagando / comprando cosas”): rastro del saldo con una Entidad, sin facturas ni aging.
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

**CxC/CxP documentales (post-MVP):** facturas a pacientes/clientes, pagos parciales aplicados a documentos viejos, aging (“¿lo que me deben es actual o muy viejo?”). Eso **no** es el alcance de Hogar; Hogar solo lleva el **saldo** con la Entidad. Análisis PRO avanzado (bancos, tarjetas, cartera) vive en `specs/009-frontend-pro-avanzado/`.

---

## QuickAdd vs EntryBuilder

| | **QuickAdd (Hogar)** | **EntryBuilder (PRO)** |
|--|----------------------|-------------------------|
| Pregunta mental | “¿Qué hice?” → reconozco un nombre | “¿Qué tipo de movimiento?” → clasifico y armo |
| Entrada | Plantilla nombrada (tile / categoría / búsqueda) | Grafo de decisión: preguntas → cuentas/entidad acotadas → hoja (plantilla o libre) |
| Formulario | Mini: cuenta, monto, concepto | Secuencia por nodos; pasos previos visibles y editables |
| Complejidad visible | Oculta códigos y líneas | Más control; sin ERP; sin catálogo de plantillas |
| Validez | La plantilla ya es válida | Validez por construcción al avanzar el grafo |
| Burst | Conserva plantilla + cuenta | Conserva camino (hoja) + cuentas; limpia monto/concepto |
| Escape | — | Asiento manual |
| Backend típico | `POST /api/apuntes` + `templateCode` | Apunte con o sin plantilla (hoja del grafo), o asiento manual (`/api/entries`) |
| Rutas UI (decisión 2026-07-16) | Namespace `/hogar/*` | Namespace `/pro/*` |

> Analogía: QuickAdd es **elegir una receta**; EntryBuilder es **cocinar con la misma cocina**, paso a paso (012: grafo estático; plantillas = hojas).

> **Decisión 2026-07-21 (012)**: EntryBuilder MUST NOT usar chips de plantillas como UX primaria. El grafo hace las preguntas; las plantillas solo resuelven la hoja contable.

---

## Diferencia fundamental

| Dimensión | HOGAR | PRO |
|-----------|-------|-----|
| **Pregunta central** | ¿Estoy bien con mi dinero? | ¿Cómo está funcionando mi actividad económica y qué compromisos tengo? |
| **Nivel de profundidad** | Decisión rápida y comprensión inmediata | Contexto operativo para no confundir rentabilidad con liquidez ni gasto con inversión |
| **Postura** | Simplifica para que cualquiera entienda su situación | Agrega separación entre dinero, deuda, activos y resultado |
| **Captura de apuntes** | **QuickAdd** (template-driven) | **EntryBuilder** + asiento manual como escape |
| **Rutas frontend** | `/hogar/...` | `/pro/...` |
| **API backend** | Mismas APIs de dominio | Mismas APIs de dominio |

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
| Por cobrar (informal) | ¿Cuánto me deben amigos / contactos tras préstamos o adelantos? |
| Ahorro neto | ¿Gasté menos de lo que gané? |
| Gastos por categoría | ¿En qué se me va la plata? |
| Tendencia mensual | ¿Voy mejor o peor que meses anteriores? |
| Alerta de exceso | ¿Estoy gastando más de lo que ingresa? |

### PRO (MVP ligero — Sprint 07)

| Indicador | ¿Qué responde? |
|-----------|----------------|
| Misma base Hogar | P&G y posición/balance **sin densificar** en Sprint 07 |
| Árbol de cuentas | Códigos, madres, saldos; crear hijas postables (no las de Entidad) |
| Captura | EntryBuilder + asiento manual |
| Empleador (si aplica) | Organización con capacidad `is_employment_dependency` para sueldo |

### PRO (avanzado — Sprint 009, post 007)

| Indicador | ¿Qué responde? |
|-----------|----------------|
| Analizar bancos | Saldos mensuales, costos operativos |
| Analizar tarjetas | Cargos del mes, intereses/multas |
| Analizar cartera | CxC vs CxP por Entidad |
| Conciliación / cierre | Post-MVP |

---

## Densidad UI por superficie y viewport

Regla operativa (no negociable en frontend): ver también `.cursor/rules/hogar-pro-ui-density.mdc`.

| Superficie | HOGAR | PRO móvil | PRO desktop |
|------------|-------|-----------|-------------|
| Captura | QuickAdd compacto | EntryBuilder para apuntes rápidos y concretos | EntryBuilder con más contexto de camino |
| Historial de apuntes | Lista estrecha filtrable | Misma usabilidad rápida | **Usar el ancho**: más columnas, filtros visibles, filas densas — no clonar el layout móvil de Hogar |
| Reportes / análisis | Paneles simples | Usable, no óptimo | Superficie principal de consumo |
| Cuentas | Saldos agrupados sin códigos | — | Árbol + códigos |

Compartir un componente de página vía `namespace` está bien; **misma densidad desktop Hogar/PRO en listados/reportes es deuda**, no el objetivo.

Storybook es la fuente ejecutable del catálogo UI; el inventario markdown es índice. Workflow: skill/agent `ui-storybook-sync`.

## Relación con el modelo de datos

Ambos modos operan sobre el **mismo modelo de datos**. No existe un modelo "Hogar" y otro "PRO". La diferencia es de **presentación, rutas UI y densidad**.

El backend expone APIs que sirven ambos modos. El frontend usa namespaces separados (`/hogar/*`, `/pro/*`) con guard de redirección según `BookConfig.mode`. Componentes atómicos pueden compartirse; las páginas/composiciones no deben ramificar por modo dentro de la misma ruta.

### Organizaciones (clientes, proveedores, empleador)

No se usan tipos `client` / `supplier` separados. Se usa **`organization`** con **capacidades** que el usuario asigna (`can_be_customer`, `can_be_supplier`, `is_employment_dependency`). Una misma organización puede ser empleador hoy y cliente/proveedor después. La capacidad requerida se **valida al registrar el apunte**, no de forma retroactiva. Ver `reglas-entidades.md` y specs 007 / 009.

---

## Relación con los sprints

| Sprint | Capacidad | Relación con modos |
|--------|-----------|-------------------|
| 05 — Dashboard PYG | Reporte obligatorio | Datos que ambos modos consumen |
| 06 — Frontend Hogar | UI mobile-first QuickAdd | Experiencia HOGAR (`/hogar/*`) |
| 07 — Frontend PRO ligero | EntryBuilder, árbol, asiento manual | Experiencia PRO mínima (`/pro/*`) |
| 09 — Frontend PRO avanzado | Análisis bancos/tarjetas/cartera | Densidad analítica PRO |
| 08 — IA v0 | **Fuera del MVP** (tiempo) | Spec conservado; no bloquea cierre MVP |

---

## Historial de cambios

| Fecha | Versión | Cambio |
|------|---------|--------|
| 2026-07-22 | 1.4.0 | Densidad UI por superficie/viewport; Storybook como SoT del catálogo; deuda PRO desktop |
| 2026-07-16 | 1.3.0 | QuickAdd vs EntryBuilder; namespaces `/hogar` `/pro`; organization+capacidades; 008 IA fuera MVP; 009 avanzado |
| 2026-07-13 | 1.2.0 | Captura: Hogar = plantillas; PRO = EntryBuilder; motor compartido; burst entry |
| 2026-07-12 | 1.1.0 | Hogar incluye CxC/CxP informales; módulo documental post-MVP |
| 2026-07-07 | 1.0.0 | Definición inicial de modos Hogar y PRO |
