# Cierre de brechas — calidad y seguridad

**Última actualización:** 2026-07-16

Instrucciones concretas para implementar más adelante las herramientas listadas
como brechas en [`docs/quality-tooling.md`](../../docs/quality-tooling.md) y
[`docs/security.md`](../../docs/security.md).

Tras cada ítem cerrado: actualizar la tabla “Aplicadas” / “Brechas” del doc
correspondiente, la marca de tiempo, y (si aplica) badges del README — siguiendo
[`update-procedure.md`](./update-procedure.md).

---

## Principio de decisión

1. **Una herramienta por problema.** No instalar Biome + Prettier + ESLint a la vez.
2. Preferir **Biome** si se quiere unificar format + lint en monorepo.
3. Mantener **oxlint** en frontend si ya está y funciona; no migrar “por moda”.
4. Seguridad: primero **JudgmentDay**, luego tooling automático según hallazgos.

---

## Q1 — oxlint en backend (prioridad alta)

**Problema:** el backend solo tiene `tsc --noEmit`; no hay linter de estilo/bugs.

**Pasos:**

1. En `backend/`:
   ```bash
   npm install -D oxlint
   ```
2. Crear `backend/.oxlintrc.json` (plugins `typescript`, `oxc`; ignore `dist`, `node_modules`).
3. Añadir script en `backend/package.json`:
   ```json
   "lint": "oxlint"
   ```
4. Añadir target en Makefile (opcional):
   ```make
   lint-backend:
   	$(RUN_BACKEND) npm run lint
   ```
5. En `.github/workflows/ci.yml`, job `test`, después de `typecheck`:
   ```yaml
   - name: Lint
     run: npm run lint
   ```
6. Actualizar `docs/quality-tooling.md` (mover fila de brecha → aplicadas).

**No tocar:** frontend oxlint ya existente.

---

## Q2 — Formato consistente: Biome o Prettier (prioridad alta)

**Decisión recomendada:** Biome (`biome.json` en raíz o por paquete).

**Pasos (Biome):**

1. Instalar `@biomejs/biome` en `backend` y/o `frontend` (o workspace raíz si se unifica).
2. `npx @biomejs/biome init`
3. Scripts: `"format": "biome format --write ."`, `"check:format": "biome check ."`.
4. CI: job que falle si `biome check` no está limpio.
5. (Opcional) Husky + lint-staged → ver Q5.

**Si se elige Prettier en su lugar:** no instalar Biome. Un solo formateador.

**No tocar:** reglas de dominio, contratos de API, ni renombrar archivos masivamente en el mismo PR que introduce el formatter (PR dedicado al format).

---

## Q3 — Umbrales de cobertura frontend (prioridad alta)

**Problema:** existe `npm run test:coverage` pero no hay umbral que falle CI.

**Pasos:**

1. En `frontend/vitest.config.ts`, dentro de `test.coverage`:
   ```ts
   thresholds: {
     lines: 50,      // subir gradualmente
     functions: 50,
     branches: 40,
     statements: 50,
   },
   ```
2. Añadir paso en CI job `frontend`:
   ```yaml
   - name: Coverage
     working-directory: frontend
     run: npm run test:coverage
   ```
3. Documentar umbrales en `docs/quality-tooling.md`.
4. (Opcional Q7) Subir `coverage/` / lcov a Codecov y badge.

**No tocar:** umbrales agresivos (80%+) en el primer PR; subir de forma incremental.

---

## Q4 — Cobertura de backend (prioridad media)

**Pasos:**

1. `npm install -D @vitest/coverage-v8` en `backend`.
2. Añadir `coverage` a `vitest.unit.config.ts` (empezar por unitarias; integración es más lenta).
3. Script `"test:coverage": "vitest run --config vitest.unit.config.ts --coverage"`.
4. CI opcional en job `test`.
5. Actualizar `docs/quality-tooling.md` + `docs/testing-strategy.md` (backlog).

---

## Q5 — Husky + lint-staged (prioridad media)

**Pasos:**

1. En la raíz (o en cada paquete): `husky` + `lint-staged`.
2. Pre-commit: lint + format **solo archivos staged** (nunca `make check` completo en commit).
3. Typecheck completo dejarlo en CI, no en pre-commit (demasiado lento).

**No tocar:** `--no-verify` en documentación; no documentar cómo saltarse hooks.

---

## Q6 — E2E en CI (prioridad media)

**Pasos:**

1. Job nuevo en `.github/workflows/ci.yml` (o workflow `e2e.yml` con `workflow_dispatch` + nightly).
2. Usar Docker Compose + perfil e2e (equivalente a `make test-e2e`).
3. Artefactos: traces/screenshots de Playwright en fallo.
4. No bloquear merge de PRs triviales al principio: `continue-on-error: true` o job opcional.

**No tocar:** `compose.e2e.yaml` salvo bugs reales de aislamiento `tador_test`.

---

## Q7 — Badge de cobertura (prioridad baja)

Tras Q3/Q4 estables: Codecov o Coveralls; badge en README junto a Tests.
Actualizar solo el bloque de badges (ver update-procedure).

---

## Q8 — Regresión visual / Storybook (prioridad baja)

Cuando el catálogo UI se estabilice: Chromatic u otra herramienta de snapshot.
Documentar en `docs/quality-tooling.md`; no mezclar con PRs de lógica financiera.

---

## Seguridad — orden post-implementación

### S0 — JudgmentDay (obligatorio primero)

1. Al cerrar implementación del branch `sprint/010-seguridad-calidad-y-tests`.
2. Ejecutar JudgmentDay (gentleman-ia): revisión ciega dual → fixes → re-juicio.
3. Rellenar `docs/security.md` → sección **Resultados de JudgmentDay**.
4. Actualizar badge README según tabla del update-procedure.
5. No declarar “pass” si quedan críticos abiertos.

### S1 — Dependencias

- Activar Dependabot o Renovate en GitHub.
- Añadir paso `npm audit --audit-level=high` en CI (backend + frontend), con allowlist documentada si hace falta.

### S2 — Secretos

- Añadir `gitleaks` en CI (o pre-commit).
- Verificar que `.env` sigue en `.gitignore`.

### S3 — Hardening Fastify (según JudgmentDay)

Candidatos típicos (implementar solo si el juicio lo confirma o prioriza):

| Paquete / cambio | Motivo |
|------------------|--------|
| `@fastify/helmet` | Cabeceras HTTP |
| `@fastify/rate-limit` | Fuerza bruta en `/auth/*` |
| Persistencia de tokens verify/recovery | Hoy viven en `Map` en memoria |
| Revisión CORS + CSRF con cookies | Sesión `httpOnly` |

Cada cambio: tests de integración mínimos + nota en `docs/security.md`.

### S4 — SAST / DAST (opcional)

- CodeQL workflow de GitHub.
- OWASP ZAP solo pre-release, no en cada PR.

---

## Orden sugerido de PRs (cuando se priorice)

```text
PR1  Q1 oxlint backend
PR2  Q2 Biome/Prettier (format only)
PR3  Q3 thresholds frontend coverage
PR4  Q4 backend coverage
PR5  Q5 husky (después de lint/format estables)
PR6  Q6 e2e CI (opcional/nightly)
———  S0 JudgmentDay (puede ser PR de docs + fixes)
PR7  S1–S3 según hallazgos
```

Un PR = un tema. No mezclar “añadir Biome” con “cambiar motor contable”.
