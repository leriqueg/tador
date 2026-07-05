# Data Model: Sprint 05 - Dashboard PYG y Posición

This model is conceptual for planning. Field-level schema is deferred to implementation planning/tasks.

## Ejercicio

- **Purpose**: Year selected for PYG panel aggregation.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.

## Dato mensual PYG

- **Purpose**: Monthly income, expense and net for the PYG chart.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.

## Desglose Top 10

- **Purpose**: Top income or expense accounts by accumulated amount for the exercise.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.

## Posición financiera

- **Purpose**: Aggregated balance saldos at query time: available (liquid assets), receivables, payables.
- **Ownership**: User-owned.
- **Validation**: Must aggregate only balance-classified accounts; must exclude income/expense and bridge accounts from position totals unless explicitly classified as balance in the chart.

## Relationships

- PYG panel aggregates income/expense lines by Ejercicio and month.
- Desglose Top 10 groups by income/expense account.
- Posición panel aggregates current saldos by balance classification (liquid asset, receivable asset, liability).
