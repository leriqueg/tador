# Data Model: Sprint 02 - Catálogos base
This model is conceptual for planning. Field-level schema is deferred to implementation planning/tasks.
## Cuenta global
- **Purpose**: Supports Sprint 02 - Catálogos base.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Cuenta de usuario
- **Purpose**: Supports Sprint 02 - Catálogos base.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Entidad
- **Purpose**: Supports Sprint 02 - Catálogos base.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Tag
- **Purpose**: Supports Sprint 02 - Catálogos base.
- **Ownership**: User-owned when it represents runtime financial data; global/reference when explicitly stated.
- **Validation**: Must satisfy tenant/privacy and sprint-specific acceptance criteria.
## Relationships
- Cuenta global guides Cuenta de usuario.
- Cuenta de usuario may reference Entidad.
- Tag belongs to Usuario and may relate to Entidad.
