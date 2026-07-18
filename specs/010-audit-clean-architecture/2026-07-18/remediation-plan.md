# Plan ejecutable de remediación de Clean Architecture

Este plan convierte la auditoría del 18 de julio de 2026 en unidades pequeñas, verificables y asignables. La estrategia es conservar el comportamiento observable mientras se invierte la propiedad de interfaces: `api -> application -> domain` e `infrastructure -> application/domain`. Cada unidad incluye sus tests y debe poder revertirse sin arrastrar refactors ajenos.

## 1. Resultado esperado

Al finalizar:

- `backend/src/application/` no importa Prisma, `argon2` ni `infrastructure/`.
- `backend/src/api/` no importa Prisma ni `infrastructure/database`.
- Los puertos pertenecen a `application/ports/`; Prisma, SQL, Argon2 y locks PostgreSQL quedan en `infrastructure/`.
- Las rutas autentican, validan/normalizan HTTP, llaman un caso de uso y traducen resultados/errores.
- Los contratos HTTP actuales, aislamiento por tenant, idempotencia, concurrencia y aritmética decimal permanecen iguales.

### Alcance

- Solo `backend/`, sus tests y, cuando corresponda, documentación de arquitectura directamente afectada.
- Hallazgos CA-1 a CA-6, incluidos escapes adicionales descubiertos en el código actual.
- Caracterización y refuerzo de tests para los artefactos tocados.

### Fuera de alcance

- Frontend, nuevas capacidades, rediseño de endpoints o mensajes de producto.
- Cambios de Prisma schema, migraciones, seeds o datos existentes.
- Cambiar rutas, status codes, cuerpos JSON o semántica de filtros.
- Introducir dependencias runtime. Los puertos deben ser TypeScript plano.
- “Mejoras” no necesarias de nombres, formato, rendimiento o dominio.

### Invariantes no negociables

1. Toda consulta o mutación de datos de usuario conserva `userId` o un `bookId` previamente resuelto desde ese `userId`; una ausencia de ownership falla cerrada.
2. `POST /api/entries`, `POST /api/apuntes`, edición/anulación y políticas de saldo conservan transacción, advisory locks, idempotency key y control de periodo.
3. Dinero usa `decimal.js` en dominio/aplicación y Prisma `Decimal`/strings en infraestructura. No introducir sumas o comparaciones monetarias con `number`; `number` solo al serializar, después de cuantizar.
4. No se cambia schema, migraciones ni seeds.
5. Los contratos HTTP se caracterizan antes o junto al primer cambio de cada endpoint.
6. Un puerto no expone `Prisma.*`, `PrismaClient`, modelos generados, `TransactionClient`, SQL ni tipos JSON de Prisma.

## 2. Estado inicial verificado

Autoridad: `.specify/memory/constitution.md`, `specs/foundation/stack-architecture.md`, `.cursor/rules/implementation-standards.mdc` y `technical-remediation.ai.md`.

Hechos del repositorio:

- `buildApp()` en `backend/src/server.ts` es el composition root y hoy registra todas las rutas.
- Hay 52 archivos TypeScript en `backend/src` y 25 archivos de test.
- Los tests unitarios son `backend/tests/unit/**/*.test.ts`; los demás son integración real con PostgreSQL y `Fastify.inject`.
- Scripts reales: `npm run typecheck`, `npm run test:unit`, `POSTGRES_HOST=localhost npm run test:integration`. En contenedor: `make typecheck`, `make test-unit`, `make test`.
- Los tests de integración son seriales y `tests/setup.ts` rechaza limpiar una DB distinta de `tador_test`.

### Discrepancias con la auditoría

La auditoría es dirección, no inventario exhaustivo. Antes de implementar, asumir además:

