# Reporte PYG MVP

El MVP de TADOR debe incluir un único reporte obligatorio: un dashboard sencillo de PYG por ejercicio. Este reporte ya existe conceptualmente en el proyecto legacy y se considera indispensable para que el MVP sea útil.

## Objetivo

Mostrar una lectura rápida del resultado anual:

```text
Ejercicio: 2026
Total ingresos: $102,000
Total gastos: $101,500
Neto: $500
```

## Alcance

Incluido:

- Selector de ejercicio anual.
- Total acumulado de ingresos del ejercicio.
- Total acumulado de gastos del ejercicio.
- Resultado neto del ejercicio.
- Gráfico mensual comparativo de ingresos, egresos y saldo.
- Top 10 de ingresos acumulados por cuenta.
- Top 10 de egresos acumulados por cuenta.

Fuera del MVP:

- PYG comparativo entre ejercicios.
- Drill-down avanzado por asiento.
- Filtros por entidad/tag.
- Reportes por centro o cuenta puente.
- Ratios o índices financieros.
- Exportación formal.

## Gráfico mensual

El dashboard debe mostrar un gráfico con:

| Elemento | Definición |
|----------|------------|
| Eje X | Meses del ejercicio, enero a diciembre. |
| Eje Y | Importe en moneda del usuario. |
| Variable A | Ingresos mensuales, como valores positivos, en barras verdes. |
| Variable B | Egresos mensuales, como valores positivos, en barras rojas. |
| Variable C | Saldo mensual, ingresos menos egresos, como línea negra con nodos. |

Reglas:

- Los egresos se muestran como valores positivos para lectura visual.
- El saldo puede ser positivo, cero o negativo.
- El formato monetario debe respetar la moneda configurada por el usuario.
- El reporte debe depender de cuentas clasificadas como ingresos y egresos, no de cuentas puente.

## Desglose de ingresos

Mostrar un gráfico pie azul con el Top 10 de cuentas de ingreso acumuladas del ejercicio.

Reglas:

- Ordenar de mayor a menor importe acumulado.
- Mostrar máximo 10 cuentas.
- Queda pendiente decidir si el resto se agrupa como `Otros`.
- Usar solo cuentas de ingreso.

## Desglose de egresos

Mostrar un gráfico pie rojo con el Top 10 de cuentas de egreso acumuladas del ejercicio.

Reglas:

- Ordenar de mayor a menor importe acumulado.
- Mostrar máximo 10 cuentas.
- Queda pendiente decidir si el resto se agrupa como `Otros`.
- Usar solo cuentas de egreso.

## Datos conceptuales requeridos

El reporte necesita que el motor pueda entregar, por usuario y ejercicio:

- ingresos acumulados,
- egresos acumulados,
- neto del ejercicio,
- ingresos por mes,
- egresos por mes,
- saldo por mes,
- top cuentas de ingreso,
- top cuentas de egreso.

## Regla de lectura contable

El dashboard PYG debe responder:

```text
¿Cuánto ingresé, cuánto gasté y cuál fue mi resultado en el ejercicio?
```

No debe responder:

```text
¿Dónde está el dinero?
¿Cuánto debo?
¿Qué saldo tiene una cuenta puente?
```

Esas preguntas pertenecen a balance, saldos o extractos, no al PYG MVP.
