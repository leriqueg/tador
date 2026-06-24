# Constitución de TADOR

| Campo | Valor |
|-------|-------|
| **Documento** | Constitución del proyecto TADOR |
| **Versión** | 1.0.0 |
| **Última actualización** | 2026-06-24 |
| **Estado** | Aprobado — Documento fundacional |
| **Fuentes** | 15 documentos fundacionales en `specs/foundation/` |

---

## Preámbulo

TADOR es una aplicación web para registrar y controlar la economía del hogar con base contable correcta. Su nombre proviene de la frase «con TADOR, puedes facilitar tu economía del hogar». Nace de la experiencia con Conta Hogar (aplicación legacy Symfony/MySQL): se conserva la velocidad y sencillez de captura, pero se reemplaza el motor contable interno por partida doble real, asientos balanceados, plan de cuentas configurable y un modelo extensible mediante plantillas.

TADOR no es un ERP. Su objetivo es que una persona use la aplicación en su vida diaria sin sentir que está usando un sistema contable profesional, pero sin sacrificar la integridad contable interna. El mismo sistema debe permitir crecer hacia un uso profesional ligero sin migrar a otro producto. Modo Hogar y Modo PRO son modos de uso, no modelos de pricing: los mismos datos sobreviven al cambio de modo.

Esta constitución es el documento de referencia definitivo del proyecto. Todo sprint, spec, decisión arquitectónica o controversia se resuelve contra este documento.

---

## Principios Rectores

### 1. Alcance MVP

**Regla.** El MVP debe entregar una aplicación web multiusuario operativa que cubra registro de economía del hogar con base contable correcta, plan de cuentas configurable, apuntes guiados, saldos básicos y un dashboard PYG anual.

**Qué incluye.**
- Multiusuario con autoregistro, login y recuperación de contraseña.
- Aislamiento total de datos por usuario desde el primer día.
- Configuración inicial de moneda y formato (no modificable después de creado el libro).
- Plan de cuentas global mantenido por TADOR como semilla base.
- Plan de cuentas personalizado por usuario sobre la estructura global.
- Cuentas madre (agrupadoras, no postables) y cuentas postables.
- Módulo de Entidades como catálogo de objetos con nombre propio (personas, bancos, tarjetas, plataformas, etc.), sin CxC/CxP formal.
- Tags como marcado de contexto; si representan nombre propio deben apoyarse en una Entidad.
- Asientos contables internos, atómicos, balanceados y auditables.
- Apuntes como plantillas guiadas que generan asientos válidos.
- Traspasos/transferencias entre cuentas sin impacto PYG directo.
- Cuentas puente/bypass para tarjetas, proyectos, años o dependientes.
- Saldos actuales por cuenta.
- Dashboard PYG anual como único reporte obligatorio.
- Cierre anual con reapertura.
- UI mobile-first con soporte desktop.
- Asistente IA v0 local (último componente del MVP) para interpretar frases simples y sugerir plantillas en Modo Hogar.

**Qué queda fuera del MVP.** Registros periódicos, facturas, CxC formal, CxP formal, compras diferidas con tarjeta, conciliación bancaria, inventario, kardex, índices financieros, reportes avanzados, IA autónoma, personalidad completa de Pacho.

**Criterio de cierre del MVP.** El MVP está completo cuando un usuario puede: (1) registrarse, (2) configurar moneda, (3) tener plan de cuentas inicial, (4) crear cuentas propias guiadas, (5) crear entidades básicas, (6) registrar apuntes principales, (7) registrar traspasos, (8) usar cuentas puente, (9) ver saldos actuales, (10) ver dashboard PYG anual, (11) cerrar y reabrir un ejercicio, (12) usar IA v0 para sugerir plantillas simples en Modo Hogar.

**Implementación.** Cada sprint implementa una capacidad vertical verificable. No se construyen capas aisladas. El orden de valor es: auth segura → cuentas configurables → asiento válido → apunte real → dashboard útil → UI usable → IA asistente.

---

### 2. Tenant y Privacidad

**Regla.** Todo dato financiero pertenece exclusivamente a un usuario. No debe existir lectura ni modificación cruzada entre usuarios.

