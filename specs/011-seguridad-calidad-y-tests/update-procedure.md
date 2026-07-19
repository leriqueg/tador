# Procedimiento reproducible de calidad y seguridad

**Última actualización:** 2026-07-18

Este procedimiento produce las evidencias que alimentan
[`docs/software-quality-report.md`](../../docs/software-quality-report.md). Está
pensado para una evaluación académica defendible, repetible y proporcionada al
tamaño de TADOR.

El informe toma como marco los atributos aplicables de ISO/IEC 25010
(adecuación funcional, fiabilidad, mantenibilidad y seguridad) y usa OWASP para
operacionalizar la evaluación de seguridad.

## Resultado esperado

Al terminar deben quedar documentados:

1. Estado de compilación, tipado y lint.
2. Pruebas aprobadas, fallidas y distribución por nivel.
3. Cobertura de líneas, sentencias, funciones y ramas para backend y frontend.
4. Hallazgos de dependencias, secretos y análisis estático de seguridad.
5. Resultado E2E y DAST, cuando se ejecute el perfil extendido.
6. Limitaciones de la medición y riesgos aceptados.

La distribución 70/20/10 describe la **pirámide de pruebas**. No es cobertura de
código ni una calificación de calidad.

## Perfiles de ejecución

| Perfil | Contenido | Cuándo |
|--------|-----------|--------|
| **Base obligatorio** | typecheck/build, lint disponible, unitarias, integración, cobertura, `npm audit`, gitleaks y Semgrep | Antes de entregar y al actualizar el reporte |
| **Extendido** | E2E y OWASP ZAP baseline | Antes de release o entrega final |
| **Opcional** | mutation testing o plataforma Sonar | Solo si el tiempo permite profundizar |

El perfil base es suficiente para el informe principal. Las herramientas
opcionales no deben bloquear la entrega.

## Prerrequisitos

- Docker Engine con Compose.
- Node.js 22 si se ejecutan comandos desde el host.
- Dependencias instaladas mediante `npm ci`.
- `gitleaks` y `semgrep` instalados localmente o disponibles como imágenes Docker.
- Para ZAP: aplicación levantada en un entorno de prueba, nunca contra producción.

### Brechas que deben cerrarse antes de medir cobertura completa

Estado al 2026-07-18:

- Frontend: `@vitest/coverage-v8` + umbrales anti-regresión en CI.
- Backend: oxlint + `@vitest/coverage-v8` (alcance unitario `domain` + `application`).
- Tras cambios de dependencias en Docker: `docker compose run --rm backend npm ci`
  (volúmenes nombrados `backend_node_modules` / `frontend_node_modules`).

## Ruta rápida

Desde la raíz:

```bash
# Calidad funcional
make test-unit
make check
make test-frontend

# Calidad estática disponible
docker compose run --rm backend npm run typecheck
docker compose run --rm --no-deps frontend npm run lint
docker compose run --rm --no-deps frontend npm run build

# Cobertura disponible hoy
docker compose run --rm --no-deps frontend npm run test:coverage

# Seguridad de dependencias
docker compose run --rm backend npm audit --audit-level=high
docker compose run --rm --no-deps frontend npm audit --audit-level=high
```

Después de habilitar cobertura backend:

```bash
docker compose run --rm backend npm run test:coverage
```

Perfil extendido:

```bash
make test-e2e
```

Registra fecha, commit (`git rev-parse HEAD`), versión de herramientas y resultados
en el reporte. Un comando que termina con código distinto de cero se registra como
fallo aunque parte de la suite haya pasado.

## 1. Compilación, tipado y lint

Ejecuta:

```bash
docker compose run --rm backend npm run typecheck
docker compose run --rm --no-deps frontend npm run build
docker compose run --rm --no-deps frontend npm run lint
```

Registra por componente:

- resultado `PASS`, `FAIL` o `N/A`;
- número de errores;
- número de advertencias;
- herramienta y versión.

La tasa de éxito del quality gate se calcula solo con controles aplicables:

```text
quality_gate_% = controles_aprobados / controles_ejecutados * 100
```

No debe presentarse este porcentaje aislado: acompáñalo con la lista de controles.

## 2. Pruebas y tasa de éxito

```bash
make test-unit
make check
make test-frontend
```

Para la entrega final:

```bash
make test-e2e
```

Registra por suite:

- casos aprobados, fallidos, omitidos y total;
- duración;
- nivel: unitario, integración o E2E.

Fórmulas:

```text
test_success_% = aprobados / ejecutados * 100
cuota_nivel_% = casos_del_nivel / total_de_casos * 100
```

Los omitidos se informan por separado. La cuota 70/20/10 es una guía de diseño, no
un umbral de aprobación.

## 3. Cobertura

### Frontend

```bash
docker compose run --rm --no-deps frontend npm run test:coverage
```

La configuración cubre `src/lib`, `src/pages` y `src/components`, excluyendo tests
y stories. Revisa el resumen V8 y registra:

- `% Lines`;
- `% Statements`;
- `% Functions`;
- `% Branches`;
- archivos o módulos críticos con cobertura baja.

### Backend

Cuando exista el script:

```bash
docker compose run --rm backend npm run test:coverage
```

