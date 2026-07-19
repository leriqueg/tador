# Seguridad — TADOR

**Fecha:** 2026-07-18

**Última actualización:** 2026-07-18

Estado de la seguridad del proyecto. El **2026-07-18** se ejecutó el perfil base
(SCA, gitleaks, Semgrep y revisión manual) y el perfil extendido con DAST
(OWASP ZAP). Detalle consolidado:
[`docs/software-quality-report.md`](./software-quality-report.md).

---

## Enfoque académico

TADOR aplica **defensa en profundidad**: ningún control aislado se considera
suficiente. La validación reduce entradas inválidas; autenticación y
autorización controlan identidad y alcance; cookies y tokens protegen sesiones;
rate limiting reduce abuso; aislamiento por tenant limita impacto; SAST, SCA,
secret scanning y DAST aportan detección independiente.

El análisis toma como referencias OWASP Top 10, OWASP API Security Top 10 y
OWASP ASVS nivel 1. Un resultado limpio de herramientas no prueba ausencia de
vulnerabilidades: demuestra únicamente que no se detectaron hallazgos dentro
del alcance, reglas y fecha documentados.

### Activos y límites de confianza

| Activo | Amenaza principal | Control relevante |
|--------|-------------------|-------------------|
| Credenciales y sesiones | robo, fuerza bruta, fijación | Argon2, cookie segura, tokens opacos, rate limit |
| Datos financieros | acceso cruzado o manipulación | autorización y filtros fail-closed por tenant |
| Integridad contable | duplicación o carrera | transacciones, idempotencia y locks |
| Secretos de infraestructura | exposición en repo o navegador | `.env` ignorado, allowlist `VITE_*`, gitleaks |
| Disponibilidad del API | abuso de endpoints | rate limiting y límites del framework |

---

## Prácticas de seguridad por diseño (ya presentes en el código)

El código y el tooling aplican *secure-by-default* según la Constitución del
proyecto:

| Área | Práctica | Dónde |
|------|----------|-------|
| **Hash de contraseñas** | `argon2` (sin criptografía de contraseñas propia) | adaptador de infraestructura de contraseñas |
| **Sesiones por cookie** | `httpOnly`, `sameSite=lax`, `secure` en producción, `maxAge` 7d | `backend/src/api/middleware/auth.ts` |
| **Longitud mínima de contraseña** | ≥ 8 caracteres | `backend/src/api/routes/auth.ts` |
| **No enumeración de usuarios** | Recuperación/reenvío no revelan si el email existe | `auth-service.ts` (`requestRecovery`, `resendVerification`) |
| **Autorización en el borde** | `requireAuth` en rutas protegidas | `backend/src/api/middleware/auth.ts` |
| **Aislamiento por tenant** | Reglas de dominio *fail-closed* en el motor contable | `backend/src/domain/**` + tests de integración |
| **Validación de entrada** | Controles parciales en rutas y dominio; Zod está declarado pero **no se usa** todavía en `backend/src` | rutas Fastify + reglas de dominio |
| **Cabeceras HTTP** | `@fastify/helmet` (CSP desactivada en API JSON) | `backend/src/server.ts` |
| **Rate limiting** | Global suave + override estricto en auth/recovery (20/min) | `server.ts`, `api/auth-rate-limit.ts` |
| **Secretos fuera del frontend** | Solo variables `VITE_*` llegan al navegador | `docs/environment-files.md` |
| **DB de test aislada** | Vitest rechaza apuntar a `tador_dev` | `backend/vitest.integration.config.ts` |

---

## Riesgos residuales y controles pendientes

1. **Idempotency-Key global.** La unicidad de `Asiento.idempotencyKey` no está
   tipada por `bookId`; un replay debe comprobar siempre pertenencia al tenant
   antes de devolver el asiento. Mitigación recomendada: índice compuesto
   `(bookId, idempotencyKey)` y recheck scoped.
2. **Validación HTTP runtime incompleta.** No hay schemas Zod/JSON Schema
   sistemáticos en el borde; parte de la validación ocurre más adentro o por
   tipado TypeScript, que no protege en runtime.
3. **Tokens y correo en entornos no productivos.** El stub de email y posibles
   respuestas de desarrollo no deben filtrarse a un despliegue público.
4. **CSRF en una futura topología cross-site.** El MVP usa cookie
   `sameSite=lax`, CORS allowlist y frontend/backend same-site.
5. **Cabeceras del frontend estático.** Helmet protege la API; las advertencias
   de ZAP sobre Vite deben resolverse en el reverse proxy/CDN productivo.
6. **Automatización de seguridad.** gitleaks, Semgrep y ZAP se ejecutaron en la
   evaluación, pero no todos son gates del workflow de CI.
7. **Configuración productiva fail-closed.** Los defaults locales de
   `SESSION_SECRET` y la ausencia de un compose productivo no deben presentarse
   como endurecimiento de producción.

> Rate-limit, helmet y tokens persistidos en base de datos se cerraron el
> **2026-07-18**. El audit de toolchain se cerró al subir backend a Vitest 4
> (`npm audit` = 0).

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
