# Frontend testing strategy (70 / 20 / 10)

Automated tests follow the **testing pyramid**: many fast, isolated checks at the base; fewer tests that wire modules together; a thin slice of full-browser journeys at the top.

| Layer | Share | Tooling | Location | Purpose |
|-------|-------|---------|----------|---------|
| **Unit** | ~70% | Vitest + jsdom | `src/**/*.test.ts` | Pure helpers, redirects, API error types — no React tree |
| **Integration** | ~20% | Vitest + Testing Library | `src/**/*.integration.test.tsx` | Pages/shell with mocked auth, book gate, and API |
| **E2E** | ~10% | Playwright | `e2e/**/*.spec.ts` | Critical user journeys against real Vite + backend |

## Host vs Docker (E2E)

| Mode | Who runs Playwright | Frontend URL | Backend URL (API setup) | Vite proxy |
|------|---------------------|--------------|-------------------------|------------|
| **Host** (`npm run test:e2e` / `make test-e2e-host`) | Your machine | `http://localhost:5173` | `http://localhost:3000` | default → localhost:3000 |
| **Docker** (`make test-e2e`) | `e2e` container | `http://frontend:5173` | `http://backend:3000` | `VITE_PROXY_TARGET=http://backend:3000` |

Defaults (`localhost`) are for host runs. Inside containers, `localhost` is the container itself — that is why E2E from the frontend container failed talking to `:3000`.

**CI-friendly practice:** stack services + test runner share a Docker network and use **service DNS** (`backend`, `frontend`). Published host ports are optional (handy for debugging), not required for the runner.

Env overrides:

- `PLAYWRIGHT_BASE_URL` — browser `baseURL`
- `PLAYWRIGHT_API_URL` — direct API calls in setup helpers
- `PLAYWRIGHT_SKIP_WEBSERVER=1` — do not start Vite (reuse compose `frontend`)

## What each layer covers

### Unit (~70%)

- `lib/finance.ts` — `monthFromSeries`, `leverageRatio`, `leverageHint`, `formatMoney`
- `lib/post-auth-redirect.ts` — uninitialized book → `/onboarding`, else `/dashboard`
- `lib/api.ts` — `ApiRequestError` shape

No network, no router, sub-millisecond runs.

### Integration (~20%)

- Hogar pages with **vi.mock** on `useAuth`, `useBookGate`, and `reports` / `book`
- Asserts visible copy, navigation cards, and loading/error states
- Faster than E2E; catches regressions in component + hook wiring

### E2E (~10%)

High-value flows only:

1. **Marketing smoke** — landing headline and CTA
2. **Guest auth** — login form validation / bad credentials
3. **Authenticated shell** — setup user via API → login UI → Resumen, Estado, Apuntes nav
4. **Finances drill-down** — Estado landing → P&G / Balance headings

## Commands

```bash
# From repo root (preferred for other machines / CI)
make test-frontend   # Vitest in frontend container
make test-e2e        # Postgres + backend + frontend + Playwright (compose network)

# Host-only E2E (backend published on :3000)
make test-e2e-host
# or:
cd frontend && npm run test:e2e

# Vitest on host
cd frontend
npm run test
npm run test:unit
npm run test:integration
npm run test:coverage
```

## CI

- **Always**: frontend `test:unit` + `test:integration` on PR (no Docker).
- **E2E**: `make test-e2e` (or equivalent compose `--profile e2e`) so the runner never depends on host `localhost`.

## Adding tests

- New **pure function** → unit test next to the module.
- New **page behavior** (conditional UI, mocked API) → integration test.
- New **cross-service journey** (auth cookie, real API) → E2E only if it protects revenue/onboarding/capture.

Avoid duplicating the same assertion at every layer: unit proves math, integration proves wiring, E2E proves the product path works end-to-end.
