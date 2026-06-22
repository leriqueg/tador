# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Document PASS/FAIL for each TADOR constitution gate:

- **MVP Scope & Sprint Fit**: Does this plan implement one sprint/capability only,
  and does it stay inside `specs/foundation/mvp-scope.md` or explicitly document an
  approved scope change?
- **Tenant & Privacy**: Are all user-owned data reads/writes scoped by authenticated
  user, with no cross-user access path and no sensitive financial/PII leakage in logs?
- **Accounting Integrity**: If this plan touches financial records, are all persisted
  events represented as balanced Asientos with traceable correction behavior?
- **Plantilla Discipline**: If this plan adds common user operations, are they modeled
  as versioned Plantillas rather than hard-coded controller/UI accounting logic?
- **Plan de Cuentas & Entidades**: Does this plan preserve the split between global
  chart structure, user-owned accounts, and Entidades as named objects?
- **PYG vs Balance**: If this plan touches reports/saldos/bridges, does it keep PYG
  aggregation separate from balance and bridge/payment account balances?
- **TDD & Tests**: Does this plan define test tooling or tests first for core backend
  behavior, especially auth, tenant isolation, accounting, templates, reports, periods,
  or AI interpretation?
- **AI Safety**: If this plan touches IA v0, does AI only suggest templates/fields and
  route execution through validated backend APIs with user confirmation?
- **Concurrency & Idempotency**: If this plan creates or mutates backend state, does it
  define duplicate-request behavior, concurrent update handling, and retry safety?
- **Secure Design & Architecture**: Does the plan preserve Clean Architecture
  boundaries, validate inputs, enforce authorization, avoid sensitive logs, and fail
  closed for tenant-owned data?
- **Maintainability Standards**: Does the plan follow SOLID/DRY without premature
  abstraction, use English names for code/endpoints, and limit English comments to
  complex procedures or non-obvious invariants?
- **Dependency Hygiene**: If this plan creates or changes package manifests, does it
  use stable releases, lock exact resolved versions, avoid prerelease/untested
  packages, and prefer reputable OSS libraries/framework features for security and
  infrastructure?

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