**Por qué existe.** TADOR es multiusuario desde el diseño. La integridad del libro contable depende de que ningún usuario pueda afectar los datos de otro. El autoregistro con correo electrónico requiere aislamiento total desde el primer test.

**Qué implica para implementación.**
- El modelo de datos debe incluir `userId` o `tenantId` en toda tabla que contenga datos de usuario: cuentas, entidades, tags, asientos, apuntes, periodos, configuración.
- Las consultas deben filtrar siempre por el usuario autenticado. No debe existir ruta que omita este filtro.
- El plan de cuentas global no pertenece a ningún usuario; los planes personalizados sí.
- La configuración (moneda, formato, modo) es por usuario y no debe compartirse.
- Dos usuarios pueden tener entidades con el mismo nombre sin conflicto.
- El middleware de autenticación debe ser la primera capa de defensa; las reglas de dominio deben reforzar el aislamiento.

---

### 3. Integridad Contable

**Regla.** Todo asiento debe quedar balanceado. No se permiten asientos descuadrados en la base de datos. La partida doble es el fundamento del motor contable.

**Por qué existe.** La razón de ser de TADOR frente a Conta Hogar es tener un motor contable correcto por dentro. Si el asiento no cuadra, el saldo, el PYG y el balance son incorrectos. La integridad contable no es negociable.

**Qué implica para implementación.**
- Todo asiento debe tener al menos dos líneas.
- La suma de débitos debe ser exactamente igual a la suma de créditos.
- La validación de balance debe ejecutarse en la capa de dominio antes de persistir. No debe confiarse únicamente en la base de datos.
- En Modo Hogar la UI puede ocultar débitos/créditos y hablar de «entradas» y «salidas», pero el motor interno debe usar debe/haber.
- Un apunte puede generar uno o más asientos según la plantilla.
- Un traspaso no debe afectar PYG si solo mueve valor entre cuentas de balance.
- Una cuenta puente puede quedar en cero sin que se pierda el PYG asociado a las cuentas de ingreso/gasto.
- Las correcciones deben hacerse por reverso, ajuste o reemplazo vinculado. No se permite borrar historia sin trazabilidad.
- Los valores monetarios nunca deben usar punto flotante JavaScript. Se usará `decimal.js` (o biblioteca equivalente) para todo cálculo financiero.
- El MVP puede permitir importes negativos en cuentas de ingreso o gasto (uso Hogar), pero las plantillas futuras deben poder representar bruto y deducciones por separado.

---

### 4. Plan de Cuentas

**Regla.** Existe un plan de cuentas global mantenido por TADOR, inspirado en NIIF. Cada usuario construye su plan personalizado sobre esa estructura base. Las cuentas agrupadoras (GRP) no reciben líneas de asiento; solo las cuentas postables (MOV).

**Por qué existe.** El plan global garantiza coherencia en reportes y evita que cada usuario parta de cero. El plan personalizado permite que cada usuario tenga sus cuentas reales (bancos, tarjetas, proyectos) sin contaminar el catálogo global.

**Qué implica para implementación.**
- El plan global se siembra como seed inicial (migración de Prisma) y no se modifica por acción del usuario.
- El usuario puede crear cuentas postables hijas de cuentas agrupadoras globales.
- Cada cuenta debe tener: código, nombre, nivel, tipo (GRP/MOV), clase NIIF (activo/pasivo/patrimonio/ingreso/gasto), naturaleza.
- Hogar no debe mostrar códigos de cuenta ni cuentas madre. PRO puede mostrarlos.
- El plan de cuentas legacy es insumo de migración y revisión, no el plan definitivo. Contiene 189 cuentas: 27 agrupadoras y 162 postables; 100 candidatas a catálogo global, 86 específicas de usuario, 39 requieren revisión manual.
- Las cuentas deben soportar referencia a ID y código legacy para migración futura.
- Las cuentas sistema (`00000001` Traspaso, `00000002` Saldo inicial) existen para migración y operaciones internas.

---

### 5. Entidades

**Regla.** Una Entidad es un objeto con nombre propio: persona, institución financiera, emisor de tarjeta, cliente, proveedor, plataforma, etc. No implica por sí sola cuentas por cobrar, cuentas por pagar, facturas ni documentos.

