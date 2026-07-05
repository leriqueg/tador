# Apply Progress: Sprint 02 — Catálogos base (TDD)

**Mode**: TDD (test-first domain)
**Delivery**: Single PR to main

## Completed

### Phase 1: Domain unit tests (TDD)
- 32 unit tests created across 5 domain entities
- All tests pass (GREEN) against existing domain types
- `vitest.unit.config.ts` added for isolated unit test execution

### Phase 2-5 (existing on main)
All infrastructure, seed, API routes, and integration tests for Sprint 02 already existed on main before branching. No changes needed.

## Files Created
| File | Purpose |
|------|---------|
| `backend/tests/unit/cuenta-global.test.ts` | 5 tests: postable, parent-child, legacy |
| `backend/tests/unit/cuenta-usuario.test.ts` | 8 tests: 4 tipos, defaults, tenant |
| `backend/tests/unit/entidad.test.ts` | 7 tests: 4 tipos, structure, unique |
| `backend/tests/unit/tag.test.ts` | 5 tests: creation, immutability, unique |
| `backend/tests/unit/activacion-cuenta-global.test.ts` | 7 tests: activation, overrides |
| `backend/vitest.unit.config.ts` | Isolated unit test config |
| `openspec/changes/002-catalogos-tdd/tasks.md` | TDD task list (updated) |
| `openspec/changes/002-catalogos-tdd/apply-progress.md` | This file |

## Verification
- Unit tests: `npm run test:unit` → 32/32 pass
- Integration tests: require PostgreSQL (Docker) — not executed in this session

## Status
**COMPLETE** — 20/20 tasks done. Ready for review.
