<!--
Sync Impact Report
- Version change: 1.5.0 → 1.6.0
- Modified principles: none renamed
- Added sections: IX Exact monetary arithmetic
- Removed sections: none
- Templates requiring updates:
  ✅ specs/foundation/stack-architecture.md
  ✅ docs/adr/0001-stack-architecture-and-library-baseline.md
  ✅ specs/005-dashboard-pyg/spec.md (FR-API-008)
  ✅ .cursor/rules/implementation-standards.mdc
- Follow-up TODOs: none
-->

# TADOR Constitution

## Product Vision: Two modes, one engine

TADOR serves two distinct needs through the same accounting engine:

**HOGAR** gives peace of mind. It answers: *"Am I doing well with my money?"*
Simple, quick indicators — income, expenses, available balance, debts, net savings.
Clarity over technical detail. Designed so a person or family can understand their
financial health without thinking like an accountant.

**PRO** gives economic control. It answers: *"How is my economic activity performing
and what commitments do I have?"* Richer context — receivables, payables, assets,
liabilities, cash flow, real vs capital expense. Designed for independent
professionals and small businesses who need to distinguish profitability from
liquidity and expense from investment.

Both modes operate on the same data model and the same backend. They differ only in
UI density, level of detail, and which indicators are emphasized. Switching modes
never requires migration. The full definition lives in `specs/foundation/modos-hogar-pro.md`.

## Core Principles

### I. Simplicidad Hogar con motor contable real

TADOR MUST let a household user register everyday financial events through simple
language, short forms, and guided Apuntes in Modo Hogar, while exposing richer
operational detail in Modo PRO — all backed by the same correct accounting engine.
The UI MAY hide accounting codes, account parents, debits, and credits in Modo Hogar,
but the backend MUST preserve a correct accounting model that works for both modes.
Product work MUST NOT make casual users learn ERP-style workflows just to record
common income, expense, transfer, or card operations.

Rationale: TADOR is inspired by Conta Hogar's speed and clarity, but exists to avoid
the accounting limits that appeared as the user's needs became more professional.
The two-mode design ensures the app grows with the user without requiring data
migration or a product switch.

### II. Asiento atómico y partida doble

Every economic event persisted by TADOR MUST be represented internally as one or more
atomic, balanced journal entries. A saved Asiento MUST contain balanced lines and MUST
NOT be stored if debits and credits do not match. Corrections MUST be traceable by
controlled edit in an open period, reversal, adjustment, or linked replacement; silent
history deletion is forbidden.

Rationale: Balanced entries are the foundation that allows saldos, PYG, bridge
accounts, future CxC/CxP, and migration from legacy data to remain coherent.

### III. Plantillas versionadas antes que lógica ad hoc

Common operations MUST be implemented through versioned Plantillas that convert user
intent into validated Asientos. MVP templates MAY live as JSON in the repository.
Application code MUST validate template inputs, accounts, ownership, period status,
currency, and generated lines before persistence. New common patterns MUST extend or
add templates rather than hard-code accounting behavior in controllers or UI flows.

Rationale: Templates keep Hogar simple, enable PRO precision, and provide a safe
integration point for the future local AI interpreter.

### IV. Propiedad del usuario, privacidad y moneda estable

All financial data MUST be scoped to the owning user from the first implementation:
accounts, entities, tags, journal entries, templates applied to the user, reports,
periods, and settings. Cross-user reads or writes are critical defects. User currency
and money format MUST be established when the book is created and MUST NOT be changed
silently after financial records exist. Logs MUST NOT expose sensitive amounts,
descriptions, account names tied to private facts, or personally identifiable third
party data unless explicitly required for a secure audit trail.

Rationale: TADOR handles personal financial data and is intended to become
multi-user from the MVP.

### V. Plan de cuentas global, cuentas de usuario y Entidades

