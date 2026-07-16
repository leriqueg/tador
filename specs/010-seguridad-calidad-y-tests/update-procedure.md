# Procedimiento de actualización — calidad, seguridad y pruebas

**Última actualización del procedimiento:** 2026-07-16

Usa este documento cuando cambien tests, herramientas de calidad, resultados de
seguridad, o los badges del README. El objetivo es **actualizar solo lo
necesario**, con conteos verificados por ejecución real.

---

## Regla de oro

| Hacer | No hacer |
|-------|----------|
| Editar los 3 docs canónicos en `docs/` + badges/sección en `README.md` | Crear un cuarto documento “resumen de calidad” paralelo |
| Actualizar la marca de tiempo `Última actualización` del doc tocado | Reescribir secciones históricas sin necesidad |
| Recalcular conteos **después** de ejecutar las suites | Inventar números o copiar conteos de un commit viejo |
| Actualizar solo las celdas/tablas que cambien | Reordenar o renombrar archivos de `docs/` sin motivo |
| Seguir `close-quality-gaps.md` para implementar tooling nuevo | Meter ESLint + Prettier + Biome a la vez sin decidir |

**Archivos permitidos a modificar en un refresh de documentación:**

```
docs/testing-strategy.md
docs/quality-tooling.md
docs/security.md
docs/delivery-checklist.md   # solo si cambia el estado de entrega
README.md                    # badges + sección "Calidad, seguridad y pruebas"
specs/010-seguridad-calidad-y-tests/*   # solo si cambia el procedimiento
```

**No tocar** (salvo que la tarea lo pida explícitamente): specs 000–008,
`frontend/docs/testing-strategy.md` (detalle operativo frontend; sí puedes
enlazarlo), constitución, ADR, código de producto.

---

## Paso 0 — Marca de tiempo

Al editar cualquier doc en `docs/`, actualiza la línea del encabezado:

```markdown
**Última actualización:** YYYY-MM-DD
```

Si solo cambias conteos, actualiza **fecha + tablas de números**. No reescribas
la narrativa completa.

---

## Paso 1 — Ejecutar las suites (fuente de verdad del “N passing”)

Desde la raíz del repo (`c:\dev\personal\tador`), con Docker disponible.

> **Windows / PowerShell:** si `make` no está en el PATH, usa los equivalentes
> Docker indicados bajo cada comando.

### 1.1 Backend — typecheck + unitarias + integración

```bash
# Typecheck + integración (incluye db-up)
make check

# Unitarias de dominio (sin DB) — obligatorio para el conteo unitario
make test-unit
```

Equivalentes sin Make:

```powershell
docker compose run --rm backend npx tsc --noEmit
docker compose run --rm backend npm run test:unit
docker compose up -d postgres
docker compose run --rm backend npm run test:integration
```

`make check` = `typecheck` + `test` (integración). **No** incluye unitarias:
por eso hay que correr `make test-unit` (o `npm run test:unit`) aparte.

### 1.2 Frontend — Vitest unit + integration

```bash
make test-frontend
```

Equivalente:

```powershell
docker compose run --rm --no-deps frontend npm run test
# o en host:
cd frontend; npm run test:unit; npm run test:integration
```

### 1.3 E2E (opcional en cada refresh; obligatorio si cambió Playwright)

```bash
make test-e2e
```

Si solo cambió backend/docs y no hay cambios en `frontend/e2e/`, puedes omitir
E2E y **mantener** el conteo E2E anterior, anotando en el commit/PR:
“E2E no re-ejecutado; conteo E2E sin cambios”.

### 1.4 Qué mirar en la salida

Al final de Vitest/Playwright aparece algo como:

```text
Tests  XX passed (XX)
```

Suma:

| Suite | Comando | Capa |
|-------|---------|------|
| Backend unit | `make test-unit` | Unitarias |
| Backend integration | `make test` / parte de `make check` | Integración |
| Frontend unit | `npm run test:unit` / parte de `make test-frontend` | Unitarias |
| Frontend integration | `npm run test:integration` | Integración |
| E2E | `make test-e2e` | E2E |

**Total** = unitarias + integración + E2E.

Si alguna suite falla, el badge del README debe reflejar **passed / total**
(p. ej. `162%20passing%20%2F%20165-yellow`), no afirmar `N passing` en verde.
Documentar los fallos en la sección de verificación de
`docs/testing-strategy.md`.

> Alternativa de conteo estático (si Vitest no arranca): buscar
> `^\s*(it|test)\(` en
> `backend/tests/unit/**`, `backend/tests/*.test.ts` (excl. unit),
> `frontend/src/**/*.test.ts`, `frontend/src/**/*.integration.test.tsx`,
> `frontend/e2e/**/*.spec.ts` (excluir `auth.setup.ts`). Preferir siempre la
> salida de Vitest cuando esté disponible.

---

## Paso 2 — Actualizar `docs/testing-strategy.md`

Editar **solo**:

