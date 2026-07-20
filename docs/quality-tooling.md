# Herramientas de calidad — TADOR

**Fecha de corte:** 2026-07-18

**Última actualización:** 2026-07-19

Inventario de las herramientas de calidad **aplicadas hoy** en el repositorio, dónde
se configuran, y las herramientas **recomendadas** para cerrar brechas. La seguridad
se documenta aparte en [`docs/security.md`](./security.md).

> **Cómo implementar cada brecha (paso a paso):**
> [`specs/011-seguridad-calidad-y-tests/close-quality-gaps.md`](../specs/011-seguridad-calidad-y-tests/close-quality-gaps.md)
>
> **Cómo refrescar conteos y badges:**
> [`specs/011-seguridad-calidad-y-tests/update-procedure.md`](../specs/011-seguridad-calidad-y-tests/update-procedure.md)
>
> **Informe consolidado:**
> [`docs/software-quality-report.md`](./software-quality-report.md)

---

## Aplicadas actualmente

Estas herramientas forman controles complementarios: el compilador detecta
inconsistencias de tipos, el linter señala defectos y convenciones, las pruebas
aportan evidencia de comportamiento y la cobertura identifica código no
ejercitado. Ninguna métrica aislada equivale a calidad; el criterio se aproxima
con evidencia diversa y riesgos residuales explícitos, en línea con
mantenibilidad, fiabilidad y seguridad de ISO/IEC 25010.

| Herramienta | Ámbito | Dónde | Qué garantiza |
|-------------|--------|-------|---------------|
| **TypeScript strict (`tsc --noEmit`)** | Backend | `make typecheck`, CI job `test` | Tipado estático sin emitir; contrato de tipos correcto |
| **TypeScript build (`tsc -b`)** | Frontend | `npm run build`, CI job `frontend` | Typecheck de proyecto + build de producción |
| **oxlint** | Backend + Frontend | `npm run lint`, `.oxlintrc.json`, CI | Linter rápido; TS/oxc (backend) y React hooks (frontend) |
| **Vitest** | Backend + Frontend | `vitest.*.config.ts` | Unit + integración (ver `docs/testing-strategy.md`) |
| **@vitest/coverage-v8** | Backend + Frontend | `npm run test:coverage` | BE: `domain/` + `application/`; FE: `lib/`, `pages/`, `components/` |
| **Umbrales de cobertura FE** | Frontend | `frontend/vitest.config.ts` | Gate anti-regresión: lines/statements ≥ 45 %, functions/branches ≥ 40 % |
| **Umbrales de cobertura BE** | Backend | `backend/vitest.unit.config.ts` | Gate anti-regresión domain+app: ≥15/15/15/12 |
| **Playwright** | Frontend/E2E | `playwright.config.ts` | Recorridos de usuario en Chromium (`make test-e2e` → 9 passed al cierre) |
| **Storybook** | Frontend | `npm run storybook` | Documentación y aislamiento visual; transforma patrones de [mockups Stitch en una biblioteca de componentes](diseno-visual-y-storybook.md) |
| **GitHub Actions CI** | Repo | `.github/workflows/ci.yml` | Typecheck + lint + unit + coverage + integración |
| **Docker Compose** | Repo | `compose.yaml`, `compose.e2e.yaml` | Entorno reproducible; volúmenes nombrados de `node_modules` |
| **Prisma migrate** | Backend | `make db-migrate` | Integridad de esquema y migraciones versionadas |
| **decimal.js** | Backend | dominio/aplicación | Aritmética monetaria exacta (Constitución IX) |

### Detalle de la CI

`.github/workflows/ci.yml` corre en `push`/`pull_request` a `main`, con Node 22:

- **Job `test` (backend)**: `npm ci` → `prisma generate` → `typecheck` → `lint`
  → `test:unit` → `test:coverage` → `test:integration` (Postgres `tador_test`).
- **Job `frontend`**: `npm ci` → `build` → `lint` → `test:unit` → `test:integration`
  → `test:coverage` (con umbrales).

Los E2E de Playwright **no** corren en CI todavía; se ejecutan localmente con
`make test-e2e`.

---

## Brechas y herramientas recomendadas

| Prioridad | Herramienta | Motivo | Acción sugerida |
|-----------|-------------|--------|-----------------|
| **Alta** | **Prettier o Biome (format)** | No hay formateo automático consistente | Adoptar Biome o Prettier; verificar en CI |
| **Media** | **Subir cobertura unitaria BE/FE** | FE ~49 % lines; BE domain+app ~19 % lines (unit); referencia objetivo 70 % | Más tests unitarios; subir umbrales gradualmente |
| **Media** | **Husky + lint-staged** | Nada bloquea commits con errores de lint/format | Pre-commit solo sobre staged |
| **Media** | **E2E en CI (nightly/opcional)** | Playwright solo corre local | Job con perfil Docker `make test-e2e` |
| **Baja** | **Codecov / badge de cobertura** | Visibilidad en PR | Subir `lcov` |
| **Baja** | **Chromatic / snapshot visual** | Storybook sin regresión visual | Cuando el catálogo UI se estabilice |
| **Baja** | **Headers estáticos en prod** | ZAP WARN en Vite SPA | CSP / XFO / etc. en reverse proxy |

> Pasos restantes (Q2, Q5–Q8, S1–S4):
> [`specs/011-seguridad-calidad-y-tests/close-quality-gaps.md`](../specs/011-seguridad-calidad-y-tests/close-quality-gaps.md)

---

## Comandos de calidad disponibles hoy

```bash
# Backend
make typecheck          # tsc --noEmit
make lint-backend       # oxlint
make coverage-backend   # cobertura unitaria domain + application
make check              # typecheck + tests de integración

# Frontend
make lint-frontend
make test-frontend
docker compose run --rm --no-deps frontend npm run test:coverage
```
