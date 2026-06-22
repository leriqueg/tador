# Open-source dependency research inventory

This document lists technical artifacts that require dependency research before
implementation. TADOR should prefer stable, reputable open-source libraries and
framework features for technical infrastructure instead of custom implementations.

## Dependency policy

- Use stable package releases only.
- Avoid alpha, beta, release-candidate, abandoned, or untested packages for product code.
- Keep exact resolved versions in the package manager lockfile.
- Review package reputation, maintenance activity, license, security history, and ecosystem adoption before adoption.
- Prefer framework-native capabilities when they are mature and fit the need.
- Do not reinvent security-sensitive mechanisms such as password hashing, token signing, encryption, validation, or migrations.

## Research backlog

| Sprint | Artifact | Why needed | Research decision needed |
|--------|----------|------------|--------------------------|
| 01 Plataforma base | Backend project tooling | Establish stable TypeScript backend foundation. | Package manager, Node LTS version, TypeScript config, module format. |
| 01 Plataforma base | Fastify core setup | Main HTTP server framework. | Stable Fastify version and first-party plugin set. |
| 01 Plataforma base | Environment configuration | Safe config loading and validation. | Config/env validation package or framework pattern. |
| 01 Plataforma base | Authentication | Email/password login and session/access handling. | Auth library/framework approach, password hashing, token/session strategy. |
| 01 Plataforma base | Password hashing | Security-sensitive credential storage. | Reputable hashing library and algorithm parameters. |
| 01 Plataforma base | Password recovery tokens | Secure reset flow. | Token generation/storage/expiry strategy and library support. |
| 01 Plataforma base | Email delivery | Verification and password recovery. | Transactional email provider/library abstraction for MVP. |
| 01 Plataforma base | Input validation | Validate request payloads consistently. | Schema validation library compatible with Fastify/TypeScript. |
| 01 Plataforma base | Rate limiting / throttling | Protect auth and recovery endpoints. | Fastify-compatible rate limiting package and defaults. |
| 01 Plataforma base | Security headers / CORS | Browser/API hardening. | Stable Fastify plugins or reverse-proxy responsibility split. |
| 01 Plataforma base | Logging | Operational logs without financial/PII leakage. | Structured logger and redaction strategy. |
| 01 Plataforma base | Test runner | Required for backend TDD. | Test runner, assertion style, coverage, integration-test strategy. |
| 01 Plataforma base | Lint/format/typecheck | Maintain code quality. | ESLint/Prettier/TypeScript stable setup. |
| 01 Plataforma base | PostgreSQL access | Persistence foundation. | Prisma stable version and migration workflow. |
| 01 Plataforma base | Docker development | Reproducible local environment. | Compose layout for app, database, migrations, test database. |
| 02 Catálogos base | Seed/migration workflow | Load global chart seed safely. | Prisma seeding pattern and idempotent seed strategy. |
| 02 Catálogos base | Slug/code normalization | Stable account/entity identifiers. | Whether to use a library or internal deterministic helpers. |
| 03 Motor contable | Decimal money arithmetic | Avoid floating-point accounting errors. | Decimal representation/library and database mapping. |
| 03 Motor contable | Concurrency control | Prevent conflicting financial writes. | Transaction isolation, optimistic locking, idempotency keys. |
| 03 Motor contable | Audit history | Track controlled edits in open periods. | Audit table pattern vs library support. |
| 04 Plantillas MVP | JSON schema validation | Validate versioned templates from repo. | JSON schema validator and schema versioning strategy. |
| 04 Plantillas MVP | Idempotency keys | Avoid duplicate Apuntes/Asientos on retry. | Header/body key convention and persistence strategy. |
| 05 Dashboard PYG | Date/month handling | Group by exercise and month correctly. | Date utility library or native Temporal availability. |
| 05 Dashboard PYG | Charting | Frontend visual dashboard. | Stable React chart library compatible with Vite/Mantine. |
| 06 Frontend Hogar | Form handling | Mobile-first guided forms. | Mantine form vs alternative form library. |
| 06 Frontend Hogar | Client validation | UX validation aligned with backend schemas. | Shared schema strategy or frontend-only validation. |
| 06 Frontend Hogar | Data fetching | Server state and cache. | React Query stable version and conventions. |
| 06 Frontend Hogar | App state | UI state/mode selection. | Zustand stable version and persistence strategy. |
| 07 Frontend PRO ligero | Editable grids/forms | Asiento manual UX. | Whether Mantine components suffice or a grid library is needed. |
| 08 IA v0 | Local model runtime | Interpret natural language locally. | Ollama/llama.cpp/runtime choice and deployment constraints. |
| 08 IA v0 | Structured AI output | Produce validated template suggestions. | JSON schema validation and constrained-output strategy. |
| 08 IA v0 | Prompt safety | Prevent autonomous accounting execution. | Guardrail approach and backend confirmation contract. |

## Package selection checklist

Before adding a package, document:

- Package name and purpose.
- Stable version selected.
- License.
- Maintenance signal: recent releases, issue activity, maintainer status.
- Security signal: known advisories, dependency footprint, audit result.
- Alternatives considered.
- Why a library/framework feature is better than custom code.
- How version locking is enforced.

## Immediate research priority

Sprint 01 must research first:

1. Package manager and lockfile policy.
2. Node LTS and TypeScript version.
3. Fastify stable version and first-party plugins.
4. Prisma/PostgreSQL migration workflow.
5. Auth, password hashing, email verification, password recovery.
6. Test runner, lint, formatter, coverage.
7. Docker development and test database setup.
