# Data Model: Sprint 01 - Plataforma base
This model is conceptual for planning. Field-level schema is deferred to implementation planning/tasks.
## Usuario
- **Purpose**: Supports Sprint 01 - Plataforma base.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Libro
- **Purpose**: Supports Sprint 01 - Plataforma base.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Configuración del libro
- **Purpose**: Supports Sprint 01 - Plataforma base.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Sesión o acceso
- **Purpose**: Supports Sprint 01 - Plataforma base.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Relationships
- Usuario owns Libro.
- Libro owns Configuración.
- Sesión grants access only to the owning Usuario.
