# Seguridad — TADOR

**Última actualización:** 2026-07-16

Estado de la seguridad del proyecto. A la fecha del sprint
`010-seguridad-calidad-y-tests` **no se ha aplicado ninguna herramienta
automatizada de seguridad**. La auditoría se ejecutará con **JudgmentDay** (del
ecosistema *gentleman-ia*) al terminar la implementación, y sus resultados se
documentarán en la sección [Resultados de JudgmentDay](#resultados-de-judgmentday).

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
| **Secretos fuera del frontend** | Solo variables `VITE_*` llegan al navegador | `docs/environment-files.md` |
| **DB de test aislada** | Vitest rechaza apuntar a `tador_dev` | `backend/vitest.integration.config.ts` |

---

## Hallazgos ya conocidos (a validar con JudgmentDay)

Observaciones internas previas a la auditoría formal:

1. **Tokens en memoria.** Los tokens de verificación y recuperación se guardan en
   `Map` en memoria (`auth-service.ts`), marcado en el código como *"replace with
   DB in production"*. No sobreviven a reinicios ni escalan horizontalmente.
2. **Sin rate limiting.** Login/registro no tienen limitación de intentos
   (riesgo de fuerza bruta / abuso).
3. **Sin cabeceras de seguridad HTTP.** No se observa `@fastify/helmet` (CSP,
   HSTS, `X-Content-Type-Options`, etc.).
4. **CORS/CSRF.** Revisar política CORS y protección CSRF para cookies de sesión.
5. **Sin escaneo de dependencias ni secretos** en CI.

> Estos puntos son *candidatos*, no un veredicto. El alcance real lo fijará la
> corrida de JudgmentDay.

---

## Plan de auditoría con JudgmentDay (gentleman-ia)

**Cuándo:** al cerrar la implementación del sprint.

**Cómo:** revisión adversarial doble sobre los cambios locales del branch
`sprint/010-seguridad-calidad-y-tests` (revisión ciega dual → corrección de
hallazgos confirmados → re-juicio).

**Qué documentar aquí tras la corrida:**

- Hallazgos por severidad (crítico / alto / medio / bajo).
- Cuáles se corrigieron y el commit/PR asociado.
- Cuáles se aceptan como riesgo y por qué.
- Veredicto final del re-juicio.

### Herramientas de seguridad recomendadas (post-JudgmentDay)

| Herramienta | Propósito |
|-------------|-----------|
| `npm audit` + **Dependabot/Renovate** | Vulnerabilidades en dependencias |
| **CodeQL** (GitHub Advanced Security) | SAST en la CI |
| **gitleaks** | Escaneo de secretos en commits |
| **@fastify/helmet** | Cabeceras de seguridad HTTP |
| **@fastify/rate-limit** | Limitación de intentos en auth |
| **OWASP ZAP** (DAST) | Escaneo dinámico opcional pre-release |

---

## Resultados de JudgmentDay

> _Pendiente._ Se completará tras ejecutar JudgmentDay al finalizar la
> implementación. Formato sugerido:
>
> | Severidad | Hallazgo | Estado | Referencia |
> |-----------|----------|--------|------------|
> | — | — | — | — |
>
> **Veredicto final:** _pendiente_ · **Fecha:** _pendiente_