- `application/financial-analysis-service.ts` importa Prisma y contiene otro `$queryRaw`; no aparece en CA-1/CA-4.
- `application/account-balance-policy.ts` y `application/transaction-locks.ts` importan `Prisma.TransactionClient`/`Prisma.sql`; son fugas críticas porque protegen concurrencia contable.
- `application/accounting-service.ts` contiene más SQL y acceso Prisma que el resumen: escrituras transaccionales, periodos, balances mensuales, PYG y balance.
- `application/resolve-apunte-entity-id.ts` contiene un loader con una interfaz de forma Prisma; la función pura puede quedarse, el loader debe salir.
- `api/routes/apuntes.ts` tiene más accesos directos que el conteo auditado y mezcla validación, ownership, plantillas, idempotencia, periodo, locks, persistencia y serialización.
- `api/routes/reports.ts` admite servicios opcionales y fallbacks. No eliminar ni alterar esos contratos sin tests; la composición de producción sí debe seguir suministrándolos.
- `application/apunte-list-filters.ts` convierte límites monetarios con `Number`. Al mover el filtro, conservar la entrada HTTP, pero representar límites como strings/Decimal antes de llegar a Prisma.

### Baseline observado el 2026-07-18

- `npm run typecheck`: pasa.
- `npm run test:unit`: el proceso termina por `RangeError: Maximum call stack size exceeded` en `tinypool` después del primer archivo.
- `POSTGRES_HOST=localhost npm run test:integration`: inicia PostgreSQL/Fastify, pero los archivos quedan omitidos y el proceso termina con el mismo error de `tinypool`.
- El árbol ya contenía movimientos no confirmados del informe hacia `2026-07-18/`. Ningún agente debe restaurar, borrar ni incluir cambios preexistentes ajenos.

El fallo del runner es un gate de entrada: registrar si se reproduce fuera del sandbox/IDE. No atribuirlo a una unidad de refactor sin comparar con este baseline.

## 3. Gates de entrada

Antes de abrir la primera unidad:

- [ ] Capturar `git status --short`, rama y SHA base; no tocar cambios ajenos.
- [ ] Confirmar Node soportado por el repo y `npm ci` ya resuelto.
- [ ] Ejecutar typecheck y ambos suites; guardar comando, exit code y resumen.
- [ ] Si persiste Tinypool, abrir/usar un issue de infraestructura de tests o acordar un baseline conocido. No ocultarlo con cambios de configuración dentro de una unidad arquitectónica.
- [ ] Confirmar que la integración apunta a `tador_test`, nunca `tador_dev`.
- [ ] Añadir primero tests de caracterización donde el mapa de §8 marque huecos.
- [ ] Congelar por unidad los endpoints, status codes y JSON que se preservarán.

## 4. Grafo de dependencias

```text
BASE-00
  └─ PORT-01 ── AUTH-02
       ├─ ACCT-03 ── CHART-12 ── ACCOUNT-13
       ├─ REPORT-04 ── REPORT-06
       ├─ ANALYSIS-05 ── REPORT-06
       ├─ JOURNAL-07a ─ JOURNAL-07b ─ ENTRY-08 ─ ENTRY-09 ─ LEDGER-10 ─ ROUTE-11
       ├─ TAG-14
       └─ ENTITY-15a ─ ENTITY-15b

ACCOUNT-13 + ENTITY-15b + ENTRY-09
  └─ APUNTE-16 ─ APUNTE-17a ─ APUNTE-17b ─ APUNTE-18 ─ PLANTILLA-19

Todos los nodos ── FINAL-20
```

`REPORT-04`, `ANALYSIS-05`, `ACCT-03`, `TAG-14` y `ENTITY-15a` pueden prepararse en paralelo solo si no editan `server.ts`, puertos compartidos ni rutas compartidas. Su wiring se integra de uno en uno sobre la rama actualizada.

## 5. Unidades de trabajo

Regla común: cada unidad empieza leyendo el diff acumulado, añade/actualiza tests antes o junto al refactor, no mezcla limpieza vecina y deja registro de comandos/resultados.

### BASE-00 — Contratos y guardas de arquitectura

**Áreas:** nuevo test de arquitectura bajo `backend/tests/unit/`; tests HTTP existentes indicados abajo.
**Precondición:** baseline registrado y fallo Tinypool clasificado.

Instrucciones:

1. Añadir un test barato que falle si `application` importa `infrastructure`, Prisma o Argon2, o si `api` importa Prisma/database.
2. Durante la migración permitir excepciones explícitas por archivo con una lista decreciente; nunca un patrón global permisivo.
3. Añadir caracterización solo para contratos sin cobertura antes de tocar su ruta.

Aceptación: la guarda refleja exactamente la deuda actual y cada unidad elimina sus excepciones.
Verificación: `npm run typecheck`; `npm run test:unit -- tests/unit/<architecture-test>.test.ts`; suites completas según §8.
Tamaño: <200 líneas.

### PORT-01 — Reubicar puertos existentes

**Áreas:** `application/ports/{user-repository,book-repository,session-service,email-service}.ts`, repos/servicios actuales, `auth-service.ts`, `book-service.ts`.
**Precondición:** BASE-00.

Mover interfaces y DTOs, sin cambiar métodos ni comportamiento. Las fábricas Prisma/stub siguen en infraestructura e implementan/importan los puertos. No mover implementaciones ni editar `server.ts` salvo que el compilador demuestre que es necesario.

Aceptación: aplicación ya no importa esos cuatro módulos de infraestructura; plataforma y book se comportan igual.
Tests: actualizar/agregar unit tests de servicios con fakes; `tests/plataforma-base.test.ts`, `tests/unit/book.test.ts`.
Tamaño: 150–300 líneas.

### AUTH-02 — Aislar Argon2

**Áreas:** `application/ports/password-hasher.ts`, `auth-service.ts`, `infrastructure/services/argon2-password-hasher.ts`, `server.ts`, tests auth.
**Precondición:** PORT-01 integrado.

Crear `PasswordHasher.hash/verify`, adapter Argon2 e inyectarlo. Tests unitarios con fake deben cubrir registro, login correcto/incorrecto y reset; integración conserva cookies y respuestas.

Aceptación: cero import de Argon2 en aplicación; producción inyecta adapter real.
Tests: unit nuevo de auth y `tests/plataforma-base.test.ts`.
Tamaño: 200–350 líneas.

### ACCT-03 — Puerto de cuentas y helpers de plantillas

**Áreas:** `application/ports/account-repository.ts`, adapter Prisma, `account-codigo.ts`, `plantilla-account-resolver.ts`, `plantilla-validator.ts`, loader de `resolve-apunte-entity-id.ts`.
**Precondición:** PORT-01.

Definir DTOs propios para árbol global, cuenta de usuario, activación y metadata. Inyectar el puerto en helpers que consultan datos. Mantener puras `ancestorCodesOf`, `matchesGroups` y `resolveApunteEntityId`; mover `loadLineAccountMetaForEntityResolution` al adapter/caso de uso. No usar `Prisma.InputJsonValue`.

Aceptación: esos cuatro módulos no conocen Prisma; ownership está en cada método tenant-owned.
Tests: ampliar `unit/plantilla-account-resolver.test.ts`, `unit/resolve-apunte-entity-id.test.ts`; regresión `plantillas.test.ts` y `apunte-entity-id.test.ts`.
Tamaño: previsto 300–400; si excede, encadenar `ACCT-03a` (puerto/adapter/tests) y `ACCT-03b` (consumidores/tests).

### REPORT-04 — Lecturas de dashboard

**Áreas:** `application/ports/dashboard-read-repository.ts`, adapter Prisma/SQL, `dashboard-report-service.ts`, `server.ts`.
**Precondición:** PORT-01.

Mover las consultas PYG mensual/top, posición y metadata de portfolio al adapter. Los DTOs de fila pertenecen al puerto. Mantener agregación/clasificación y Decimal en aplicación. No convertir a `number` antes del DTO HTTP final.

Aceptación: dashboard application service solo depende del puerto y dominio; SQL idéntico salvo cambios demostrablemente equivalentes.
Tests: unit tests de agregación/fakes donde falten; `dashboard-report.test.ts`, `pro-analysis-reports.test.ts`.
Tamaño: probablemente >400; PR encadenada obligatoria: `REPORT-04a` PYG, `REPORT-04b` posición/portfolio y wiring. Cada slice conserva sus tests.