TADOR MUST separate the global chart-of-accounts structure from user-owned accounts.
The global plan gives NIIF-inspired classification and allowed locations; user
accounts represent concrete banks, cards, wallets, bridges, projects, and personal
tracking needs. Entidad MUST represent named objects such as banks, card issuers,
people, family members, clients, suppliers, institutions, or platforms. Entidad does
not imply formal CxC/CxP documents by itself; future CxC/CxP modules MUST reference
Entidades. The MVP MUST support registering receivable and payable debts as balance
accounts linked to Entidades (banks, card issuers, people, clients, suppliers).
Formal CxC/CxP documents (invoices, due-date tracking, aging, third-party account
statements) are post-MVP, but the account-plus-Entidad engine that supports them
MUST exist from the MVP so that switching between Modo Hogar and Modo PRO never
requires a data model change.

CLARIFICATION: "Cuenta por cobrar" and "cuenta por pagar" are balance accounts with
an Entidad reference. Registering a debt via an accounting entry IS core MVP.
Aging reports, invoice attachments, and formal CxC/CxP modules are separate
post-MVP capabilities. The account layer and the formal document layer are distinct;
the MVP implements the first and leaves the second for later sprints.

Rationale: This avoids mixing catalog defaults with one user's history while keeping
a migration path from the legacy plan and future professional modules, and ensures
mode switching stays a UI concern rather than a data migration.

### VI. PYG y Balance son preguntas distintas

Reports and calculations MUST distinguish between PYG and Balance. PYG answers what
income or expense occurred by income/expense accounts. Balance answers where money,
debt, assets, liabilities, or bridge balances are. Bridge/bypass accounts MAY net to
zero without erasing the PYG impact. The MVP dashboard MUST include a PYG panel that
aggregates from income and expense accounts only, not from bridge balances or
payment-method accounts, and a separate balance-position panel (available cash,
receivables, payables) derived from balance account saldos. The two panels MUST NOT
mix data sources.

Rationale: The canonical card, child/dependent, third-party funds, and bridge-account
cases depend on not confusing payment media with real income or expense.

### VII. Incremental delivery con TDD verificable

Implementation MUST follow "one sprint = one spec = one verifiable capability".
Backend work MUST be designed for TDD; once a test runner exists, tests for each
story's core behavior MUST be written before implementation and must fail first.
Specs that touch auth, tenant isolation, accounting integrity, templates, reports,
period closing, or AI interpretation MUST define independent tests and acceptance
criteria before implementation tasks are generated.

Rationale: The domain is subtle. Small, testable vertical slices protect accounting
integrity and keep the MVP from becoming an unreviewable rewrite.

### VIII. Secure, concurrent and maintainable implementation

Backend endpoints that create or mutate financial state MUST define concurrency and
idempotency behavior before implementation. Secure design MUST be applied by default:
validate inputs, enforce authorization at boundaries, avoid sensitive logs, and fail
closed for tenant-owned data. Package manifests MUST use stable releases, avoid
untested prerelease dependencies, and preserve exact resolved versions through the
package-manager lockfile. Technical infrastructure such as authentication,
encryption, token handling, validation, migrations, logging, and security controls
MUST prefer reputable open-source libraries or framework features over custom
implementations. Code MUST follow Clean Architecture boundaries, SOLID, and DRY with
judgment, avoiding premature abstractions. Class names, variables, procedures, files,
and endpoint route paths MUST be in English. Code comments MUST be rare, written in
English, and limited to complex procedures, non-obvious invariants, or
security/accounting reasoning.

Rationale: TADOR will mutate sensitive financial state. Idempotency, concurrency,
dependency hygiene, security, clear naming, and disciplined architecture reduce data
corruption, supply-chain, and long-term maintenance risk.

### IX. Exact monetary arithmetic

All monetary amounts MUST use exact decimal representation end-to-end:

