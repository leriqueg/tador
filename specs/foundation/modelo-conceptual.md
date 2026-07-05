# Modelo conceptual ligero

Este documento describe los conceptos del dominio de TADOR sin definir todavía arquitectura, tablas, endpoints ni contratos de software. Su objetivo es que Spec Kit tenga vocabulario claro para generar specs después.

## Conceptos base

| Concepto | Definición ligera | Notas |
|----------|-------------------|-------|
| Usuario | Persona registrada que posee un libro financiero. | Todo dato contable debe pertenecer a un usuario o a una organización futura. |
| Configuración del usuario | Preferencias iniciales del libro, especialmente moneda y formato. | La moneda se define al registro y no debería cambiarse después. |
| Libro | Contenedor lógico de cuentas, entidades, apuntes, asientos, tags y cierres. | En el MVP, probablemente un usuario tenga un libro principal. |
| Modo de uso | Configuración Hogar o PRO que cambia densidad de UI y plantillas disponibles. | Nivel de expectativa del usuario, no pricing; el modelo de datos es idéntico en ambos modos. |
| Plan de cuentas global | Estructura base mantenida por TADOR, inspirada en NIIF. | Define clases, grupos y ubicaciones recomendadas. |
| Plan de cuentas del usuario | Adaptación del usuario sobre el plan global. | Incluye bancos, tarjetas, billeteras, proyectos y cuentas propias. |
| Cuenta | Unidad clasificadora para saldos o resultados. | Puede ser agrupadora o postable. |
| Entidad | Objeto con nombre propio relacionado con cuentas, apuntes o informes. | No implica módulo documental CxC/CxP; sí vincula deudas por cobrar/pagar registradas como cuentas de balance. |
| Tag | Marca de contexto para búsqueda o agrupación. | Si el tag es un nombre propio, debería apoyarse en Entidad. |
| Apunte | Experiencia guiada para registrar una intención. | Produce uno o más asientos según plantilla. |
| Asiento | Registro contable atómico y balanceado. | Es la unidad persistente de integridad contable. |
| Línea de asiento | Afectación individual de una cuenta dentro de un asiento. | Las líneas hacen que el asiento cuadre. |
| Plantilla | Regla de generación de asientos a partir de datos simples. | Permite mantener UI simple y motor contable correcto. |
| Asistente IA v0 | Interpretador local de lenguaje natural para Modo Hogar. | Sugiere plantillas y datos, pero no ejecuta asientos directamente. |
| Cuenta puente | Cuenta para acumular o netear contextos de paso. | Útil para tarjetas, proyectos, años, dependientes o fondos de terceros. |
| Periodo anual | Ejercicio que puede cerrarse y reabrirse. | El MVP considera cierre anual. |
| Dashboard MVP | Reporte obligatorio con panel PYG (ingresos, egresos, neto por ejercicio) y panel de posición (disponible, por cobrar, por pagar). | Los paneles usan fuentes de cálculo distintas y no se mezclan. |

## Relaciones conceptuales

```text
Usuario
  └── Libro
        ├── Configuración
        ├── Plan de cuentas del usuario
        │     └── Cuenta
        ├── Entidad
        ├── Tag
        ├── Asistente IA v0
        │     └── Sugerencia de plantilla
        ├── Apunte
        │     └── Plantilla
        │           └── Asiento
        │                 └── Línea de asiento
        ├── Periodo anual
        └── Dashboard MVP
              ├── Panel PYG
              └── Panel de posición
```

## Reglas conceptuales

- Un usuario no debe poder ver ni modificar datos de otro usuario.
- El plan global orienta, pero el usuario necesita cuentas propias.
- Las cuentas madre ordenan; las cuentas postables reciben líneas.
- Todo hecho económico debe poder expresarse como asiento balanceado.
- El usuario Hogar no necesita ver las líneas contables si una plantilla puede generarlas.
- El usuario PRO puede necesitar una forma más abierta de registrar asientos.
- Las Entidades dan nombre propio a bancos, personas, clientes, proveedores, plataformas y emisores; en el MVP pueden vincular cuentas de balance por cobrar o por pagar.
- El módulo documental formal de CxC/CxP y facturas no está en el MVP, pero deberá referenciar Entidades cuando exista.
- Las cuentas puente ayudan a separar la pregunta “dónde está/debo el dinero” de “qué ingreso/gasto ocurrió”.
- El asistente IA v0 solo interpreta texto y sugiere plantillas; la ejecución contable siempre pasa por el backend.
- El panel PYG del dashboard MVP se calcula desde cuentas de ingreso y egreso, no desde cuentas puente ni saldos de balance.
- El panel de posición del dashboard MVP se calcula desde saldos de cuentas de balance (activo líquido, por cobrar, pasivo), no desde cuentas de ingreso/egreso.

## Fuera de este modelo por ahora

- Diseño de base de datos.
- Prisma schema.
- Arquitectura backend/frontend.
- Endpoints.
- Permisos finos.
- Estados completos de documento.
- Multi-organización para contador con clientes.