### ANALYSIS-05 — Lectura de análisis financiero

**Áreas:** `application/ports/financial-analysis-read-repository.ts`, adapter SQL, `financial-analysis-service.ts`, `server.ts`.
**Precondición:** PORT-01; integrar después de REPORT-04 para evitar choque en `server.ts`.

Mover `$queryRaw` al adapter y devolver `{ codigo, signedAmount }`. Conservar agregación Decimal y filtros `bookId/entityId/year`.

Aceptación: el servicio no importa Prisma; tenant se restringe por `bookId` resuelto desde el usuario.
Tests: `unit/financial-analysis.test.ts`, `pro-analysis-reports.test.ts`.
Tamaño: 150–300 líneas.

### REPORT-06 — Adelgazar rutas de reportes

**Áreas:** `api/routes/reports.ts`, `server.ts`, servicio de book existente.
**Precondición:** REPORT-04, ANALYSIS-05 y LEDGER-10.

Eliminar `getBookId` Prisma. Inyectar `BookApplicationService` o un caso de uso application equivalente. Conservar alias `year/año`, fallbacks 501 y formas JSON caracterizadas.

Aceptación: ruta sin Prisma; cada report usa un book del tenant autenticado.
Tests: `dashboard-report.test.ts`, `pro-analysis-reports.test.ts`, secciones reports de `motor-contable.test.ts`.
Tamaño: <250 líneas.

### JOURNAL-07a — Contrato transaccional de journal

**Áreas:** nuevos puertos de journal/unit-of-work, adapter Prisma inicial, tests de contrato.
**Precondición:** PORT-01.

Diseñar una transacción propiedad de aplicación sin exponer `Prisma.TransactionClient`. Debe soportar, como mínimo: idempotency lookup/lock, book/period lookup, cuentas, saldos protegidos, persistencia de asiento/líneas/versiones y commit atómico. El advisory lock SQL vive en infraestructura.

No crear un “repository” con lógica de negocio oculta. El caso de uso decide secuencia; el adapter ejecuta primitivas dentro de una unidad de trabajo.

Aceptación: interfaces sin tipos Prisma y tests de contrato del adapter para rollback, duplicado idempotente y ownership.
Tests: nuevos tests de contrato enfocados más `account-balance-policy.test.ts`.
Tamaño: 250–400.

### JOURNAL-07b — Extraer acceso de política de saldo

**Áreas:** `account-balance-policy.ts`, `transaction-locks.ts`, adapter transaccional, tests.
**Precondición:** JOURNAL-07a.

Separar cálculo puro de la carga/lock/persistencia. Mover `Prisma.sql` y lock PostgreSQL a infraestructura. Conservar orden determinista de locks, exclusión de asiento reemplazado y Decimal exacto.

Aceptación: ambos módulos de aplicación no importan Prisma; las pruebas concurrentes siguen demostrando que solo una retirada consume el saldo.
Tests: unit puros nuevos y `account-balance-policy.test.ts`.
Tamaño: 300–400; si supera, mantener `07a/07b` como PRs encadenadas, nunca un PR único.

### ENTRY-08 — Migrar creación y lectura de asientos

**Áreas:** `accounting-service.ts`, journal adapter, tests motor.
**Precondición:** JOURNAL-07b.

Migrar `createEntry`, `getEntry` y `listEntries` al puerto. Preservar validación de líneas, cuantización, periodo, idempotencia, transacción y respuesta. Añadir unit tests con fakes antes del cambio; no tocar update/void.

Aceptación: estos métodos no usan Prisma y pasan concurrencia/idempotencia.
Tests: secciones creación/idempotencia de `motor-contable.test.ts`, `account-balance-policy.test.ts`.
Tamaño: 300–400.

### ENTRY-09 — Migrar edición y anulación

**Áreas:** `accounting-service.ts`, journal adapter, tests motor.
**Precondición:** ENTRY-08 integrado; misma rama encadenada, no worktree paralelo.

Migrar `updateEntry` y `voidEntry`. Preservar `AsientoVersion`, periodo abierto, reversión, exclusión del asiento reemplazado y chequeo de saldo dentro de la transacción.

