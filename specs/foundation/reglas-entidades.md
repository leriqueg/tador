# Reglas iniciales de Entidades

El módulo de Entidades representa objetos con nombre propio. Su propósito es evitar tablas separadas para bancos, personas, clientes, proveedores, emisores de tarjeta o plataformas, y preparar el camino para capacidades futuras sin obligar a implementarlas en el MVP.

## Principio central

```text
Entidad = objeto con nombre propio
Relación contable = cómo esa entidad participa en cuentas, apuntes, asientos o módulos futuros
Capacidades = qué roles puede jugar esa Entidad en un apunte concreto
```

Una Entidad no es automáticamente una cuenta por cobrar, una cuenta por pagar, una factura o un documento. Es el sujeto o institución al que otras capacidades pueden apuntar.

## Tipos runtime (MVP)

Tipos persistidos en `TipoEntidad` (Prisma) — alineados con el código:

| Tipo | Ejemplos | Uso esperado |
|------|----------|--------------|
| `person` | Mariuxi, Jessica, Tía Toya | Préstamos informales, regalos, afectaciones. |
| `bank` | Banco Bolivariano, JEP | Provisión de cuenta bancaria. |
| `card_issuer` | AMEX, Visa Bankard | Provisión de cuenta tarjeta. |
| `wallet_platform` | PayPal, Binance | Provisión de billetera virtual. |
| `organization` | Empleador, cliente, proveedor, empresa | Actividad económica PRO; roles vía **capacidades**. |

> **Decisión 2026-07-16**: No existen tipos `client` / `supplier` separados. Clientes y proveedores son `organization` con capacidades. Evita categorías rígidas cuando la misma empresa puede ser empleador, luego cliente u proveedor.

## Capacidades de `organization`

| Capacidad | Significado | Cuándo se exige |
|-----------|-------------|-----------------|
| `can_be_customer` | Puede operar como cliente (cobros / CxC saldo). | Al apunte de cobro/venta a esa org. |
| `can_be_supplier` | Puede operar como proveedor (pagos / CxP saldo). | Al apunte de compra/pago a esa org. |
| `is_employment_dependency` | Empresa de la que el usuario depende laboralmente (empleador). | Al apunte de sueldo / ingreso por dependencia. |

Reglas:

- El usuario asigna capacidades; una organización puede tener varias.
- Empleador: normalmente **1**; permitir hasta **3** (`is_employment_dependency`). Con el tiempo puede cambiar de trabajo (nueva org o quitar flag de la anterior).
- La validación de capacidad ocurre **al registrar el apunte**, nunca de forma retroactiva sobre historial.
- No reescribir el pasado si el usuario cambia capacidades después.

## Roles o capacidades (catálogo ampliado / futuro)

| Capacidad | Significado |
|-----------|-------------|
| `can_have_bank_accounts` | Asociada a cuentas bancarias (`tipo` bank). |
| `can_issue_credit_cards` | Asociada a tarjetas (`tipo` card_issuer). |
| `can_be_tagged` | Afectación o referencia en apuntes. |
| `can_be_customer` | Cliente en apuntes / CxC saldo. |
| `can_be_supplier` | Proveedor en apuntes / CxP saldo. |
| `is_employment_dependency` | Empleador (relación de dependencia). |
| `can_have_receivables` | Módulos documentales futuros. |
| `can_have_payables` | Módulos documentales futuros. |
| `can_be_report_dimension` | Filtrar o agrupar informes. |

## Onboarding vs JIT (PRO)

| Momento | Qué se pregunta |
|---------|-----------------|
| Onboarding PRO | Solo si trabaja en **relación de dependencia** → crear `organization` con `is_employment_dependency` (necesaria para el primer sueldo). |
| Onboarding PRO | **MUST NOT** pedir clientes ni proveedores. |
| Freelance sin clientes | Puede completar onboarding sin organizaciones cliente. |
| EntryBuilder | Clientes/proveedores **Just-in-Time** (selección o creación inline) cuando la rama lo exige. La UI JIT MUST ser explícita y segura (nombre + capacidades mínimas). |

Hogar: onboarding no pregunta perfil laboral (ver Sprint 06).

## Reglas MVP

- Cada Entidad pertenece a un usuario.
- Dos usuarios pueden tener entidades con el mismo nombre sin conflicto.
- En un mismo usuario, el nombre debería ser único o advertir duplicados.
- Una Entidad puede estar relacionada con cuentas del usuario.
- Cuentas `bank` / `card` / billetera de plataforma: solo vía provisión de Entidad (no crear a mano en `/accounts`).
- No se implementan facturas ni módulo documental formal de CxC/CxP en el MVP; sí se registran deudas por cobrar/pagar como cuentas de balance vinculadas a Entidades.

## Reglas para módulos futuros

- Un módulo CxC debe apuntar a una Entidad con capacidad de cliente / receivables.
- Un módulo CxP debe apuntar a una Entidad con capacidad de proveedor / payables.
- Facturas emitidas/recibidas usan la Entidad como dimensión común.

## Ejemplos

```text
Entidad: Banco Bolivariano
Tipo: bank
Uso: Cuenta bancaria aprovisionada
```

```text
Entidad: Acme Corp
Tipo: organization
Capacidades: is_employment_dependency
Uso: Empleador; apunte de sueldo exige esta capacidad
```

```text
Entidad: Clínica del Valle
Tipo: organization
Capacidades: can_be_customer
Uso: Cliente; cobro JIT desde EntryBuilder
```

```text
Entidad: Mariuxi
Tipo: person
Uso: Préstamo informal Hogar/PRO
```

## Dudas pendientes

- Persistencia exacta de capacidades (`Json` en Entidad vs tabla de flags).
- Si `Tag` será tabla separada o relación flexible con Entidad.
- Alias por Entidad (`Bco. Bolivariano` vs nombre canónico).
