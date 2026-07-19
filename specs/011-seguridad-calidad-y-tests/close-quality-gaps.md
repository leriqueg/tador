# Cierre de brechas — calidad y seguridad

**Última actualización:** 2026-07-18

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
4. Seguridad: primero establecer una línea base automatizada y OWASP; después
   remediar hallazgos validados.

---

## Q1 — oxlint en backend (prioridad alta) — **CERRADO 2026-07-18**

Implementado: `backend/.oxlintrc.json`, script `lint`, `make lint-backend`, paso
CI, 0 warnings/0 errors.

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

## Q3 — Umbrales de cobertura frontend (prioridad alta) — **CERRADO 2026-07-18**

Implementado: thresholds lines/statements 45, functions/branches 40 + paso CI
`Coverage`. Objetivo pedagógico 70 % sigue como meta de mejora.

---

## Q4 — Cobertura de backend (prioridad media) — **CERRADO 2026-07-18**

Implementado: `@vitest/coverage-v8@4.1.10`, `test:coverage` sobre `domain` +
`application`, `make coverage-backend`, paso CI. Gate anti-regresión
lines/statements/functions/branches ≥15/15/15/12. Medido al cierre:
lines 19.05 %, statements 18.53 %, functions 17.24 %, branches 15.96 %.

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

### S0 — Evaluación OWASP reproducible (obligatorio primero)

1. Al cerrar implementación del branch `sprint/010-seguridad-calidad-y-tests`.
2. Ejecutar el perfil base: `npm audit`, gitleaks, Semgrep y revisión manual.
3. Ejecutar el perfil extendido (E2E + OWASP ZAP Baseline) para la entrega final.
4. Rellenar `docs/software-quality-report.md` y la sección de resultados de
   `docs/security.md`.
5. Actualizar badge README según el estado real.
6. No declarar “pass” si quedan críticos abiertos.

### S1 — Dependencias

- Activar Dependabot o Renovate en GitHub.
- Añadir paso `npm audit --audit-level=high` en CI (backend + frontend), con allowlist documentada si hace falta.

### S2 — Secretos

- Añadir `gitleaks` en CI (o pre-commit).
- Verificar que `.env` sigue en `.gitignore`.

### S3 — Hardening Fastify (según evaluación OWASP)

| Paquete / cambio | Estado 2026-07-18 |
|------------------|-------------------|
| `@fastify/helmet` | **Hecho** en `server.ts` |
| `@fastify/rate-limit` | **Hecho** (global + auth/recovery 20/min) |
| Persistencia de tokens verify/recovery | **Hecho** (`AuthToken` + hash SHA-256) |
| Revisión CORS + CSRF con cookies | **Hecho** (MVP: CORS allowlist + `sameSite=lax`) |

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
———  S0 Evaluación OWASP (puede ser PR de docs + fixes)
PR7  S1–S3 según hallazgos
```

Un PR = un tema. No mezclar “añadir Biome” con “cambiar motor contable”.
