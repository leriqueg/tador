<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: VII (expanded plan checks); added VIII (Secure, concurrent and maintainable implementation)
- Added sections: none
- Removed sections: none
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md
  ✅ .specify/templates/spec-template.md
  ✅ .specify/templates/tasks-template.md
  ✅ README.md (reviewed; no update required)
  ✅ .cursor/rules/specify-rules.mdc (reviewed; no update required)
- Follow-up TODOs: none
-->

# TADOR Constitution

## Core Principles

### I. Simplicidad Hogar con motor contable real

TADOR MUST let a household user register everyday financial events through simple
language, short forms, and guided Apuntes. The UI MAY hide accounting codes, account
parents, debits, and credits in Modo Hogar, but the backend MUST preserve a correct
accounting model. Product work MUST NOT make casual users learn ERP-style workflows
just to record common income, expense, transfer, or card operations.

Rationale: TADOR is inspired by Conta Hogar's speed and clarity, but exists to avoid
the accounting limits that appeared as the user's needs became more professional.

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
not imply CxC/CxP by itself; future CxC/CxP modules MUST reference Entidades.

Rationale: This avoids mixing catalog defaults with one user's history while keeping
a migration path from the legacy plan and future professional modules.

### VI. PYG y Balance son preguntas distintas

Reports and calculations MUST distinguish between PYG and Balance. PYG answers what
income or expense occurred by income/expense accounts. Balance answers where money,
debt, assets, liabilities, or bridge balances are. Bridge/bypass accounts MAY net to
zero without erasing the PYG impact. The MVP PYG dashboard MUST aggregate from income
and expense accounts, not from bridge balances or payment-method accounts.

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
closed for tenant-owned data. Code MUST follow Clean Architecture boundaries, SOLID,
and DRY with judgment, avoiding premature abstractions. Class names, variables,
procedures, files, and endpoint route paths MUST be in English. Code comments MUST be
rare, written in English, and limited to complex procedures, non-obvious invariants,
or security/accounting reasoning.

Rationale: TADOR will mutate sensitive financial state. Idempotency, concurrency,
security, clear naming, and disciplined architecture reduce data corruption and
long-term maintenance risk.

## Product & Domain Constraints

- MVP scope is defined in `specs/foundation/mvp-scope.md`.
- The implementation sequence MUST follow `specs/foundation/estrategia-incremental-sprints.md`
  unless a spec explicitly amends that order.
- The only mandatory MVP report is the annual PYG dashboard described in
  `specs/foundation/reporte-pyg-mvp.md`.
- Plantilla design MUST start from `specs/foundation/plantillas-mvp-v0.md`.
- Canonical behavior MUST be checked against `specs/foundation/casos-canonicos-demo.md`.
- The legacy chart review in `specs/foundation/reglas-plan-cuentas.md` is migration
  input, not the final global plan.
- The MVP explicitly excludes formal invoices, formal CxC/CxP, periodic entries,
  deferred credit-card purchases, reconciliation, inventory, kardex, advanced
  reports, and autonomous AI execution.

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

**Version**: 1.1.0 | **Ratified**: 2026-06-20 | **Last Amended**: 2026-06-22
