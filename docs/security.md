# Seguridad — TADOR

**Última actualización:** 2026-07-18

Estado de la seguridad del proyecto. El **2026-07-18** se ejecutó el perfil base
(SCA, gitleaks, Semgrep y revisión manual). DAST (OWASP ZAP) permanece en el
perfil extendido. Detalle consolidado:
[`docs/software-quality-report.md`](./software-quality-report.md).

---

## Prácticas de seguridad por diseño (ya presentes en el código)

Aunque no hay tooling de seguridad, el código sí aplica *secure-by-default* según
la Constitución del proyecto:

| Área | Práctica | Dónde |
|------|----------|-------|
| **Hash de contraseñas** | `argon2` (no IEEE/MD5/SHA a mano) | `backend/src/application/auth-service.ts` |
| **Sesiones por cookie** | `httpOnly`, `sameSite=lax`, `secure` en producción, `maxAge` 7d | `backend/src/api/middleware/auth.ts` |
| **Longitud mínima de contraseña** | ≥ 8 caracteres | `backend/src/api/routes/auth.ts` |
| **No enumeración de usuarios** | Recuperación/reenvío no revelan si el email existe | `auth-service.ts` (`requestRecovery`, `resendVerification`) |
| **Autorización en el borde** | `requireAuth` en rutas protegidas | `backend/src/api/middleware/auth.ts` |
| **Aislamiento por tenant** | Reglas de dominio *fail-closed* en el motor contable | `backend/src/domain/**` + tests de integración |
| **Validación de entrada** | `zod` para esquemas | dependencia `zod` en backend |
| **Cabeceras HTTP** | `@fastify/helmet` (CSP desactivada en API JSON) | `backend/src/server.ts` |
| **Rate limiting** | Global suave + override estricto en auth/recovery (20/min) | `server.ts`, `api/auth-rate-limit.ts` |
| **Secretos fuera del frontend** | Solo variables `VITE_*` llegan al navegador | `docs/environment-files.md` |
| **DB de test aislada** | Vitest rechaza apuntar a `tador_dev` | `backend/vitest.integration.config.ts` |

---

## Hallazgos candidatos a validar

1. **Tokens en memoria.** Los tokens de verificación y recuperación se guardan en
   `Map` en memoria (`auth-service.ts`), marcado en el código como *"replace with
   DB in production"*. No sobreviven a reinicios ni escalan horizontalmente.
2. **CORS/CSRF.** Revisar política CORS y protección CSRF para cookies de sesión.
3. **Escaneo de secretos en CI.** gitleaks se ejecutó en la evaluación; falta
   automatizarlo en el workflow.

> Rate-limit y helmet se cerraron el **2026-07-18**. El audit de toolchain Vitest
> se cerró al subir backend a Vitest 4 (`npm audit` = 0).

---

## Plan de auditoría OWASP

**Cuándo:** al cerrar la implementación del sprint.

**Cómo:** perfil base con `npm audit`, gitleaks y Semgrep; perfil extendido con
OWASP ZAP Baseline; revisión manual de autenticación, sesiones, autorización por
tenant, validación, consultas, errores y configuración.

**Qué documentar tras la ejecución:**

- Hallazgos por severidad (crítico / alto / medio / bajo).
- Cuáles se corrigieron y el commit/PR asociado.
- Cuáles se aceptan como riesgo y por qué.
- Categoría OWASP y evidencia reproducible.
- Resultado final y limitaciones.

El procedimiento completo y la plantilla de resultados están en:

- [`specs/011-seguridad-calidad-y-tests/update-procedure.md`](../specs/011-seguridad-calidad-y-tests/update-procedure.md)
- [`docs/software-quality-report.md`](./software-quality-report.md)

### Herramientas de seguridad recomendadas

| Herramienta | Propósito |
|-------------|-----------|
| `npm audit` + **Dependabot/Renovate** | Vulnerabilidades en dependencias |
| **CodeQL** (GitHub Advanced Security) | SAST en la CI |
| **gitleaks** | Escaneo de secretos en commits |
| **@fastify/helmet** | Cabeceras de seguridad HTTP |
| **@fastify/rate-limit** | Limitación de intentos en auth |
| **OWASP ZAP** (DAST) | Escaneo dinámico opcional pre-release |

---

## Resultados de la evaluación OWASP

> Ejecutada el **2026-07-18** (perfil base + extendido). Cierre **APROBADO**.
> Detalle: [`software-quality-report.md`](./software-quality-report.md).
>
> | Severidad | Hallazgo | Estado | Referencia |
> |-----------|----------|--------|------------|
> | Alto (toolchain) | CVEs vitest/vite (backend) | **Cerrado** (Vitest 4; audit 0) | npm audit |
> | Medio | Sin rate-limit en auth | **Cerrado** (`@fastify/rate-limit`) | server/auth |
> | Medio | Sin helmet / cabeceras HTTP | **Cerrado** (`@fastify/helmet`) | server.ts |
> | Medio | Tokens verify/recovery en memoria | **Cerrado** (`AuthToken` + SHA-256) | Prisma / auth-service |
> | Medio | CORS / CSRF MVP | **Cerrado** (`@fastify/cors` + cookies) | server.ts |
> | Bajo/Medio | ZAP WARN cabeceras Vite SPA | **Aceptado** (API con helmet; proxy en prod) | ZAP Baseline |
> | Info | gitleaks FP en `idempotencyKey` de test | Falso positivo | gitleaks |
> | — | Semgrep 0; audit 0; E2E 9/9; ZAP 0 FAIL | PASS | perfil extendido |
>
> **Resultado final:** baseline OWASP **aprobado** · **Fecha:** 2026-07-18