**Por qué existe.** En lugar de crear tablas separadas para bancos, personas, clientes y proveedores, una sola abstracción de Entidad con tipos y capacidades permite crecer por módulos sin cambiar el modelo de datos. CxC y CxP son capacidades futuras que apuntarán a Entidades existentes.

**Qué implica para implementación.**
- Cada Entidad pertenece a un usuario. Dos usuarios pueden tener entidades con el mismo nombre.
- Dentro de un mismo usuario, el nombre debería ser único o advertir duplicados.
- Una Entidad tiene un tipo principal (`financial_institution`, `card_issuer`, `person`, `family_member`, `dependent`, `friend`, `client`, `supplier`, `colleague`, `government`, `platform`, `other`).
- Una Entidad puede tener capacidades/roles adicionales (`can_have_bank_accounts`, `can_issue_credit_cards`, `can_be_tagged`, `can_be_customer`, `can_be_supplier`, `can_have_receivables`, `can_have_payables`, `can_be_report_dimension`).
- Una cuenta bancaria o tarjeta debe poder apuntar a una Entidad financiera/emisora.
- Una Entidad puede usarse como tag/afectación en apuntes.
- No se implementan facturas, CxC formal ni CxP formal en el MVP, pero el diseño debe permitir que módulos futuros apunten a Entidades existentes.

---

### 6. Plantillas

**Regla.** Una plantilla convierte una intención de usuario en un asiento contable válido. Las plantillas son la experiencia principal de registro en Modo Hogar. El usuario no debe ver la complejidad contable.

**Por qué existe.** Sin plantillas, el usuario Hogar tendría que entender partida doble. Las plantillas encapsulan la lógica contable y exponen solo los datos que el usuario necesita: monto, concepto, cuenta de gasto y medio de pago.

**Qué implica para implementación.**
- Las plantillas MVP viven inicialmente como JSON versionado dentro del repositorio. En el futuro pueden migrar a base de datos.
- Toda plantilla produce una salida estructurada que describe las líneas del asiento.
- Las plantillas prioritarias para el MVP son: `gasto_efectivo`, `gasto_tarjeta_puente`, `ingreso_simple`, `ingreso_tercero`, `traspaso`, `gasto_proyecto_puente`, `asiento_manual` (solo PRO).
- Cada plantilla debe definir: código, versión, modos (Hogar/PRO), intención, campos, validaciones, receta del asiento y ejemplos para IA.
- Las estrategias de selección de cuenta incluyen: `fixed`, `user_default`, `ask_user`, `ask_or_suggest`, `from_entity_relation`, `create_if_missing`.
- La validación previa a generar el asiento debe incluir: `amount_positive`, `period_open`, `accounts_active`, `accounts_belong_to_user`, `currency_matches_user`.
- En Modo Hogar la plantilla oculta la complejidad; en Modo PRO puede pedir más datos o permitir elegir cuentas con mayor precisión.

---

### 7. PYG vs Balance

**Regla.** TADOR separa dos preguntas contables fundamentales: «¿qué ingreso o gasto ocurrió?» (PYG) y «¿dónde está el dinero o la deuda?» (Balance). Nunca deben confundirse.

**Por qué existe.** La confusión entre PYG y balance es el error más común en contabilidad doméstica. Una cuenta puente en cero no significa que no haya existido un gasto. El dashboard PYG debe responder ingresos y gastos del ejercicio; el balance responde saldos de activos, pasivos y patrimonio.

**Qué implica para implementación.**
- El dashboard PYG MVP se calcula desde cuentas clasificadas como ingresos y gastos, no desde cuentas puente ni saldos de balance.
- El reporte PYG incluye: selector de ejercicio, total ingresos, total gastos, neto, gráfico mensual (ingresos verdes, egresos rojos, saldo línea negra), Top 10 ingresos y Top 10 egresos.
- Los egresos se muestran como valores positivos en el gráfico (para lectura visual).
- El formato monetario debe respetar la moneda del usuario.
- Quedan fuera del MVP: PYG comparativo, drill-down por asiento, filtros por entidad/tag, reportes por centro de costo, ratios, exportación formal.