Aceptación: rollback atómico ante cualquier fallo y respuestas actuales.
Tests: edición/anulación de `motor-contable.test.ts` y regresión `account-balance-policy.test.ts`.
Tamaño: 300–400.

### LEDGER-10 — Periodos, balances y reportes legacy

**Áreas:** resto de `accounting-service.ts`, puertos/adapters de journal/read model.
**Precondición:** ENTRY-09.

Migrar ensure/close/reopen/get period, balance actual/mensual, PYG y balance sheet. El SQL mensual sale a infraestructura; sumas y clasificación permanecen Decimal/application.

Aceptación: `accounting-service.ts` no importa Prisma ni infraestructura.
Tests: periodos, balances y reports de `motor-contable.test.ts`.
Tamaño: >400 probable; encadenar `LEDGER-10a` periodos, `10b` balances, `10c` PYG/balance.

### ROUTE-11 — Rutas entries, periods y balances

**Áreas:** `entries.ts`, `periods.ts`, `balances.ts`, `server.ts`.
**Precondición:** LEDGER-10.

Reemplazar los tres `getBookId` por servicio application inyectado. Mantener parseo/error mapping; no mover detalles HTTP a aplicación.

Aceptación: tres rutas sin Prisma y con resolución tenant-safe.
Tests: `motor-contable.test.ts`, `account-balance-policy.test.ts`.
Tamaño: 150–300.

### CHART-12 — Chart y activaciones

**Áreas:** `chart.ts`, caso de uso chart, `AccountRepository`, adapter, `server.ts`.
**Precondición:** ACCT-03 y JOURNAL-07b.

Extraer listado, activación y cambio de política. El cambio de política debe conservar lock transaccional y ownership. La ruta solo parsea y mapea errores.

Aceptación: sin Prisma en ruta; activación global no permite alterar política de otro usuario.
Tests: chart de `catalogos-base.test.ts`, `account-balance-policy.test.ts`.
Tamaño: 250–400.

### ACCOUNT-13 — Cuentas de usuario

**Áreas:** `accounts.ts`, caso de uso accounts, `AccountRepository`, adapter, `server.ts`.
**Precondición:** CHART-12.

Extraer lista, creación guiada/default parents y política de saldo. Representar metadata con DTO propio y mapear JSON Prisma en infraestructura. Mantener 409/422 y proyección Hogar.

Aceptación: ruta sin Prisma/tipos Prisma; toda cuenta listada/modificada tiene `userId`.
Tests: cuentas, edge cases y tenant de `catalogos-base.test.ts`; `account-balance-policy.test.ts`.
Tamaño: >400 probable; encadenar `ACCOUNT-13a` lista/creación y `13b` política/wiring.

### TAG-14 — CRUD de tags

**Áreas:** `application/ports/tag-repository.ts`, caso de uso, adapter, `tags.ts`, `server.ts`.
**Precondición:** PORT-01.

Extraer CRUD y unicidad por usuario. Las búsquedas update/delete deben incluir `userId`.

Aceptación: ruta fina, 404/409 iguales y aislamiento cubierto.
Tests: tags, duplicados y tenant en `catalogos-base.test.ts`; unit con fake.
Tamaño: 250–400.

### ENTITY-15a/15b — Entidades y aprovisionamiento

**Áreas:** puerto/caso de uso/adapter de entidades, `entities.ts`, `server.ts`.
**Precondición:** PORT-01; `15b` requiere ACCT-03.

- `ENTITY-15a`: listado, update/delete y entidades no provisionables.
- `ENTITY-15b`: creación atómica de banco/tarjeta/wallet más cuenta asociada y metadata.

Preservar capacidades, unicidad tenant y transacción entidad+cuenta. Tests antes o junto a cada slice.

Aceptación: sin Prisma/`Prisma.InputJsonValue` en API; no queda entidad provisionada sin su cuenta si falla la transacción.
Tests: `entity-capabilities.test.ts`, entidades/tenant/duplicados en `catalogos-base.test.ts`.
Tamaño: cada slice 300–400; PR encadenada obligatoria.

