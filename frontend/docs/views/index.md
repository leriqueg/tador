# View docs — index

Per-route UI contracts for TADOR. **Policy:** [ADR 0006](../../../docs/adr/0006-ui-catalog-governance.md).  
**Routes:** [`../route-map.md`](../route-map.md). **Exceptions:** [`../ui-exceptions.md`](../ui-exceptions.md).  
**Template:** [`_TEMPLATE.md`](./_TEMPLATE.md).

Audits (agent `ui-design-governance`) walk this table view-by-view.

## Authenticated — Hogar

| Route | Doc | Primary use case | Audit status |
|-------|-----|------------------|--------------|
| `/hogar/dashboard` | [hogar-dashboard.md](./hogar-dashboard.md) | Resumen mes/año + posición | stub |
| `/hogar/entries` | [hogar-entries.md](./hogar-entries.md) | QuickAdd captura | stub |
| `/hogar/finances` | [hogar-finances.md](./hogar-finances.md) | Hub Estado | stub |
| `/hogar/finances/pyg` | [hogar-finances-pyg.md](./hogar-finances-pyg.md) | P&G + top cuentas | stub |
| `/hogar/finances/balance` | [hogar-finances-balance.md](./hogar-finances-balance.md) | Posición / balance | stub |
| `/hogar/finances/apuntes` | [hogar-finances-apuntes.md](./hogar-finances-apuntes.md) | Historial filtrable | stub |
| `/hogar/accounts` | [hogar-accounts.md](./hogar-accounts.md) | Cuentas y saldos | stub |
| `/hogar/entities` | [hogar-entities.md](./hogar-entities.md) | Entidades | stub |
| `/hogar/settings` | [hogar-settings.md](./hogar-settings.md) | Config libro | stub |

## Authenticated — PRO

| Route | Doc | Primary use case | Audit status |
|-------|-----|------------------|--------------|
| `/pro/dashboard` | [pro-dashboard.md](./pro-dashboard.md) | Hub PRO | stub |
| `/pro/entries` | [pro-entries.md](./pro-entries.md) | EntryBuilder | stub |
| `/pro/entries/manual` | [pro-entries-manual.md](./pro-entries-manual.md) | Asiento manual | stub |
| `/pro/finances` | [pro-finances.md](./pro-finances.md) | Hub Estado | stub |
| `/pro/finances/pyg` | [pro-finances-pyg.md](./pro-finances-pyg.md) | P&G (shared page) | stub |
| `/pro/finances/balance` | [pro-finances-balance.md](./pro-finances-balance.md) | Balance | stub |
| `/pro/finances/apuntes` | [pro-finances-apuntes.md](./pro-finances-apuntes.md) | Historial (density debt) | stub |
| `/pro/accounts` | [pro-accounts.md](./pro-accounts.md) | Árbol de cuentas | stub |
| `/pro/entities` | [pro-entities.md](./pro-entities.md) | Entidades | stub |
| `/pro/settings` | [pro-settings.md](./pro-settings.md) | Config | stub |
| `/pro/analysis` | [pro-analysis.md](./pro-analysis.md) | Hub análisis | stub |
| `/pro/analysis/banks` | [pro-analysis-banks.md](./pro-analysis-banks.md) | Bancos | stub |
| `/pro/analysis/cards` | [pro-analysis-cards.md](./pro-analysis-cards.md) | Tarjetas | stub |
| `/pro/analysis/portfolio` | [pro-analysis-portfolio.md](./pro-analysis-portfolio.md) | Cartera | stub |

## Public / shared

| Route | Doc | Primary use case | Audit status |
|-------|-----|------------------|--------------|
| `/` | [public-landing.md](./public-landing.md) | Marketing | stub |
| `/login` | [public-login.md](./public-login.md) | Auth | stub |
| `/register` | [public-register.md](./public-register.md) | Auth | stub |
| `/faq` | [public-faq.md](./public-faq.md) | FAQ | stub |
| `/onboarding` | [shared-onboarding.md](./shared-onboarding.md) | Primer uso | stub |

## Audit status legend

- `stub` — skeleton only  
- `audited` — last audit recorded in the view doc  
- `aligned` — no open gaps vs canonical stories (exceptions cleared or N/A)  
- `debt` — known gaps listed in the view doc and/or `ui-exceptions.md`