1. **Persistence:** PostgreSQL `NUMERIC` / Prisma `Decimal` columns for stored amounts.
2. **Application/domain math:** `decimal.js` (`Decimal`) for aggregation, balance
   checks, quantization, and comparisons. Intermediate IEEE 754 binary floating-point
   (`number`) arithmetic on money is forbidden.
3. **Currency scale:** Quantize to the book's currency minor units (ISO 4217 fraction
   digits) with half-up rounding before persistence and before equality checks.
   MVP default is **USD with 2 fraction digits**. Unknown currency codes MUST default
   to 2 digits until an explicit ISO mapping is added — so new currencies do not
   require rewriting callers.
4. **API boundary:** JSON responses MAY expose JS `number` only after quantization;
   prefer deriving that number from a Decimal/string, never from unchecked float sums.

Rationale: Binary floating-point cannot represent common decimal fractions exactly
(e.g. 0.1). Accounting invariants (balanced Asientos, saldos, reports) require
exact decimal math so multi-currency support can grow without rewriting the engine.

## Product & Domain Constraints

- MVP scope is defined in `specs/foundation/mvp-scope.md`.
- Mode definitions (Hogar vs PRO) are defined in `specs/foundation/modos-hogar-pro.md`.
- All specs and sprints MUST respect the Hogar/PRO distinction described in that document.
- The implementation sequence MUST follow `specs/foundation/estrategia-incremental-sprints.md`
  unless a spec explicitly amends that order.
- The mandatory MVP dashboard is described in `specs/foundation/reporte-pyg-mvp.md`
  and spec `005-dashboard-pyg`: annual PYG panel plus a separate balance-position
  panel (available cash, receivables, payables).
- Plantilla design MUST start from `specs/foundation/plantillas-mvp-v0.md`.
- Canonical behavior MUST be checked against `specs/foundation/casos-canonicos-demo.md`.
- The legacy chart review in `specs/foundation/reglas-plan-cuentas.md` is migration
  input, not the final global plan.
- The MVP explicitly excludes formal invoices, formal CxC/CxP documents and
  third-party account statements, periodic entries, deferred credit-card purchases,
  reconciliation, inventory, kardex, advanced reports, and autonomous AI execution.
  Exclusion of formal CxC/CxP does NOT exclude registering receivable/payable debts
  as balance accounts linked to Entidades; that capability is MVP core.
- MVP closure criteria: the product is complete when a user can:
  (1) register and authenticate,
  (2) configure their currency on first login,
  (3) receive the initial chart of accounts,
  (4) create guided personal accounts,
  (5) create basic entities,
  (6) record everyday journal entries via templates,
  (7) record transfers between accounts,
  (8) use bridge/bypass accounts,
  (9) view current account balances,
  (10) view the dashboard with PYG and position panels,
  (11) close and re-open a fiscal year,
  (12) use the local AI v0 to suggest simple templates in Modo Hogar.

## Technical Direction

- Planned frontend: React, TypeScript, Vite, Mantine, Zustand, React Query.
- Planned backend: Node.js, Fastify, PostgreSQL, Prisma.
- Planned infrastructure: Docker.
- Planned AI: local small model used only as an interpreter that suggests templates
  and prefilled fields in Modo Hogar.
- The AI MUST NOT create journal entries directly, bypass backend validation, modify
  closed periods, or execute without user confirmation.
- Until implementation manifests exist, specs MUST treat this stack as planned and
  confirm concrete tooling in each `plan.md`.
- Mutating backend features MUST document idempotency and concurrency strategy in
  their implementation plans.
- Plans that introduce dependencies MUST include a dependency research section that
  prefers stable, reputable OSS packages and documents rejected risky alternatives.

## Development Workflow

- Use Spec Kit for one capability at a time: specify → plan → tasks → implement.
- Do not create a full-MVP mega-spec; create one spec per sprint/capability.
- Every `plan.md` MUST include a Constitution Check covering tenant isolation,
  accounting balance, templates, PYG/Balance separation, TDD/test strategy, and MVP
  scope, plus secure design, concurrency/idempotency, architecture boundaries, and
  naming/comment standards when code is involved.
