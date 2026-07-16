# Research: Sprint 06 - Frontend Hogar

## Decision: Sprint boundary

Hogar UI only; excludes PRO screens and IA.

**Rationale**: Prevents broad MVP specs and keeps each sprint independently plannable.

**Alternatives considered**: Full MVP planning in one spec.

## Decision: Testing posture

Use TDD for backend behavior once Sprint 01 establishes test tooling. Frontend: smoke/manual + Storybook for capture components.

**Rationale**: Constitution requires test-first core behavior and tenant/accounting protection.

**Alternatives considered**: Manual testing only.

## Decision: Tenant/privacy default

All user-owned data must be scoped by authenticated user.

**Rationale**: Financial data is private and multiuser from the MVP.

**Alternatives considered**: Add tenant scoping later.

## Decision: Captura Hogar = template-driven quick capture (2026-07-13)

Hogar does **not** use PRO EntryBuilder. Daily capture is plantilla-first with three discovery layers (frequent tiles → kind+category chips → typeahead) and a mini-form (account, amount, short description). Burst action: “Guardar y registrar otro”.

**Rationale**: Persona Hogar thinks in named intents (“pagué el supermercado”), not transaction taxonomy. Recognition over recall; Hick’s law via stratified navigation. Same capture motor as PRO with steps pre-answered by plantilla JSON.

**Alternatives considered**:
- Reuse PRO sequential builder for Hogar — rejected: forces abstract classification (INGRESO/EGRESO) before intent.
- Flat grid of 20+ plantilla buttons — rejected: cognitive overload.
- Dry multi-field form as primary Hogar UX — rejected: feels accounting-like; plantilla already resolves structure.

**Reference**: `specs/foundation/modos-hogar-pro.md` § Diferencia fundamental; mockup `apuntes_tador`.

## Decision: Shared capture motor, mode-specific presentation

One `POST /api/apuntes` path; UI presentation differs by `BookConfig.mode`. PRO EntryBuilder is specified in Sprint 07 and must not ship as Hogar UX in 006.

**Rationale**: DRY + Clean Architecture — accounting rules stay in plantillas/backend.

**Alternatives considered**: Separate Hogar-only write API — rejected as unnecessary duplication.

## Decision: Plantillas list light + detail enrich (2026-07-13)

Entries loads `GET /api/plantillas?mode=hogar` for discovery, then `GET /api/plantillas/:code` when selecting. Hides empty category chips using catalog codes. Diagnóstico: `/api/dev/plantillas-admin` (004 §12).

## Decision: Onboarding Hogar — TZ, billeteras, tarjetas, sin bancos (2026-07-14)

### Timezone
Curated list covering North America, South America, Europe (must include `America/Guayaquil`). Default from `Intl.DateTimeFormat().resolvedOptions().timeZone` when listed; else `UTC`. Human labels.

### Wallets first, banks later
~~Onboarding prioritizes clarifying the default wallet and optionally adding 0–2 virtual wallets. Banks are created just-in-time~~ **Superseded 2026-07-14 evening.**

## Decision: Ajustes / Entidades / Cuentas (2026-07-14 evening)

### Settings (`/settings`)
- Currency: readonly after onboarding (Book attribute; multi-book ≠ FX).
- Timezone: editable (curated list).
- User `fullName`: editable.
- Email/password change: out of MVP.

### Entity types & auto-provision
| Tipo | UX | Cuenta | Grupo |
|------|-----|--------|-------|
| `bank` | Banco | `bank` | `11120000` |
| `card_issuer` | Tarjeta de crédito | `card` | `21200000` |
| `wallet_platform` | Billetera virtual | `wallet` | `11110000` |
| `person` | Persona | balance CxC | `11320000` |
| `organization` | PRO | — | — |

Default plan wallet = **no** entity. Virtual wallets always `wallet_platform`.

### Routes
- Onboarding: optional declare Bank / Card / Virtual wallet (entity APIs).
- Later adds: `/entities`.
- `/accounts` Hogar: only income/expense category admin (no balance hero). Bridges = PRO door.

### Rejected
- Generic single `issuer` for both cards and PayPal.
- Manual `POST /api/accounts` for bank/card.
- Banks-only JIT without onboarding option.

## Decision: Dashboard hub vs Finances landing (2026-07-15 / 2026-07-16)

### Problem
Spec 005 bundled annual PYG + position into one “dashboard”. Hogar users need a light home and a separate place for deeper analysis without nested menus or the word “reporte”.

### Decision
| Surface | Role |
|---------|------|
| `/dashboard` | Hub: default **current month** KPIs from `monthlySeries[m]`; optional year totals; condensed position; insight tip (Pacho later). |
| `/finances` | Landing with three CTAs (plain language). |
| `/finances/pyg` | Full P&G: bars + balance line; Top **10** pies; exercise→months or month→days when API allows. |
| `/finances/balance` | Position breakdown; optional client-only leverage index (not in API/spec MVP). |
| `/finances/apuntes` | Filtered history (dates, accounts, amounts, description). |
| `/entries` | Capture only. |

### Month data
Reuse `GET /api/reports/pyg?year=` — no month-to-date endpoint in MVP.

### Out of Hogar MVP
Account/entity filters on P&G; Top 5/20 selector; formal debt-ratio FR; nested nav.

**Alternatives considered**: Nested “Reportes” menu — rejected (heavy). P&G inside dashboard — rejected (saturates home).

