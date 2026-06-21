# Alcance MVP

Este documento consolida el alcance mínimo de TADOR antes de pasar a Spec Kit. No define arquitectura ni tareas técnicas; define qué debe existir para considerar útil el primer producto.

## Objetivo del MVP

Construir una aplicación web multiusuario para registrar economía del hogar con base contable correcta, plan de cuentas configurable, apuntes guiados, saldos básicos y un dashboard PYG anual.

El MVP debe permitir que una persona use TADOR en su vida diaria sin sentir que está usando un ERP, pero sin sacrificar la integridad contable interna.

## Incluido

| Área | Alcance MVP |
|------|-------------|
| Usuarios | Autoregistro con correo, login y recuperación de contraseña. |
| Seguridad | Todo dato financiero pertenece a un usuario; no debe existir lectura cruzada. |
| Configuración | Moneda y formato de moneda definidos al crear el libro; no deberían cambiarse después. |
| Modos | Hogar y PRO como modos de uso, no como pricing. |
| Plan de cuentas | Catálogo global base y plan personalizado por usuario. |
| Cuentas | Cuentas madre y cuentas postables; Hogar oculta códigos, PRO puede mostrarlos. |
| Entidades | Catálogo base de objetos con nombre propio: bancos, tarjetas, personas, clientes, proveedores, plataformas, etc. |
| Tags | Etiquetas simples para contexto; si representan nombre propio deben apoyarse en Entidad. |
| Asientos | Registro interno atómico, balanceado y auditable. |
| Apuntes | Plantillas guiadas para registrar acciones cotidianas. |
| Traspasos | Movimiento entre cuentas sin impacto PYG directo. |
| Puentes/bypass | Cuentas puente para tarjeta, proyectos, años o dependientes, sin confundir PYG con balance. |
| Saldos | Saldos actuales por cuenta. |
| Reporte | Dashboard PYG anual como único reporte obligatorio. |
| Periodos | Cierre anual con reapertura. |
| UI | Mobile-first con soporte desktop. |
| IA | Asistente IA v0 local para interpretar frases simples y sugerir plantillas en Modo Hogar, después de backend y frontend. |

## Reporte obligatorio

El MVP debe incluir el dashboard PYG anual descrito en `reporte-pyg-mvp.md`:

- total de ingresos,
- total de gastos,
- neto del ejercicio,
- gráfico mensual ingresos/egresos/saldo,
- Top 10 ingresos acumulados,
- Top 10 egresos acumulados.

## Fuera del MVP

| Área | Motivo |
|------|--------|
| Registros periódicos | Se incorporarán cuando el motor de apuntes esté estable. |
| Facturas | Requieren modelo documental propio. |
| CxC formal | Depende de Entidades y documentos; queda post-MVP. |
| CxP formal | Depende de Entidades y documentos; queda post-MVP. |
| Compras diferidas con tarjeta | Necesita reglas específicas de cuotas, intereses y reconocimiento mensual. |
| Conciliación bancaria/tarjeta | Requiere importación y matching de extractos. |
| Inventario | No es objetivo del producto inicial. |
| Kardex | Fuera del enfoque de economía del hogar. |
| Control de materia prima | No se implementa como inventario en MVP. |
| Índices financieros | Se agregarán con reportes PRO futuros. |
| Reportes avanzados | Comparativos, exportaciones y filtros complejos quedan después. |
| IA autónoma | La IA no decide ni ejecuta contabilidad sin validación y confirmación. |
| Personalidad completa de Pacho | Branding y guía conversacional quedan para después. |

## Decisiones de producto

- El término preferido para captura simple es `Apunte`.
- `Movimiento` queda como término en observación; se recomienda `Asiento manual` para PRO.
- Las plantillas MVP vivirán inicialmente en JSON versionado dentro del repo.
- En el futuro, las plantillas podrían persistirse en base de datos.
- Las Entidades sí entran en MVP, pero CxC/CxP no.
- El plan de cuentas legacy es insumo de migración y revisión, no plan definitivo.

## Reglas mínimas de edición y cierre

- En periodos abiertos, el MVP puede permitir edición controlada de apuntes/asientos.
- En periodos cerrados, no debe haber modificación silenciosa.
- La reapertura permite corregir historial bajo decisión explícita del usuario.
- Más adelante se debe definir si las correcciones se harán por edición, reverso, ajuste o reemplazo vinculado.

## Criterio de cierre del MVP

El MVP está completo cuando un usuario pueda:

1. registrarse,
2. configurar moneda,
3. tener plan de cuentas inicial,
4. crear cuentas propias guiadas,
5. crear entidades básicas,
6. registrar apuntes principales,
7. registrar traspasos,
8. usar cuentas puente,
9. ver saldos actuales,
10. ver dashboard PYG anual,
11. cerrar y reabrir un ejercicio,
12. usar IA v0 para sugerir plantillas simples en Modo Hogar.

## No decidido aún

- Lista final exacta de plantillas.
- Campos definitivos de cada plantilla.
- Reglas exactas de reverso/ajuste.
- Criterio definitivo de codificación NIIF del plan global.
- Modelo técnico de tags frente a Entidades.