### APUNTE-16 — Lectura y filtros

**Áreas:** puerto/read repository de apuntes, caso de uso list/get, `apuntes.ts`, `apunte-list-filters.ts`.
**Precondición:** ACCT-03 y ENTITY-15b.

Extraer list/get. El filtro application genera un DTO neutral; el adapter crea el `where`. Límites de monto permanecen string/Decimal hasta Prisma. Conservar orden por `createdAt`, paginación y proyección sin líneas.

Aceptación: list/get sin Prisma y siempre por `userId`.
Tests: SC-008 de `plantillas.test.ts`, unit de filtros y nuevo test get/tenant si falta.
Tamaño: 250–400.

### APUNTE-17a/17b — Creación de apunte

**Áreas:** `ApunteRepository`, caso de uso create, adapters, `apuntes.ts`, `server.ts`.
**Precondición:** ACCOUNT-13, ENTITY-15b, ENTRY-09, APUNTE-16.

- `APUNTE-17a`: puertos, adapter transaccional y unit tests de contrato; sin lógica HTTP.
- `APUNTE-17b`: caso de uso y ruta fina.

El caso de uso conserva validación de plantilla/cuentas/capacidad, book currency, entity auto-resolution, periodo, balance, idempotency replay y persistencia atómica. Reutilizar journal unit-of-work; no duplicar locks.

Aceptación: respuestas frescas y replay son idénticas; P2002 mantiene replay; ningún write cruza tenant.
Tests: creación/validaciones/traspasos de `plantillas.test.ts`, `apunte-entity-id.test.ts`, `account-balance-policy.test.ts`.
Tamaño: >400 total; PR encadenada obligatoria y revisión especial de concurrencia.

### APUNTE-18 — Edición de apunte

**Áreas:** caso de uso update, adapter, `apuntes.ts`.
**Precondición:** APUNTE-17b.

Extraer patch y coordinarlo con edición de asiento. Conservar periodo, moneda, cuenta/tenant y atomicidad; si hoy apunte y asiento no son totalmente atómicos, no “corregir” silenciosamente: caracterizar, documentar riesgo y pedir decisión.

Aceptación: ruta fina y contrato PATCH igual.
Tests: añadir caracterización PATCH si no existe; ejecutar `plantillas.test.ts` y motor.
Tamaño: 250–400.

### PLANTILLA-19 — Preview/admin

**Áreas:** `plantillas-admin.ts`, caso de uso preview/readiness, `server.ts`.
**Precondición:** ACCT-03 y APUNTE-17b.

Eliminar lookup Prisma de book y reutilizar puertos/casos de uso. El render HTML queda en API; validación/preview queda en application.

Aceptación: sin Prisma y preview sigue sin persistir.
Tests: bloque Plantillas Admin de `plantillas.test.ts`.
Tamaño: 150–300.

### FINAL-20 — Cierre de arquitectura

**Áreas:** guardas, documentación y wiring final; ningún refactor funcional nuevo.
**Precondición:** todas las unidades integradas.

Eliminar allowlist temporal de BASE-00, ejecutar todos los gates, revisar puertos y composition root. Verificar que no quedaron factories opcionales sin uso ni adapters muertos.

Aceptación: criterios globales de §9.
Tamaño: <200 líneas.

## 6. Asignación a subagentes

- Un agente recibe una sola unidad o un tramo explícito `a/b`; no “CA-3 completo”.
- Ownership exclusivo mientras la unidad está activa: archivos de la unidad, sus tests y sus adapters.
- `server.ts`, un puerto ya existente y `accounting-service.ts` son archivos de exclusión mutua. Solo una rama activa puede editarlos.
- El agente no renombra, formatea ni abstrae código fuera de su slice.
- Cada handoff incluye SHA base, archivos tocados, decisiones de interfaz, invariantes revisadas, comandos/exit codes y deuda restante.
- Si descubre una discrepancia, la documenta y detiene solo si cambia contrato, schema, seguridad, dinero o atomicidad.
- Tests de comportamiento viajan en el mismo commit/PR que el refactor que protegen.

