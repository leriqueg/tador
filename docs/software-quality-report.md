# Informe de calidad de software y seguridad — TADOR

**Estado:** **APROBADO** (cierre completo 2026-07-18)  
**Última actualización:** 2026-07-18  
**Fecha de evaluación:** 2026-07-18  
**Commit base evaluado:** `4ccb17c5ce9d05b291baa27c1d3ee77e3e58a6ae` (`4ccb17c`)  
**Rama:** `sprint/010-seguridad-calidad-y-tests`  
**Responsable:** ejecución automatizada según
[`specs/011-seguridad-calidad-y-tests/update-procedure.md`](../specs/011-seguridad-calidad-y-tests/update-procedure.md)

Este informe presenta evidencia reproducible sobre la calidad del backend y
frontend de TADOR. Separa resultados funcionales, cobertura, análisis estático y
seguridad para evitar convertir una sola métrica en una calificación absoluta.

Artefactos locales de esta corrida (ignorados por Git): `.quality-results/`.

## Resumen ejecutivo

| Dimensión | Backend | Frontend | Estado global |
|-----------|---------|----------|---------------|
| Compilación / typecheck | PASS (tras `prisma generate`) | PASS | PASS |
| Lint | PASS (0 warnings) | PASS (3 warnings) | PASS |
| Pruebas | 96 unit + 112 int PASS | 83 unit + 68 int PASS | PASS (359/359 base) |
| E2E Playwright | — | 9/9 PASS | PASS (perfil extendido) |
| Cobertura | Unit domain+app: Lines 19.05 % | Lines 48.98 % (gate OK) | Riesgo aceptado <70 % |
| Dependencias | PASS (0 vulns, Vitest 4) | PASS (0) | PASS |
| Secretos | 1 finding → falso positivo | — | PASS (validado) |
| SAST (Semgrep) | 0 findings | 0 findings | PASS |
| DAST (ZAP Baseline) | — | 0 FAIL / 8 WARN (Vite SPA) | PASS con riesgos aceptados |

**Conclusión:** perfil **base + extendido** cerrados el **2026-07-18** sobre el
commit base `4ccb17c` y remediaciones del mismo día (tooling, hardening OWASP,
tokens en DB, CORS, E2E PRO setup, ZAP). **Apto para cierre completo** con
riesgos residuales documentados (cobertura pedagógica <70 %, cabeceras ZAP en
Vite dev).

## 1. Alcance y método

### Alcance

- Backend Node.js/TypeScript/Fastify/Prisma.
- Frontend React/TypeScript/Vite.
- Pruebas unitarias, integración y E2E.
- Dependencias de producción y desarrollo.
- Código productivo y configuración versionada.
- Historial Git para detección de secretos.
- DAST: OWASP ZAP Baseline contra `http://127.0.0.1:5173`.

### Método

1. Quality gates: compilación, tipado y lint.
2. Pruebas: tasa de éxito y distribución por nivel.
3. Cobertura V8 (backend unit domain+application; frontend lib/pages/components).
4. Seguridad: SCA, secretos, SAST, DAST.
5. Referencias: OWASP Top 10, OWASP API Security Top 10 y OWASP ASVS nivel 1.
6. Marco ISO/IEC 25010 (adecuación funcional, fiabilidad, mantenibilidad, seguridad).

La pirámide 70/20/10 se reporta como distribución de pruebas, no como cobertura.

## 2. Reproducibilidad

| Dato | Valor |
|------|-------|
| Fecha | 2026-07-18 (evaluación + remediaciones + cierre) |
| Commit base | `4ccb17c5ce9d05b291baa27c1d3ee77e3e58a6ae` |
| Rama | `sprint/010-seguridad-calidad-y-tests` |
| Sistema operativo | Linux 6.17.0-19-generic (Ubuntu 24.04), x86_64 |
| Node.js (host) | v20.19.5 |
| Node.js (contenedores) | v22.x |
| Docker Compose | v5.x |
| Backend / Frontend Vitest | 4.1.10 |
| oxlint | 1.73.0 |
| gitleaks | 8.30.1 |
| Semgrep | 1.169.0 |
| OWASP ZAP | imagen `ghcr.io/zaproxy/zaproxy:stable` (`zap-baseline.py`) |

## 3. Quality gates

