# Data Model: Sprint 03 - Motor contable
This model is conceptual for planning. Field-level schema is deferred to implementation planning/tasks.
## Asiento
- **Purpose**: Supports Sprint 03 - Motor contable.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Línea de asiento
- **Purpose**: Supports Sprint 03 - Motor contable.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Saldo actual
- **Purpose**: Supports Sprint 03 - Motor contable.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Periodo anual
- **Purpose**: Supports Sprint 03 - Motor contable.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Relationships
- Asiento owns Línea de asiento.
- Línea references Cuenta postable.
- Periodo anual controls allowed modification.