## 7. Worktrees, branches y olas

### Convención

- Base inicial: rama coordinadora creada desde el SHA aprobado de `audit/clean_architecure`.
- Rama coordinadora sugerida: `refactor/010-clean-architecture`.
- Unidad: `refactor/010-<id>-<slug>`, por ejemplo `refactor/010-auth-02-password-hasher`.
- Worktree sugerido fuera del checkout principal: `../tador-wt-010-<id>`.
- Nunca crear worktrees desde un working tree sucio; la rama se crea desde un commit coordinador conocido.

### Cuándo usar worktree

Sí: preparación paralela sobre archivos disjuntos, experimentos de contrato y PRs encadenadas grandes.
No: dos unidades que toquen `server.ts`, `accounting-service.ts`, el mismo puerto o la misma ruta; tampoco para ocultar cambios sin commit del coordinador.

### Stacking

Una rama dependiente parte de la última rama integrada, no de la base antigua. Orden obligatorio:

- `JOURNAL-07a -> 07b -> ENTRY-08 -> ENTRY-09 -> LEDGER-10* -> ROUTE-11`.
- `ACCT-03 -> CHART-12 -> ACCOUNT-13*`.
- `ENTITY-15a -> 15b`.
- `APUNTE-16 -> 17a -> 17b -> 18 -> PLANTILLA-19`.

### Olas conservadoras

1. **Ola 0, secuencial:** BASE-00, PORT-01, AUTH-02.
2. **Ola 1, preparación paralela limitada:** ACCT-03, REPORT-04a y ENTITY-15a pueden prepararse en worktrees distintos. Integrar y cablear de uno en uno; luego ANALYSIS-05 y REPORT-04b.
3. **Ola 2, secuencial:** toda la cadena JOURNAL/ENTRY/LEDGER/ROUTE. Nadie más edita `accounting-service.ts` o `server.ts`.
4. **Ola 3:** TAG-14 puede prepararse en paralelo con CHART-12, pero su wiring se integra serialmente. Luego ACCOUNT-13 y ENTITY-15b.
5. **Ola 4, secuencial:** REPORT-06 y cadena APUNTE/PLANTILLA.
6. **Ola 5:** FINAL-20.

Gate entre olas: rama coordinadora limpia, typecheck, unit completo, integración completa, guardas `rg`, revisión de diff y registro de baseline/fallos.

## 8. Protocolo obligatorio de tests

### Mapa fuente → tests mínimos

- Auth/book/puertos: unit nuevos + `plataforma-base.test.ts` + `unit/book.test.ts`.
- Account/chart/helpers: `unit/plantilla-account-resolver.test.ts`, `unit/resolve-apunte-entity-id.test.ts`, `catalogos-base.test.ts`, `account-balance-policy.test.ts`.
- Entity/tag: `entity-capabilities.test.ts`, `catalogos-base.test.ts`, unit domain existentes.
- Journal/accounting/routes: `motor-contable.test.ts`, `account-balance-policy.test.ts`.
- Dashboard/financial analysis/reports: `unit/financial-analysis.test.ts`, `dashboard-report.test.ts`, `pro-analysis-reports.test.ts`, secciones report de motor.
- Apuntes/plantillas: `unit/apunte-list-filters.test.ts`, `unit/resolve-apunte-entity-id.test.ts`, `plantillas.test.ts`, `apunte-entity-id.test.ts`, `account-balance-policy.test.ts`.

### Secuencia por agente

1. Ejecutar el test enfocado antes del cambio y guardar resultado.
2. Añadir/actualizar test; cuando sea nuevo comportamiento de caracterización, demostrar que detecta una alteración relevante o que falla antes del seam.
3. Ejecutar test enfocado después.
4. Ejecutar `npm run typecheck`.
5. Ejecutar `npm run test:unit`.
6. Ejecutar `POSTGRES_HOST=localhost npm run test:integration`.
7. Ejecutar guardas:

```bash
rg -n "infrastructure/|@prisma/client|from ['\"]argon2['\"]|prisma\." backend/src/application
rg -n "infrastructure/database|@prisma/client|prisma\." backend/src/api
rg -n "Prisma(Client|\\.|TransactionClient|sql)" backend/src/application backend/src/api
rg -n "number" backend/src/application backend/src/domain
git diff --check
git diff --stat
```

El último `rg number` es revisión manual: distinguir años, paginación y DTO HTTP de dinero intermedio.

### Fallo preexistente

- Repetir exactamente el comando en la rama base/SHA del agente.
- Si falla igual, registrar evidencia y continuar solo con aprobación del coordinador y tests enfocados verdes; no editar runner/config como parte del refactor.
- Si solo falla en la rama de la unidad, es regresión de la unidad y bloquea handoff.
- Nunca marcar “verde” un suite omitido, abortado o con cero tests ejecutados.

## 9. Integración, rollback y finalización

Gate de integración por unidad:

- propósito único y diff revisable;
- tests junto al código;
- sin conflictos pendientes ni cambios ajenos;
- wiring de producción probado, no solo fakes;
- contratos HTTP comparados;
- ownership, Decimal y atomicidad revisados explícitamente;
- idealmente <400 líneas cambiadas. Si se aproxima, usar los slices/PRs encadenados ya definidos.

Rollback: revertir la unidad/PR completa en orden inverso del stack. No revertir un puerto base dejando adapters consumidores. Ante regresión de concurrencia, tenant o dinero, detener la ola y volver al último gate verde.

Finalización global:

- los tres `rg` de arquitectura no devuelven hallazgos reales;
- dominio sigue puro;
- typecheck, unit e integración ejecutan todos sus tests y pasan;
- no hay cambios en schema/migrations/seeds/package manifests;
- todos los endpoints mantienen rutas, status y JSON;
- concurrencia/idempotencia/saldo tienen pruebas verdes;
- `server.ts` es el único composition root y no contiene reglas de negocio;
- no hay puertos o adapters sin uso ni interfaces definidas en infraestructura.

## 10. Plantillas operativas

### Prompt de lanzamiento

```text
Implementa únicamente <ID — nombre> del plan:
specs/010-audit-clean-architecture/2026-07-18/remediation-plan.md

Base exacta: <rama/SHA>. Worktree: <ruta o “no”>.
Ownership permitido: <archivos/áreas>. No edites <archivos compartidos>.
Lee constitución, stack architecture e implementation standards.
Preserva contratos HTTP, tenant isolation, Decimal, transacciones e idempotencia.
Agrega/actualiza tests antes o junto al refactor. Ejecuta tests enfocados,
typecheck, unit, integración y rg de arquitectura. No cambies schema/migrations,
dependencias ni refactors ajenos. Si el trabajo supera ~400 líneas, detente en
el sub-slice previsto y entrega un handoff encadenable.
```

### Reporte final del subagente

```text
Unidad / base:
Resultado:
Archivos y contratos tocados:
Tests añadidos o actualizados:
Comandos, exit codes y tests realmente ejecutados:
Guardas de arquitectura:
Invariantes verificadas (tenant/dinero/atomicidad/HTTP):
Decisiones de puertos y wiring:
Riesgos, fallos preexistentes y evidencia:
Siguiente unidad desbloqueada / dependencia pendiente:
Tamaño del diff:
```

## 11. Riesgos que requieren decisión

- El seam transaccional de JOURNAL-07 no puede ser una simple interfaz CRUD: debe mantener locks y validación dentro de la misma transacción. Una propuesta que exponga `Prisma.TransactionClient` no es aceptable.
- APUNTE-18 debe comprobar si la actualización actual de asiento y apunte es atómica. Si no lo es, corregir atomicidad podría alterar comportamiento y tamaño; elevar al coordinador antes de ampliar alcance.
- El fallo Tinypool observado impide afirmar baseline verde. Debe resolverse o aceptarse formalmente antes de integración global.
- La cantidad real de cambios en `accounting-service.ts`, dashboard y apuntes supera la estimación de la auditoría; por eso sus PRs encadenadas son obligatorias, no opcionales.