| Control | Componente | Resultado | Errores | Advertencias | Evidencia |
|---------|------------|-----------|---------|--------------|----------|
| TypeScript `tsc --noEmit` | Backend | PASS | 0 | 0 | Tras `npx prisma generate` |
| Build `tsc -b && vite build` | Frontend | PASS | 0 | 0 | `.quality-results/frontend-build.log` |
| oxlint | Frontend | PASS | 0 | 3 | `react/only-export-components` |
| oxlint | Backend | PASS | 0 | 0 | Q1 cerrado |

```text
quality_gate_% = 4 / 4 * 100 = 100 %
```

**Quality gate:** PASS.

## 4. Pruebas

| Suite | Nivel | Aprobadas | Fallidas | Omitidas | Total | Evidencia |
|-------|-------|-----------|----------|----------|-------|----------|
| Backend unit | Unitario | 96 | 0 | 0 | 96 | Vitest 4 |
| Backend integration | Integración | 112 | 0 | 0 | 112 | Postgres `tador_test` |
| Frontend unit | Unitario | 83 | 0 | 0 | 83 | Vitest + jsdom |
| Frontend integration | Integración | 68 | 0 | 0 | 68 | Testing Library |
| Playwright | E2E | 9 | 0 | 0 | 9 | `make test-e2e` (incl. setup PRO) |

```text
test_success_% (base) = 359 / 359 * 100 = 100 %
test_success_% (extendido) = 368 / 368 * 100 = 100 %
```

### Distribución de la pirámide (con E2E)

| Nivel | Casos | Cuota real | Objetivo orientativo |
|-------|-------|------------|---------------------|
| Unitario | 179 | 48.6 % | 70 % |
| Integración | 180 | 48.9 % | 20 % |
| E2E | 9 | 2.4 % | 10 % |
| **Total** | **368** | 100 % | — |

**Interpretación:** pirámide inclinada a integración (motor contable / plantillas
contra Postgres). E2E cubre auth Hogar/PRO y recorridos críticos; no sustituye
la capa de integración.

## 5. Cobertura

| Componente | Lines | Statements | Functions | Branches | Estado |
|------------|-------|------------|-----------|----------|--------|
| Backend (unit: domain + application) | 19.05 % | 18.53 % | 17.24 % | 15.96 % | Gate anti-regresión ≥15/15/15/12 **PASS** |
| Frontend | 48.98 % | 47.68 % | 44.41 % | 47.24 % | Gate ≥45/45/40/40 **PASS** |

### Umbrales de referencia

| Métrica | Referencia pedagógica | Resultado |
|---------|----------------------|-----------|
| Lines | 70 % | FE 48.98 % / BE unit 19.05 % — bajo objetivo; riesgo aceptado |
| Gate FE | ≥45/45/40/40 | **PASS** |
| Gate BE unit | ≥15/15/15/12 | **PASS** |
| Código nuevo/modificado | 80 % | No medido (sin gate de diff) |

### Áreas críticas (observación)

- FE bien cubiertos: `entry-builder`, análisis PRO parcial, `finance.ts`, guards.
- FE baja cobertura: marketing/login/register, varios formularios Hogar, `api.ts`.
- BE unitario: `domain` ~61 % lines; `application` baja (servicios cubiertos vía integración).

## 6. Seguridad

### Resultados automatizados

| Herramienta | Alcance | Crítico | Alto | Medio | Bajo/Info | Estado |
|-------------|---------|---------|------|-------|-----------|--------|
| npm audit | Backend | 0 | 0 | 0 | 0 | PASS |
| npm audit | Frontend | 0 | 0 | 0 | 0 | PASS |
| gitleaks | Historial Git | 0 reales | — | — | 1 FP | PASS tras validación |
| Semgrep (`p/owasp-top-ten` + `p/typescript`) | `backend/src` + `frontend/src` | 0 | 0 | 0 | 0 | PASS |
| OWASP ZAP Baseline | Vite `http://127.0.0.1:5173` | 0 FAIL | — | WARN-NEW 8 | INFO | PASS (`-I`; sin FAIL-NEW) |

ZAP WARN (superficie Vite SPA / cabeceras de front estático): clickjacking,
`X-Content-Type-Options`, CSP, Permissions-Policy, COEP, SRI, etc. El API Fastify
lleva `@fastify/helmet`. En producción las cabeceras del front deben aplicarse en
el reverse proxy / hosting estático — aceptado para MVP.