- Every `tasks.md` for backend behavior MUST include test tasks once the test runner
  exists. If no runner exists, the spec MUST make tooling setup part of the sprint.
- Documentation changes that alter domain meaning MUST update foundation docs or cite
  the spec that supersedes them.
- Commits created by the assistant in this workspace MUST use Spanish commit messages.

## Governance

This constitution supersedes ad hoc project guidance for TADOR product and
engineering decisions. Foundation documents provide rationale and examples, but specs
and plans MUST comply with this constitution.

Amendments MUST:

- document the reason for the change,
- update affected templates or guidance files,
- include a Sync Impact Report in this file,
- use semantic versioning:
  - MAJOR for incompatible principle or governance changes,
  - MINOR for new principles or materially expanded obligations,
  - PATCH for clarifications that do not change obligations.

Each new Spec Kit plan MUST pass the Constitution Check before Phase 0 research and
again after Phase 1 design. Violations MUST be listed in Complexity Tracking with the
simpler alternative that was rejected.

---
## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **TADOR** | Web application to facilitate household economy with correct accounting foundations, designed to grow towards light professional use. |
| **Hogar** | Simple, guided mode using everyday language. Hides account codes, parent accounts, debits/credits, and accounting complexity. |
| **PRO** | Explicit mode that exposes accounting details without becoming an ERP. |
| **Book (Libro)** | A user's complete financial dataset: accounts, entities, journal entries, templates, periods, settings. |
| **Account (Cuenta)** | Chart-of-accounts element that classifies balances, income, expenses, liabilities, equity, or bridge/bypass values. |
| **Parent account (Cuenta madre)** | Grouping account (GRP), non-postable. Organizes the chart of accounts. |
| **Postable account (Cuenta postable)** | Leaf account (MOV) that receives journal entry lines. |
| **Global chart of accounts (Plan de cuentas global)** | NIIF-inspired base catalog maintained by TADOR. |
| **User chart of accounts (Plan de cuentas del usuario)** | Personalization on top of the global plan with user-owned accounts. |
| **Asiento** | Atomic, balanced, auditable journal entry. Contains a header and lines. |
| **Journal entry line (Línea de asiento)** | Individual account movement within an Asiento. |
| **Apunte** | Guided template that converts an everyday intention into one or more valid Asientos. |
| **Manual entry (Asiento manual)** | PRO-mode open entry with explicit balance validation. |
| **Transfer (Traspaso)** | Template that moves value between accounts without direct PYG impact. |
| **Template (Plantilla)** | Recipe that takes user parameters and generates a valid Asiento. |
| **Entidad** | Named-object abstraction: bank, person, platform, card issuer, client, supplier, etc. Does not imply formal CxC/CxP documents; can link balance accounts for receivables/payables. |
| **Tag** | Context marker for filtering or grouping. If representing a reusable named entity, MUST be an Entidad instead. |
| **Bridge account (Cuenta puente)** | Account that accumulates or nets passing values without confusing PYG with balance. |
| **PYG** | Income/expense view. Answers "how much did I earn or spend by category?" |
| **Balance** | Asset, liability, and equity view. Answers "where is the money and what do I owe?" |
| **Annual close (Cierre anual)** | Lock modification on a fiscal year, with optional re-opening. |
| **Re-opening (Reapertura)** | Action to re-enable modification of a previously closed fiscal year. |
| **Double-entry (Partida doble)** | Accounting principle: every journal entry has debits and credits that MUST sum to equal amounts. |
| **Idempotency (Idempotencia)** | Property by which the same request can be sent multiple times without creating duplicates. |

**Version**: 1.6.0 | **Ratified**: 2026-06-20 | **Last Amended**: 2026-07-12