---

### 8. TDD y Pruebas

**Regla.** El desarrollo de TADOR sigue TDD (Test-Driven Development). Cada sprint debe cerrar con comportamiento demostrable, tests mínimos y documentación actualizada si cambia el dominio.

**Por qué existe.** La integridad contable y el aislamiento por usuario son demasiado críticos para verificarlos manualmente. TDD garantiza que las reglas de balance, tenant isolation y validación de asientos se prueben desde el primer momento.

**Qué implica para implementación.**
- El backend se desarrolla primero, con TDD. El frontend viene después.
- Cada sprint debe cerrar con tests que verifiquen el criterio de cierre del sprint.
- Stack de testing: `vitest` como candidato para backend TDD (pruebas rápidas TypeScript).
- El aislamiento por usuario debe probarse desde el primer sprint: dos usuarios no pueden leer ni modificar datos entre sí.
- El motor contable debe tener tests que verifiquen: balance de asientos, rechazo de asientos descuadrados, cálculo de saldos, cierre y reapertura de periodos.
- Las plantillas deben tener tests que verifiquen la generación correcta de asientos para cada caso canónico.
- Los tests de integración deben usar una base de datos PostgreSQL dedicada (postgres_test en Docker Compose).
- Docker Compose crece por fase: solo se agregan servicios cuando el repositorio tiene el código implementado.

---

### 9. IA Safety

**Regla.** La IA v0 no ejecuta asientos directamente. Solo produce sugerencias estructuradas que el usuario debe confirmar. Toda ejecución contable pasa por las APIs normales de TADOR con sus validaciones estándar.

**Por qué existe.** La integridad contable no puede delegarse a un modelo de lenguaje. La IA v0 es un asistente de captura, no un contador autónomo. Las reglas de balance, pertenencia de cuentas, periodos y moneda deben aplicarse siempre en el backend, independientemente de si la entrada vino de IA o de formulario manual.

**Qué implica para implementación.**
- La IA v0 es el último componente del MVP. Se implementa después de backend y frontend.
- Usa un modelo local pequeño ejecutado en infraestructura propia o VPS (Ollama/llama.cpp u opción similar).
- La IA recibe texto del usuario y devuelve una sugerencia JSON estructurada: `templateCode`, `confidence`, `fields`, `needsConfirmation`.
- El backend debe validar usuario, cuentas, periodo, moneda, plantilla y reglas contables **antes** de ejecutar.
- La IA no puede modificar periodos cerrados, ni decidir casos contables complejos sin preguntas adicionales.
- Casos adecuados: «Gasté 50 en almuerzo», «Recibí 100 de Mariuxi». Casos fuera de alcance: diferidos de tarjeta, facturas, CxC/CxP, retenciones, ejecución sin confirmación.
- Si el modelo no puede ejecutarse localmente, esta capacidad se difiere hasta que exista un runtime viable.

---

### 10. Concurrencia e Idempotencia

**Regla.** Las operaciones de escritura financiera deben protegerse contra conflictos concurrentes y duplicación por reintentos. Toda creación de asientos debe ser idempotente mediante claves de idempotencia.

**Por qué existe.** Un usuario puede enviar la misma solicitud dos veces (doble clic, timeout, error de red). En contabilidad, un asiento duplicado es un error grave que descuadra saldos y reportes. La concurrencia mal manejada puede producir violaciones de balance.

**Qué implica para implementación.**
- El endpoint de creación de asientos/apuntes debe aceptar una `idempotencyKey` (en header o cuerpo).
- La misma clave de idempotencia debe producir el mismo resultado (retornar el recurso existente, no crear duplicado).
- La persistencia de la clave de idempotencia debe ser transaccional con la creación del asiento.
- El motor contable debe usar transacciones de base de datos con nivel de aislamiento apropiado para evitar lecturas sucias en cálculos de saldo.
- Se debe evaluar `serializable` o `repeatable read` según el caso de uso.
- Las migraciones y seeds deben ser idempotentes: ejecutables múltiples veces sin efectos secundarios.

---

### 11. Arquitectura Limpia