La inclusión debe limitarse a código productivo (`src/**`) y excluir migraciones,
archivos generados, tests y `dist`. Para evitar doble conteo, se recomienda producir
un reporte combinado de unitarias e integración o fusionar coberturas V8.

### Criterios iniciales

Los umbrales se fijan después de obtener la primera línea base:

| Métrica | Umbral inicial orientativo |
|---------|-----------------------------|
| Líneas | 70 % |
| Sentencias | 70 % |
| Funciones | 70 % |
| Ramas | 60 % |
| Código nuevo/modificado | 80 % |

No se fuerza artificialmente un 80 % global si la línea base es inferior. El primer
gate debe impedir retrocesos y después subir gradualmente.

En autenticación, autorización por tenant, idempotencia, asientos balanceados y
dinero exacto, la revisión debe priorizar **comportamientos críticos cubiertos**,
no solo el porcentaje agregado.

## 4. Seguridad automatizada — perfil base

La evaluación se mapea a OWASP Top 10, OWASP API Security Top 10 y controles
aplicables de OWASP ASVS nivel 1.

### 4.1 Dependencias (SCA)

```bash
docker compose run --rm backend npm audit --audit-level=high
docker compose run --rm --no-deps frontend npm audit --audit-level=high
```

Registra vulnerabilidades por severidad, dependencia afectada, exposición real,
versión corregida y decisión. No uses `npm audit fix --force` durante la auditoría.

### 4.2 Secretos

Con gitleaks instalado:

```bash
gitleaks git . --redact
```

Debe analizar el historial, no solo el árbol actual. El reporte solo registra
conteos y referencias saneadas; nunca copies un secreto encontrado.

### 4.3 SAST

Con Semgrep instalado:

```bash
semgrep scan \
  --config p/owasp-top-ten \
  --config p/typescript \
  backend/src frontend/src
```

Cada hallazgo se valida manualmente para separar vulnerabilidades reales de falsos
positivos. Registra regla, ubicación, severidad, evidencia y decisión.

## 5. Seguridad dinámica — perfil extendido

Levanta el stack de prueba y verifica salud:

```bash
docker compose up -d postgres backend frontend
docker compose ps
mkdir -p .quality-results
```

Ejecuta OWASP ZAP Baseline contra la superficie pública:

```bash
docker run --rm --network host \
  -v "$PWD/.quality-results:/zap/wrk/:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://127.0.0.1:5173 \
  -J zap-report.json -r zap-report.html
```

Limitaciones:

- Baseline es pasivo y no cubre adecuadamente rutas autenticadas.
- No demuestra ausencia de vulnerabilidades.
- Los flujos financieros autenticados requieren revisión manual o un contexto ZAP
  específico; eso queda fuera del perfil base.
- Nunca ejecutar ataques activos contra producción.

## 6. Revisión manual OWASP

Valida como mínimo:

- autenticación, recuperación y verificación de cuenta;
- cookies (`httpOnly`, `secure`, `sameSite`) y CSRF;
- autorización de cada recurso propiedad de un tenant;
- validación Zod y límites de tamaño;
- inyección en Prisma/SQL y construcción de consultas;
- rate limiting y prevención de fuerza bruta;
- cabeceras HTTP y CORS;
- exposición de errores, logs y datos sensibles;
- gestión de secretos y configuración de producción;
- idempotencia y concurrencia en mutaciones financieras.

Cada hallazgo debe incluir categoría OWASP, severidad, evidencia reproducible,
impacto, remediación y estado.

## 7. Actualizar el reporte

Edita [`docs/software-quality-report.md`](../../docs/software-quality-report.md):

1. Fecha, commit y entorno.
2. Resultados del quality gate.
3. Conteos y tasa de éxito de pruebas.
4. Cobertura backend/frontend.
5. Hallazgos de seguridad por herramienta y categoría OWASP.
6. Limitaciones y riesgos aceptados.
7. Conclusión basada en evidencia.

Actualiza además:

- [`docs/testing-strategy.md`](../../docs/testing-strategy.md), si cambian conteos;
- [`docs/quality-tooling.md`](../../docs/quality-tooling.md), si cambia tooling;
- [`docs/security.md`](../../docs/security.md), si cambia el estado de seguridad;
- `README.md`, solo si cambian badges o el resumen.

## 8. Criterio de cierre

- [x] Todas las suites obligatorias fueron ejecutadas.
- [x] No se presenta 70/20/10 como cobertura.
- [x] Cobertura incluye las cuatro métricas y su alcance.
- [x] Fallos, omitidos y controles N/A están visibles.
- [x] Hallazgos automáticos fueron validados manualmente.
- [x] No quedan vulnerabilidades críticas abiertas.
- [x] Riesgos altos abiertos tienen justificación y plan.
- [x] El reporte identifica commit, fecha y versiones.
- [x] Las limitaciones de ZAP y de cobertura están declaradas.

El resultado es **aprobado** únicamente si los controles obligatorios pasan, no hay
hallazgos críticos abiertos y cualquier riesgo alto está corregido o aceptado de
forma explícita y justificada.

**Cierre 2026-07-18:** cumplido — ver [`docs/software-quality-report.md`](../../docs/software-quality-report.md).
