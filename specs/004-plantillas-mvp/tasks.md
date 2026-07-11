# Tasks: Sprint 04 — Plantillas MVP

- [x] ## T1: Plantillas JSON (10 archivos)

Crear `backend/src/plantillas/` con los 10 JSON de plantillas HOME.

**Files**: `backend/src/plantillas/pagar-servicios.json`, `deposito-bancario.json`, `registrar-sueldo.json`, `pagar-supermercado.json`, `pagar-taxi.json`, `pagar-cita-medica.json`, `pagar-cine.json`, `retiro-bancario.json`, `transferencia.json`, `pago-tarjeta.json`

**Definition**: Cada archivo sigue el formato de [spec.md section 3](../spec.md#3-formato-de-plantilla-json). Ver template definitions en [section 4](../spec.md#4-las-10-plantillas-home).

**Acceptance**:
- Cada JSON tiene `code`, `version`, `name`, `modes`, `amountMode`, `lines[]` con `id`, `side`, `label`, `strategy`, `groupCode`/`groupCodes`
- Todos los `from_group` con `groupCode` que existe en el plan de cuentas
- Todos los `from_groups` con `groupCodes[]` que existen en el plan de cuentas

---

- [x] ## T2: Plantilla loader (`index.ts`)

**File**: `backend/src/plantillas/index.ts`

Carga los 10 JSON desde el filesystem, valida schema mínimo y los exporta como array registrado.

**Acceptance**:
- Lee `__dirname + '/*.json'`
- Valida que cada plantilla tenga `code`, `version`, `name`, `modes`, `lines[]`
- Valida que cada línea tenga `id`, `side`, `strategy`
- Si `strategy === 'from_group'`, requiere `groupCode`
- Si `strategy === 'from_groups'`, requiere `groupCodes[]`
- Exporta `getPlantilla(code): Plantilla | undefined` y `getAllPlantillas(): Plantilla[]`
- Loguea error si un JSON es inválido (no crash)

---

- [x] ## T3: Plugin Fastify — registro de plantillas

**File**: `backend/src/api/plugins/plantillas.ts` o integrado en server.ts

Registra las plantillas en el servidor y agrega decorator `app.plantillaLoader`.

**Acceptance**:
- Plugin carga plantillas al `onReady`
- Decorator accesible desde rutas

---

- [x] ## T4: GET /api/plantillas

**Files**: `backend/src/api/routes/plantillas.ts`, registro en server.ts

Endpoint listar y obtener plantillas individuales.

**Acceptance**:
- `GET /api/plantillas` → 200, devuelve todas las plantillas
- `GET /api/plantillas?mode=hogar` → filtra por `modes` array
- `GET /api/plantillas/:code` → 200, devuelve la plantilla con `availableAccounts` resuelto
- `GET /api/plantillas/nonexistent` → 404
- Requiere autenticación (session cookie)
- Cada línea en GET /api/plantillas/:code incluye `availableAccounts`: lista de CuentaGlobal + CuentaUsuario que cumplen la estrategia

**Account resolution logic**:
- `from_group(groupCode)`: busca CuentaGlobal con parent chain → groupCode. Busca CuentaUsuario con globalId → CuentaGlobal → parent chain → groupCode.
- `from_groups(groupCodes)`: igual pero acepta cualquiera de los grupos.

---

- [x] ## T5: Modelo Apunte + migración Prisma

**File**: `backend/prisma/schema.prisma`, nueva migración

```prisma
model Apunte {
  id           String   @id @default(cuid())
  templateCode String?
  date         DateTime
  concept      String
  amount       Decimal
  asientoId    String   @unique
  asiento      Asiento  @relation(fields: [asientoId], references: [id])
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  createdAt    DateTime @default(now())
}
```

**Acceptance**:
- `prisma migrate dev` crea la tabla
- Relación 1:1 con Asiento
- `templateCode` nullable para apuntes PRO wizard
- ForeignKey a User y Asiento

---

- [x] ## T6: POST /api/apuntes — core logic

**File**: `backend/src/api/routes/apuntes.ts`

Crea un apunte y su asiento en una transacción.

**Acceptance**:

### Con templateCode (HOME)
- Valida que `templateCode` exista (V1)
- Valida que cada `lines[].id` exista en la plantilla (V2)
- Valida que cada `accountId` exista y sea accesible (V3) — CuentaGlobal o CuentaUsuario del usuario
- Valida jerarquía: cada cuenta cumple la estrategia del slot (V4):
  - `from_group`: la cuenta (CuentaGlobal o CuentaUsuario) cuelga del grupo `groupCode`
  - `from_groups`: la cuenta cuelga de ALGUNO de los `groupCodes`
- Si `amountMode === 'single'`, replica el `amount` en todas las líneas (V5)
- Periodo abierto (V6)
- Cuentas activas (V7)
- Asiento balanceado: débitos = créditos (V8)
- Tenant isolation (V9)

### Sin templateCode (PRO wizard)
- Valida que cada línea tenga `side` y `amount`
- Valida cuentas (V3), periodo (V6), activas (V7), balance (V8), tenant (V9)
- Sin validación de jerarquía de grupo

### Response
- 201 con `apunte` y `asiento` generados
- 400 con errores de validación descriptivos

---

- [x] ## T7: Tests

**File**: `backend/tests/plantillas.test.ts`

### Unit tests
- Loader carga 10 plantillas
- Loader rechaza JSON inválido (sin code, sin lines, etc.)
- `getPlantilla` por code existe
- `getPlantilla` por code inexistente → undefined

### Integration tests

**US1**: Registrar gasto con plantilla (pagar_servicios con crédito a banco)
- POST /api/apuntes → 201, asiento balanceado
- Verificar Apunte creado con templateCode
- Verificar Asiento creado con líneas correctas

**US2**: Registrar ingreso con plantilla (registrar_sueldo)
- POST /api/apuntes → 201, asiento balanceado
- Verificar que DEBE es efectivo/banco y HABER es ingreso

**US3**: Registrar traspaso (deposito_bancario, retiro_bancario, transferencia)
- POST /api/apuntes → 201, asiento sin impacto PYG

**US4**: Registrar pago tarjeta (pago_tarjeta)
- POST /api/apuntes → 201, asiento balanceado
- DEBE = tarjeta (reduce pasivo), HABER = banco

**US5**: PRO wizard sin template
- POST /api/apuntes sin templateCode → 201
- con líneas custom balanceadas

**US6**: Errores de validación
- Template inexistente → 400
- Línea con ID inválido → 400
- Cuenta inexistente → 404
- Cuenta de otro usuario → 403
- Cuenta que no cuelga del grupo declarado → 400
- Periodo cerrado → 400
- Asiento descuadrado → 400
- Sin template + líneas descuadradas → 400

**US7**: GET /api/plantillas
- Devuelve 10 plantillas
- GET /api/plantillas/:code devuelve plantilla con availableAccounts
- GET /api/plantillas/nonexistent → 404

---

- [x] ## T8: Validator de jerarquía

**File**: `backend/src/application/plantilla-validator.ts` o similar

Función que verifica si una cuenta (CuentaGlobal o CuentaUsuario) cuelga de un grupo contable (groupCode).

**Logic**:
- Si es CuentaGlobal:
  - Walk up `parentId` chain hasta root
  - Si algún ancestor tiene `codigo === groupCode` → OK
  - Si la cuenta misma tiene `codigo === groupCode` → OK (la cuenta ES el grupo, aunque no posteable)
- Si es CuentaUsuario:
  - Sigue `globalId` → CuentaGlobal
  - Luego walk up `parentId` chain como CuentaGlobal

**Acceptance**:
- Retorna boolean
- Usa Prisma relations (carga la chain completa en una query)
- Limita a 10 niveles de profundidad (previene loops)

---

## Follow-up (deuda para Sprint 06)

Historial de apuntes requerido por UI Hogar (`/entries`, dashboard recientes). Contrato: `GET /api/apuntes` en spec §5.4.

- [x] F1 Escribir test: `GET /api/apuntes` → 200 lista del usuario A; usuario B no ve apuntes de A (SC-008)
- [x] F2 Escribir test: orden por `date` desc; `limit`/`offset` respetados; respuesta sin líneas de asiento
- [x] F3 Implementar `GET /api/apuntes` en `backend/src/api/routes/apuntes.ts` según §5.4
