# Reglas iniciales de Entidades

El módulo de Entidades representa objetos con nombre propio. Su propósito es evitar tablas separadas para bancos, personas, clientes, proveedores, emisores de tarjeta o plataformas, y preparar el camino para capacidades futuras sin obligar a implementarlas en el MVP.

## Principio central

```text
Entidad = objeto con nombre propio
Relación contable = cómo esa entidad participa en cuentas, apuntes, asientos o módulos futuros
```

Una Entidad no es automáticamente una cuenta por cobrar, una cuenta por pagar, una factura o un documento. Es el sujeto o institución al que otras capacidades pueden apuntar.

## Qué puede ser Entidad

| Tipo candidato | Ejemplos | Uso esperado |
|----------------|----------|--------------|
| `financial_institution` | Banco Bolivariano, Banco Pichincha, JEP | Relacionar cuentas bancarias, inversiones o productos financieros. |
| `card_issuer` | AMEX, Visa, Mastercard, Bankard | Relacionar tarjetas de crédito o débito. |
| `person` | Mariuxi, Jessica, Tía Toya | Tags, préstamos informales, regalos, afectaciones. |
| `family_member` | Mamá, hermano, pareja | Contexto personal y familiar. |
| `dependent` | Santiago, Alekey | Gastos o informes por dependiente. |
| `friend` | Amistades | Regalos, préstamos, aportes, tags. |
| `client` | Cliente ABC | CxC futura, documentos futuros, informes por cliente. |
| `supplier` | Proveedor XYZ | CxP futura, compras futuras, documentos futuros. |
| `colleague` | Colega profesional | Contexto laboral o profesional. |
| `government` | SRI, IESS, municipio | Impuestos, aportes, tasas, trámites. |
| `platform` | Netflix, Spotify, Hapi | Suscripciones, inversiones, servicios frecuentes. |
| `other` | Cualquier otro nombre propio | Evita bloquear captura cuando no haya tipo claro. |

## Roles o capacidades

Una Entidad puede tener un tipo principal y varias capacidades. Esto evita multiplicar tablas y permite crecer por módulos.

| Capacidad | Significado |
|-----------|-------------|
| `can_have_bank_accounts` | Puede estar asociada a cuentas bancarias. |
| `can_issue_credit_cards` | Puede estar asociada a tarjetas de crédito. |
| `can_be_tagged` | Puede usarse como afectación o referencia en apuntes. |
| `can_be_customer` | Puede operar como cliente cuando exista CxC/documentos. |
| `can_be_supplier` | Puede operar como proveedor cuando exista CxP/documentos. |
| `can_have_receivables` | Puede tener cuentas por cobrar en módulos futuros. |
| `can_have_payables` | Puede tener cuentas por pagar en módulos futuros. |
| `can_be_report_dimension` | Puede usarse para filtrar o agrupar informes. |

## Reglas MVP

- Cada Entidad pertenece a un usuario.
- Dos usuarios pueden tener entidades con el mismo nombre sin conflicto.
- En un mismo usuario, el nombre debería ser único o advertir duplicados.
- Una Entidad puede estar relacionada con cuentas del usuario.
- Una Entidad puede usarse como tag/afectación en apuntes.
- Una cuenta bancaria o tarjeta puede apuntar a una Entidad financiera o emisora.
- Una persona puede usarse como referencia de regalos, préstamos informales, ingresos o deudas por cobrar/pagar vinculadas a cuentas de balance.
- No se implementan facturas ni módulo documental formal de CxC/CxP en el MVP; sí se registran deudas por cobrar/pagar como cuentas de balance vinculadas a Entidades (tarjetas, préstamos, personas, clientes, proveedores).

## Reglas para módulos futuros

- Un módulo CxC debe apuntar a una Entidad, normalmente con capacidad `can_have_receivables`.
- Un módulo CxP debe apuntar a una Entidad, normalmente con capacidad `can_have_payables`.
- Una factura emitida debe apuntar a una Entidad cliente.
- Una factura recibida debe apuntar a una Entidad proveedor.
- Los vencimientos, aplicaciones de cobro/pago y reportes por tercero deben usar la Entidad como dimensión común.

## Ejemplos

```text
Entidad: Banco Bolivariano
Tipo: financial_institution
Capacidades: can_have_bank_accounts, can_issue_credit_cards
Uso: Cuenta bancaria "Bolivariano 2026"
```

```text
Entidad: Mariuxi
Tipo: person
Capacidades: can_be_tagged, can_be_report_dimension
Uso: Regalos e ingresos relacionados con Mariuxi
```

```text
Entidad: Cliente ABC
Tipo: client
Capacidades futuras: can_be_customer, can_have_receivables
Uso MVP: referencia/tag si hace falta
Uso futuro: facturas y CxC
```

## Dudas pendientes

- Si `Tag` será una tabla separada o una relación flexible con Entidad más etiquetas libres.
- Si una Entidad puede cambiar de tipo principal sin afectar historial.
- Si se permitirán alias por Entidad, por ejemplo `Bco. Bolivariano`, `Bolivariano`, `Banco Bolivariano`.
- Si algunas Entidades serán globales sugeridas por TADOR o todas serán por usuario en el MVP.
