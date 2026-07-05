# Glosario inicial de TADOR

Este glosario fija lenguaje de producto antes de crear specs formales. Las definiciones son intencionales pero no definitivas; se deben ajustar cuando las plantillas MVP queden cerradas.

## Términos principales

| Término | Definición inicial |
|---------|--------------------|
| TADOR | Aplicación web para facilitar la economía del hogar y permitir crecimiento hacia uso profesional ligero. |
| Hogar | Modo de uso simple, guiado por frases cotidianas y menús cortos. Oculta códigos, cuentas madre y complejidad contable. Nivel de expectativa del usuario, no pricing. |
| PRO | Modo de uso más explícito. Permite elegir más detalles contables sin convertirse en ERP. Mismo modelo de datos que Hogar. |
| Libro | Conjunto de datos financieros de un usuario: cuentas, entidades, apuntes, asientos, tags, cierres y configuración. |
| Cuenta | Elemento del plan de cuentas usado para clasificar saldos, ingresos, gastos, pasivos, patrimonio o cuentas puente. |
| Cuenta madre | Cuenta agrupadora no postable. Sirve para ordenar el plan de cuentas y reportes. |
| Cuenta postable | Cuenta final donde se pueden registrar líneas de asiento. |
| Plan de cuentas global | Catálogo base mantenido por el sistema, inspirado en NIIF y usado como estructura común. |
| Plan de cuentas del usuario | Personalización del usuario sobre el plan global. Incluye cuentas propias como bancos, tarjetas, billeteras o proyectos. |
| Asiento | Unidad atómica, balanceada y auditable de un hecho económico. Internamente contiene cabecera y líneas. |
| Línea de asiento | Parte de un asiento que afecta una cuenta por un importe. El conjunto de líneas debe mantener el asiento balanceado. |
| Apunte | Plantilla guiada para convertir una intención cotidiana en un asiento contable. Es la experiencia principal del Modo Hogar. |
| Movimiento | Término tentativo para un registro más abierto en Modo PRO. Queda en observación porque puede confundirse con el modelo legacy. |
| Asiento manual | Nombre alternativo recomendado para el registro PRO más abierto si se decide evitar “Movimiento”. |
| Traspaso | Plantilla de asiento que mueve valor entre cuentas sin generar PYG directo. Incluye transferencias, depósitos, reclasificaciones y pagos de créditos. |
| Transferencia | Sinónimo funcional de traspaso cuando el lenguaje de usuario lo haga más natural. |
| Plantilla | Receta que toma parámetros del usuario y genera un asiento válido. |
| Entidad | Objeto con nombre propio: banco, persona, familiar, cliente, proveedor, plataforma, emisor de tarjeta, etc. Puede vincular cuentas de balance por cobrar/pagar; no implica módulo documental formal. |
| Tag | Marca de contexto para filtrar o agrupar apuntes/asientos. Si representa un nombre propio reutilizable, debería resolverse como Entidad. |
| Cuenta puente | Cuenta usada para acumular, netear o controlar valores de paso sin confundir PYG con saldos. |
| Bypass | Uso práctico de una cuenta puente para registrar operaciones con medios de pago como tarjetas, bancos o billeteras. |
| PYG | Vista de ingresos y gastos. Responde “cuánto gané o gasté por categoría”. |
| Balance | Vista de activos, pasivos y patrimonio. Responde “dónde está el dinero, qué me deben y qué debo”. |
| Dashboard MVP | Pantalla obligatoria del MVP con panel PYG (resultado del ejercicio) y panel de posición (disponible, por cobrar, por pagar). |
| Cierre anual | Bloqueo o control de modificación sobre un ejercicio anual, con opción de reapertura. |
| Reapertura | Acción que permite modificar un periodo anual previamente cerrado. |

## Decisiones de lenguaje

- En la UI Hogar se debe favorecer “apunte”, “recibí”, “gasté”, “compré”, “transferí” antes que términos contables.
- En la UI PRO se puede mostrar más vocabulario contable, pero sin forzar jerga innecesaria.
- “Movimiento” no queda descartado, pero debe revisarse porque en sistemas contables suele significar línea o registro auxiliar, no necesariamente asiento completo.
- “Entidad” no equivale al módulo documental formal de CxC/CxP. En el MVP, las deudas por cobrar/pagar se registran como cuentas de balance vinculadas a Entidades; los documentos formales llegan después.

## Pendiente

- Confirmar si el término final para registros PRO será `Movimiento` o `Asiento manual`.
- Definir si `Tag` será una entidad técnica separada o una relación flexible sobre Entidades y etiquetas libres.
- Definir nombres finales de plantillas MVP.