**Regla.** TADOR sigue Clean Architecture con dependencias dirigidas hacia el dominio. Los controladores y rutas deben ser delgados. Las reglas contables, de tenant isolation, idempotencia y ejecución de plantillas pertenecen al código de aplicación y dominio, no a HTTP handlers ni componentes React.

**Por qué existe.** Las reglas contables son el activo más valioso del sistema. Si están mezcladas con infraestructura (HTTP, base de datos, UI), cualquier cambio tecnológico las pone en riesgo. Clean Architecture protege las reglas de dominio y permite probarlas sin infraestructura.

**Qué implica para implementación.**
- Estructura de directorios backend: `domain/`, `application/`, `infrastructure/`, `api/`.
- Dirección de dependencias: `API/UI → Application → Domain`. `Infrastructure → Application/Domain` (implementa contratos).
- Las reglas de balance, validación de asientos, cálculo de saldos y pertenencia de cuentas viven en `domain/`.
- Los casos de uso (registrar apunte, cerrar periodo, crear cuenta) viven en `application/`.
- La infraestructura (Prisma, Fastify, servicios externos) implementa interfaces definidas en dominio/aplicación.
- Stack backend: Node.js 24 LTS, TypeScript ESM, Fastify, Prisma + PostgreSQL, `argon2` para hashing, `zod` o JSON Schema para validación, Pino para logging estructurado, `nanoid` para IDs no secretos, `crypto` de Node para tokens de seguridad.
- Stack frontend (sprints posteriores): React + Mantine, Vite, TanStack Query, Zustand.
- Docker Compose se expande por fase. No se agregan servicios sin código implementado.

---

### 12. Higiene de Dependencias

**Regla.** Solo se incorporan dependencias estables, con mantenimiento activo, licencia compatible y reputación verificada. No se usan versiones alpha, beta, release-candidate ni paquetes abandonados para código de producción.

**Por qué existe.** Una dependencia mal mantenida o insegura compromete la integridad de los datos financieros. TADOR no debe reinventar mecanismos sensibles (hashing, tokens, validación, migraciones), pero cada dependencia debe justificarse.

**Qué implica para implementación.**
- Antes de instalar un paquete, documentar: nombre, propósito, versión estable, licencia, señal de mantenimiento, señal de seguridad, alternativas consideradas, por qué es mejor que código propio.
- Ejecutar `npm audit` (o equivalente) después de cada instalación.
- Comprometer el lockfile (`package-lock.json`) con versiones exactas resueltas.
- Preferir capacidades nativas del framework cuando sean maduras y suficientes.
- No reinventar: password hashing → `argon2`, tokens de seguridad → `crypto` de Node, validación de esquemas → `zod` o JSON Schema de Fastify, logging → Pino (incluido en Fastify), migraciones → Prisma.
- Las versiones observadas en los documentos fundacionales son referencias; la versión real se define al momento de la instalación y se congela en el lockfile.
- Prioridad de investigación inmediata para Sprint 01: package manager, Node LTS, Fastify + plugins, Prisma + PostgreSQL, auth + hashing + recovery, test runner + lint + formatter, Docker + test database.

---

## Regla de Gobierno

### Un sprint = un spec = una capacidad verificable

La implementación de TADOR avanza por sprints funcionales. Cada sprint se convierte en un spec separado con alcance propio, tests y criterio de cierre. No se mezclan funcionalidades de diferentes sprints en una misma entrega.

### Secuencia de sprints MVP

| Sprint | Nombre | Capacidad |
|--------|--------|-----------|
| 00 | Foundation Spec Kit | Constitución, specs iniciales, criterios de calidad |
| 01 | Plataforma base | Backend multiusuario, auth, PostgreSQL, Docker |
| 02 | Catálogos base | Plan de cuentas global y personal, entidades, tags |
| 03 | Motor contable | Asientos balanceados, saldos, periodos |
| 04 | Plantillas MVP | Apuntes guiados para casos cotidianos |
| 05 | Dashboard PYG | Reporte único obligatorio |
| 06 | Frontend Hogar | UI mobile-first para registro cotidiano |
| 07 | Frontend PRO ligero | Mayor control sin convertirse en ERP |
| 08 | IA v0 | Asistente local para interpretar lenguaje natural |