### Hallazgos validados

| ID | OWASP | Severidad | Evidencia | Remediación | Estado |
|----|-------|-----------|----------|-------------|--------|
| Q-2026-07-18-01 | A06 Components | Alto (toolchain) | `npm audit` vitest/vite | Vitest 4 + coverage-v8 4 | **Cerrado** |
| Q-2026-07-18-02 | A07 Auth Failures | Medio | Sin rate-limit | `@fastify/rate-limit` | **Cerrado** |
| Q-2026-07-18-03 | A05 Misconfig | Medio | Sin helmet | `@fastify/helmet` | **Cerrado** |
| Q-2026-07-18-04 | A02 Crypto/Auth | Medio | Tokens en `Map` | Modelo `AuthToken` + hash SHA-256 | **Cerrado** |
| Q-2026-07-18-05 | A05 Misconfig | Medio | CORS/CSRF | `@fastify/cors` + cookies `httpOnly`/`sameSite=lax` | **Cerrado** (MVP) |
| GITLEAKS-1 | — | Info | `idempotencyKey` de test | Falso positivo | FP |
| ZAP-WARN-* | A05 | Bajo/Medio | Cabeceras ausentes en Vite | Proxy/CDN en prod | **Aceptado** |

### Revisión manual

- [x] Autenticación y recuperación — `argon2`; tokens persistidos y consumidos en DB.
- [x] Cookies / CSRF MVP — `httpOnly` + `sameSite=lax`; same-origin vía proxy Vite.
- [x] Autorización tenant — tests de integración del motor.
- [x] Validación de entrada — Zod en backend.
- [x] Inyección SQL/Prisma — Semgrep 0; Prisma.
- [x] Rate limiting — auth/recovery 20/min (techo alto bajo `VITEST`).
- [x] CORS — allowlist `CORS_ORIGIN` + credentials.
- [x] Errores, logs y stubs de email — sin secretos reales en gitleaks.
- [x] Idempotencia y concurrencia financiera — integración PASS.
- [x] E2E + ZAP Baseline — ejecutados en cierre.

## 7. Limitaciones

- Cobertura <70 % no implica calidad de aserciones; gates anti-regresión sí.
- ZAP apuntó al front Vite; no sustituye un scan autenticado del API.
- Semgrep CE con rulesets públicos; no sustituye ASVS completo ni pentest.
- Una sola corrida no mide flakiness (mitigado timeout en smoke PRO).
- Double-Submit CSRF diferido si FE/BE pasan a orígenes distintos.

## 8. Riesgos aceptados

| Riesgo | Motivo de aceptación | Compensación | Revisión |
|--------|----------------------|--------------|----------|
| Cobertura FE/BE <70 % pedagógico | Línea base honesta; valor en integración/E2E | Gates ≥45 % FE y ≥15 % BE unit; 368 tests | Subir umbrales al crecer suites |
| WARN ZAP en Vite SPA | Dev/static sin helmet de CDN | Helmet en API; headers en proxy prod | Pre-producción / hosting |
| CSRF Double-Submit no implementado | MVP same-site + proxy | `sameSite=lax` + CORS allowlist | Si FE/BE cross-site |
| E2E ~2 % de la pirámide | Coste/beneficio; journeys críticos cubiertos | Integración densa del motor | Ampliar E2E bajo demanda |

## 9. Conclusión

Evaluación del **2026-07-18** (commit base `4ccb17c` + remediaciones del mismo día):

- **Fortalezas:** 368 pruebas en verde (base + E2E); typecheck/build/lint OK;
  Semgrep limpio; `npm audit` 0; helmet, rate-limit, CORS, tokens en DB; ZAP sin
  FAIL; CI con lint/coverage.
- **Residuales aceptados:** cobertura pedagógica <70 %; WARN ZAP de cabeceras SPA.
- **Decisión:** **APROBADO — cierre completo** para entrega académica / MVP con
  baseline OWASP documentada.
- **Siguiente ciclo (no bloqueante):** Biome/format (Q2), husky (Q5), E2E en CI
  nightly (Q6), subir cobertura hacia 60–70 %, headers estáticos en producción.
