# Herramientas de calidad — TADOR

**Última actualización:** 2026-07-16

Inventario de las herramientas de calidad **aplicadas hoy** en el repositorio, dónde
se configuran, y las herramientas **recomendadas** para cerrar brechas. La seguridad
se documenta aparte en [`docs/security.md`](./security.md).

> **Cómo implementar cada brecha (paso a paso):**  
> [`specs/010-seguridad-calidad-y-tests/close-quality-gaps.md`](../specs/010-seguridad-calidad-y-tests/close-quality-gaps.md)  
> **Cómo refrescar conteos y badges:**  
> [`specs/010-seguridad-calidad-y-tests/update-procedure.md`](../specs/010-seguridad-calidad-y-tests/update-procedure.md)

---

## Aplicadas actualmente

| Herramienta | Ámbito | Dónde | Qué garantiza |
|-------------|--------|-------|---------------|
| **TypeScript strict (`tsc --noEmit`)** | Backend | `make typecheck`, CI job `test` | Tipado estático sin emitir; contrato de tipos correcto |
| **TypeScript build (`tsc -b`)** | Frontend | `npm run build`, CI job `frontend` | Typecheck de proyecto + build de producción |
| **oxlint** | Frontend | `npm run lint`, `frontend/.oxlintrc.json` | Linter Rust ultrarrápido; reglas React (`rules-of-hooks`), TypeScript y `oxc` |
| **Vitest** | Backend + Frontend | `vitest.*.config.ts` | Unit + integración (ver `docs/testing-strategy.md`) |
| **@vitest/coverage-v8** | Frontend | `npm run test:coverage` | Cobertura de `lib/`, `pages/`, `components/` |
| **Playwright** | Frontend/E2E | `playwright.config.ts` | Recorridos de usuario en Chromium |
| **Storybook** | Frontend | `npm run storybook` | Documentación y aislamiento visual de componentes |
| **GitHub Actions CI** | Repo | `.github/workflows/ci.yml` | Typecheck + unit + integración en cada PR a `main` |
| **Docker Compose** | Repo | `compose.yaml`, `compose.e2e.yaml` | Entorno reproducible; DB de test aislada (`tador_test`) |
| **Prisma migrate** | Backend | `make db-migrate` | Integridad de esquema y migraciones versionadas |
| **decimal.js** | Backend | dominio/aplicación | Aritmética monetaria exacta (Constitución IX) |

### Detalle de la CI

`.github/workflows/ci.yml` corre en `push`/`pull_request` a `main`, con Node 22:

- **Job `test` (backend)**: `npm ci` → `prisma generate` → `typecheck` → `test:unit`
  → `test:integration` (contra un servicio Postgres 16 con `tador_test`).
- **Job `frontend`**: `npm ci` → `build` (typecheck) → `test:unit` → `test:integration`.

Los E2E de Playwright **no** corren en CI todavía; se ejecutan localmente con
`make test-e2e`.

---

## Brechas y herramientas recomendadas

Priorizadas por impacto/esfuerzo. Ninguna está aplicada aún.

| Prioridad | Herramienta | Motivo | Acción sugerida |
|-----------|-------------|--------|-----------------|
| **Alta** | **oxlint en backend** | El backend no tiene linter; solo typecheck | Añadir `oxlint` + `.oxlintrc.json` al backend y a la CI |
| **Alta** | **Prettier o Biome (format)** | No hay formateo automático consistente | Adoptar Biome (formatea + lint) o Prettier; verificar en CI |
| **Alta** | **Umbrales de cobertura** | Cobertura existe pero no se exige | `coverage.thresholds` en Vitest + reporte en CI |
| **Media** | **Cobertura de backend** | Backend no reporta cobertura | Añadir `@vitest/coverage-v8` al backend |
| **Media** | **Husky + lint-staged** | Nada bloquea commits con errores de lint/format | Pre-commit: typecheck + lint + format sobre staged |
| **Media** | **E2E en CI (nightly/opcional)** | Playwright solo corre local | Job con perfil Docker `make test-e2e` |
| **Baja** | **Codecov / badge de cobertura** | No hay visibilidad de cobertura en PR | Subir `lcov` a Codecov y añadir badge |
| **Baja** | **Chromatic / snapshot visual** | Storybook sin regresión visual | Regresión visual cuando el catálogo UI se estabilice |

> **Sugerencia de consolidación:** adoptar **Biome** cubriría a la vez *lint* +
> *format* en backend y frontend con una sola herramienta y una sola config, y es
> combinable con `oxlint` o puede reemplazarlo. Evaluar antes de sumar Prettier +
> ESLint por separado.
>
> Pasos de implementación (Q1–Q8, S0–S4):  
> [`specs/010-seguridad-calidad-y-tests/close-quality-gaps.md`](../specs/010-seguridad-calidad-y-tests/close-quality-gaps.md)

---

## Comandos de calidad disponibles hoy

```bash
# Backend
make typecheck          # tsc --noEmit
make check              # typecheck + tests de integración

# Frontend
cd frontend
npm run lint            # oxlint
npm run build           # tsc -b + vite build (typecheck)
npm run test:coverage   # cobertura V8
```