1. Línea `**Última actualización:** …`
2. Tabla **Resumen ejecutivo** (casos reales, cuota %, total)
3. Tablas **Conteo detallado por archivo** si se añadieron/quitaron archivos o casos
4. Sección **Backlog de pruebas** si se cerró o abrió un ítem

Fórmula de cuota:

```text
cuota_% = round(casos_capa / total * 100)
```

No inventes la distribución 70/20/10: documenta la **cuota real** y deja el
objetivo pedagógico en la columna “Objetivo”.

---

## Paso 3 — Actualizar `docs/quality-tooling.md`

Solo si cambió tooling (nueva herramienta, CI, lint, cobertura):

1. Marca de tiempo
2. Tabla **Aplicadas actualmente** (añadir fila o marcar estado)
3. Tabla **Brechas** (mover ítem a “aplicadas” o tachar)
4. Comandos al final si hay un nuevo `make` target

Si solo cambió el número de tests y no el tooling → **no edites** este archivo.

Detalle de *cómo* implementar cada brecha: ver
[`close-quality-gaps.md`](./close-quality-gaps.md).

---

## Paso 4 — Actualizar `docs/security.md`

Solo cuando:

- Termine JudgmentDay, o
- Se añada tooling de seguridad (`helmet`, `rate-limit`, CodeQL, etc.)

Entonces:

1. Marca de tiempo
2. Rellenar **Resultados de JudgmentDay** (tabla + veredicto + fecha)
3. Mover hallazgos resueltos fuera de “candidatos”
4. Actualizar badge de seguridad en README (ver paso 5)

Si JudgmentDay sigue pendiente → **no cambies** el badge ni inventes resultados.

---

## Paso 5 — Sincronizar `README.md`

Tocar **únicamente**:

1. Badges del bloque `<!-- Calidad, seguridad y pruebas -->`
2. Tabla de la sección `## Calidad, seguridad y pruebas`

### Plantillas de badges (Shields.io)

Sustituye `UNIT`, `INT`, `E2E`, `TOTAL` por los números del paso 1:

```markdown
[![Tests](https://img.shields.io/badge/tests-TOTAL%20passing-brightgreen)](docs/testing-strategy.md)
[![Test pyramid](https://img.shields.io/badge/70%2F20%2F10-UNIT%20unit%20%7C%20INT%20int%20%7C%20E2E%20e2e-informational)](docs/testing-strategy.md)
```

Ejemplo con los números de 2026-07-16:

```text
TOTAL=165  UNIT=68  INT=92  E2E=5
→ tests-165%20passing
→ 70%2F20%2F10-68%20unit%20%7C%2092%20int%20%7C%205%20e2e
```

Badge de seguridad (elige uno):

| Estado | Badge |
|--------|-------|
| Pendiente JudgmentDay | `security-JudgmentDay%20pending-orange` |
| Pasó con hallazgos aceptados | `security-JudgmentDay%20reviewed-yellow` |
| Pasó limpio / hallazgos críticos cerrados | `security-JudgmentDay%20pass-brightgreen` |

El badge de CI (`actions/workflows/ci.yml/badge.svg`) **no se edita a mano**.

---

## Paso 6 — Checklist de entrega (opcional)

Si avanzó despliegue, slides, vídeo o README de instalación, actualiza el estado
en [`docs/delivery-checklist.md`](../../docs/delivery-checklist.md) (casillas y
URLs). No dupliques ese checklist en el README: el README **enlaza** y contiene
el contenido de producto.

---

## Paso 7 — Verificación final

Antes de commit/PR:

- [ ] Suites del paso 1 ejecutadas (o E2E omitido con nota explícita)
- [ ] Números en `testing-strategy.md` = suma de salidas Vitest/Playwright
- [ ] Badges README = mismos números (URL encoding correcto: espacio → `%20`, `|` → `%7C`, `/` → `%2F`)
- [ ] Marca de tiempo actualizada en cada doc tocado
- [ ] No se crearon archivos nuevos fuera de la lista “permitidos”
- [ ] `docs/security.md` no inventó resultados de JudgmentDay

---

## Comando rápido de “refresh de conteos”

```bash
# 1) Ejecutar (Linux/macOS / Git Bash con Make)
make test-unit
make check
make test-frontend
# make test-e2e   # si aplica
```

```powershell
# 1) Ejecutar (Windows PowerShell sin Make)
docker compose run --rm backend npm run test:unit
docker compose up -d postgres
docker compose run --rm backend npx tsc --noEmit
docker compose run --rm backend npm run test:integration
docker compose run --rm --no-deps frontend npm run test
# docker compose -f compose.yaml -f compose.e2e.yaml --profile e2e run --rm --build e2e
```

```text
# 2) Anotar totales de la salida → editar:
#    docs/testing-strategy.md
#    README.md (badges + tabla)

# 3) Actualizar **Última actualización:** a la fecha de hoy en los docs tocados
```
