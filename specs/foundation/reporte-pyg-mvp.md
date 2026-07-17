# Dashboard MVP

El MVP de TADOR debe incluir un dashboard obligatorio con dos lecturas separadas: un panel PYG por ejercicio y un panel de posición financiera a la fecha de consulta. El panel PYG ya existe conceptualmente en el proyecto legacy y se considera indispensable; el panel de posición expone la capacidad MVP de registrar deudas por cobrar/pagar como cuentas de balance vinculadas a Entidades.

> **Nota UI Hogar (006, 2026-07-16):** En Modo Hogar la **presentación** separa hub (`/dashboard`, mes default) de análisis (`/finances/pyg`, `/finances/balance`). Los datos y reglas de este documento siguen siendo la fuente canónica del panel PYG y de la posición.

## Objetivo

Mostrar una lectura rápida del resultado anual y, por separado, de la posición financiera actual.

**Panel PYG (por ejercicio):**

```text
Ejercicio: 2026
Total ingresos: $102,000
Total gastos: $101,500
Neto: $500
```

**Panel de posición (a la fecha de consulta):**

```text
Disponible: $3,200
Por cobrar: $500
Por pagar: $1,800
```

## Alcance

Incluido — panel PYG:

- Selector de ejercicio anual.
- Total acumulado de ingresos del ejercicio.
- Total acumulado de gastos del ejercicio.
- Resultado neto del ejercicio.
- Gráfico mensual comparativo de ingresos, egresos y saldo.
- Top 10 de ingresos acumulados por cuenta.
- Top 10 de egresos acumulados por cuenta.

Incluido — panel de posición:

- Total disponible (suma de saldos de cuentas de activo líquido: efectivo, bancos, billeteras).
- Total por cobrar (suma de saldos de cuentas de activo por cobrar).
- Total por pagar (suma de saldos de cuentas de pasivo: tarjetas, préstamos, cuentas por pagar).

Fuera del MVP:

- PYG comparativo entre ejercicios.
- Drill-down avanzado por asiento.
- Filtros por entidad/tag.
- Reportes por centro o cuenta puente.
- Ratios o índices financieros.
- Exportación formal.
- Estados de cuenta por cliente o proveedor.
- Desglose de posición por Entidad (filtros por tercero quedan post-MVP).

## Gráfico mensual (panel PYG)

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

El panel PYG necesita que el motor pueda entregar, por usuario y ejercicio:

- ingresos acumulados,
- egresos acumulados,
- neto del ejercicio,
- ingresos por mes,
- egresos por mes,
- saldo por mes,
- top cuentas de ingreso,
- top cuentas de egreso.

- top cuentas de egreso.

El panel de posición necesita que el motor pueda entregar, por usuario a la fecha de consulta:

- saldo agregado de activos líquidos,
- saldo agregado de activos por cobrar,
- saldo agregado de pasivos (por pagar).

## Regla de lectura contable

El panel PYG debe responder:

```text
¿Cuánto ingresé, cuánto gasté y cuál fue mi resultado en el ejercicio?
```

El panel de posición debe responder:

```text
¿Cuánto tengo disponible?
¿Cuánto me deben?
¿Cuánto debo?
```

El cálculo PYG no debe mezclarse con el cálculo de posición. El panel PYG no debe usar saldos de balance ni cuentas puente. El panel de posición no debe usar cuentas de ingreso/egreso.

Preguntas que siguen fuera del dashboard MVP:

```text
¿Qué saldo tiene una cuenta puente?
¿Cuánto debo a un proveedor específico? (estado de cuenta por Entidad)
```

Esas lecturas pertenecen a saldos por cuenta, extractos o módulos formales de CxC/CxP post-MVP.
