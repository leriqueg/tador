# Estrategia incremental por sprints

La implementación de TADOR debe avanzar por sprints funcionales. Cada sprint debería convertirse en un spec separado de Spec Kit, con alcance propio, pruebas y criterio de cierre. La idea no es construir capas aisladas, sino entregar verticales pequeños que dejen el producto cada vez más usable.

## Regla de avance

```text
Un sprint = un spec = una capacidad verificable
```

Cada sprint debe cerrar con:

- comportamiento demostrable,
- tests mínimos,
- documentación actualizada si cambia el dominio,
- deuda o decisiones abiertas registradas,
- sin mezclar funcionalidades de otro sprint.

## Secuencia propuesta

```text
Sprint 00  Foundation Spec Kit
Sprint 01  Plataforma base
Sprint 02  Catálogos base
Sprint 03  Motor contable
Sprint 04  Plantillas MVP
Sprint 05  Dashboard PYG
Sprint 06  Frontend Hogar
Sprint 07  Frontend PRO ligero
Sprint 08  IA v0
```

## Sprint 00 - Foundation Spec Kit

### Objetivo

Convertir los documentos foundation en constitución, specs iniciales y tareas controlables.

### Incluye

- Constitución del proyecto.
- Spec general del MVP.
- Specs separados por sprint.
- Criterios de calidad y pruebas.
- Revisión de alcance incluido/excluido.

### Criterio de cierre

Spec Kit deja una ruta clara de implementación, sin empezar todavía a programar producto.

## Sprint 01 - Plataforma base

### Objetivo

Crear la base técnica segura para una aplicación multiusuario.

### Incluye

- Backend Node.js + Fastify.
- PostgreSQL + Prisma.
- Docker local.
- Registro de usuario.
- Login.
- Recuperación de contraseña.
- Libro/configuración inicial del usuario.
- Moneda y formato de moneda.
- Aislamiento por usuario desde el primer test.

### Criterio de cierre

Dos usuarios pueden existir en el sistema y no pueden leer ni modificar datos entre sí.

## Sprint 02 - Catálogos base

### Objetivo

Permitir que un usuario tenga estructura mínima para registrar operaciones.

### Incluye

- Plan de cuentas global seed.
- Plan de cuentas personalizado por usuario.
- Cuentas madre y cuentas postables.
- Creación guiada de cuentas: banco, tarjeta, billetera, cuenta puente.
- Entidades básicas.
- Tags simples.

### Criterio de cierre

Un usuario nuevo puede preparar su libro con cuentas y entidades propias usando la estructura global.

## Sprint 03 - Motor contable

### Objetivo

Guardar asientos balanceados como unidad atómica del sistema.

### Incluye

- Asiento.
- Línea de asiento.
- Validación de balance.
- Saldos actuales por cuenta derivados desde líneas.
- Periodo anual abierto/cerrado básico.
- Edición solo en periodo abierto.
- Reapertura anual básica.

### Criterio de cierre

El sistema no permite guardar asientos descuadrados y puede calcular saldos actuales por cuenta.

## Sprint 04 - Plantillas MVP

### Objetivo

Permitir registrar apuntes Hogar sin que el usuario vea la complejidad contable.

### Incluye

Plantillas prioritarias:

1. `traspaso`
2. `gasto_efectivo`
3. `gasto_tarjeta_puente`
4. `ingreso_simple`
5. `ingreso_tercero`
6. `gasto_proyecto_puente`
7. `asiento_manual` para PRO

### Criterio de cierre

Los casos canónicos demostrativos principales pueden reproducirse mediante plantillas o asiento manual PRO.

## Sprint 05 - Dashboard PYG y Posición

### Objetivo

Entregar el dashboard obligatorio del MVP con panel PYG y panel de posición separados.

### Incluye

**Panel PYG:**

- Selector de ejercicio.
- Total ingresos.
- Total egresos.
- Neto.
- Gráfico mensual con ingresos, egresos y saldo.
- Top 10 ingresos.
- Top 10 egresos.

**Panel de posición:**

- Total disponible (activo líquido).
- Total por cobrar.
- Total por pagar.

### Criterio de cierre

El panel PYG se calcula desde asientos reales de cuentas de ingreso/egreso y no desde saldos de cuentas puente. El panel de posición se calcula desde saldos de cuentas de balance y no altera ni mezcla totales PYG.

## Sprint 06 - Frontend Hogar

### Objetivo

Construir una experiencia usable para registro cotidiano.

### Incluye

- Onboarding.
- Login.
- Configuración inicial.
- Crear cuentas guiadas.
- Crear entidades básicas.
- Registrar apuntes principales.
- Ver saldos actuales.
- Ver dashboard con panel PYG y panel de posición.

### Criterio de cierre

El usuario puede registrar una semana real de operaciones en Modo Hogar.

## Sprint 07 - Frontend PRO ligero

### Objetivo

Agregar mayor control sin convertir TADOR en un ERP.

### Incluye

- Ver códigos de cuenta.
- Elegir cuenta madre al crear cuentas.
- Formularios con más detalle.
- Asiento manual.
- Vista más explícita de cuentas y saldos.

### Criterio de cierre

El usuario PRO puede resolver casos que Hogar no expone, sin romper las reglas contables.

## Sprint 08 - IA v0

### Objetivo

Agregar un asistente local que interprete lenguaje natural y sugiera plantillas.

### Incluye

- Modelo local pequeño.
- Endpoint o servicio de interpretación.
- Salida JSON estructurada.
- Selección sugerida de plantilla.
- Precarga de campos.
- Confirmación del usuario.
- Ejecución solo mediante APIs normales de TADOR.

### Criterio de cierre

Frases simples como `gasté $50 en almuerzo` sugieren una plantilla correcta y permiten confirmar el registro.

## Fuera de esta secuencia MVP

- Facturas.
- CxC formal.
- CxP formal.
- Registros periódicos.
- Compras diferidas de tarjeta.
- Conciliación.
- Inventario.
- Kardex.
- Reportes avanzados.
- IA autónoma.

## Orden de valor

La secuencia busca validar primero la base del producto:

```text
Auth segura
→ cuentas configurables
→ asiento válido
→ apunte real
→ dashboard útil
→ UI usable
→ IA asistente
```

La IA se deja al final del MVP porque depende de que ya existan plantillas, validaciones y APIs confiables.