### Cierre de sprint

Cada sprint debe cerrar con:
- Comportamiento demostrable.
- Tests mínimos que verifiquen el criterio de cierre.
- Documentación actualizada si cambia el dominio.
- Deuda técnica o decisiones abiertas registradas.
- Sin funcionalidades de otro sprint.

### Toma de decisiones

1. Esta constitución es la referencia máxima del proyecto. Cualquier decisión debe ser consistente con ella.
2. Las decisiones arquitectónicas significativas se registran como ADR (Architecture Decision Records) en `docs/adr/`.
3. Los cambios a esta constitución requieren acuerdo explícito y se reflejan como nueva versión con registro de cambios.
4. Las dudas sobre alcance se resuelven contra el Preámbulo y los Principios Rectores, en ese orden.

### Procedimiento de enmienda

1. Cualquier modificación a esta constitución debe proponerse como cambio explícito sobre el documento.
2. La enmienda debe especificar: qué principio o regla modifica, por qué, y qué impacto tiene en sprints existentes o planificados.
3. La enmienda se registra como nueva versión del documento con fecha y descripción del cambio.
4. Las enmiendas menores (errores ortográficos, aclaraciones que no cambian significado) pueden aplicarse directamente. Las enmiendas sustantivas requieren revisión de consistencia contra todos los principios.

---

## Glosario Constitucional

| Término | Definición |
|---------|------------|
| **TADOR** | Aplicación web para facilitar la economía del hogar con base contable correcta y crecimiento hacia uso profesional ligero. |
| **Hogar** | Modo de uso simple, guiado por frases cotidianas. Oculta códigos, cuentas madre y complejidad contable. |
| **PRO** | Modo de uso más explícito. Permite elegir detalles contables sin convertirse en ERP. |
| **Libro** | Conjunto de datos financieros de un usuario: cuentas, entidades, apuntes, asientos, tags, cierres y configuración. |
| **Cuenta** | Elemento del plan de cuentas para clasificar saldos, ingresos, gastos, pasivos, patrimonio o puentes. |
| **Cuenta madre** | Cuenta agrupadora (GRP), no postable. Ordena el plan de cuentas. |
| **Cuenta postable** | Cuenta final (MOV) que recibe líneas de asiento. |
| **Plan de cuentas global** | Catálogo base mantenido por TADOR, inspirado en NIIF. |
| **Plan de cuentas del usuario** | Personalización sobre el plan global con cuentas propias. |
| **Asiento** | Unidad atómica, balanceada y auditable. Contiene cabecera y líneas. |
| **Línea de asiento** | Afectación individual de una cuenta dentro de un asiento. |
| **Apunte** | Plantilla guiada para convertir una intención cotidiana en asiento(s). |
| **Asiento manual** | Registro PRO abierto con validación de balance explícita. |
| **Traspaso** | Plantilla que mueve valor entre cuentas sin generar PYG directo. |
| **Plantilla** | Receta que toma parámetros y genera un asiento válido. |
| **Entidad** | Objeto con nombre propio (banco, persona, plataforma, etc.). No implica CxC/CxP. |
| **Tag** | Marca de contexto para filtrar o agrupar. Si es nombre propio reutilizable, debe ser Entidad. |
| **Cuenta puente** | Cuenta para acumular o netear valores de paso sin confundir PYG con saldos. |
| **PYG** | Vista de ingresos y gastos. Responde «cuánto gané o gasté por categoría». |
| **Balance** | Vista de activos, pasivos y patrimonio. Responde «dónde está el dinero y qué debo». |
| **Cierre anual** | Bloqueo de modificación sobre un ejercicio anual, con opción de reapertura. |
| **Reapertura** | Acción que permite modificar un periodo anual previamente cerrado. |
| **Partida doble** | Principio contable: todo asiento tiene débitos y créditos que deben sumar igual. |
| **Idempotencia** | Propiedad por la cual una misma solicitud puede enviarse múltiples veces sin crear duplicados. |

---

*Esta constitución se sostiene sobre los 15 documentos fundacionales en `specs/foundation/` y reemplaza cualquier decisión previa inconsistente con su contenido.*
