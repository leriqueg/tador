# Reglas contables mínimas

Estas reglas son una base conceptual para TADOR. No reemplazan asesoría contable ni definen todavía implementación. Se apoyan en la estructura general de NIIF/IFRS: activos, pasivos y patrimonio describen posición financiera; ingresos y gastos describen rendimiento.

## Elementos contables

Según el marco conceptual IFRS/NIIF:

| Elemento | Idea práctica para TADOR |
|----------|--------------------------|
| Activo | Recurso controlado: banco, efectivo, billetera, inversión, cuentas por cobrar. |
| Pasivo | Obligación: tarjeta de crédito, préstamo, cuentas por pagar, impuestos por pagar. |
| Patrimonio | Residual entre activos y pasivos. En hogar puede mantenerse simple al inicio. |
| Ingreso | Incremento de valor que aumenta patrimonio, sin ser aporte del dueño. |
| Gasto | Disminución de valor que reduce patrimonio, sin ser distribución al dueño. |

## Ecuación base

```text
Activos = Pasivos + Patrimonio
```

El resultado del periodo se entiende como parte del patrimonio:

```text
Resultado = Ingresos - Gastos
```

## Partida doble

- Todo asiento debe tener al menos dos líneas.
- Todo asiento debe quedar balanceado.
- La suma de débitos debe igualar la suma de créditos.
- TADOR puede ocultar débitos/créditos en Modo Hogar, pero el motor debe conservar la integridad.
- No se deben guardar asientos descuadrados.

## Cuentas deudoras y acreedoras

Regla práctica general:

| Tipo de cuenta | Aumenta con | Disminuye con |
|----------------|-------------|---------------|
| Activo | Débito | Crédito |
| Gasto | Débito | Crédito |
| Pasivo | Crédito | Débito |
| Patrimonio | Crédito | Débito |
| Ingreso | Crédito | Débito |

En la UI se puede hablar de entradas, salidas, cobros o pagos. La conversión a debe/haber debe ser responsabilidad de la plantilla.

## Asientos

- El asiento es la unidad mínima de integridad.
- Un apunte debe generar uno o más asientos válidos según la plantilla.
- Un traspaso no debe afectar PYG si solo mueve valor entre cuentas de balance.
- Una cuenta puente puede cerrar en cero sin perder el PYG asociado a las cuentas de ingreso/gasto.
- Las correcciones deberían hacerse por reverso, ajuste o reemplazo vinculado, no por borrar historia sin trazabilidad.

## PYG vs balance

TADOR debe separar dos preguntas:

| Pregunta | Vista |
|----------|-------|
| ¿Dónde está el dinero o la deuda? | Balance: activos, pasivos, patrimonio. |
| ¿Qué ingreso o gasto ocurrió? | PYG: ingresos y gastos. |

Esto evita errores como interpretar una cuenta puente en cero como si no hubiera existido gasto.

## Valores negativos

El MVP puede permitir valores negativos en cuentas de ingreso o gasto porque el usuario viene de un modelo flexible de Conta Hogar. Sin embargo, deben tratarse con cuidado:

- En Hogar, un ingreso neto puede ser más útil que registrar bruto y deducciones.
- En PRO, puede convenir separar ingreso bruto, retenciones, aportes, comisiones o deducciones.
- Las plantillas futuras deben poder representar ambos modelos.
- El plan de cuentas estándar debe ayudar a decidir cuándo algo es menor ingreso, gasto, pasivo, retención o cuenta por cobrar/pagar.

## Cierres

- El MVP considera cierre anual.
- Un periodo cerrado no debería permitir modificaciones silenciosas.
- Debe definirse si se permiten reversos o ajustes en periodos cerrados.
- Debe existir reapertura para corregir historial cuando el usuario lo decida.

## Pendiente contable

- Validar plan de cuentas base contra NIIF y uso doméstico/profesional.
- Definir tratamiento de descuentos de sueldo, aportes, retenciones y comisiones.
- Definir si compras profesionales de insumos se tratan como menor ingreso, costo, activo o gasto según contexto.
- Definir reglas de cierre y reapertura.
- Definir plantilla para tarjeta, bypass y puentes.

## Fuentes consultadas

- IFRS Conceptual Framework for Financial Reporting: elementos de estados financieros.
- IAS 1 / IFRS 18 como referencia general de presentación de estados financieros.
- Principios de partida doble: cada transacción afecta cuentas manteniendo la ecuación contable.
