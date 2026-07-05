# Feature Specification: Sprint 04 — Plantillas MVP

**Branch**: `sprint/004-plantillas`  
**Created**: 2026-07-05  
**Status**: Draft → Final

## 1. Purpose

Construir el **motor de plantillas** que permite a TADOR generar asientos contables a partir de intenciones del usuario. Las plantillas son el puente entre eventos cotidianos y la partida doble.

Este sprint NO incluye UI ni frontend. Solo backend: definición de plantillas (JSON), endpoint de apuntes, validación y generación de asientos.

## 2. Principios de diseño

1. **HOME y PRO comparten el mismo backend.** Una plantilla HOME es un wizard PRO con opciones precargadas. El endpoint recibe exactamente lo mismo.
2. **La plantilla es datos, no código.** Son JSON versionados en el repo. El backend nunca programa lógica especial por plantilla.
3. **La plantilla declara qué cuentas participan y cómo.** Define slots (líneas), cada uno con grupo contable, lado (debe/haber) y modo de resolución.
4. **El usuario resuelve las cuentas concretas** seleccionando hijas de los grupos declarados.
5. **Un apunte genera exactamente un asiento.** Flujos compuestos requieren varios apuntes.

## 3. Formato de plantilla (JSON)

### 3.1 Estructura base

```jsonc
{
  // Identificación
  "code": "pagar_servicios",
  "version": 1,
  "name": "Pagar servicios básicos",
  "modes": ["hogar"],
  "status": "active",

  // Campos de entrada del formulario (a primer nivel, no array)
  "amount": {
    "type": "money",
    "required": true,
    "label": "Monto"
  },
  "concept": {
    "type": "text",
    "required": true,
    "label": "Concepto"
  },
  "date": {
    "type": "date",
    "default": "today",
    "required": true,
    "label": "Fecha"
  },
  "entity": {
    "type": "entity",
    "required": false,
    "label": "Relacionado con"
  },

  // Modo de reparto del monto entre líneas
  "amountMode": "single",
  //   "single" = mismo monto en todas las líneas
  //   "per_line" = futuro: cada línea puede llevar un monto distinto
  //               (el sistema valida balance = suma débitos = suma créditos)

  // Descripción del asiento (template con {campos})
  "descriptionTemplate": "{concept}",

  // Líneas del asiento — cada una es un slot que el usuario llena con una cuenta
  "lines": [
    {
      "id": 1,
      "side": "debit",
      "label": "Tipo de servicio",
      "strategy": "from_group",
      "groupCode": "61120000",
      "suggestedChild": "61211002"       // opcional, sugerencia para UI
    },
    {
      "id": 2,
      "side": "credit",
      "label": "Pagaste con",
      "strategy": "from_groups",
      "groupCodes": ["11110000", "11120000", "21200000"]
      // Efectivo, Bancos, Tarjetas de crédito
      // Sin suggestedChild — el usuario elige siempre
    }
  ],

  // Versión legacy markdown para documentación
  "journalExample": "DEBE 61120000 (Servicios del hogar)\nHABER 11120000 (Banco)"
}
```

### 3.2 Estrategias de línea (`strategy`)

| strategy | Significado | Frontend |
|---|---|---|
| `from_group` | El usuario elige una cuenta hija (postable) del grupo `groupCode`. Pueden ser CuentaGlobal o CuentaUsuario que cuelguen de ese grupo. | Selector filtrado por grupo |
| `from_groups` | El usuario elige de entre varios grupos posibles | Selector unificado con cuentas de esos grupos |
| `fixed` | Cuenta fija, no se pide al usuario | No aparece en UI |
| `from_entity` | Se deriva de la entidad seleccionada (futuro) | Depende de entidad |

### 3.3 Archivos JSON

Viven en `backend/src/plantillas/`:

```
backend/src/plantillas/
├── index.ts              // Exporta todas y las registra
├── pagar-servicios.json
├── deposito-bancario.json
├── registrar-sueldo.json
├── pagar-supermercado.json
├── pagar-taxi.json
├── pagar-cita-medica.json
├── pagar-cine.json
├── retiro-bancario.json
├── transferencia.json
└── pago-tarjeta.json
```

Se cargan en memoria al arrancar el servidor desde los archivos JSON. No hay tabla `plantillas` en DB.

## 4. Las 10 plantillas HOME

### 4.1 Pagar Servicios Básicos

```json
{
  "code": "pagar_servicios",
  "version": 1,
  "name": "Pagar servicios básicos",
  "modes": ["hogar"],
  "amountMode": "single",
  "descriptionTemplate": "{concept}",
  "lines": [
    { "id": 1, "side": "debit", "label": "Tipo de servicio",  "strategy": "from_group",    "groupCode": "61120000", "suggestedChild": null },
    { "id": 2, "side": "credit", "label": "Pagaste con",       "strategy": "from_groups", "groupCodes": ["11110000","11120000","21200000"] }
  ]
}
```

### 4.2 Depositar en Banco

```json
{
  "code": "deposito_bancario",
  "version": 1,
  "name": "Depositar en banco",
  "modes": ["hogar"],
  "amountMode": "single",
  "descriptionTemplate": "Depósito: {concept}",
  "lines": [
    { "id": 1, "side": "debit",  "label": "Banco destino",   "strategy": "from_group",   "groupCode": "11120000" },
    { "id": 2, "side": "credit", "label": "Desde (origen)",   "strategy": "from_groups", "groupCodes": ["11110000","11120000"] }
  ]
}
```

### 4.3 Registrar Sueldo

```json
{
  "code": "registrar_sueldo",
  "version": 1,
  "name": "Registrar sueldo del mes",
  "modes": ["hogar"],
  "amountMode": "single",
  "descriptionTemplate": "Sueldo: {concept}",
  "lines": [
    { "id": 1, "side": "debit",  "label": "¿Dónde recibiste?", "strategy": "from_groups", "groupCodes": ["11110000","11120000"] },
    { "id": 2, "side": "credit", "label": "Tipo de ingreso",    "strategy": "from_group", "groupCode": "41010000", "suggestedChild": null }
  ]
}
```

### 4.4 Pagar Supermercado

```json
{
  "code": "pagar_supermercado",
  "version": 1,
  "name": "Pagar supermercado",
  "modes": ["hogar"],
  "amountMode": "single",
  "descriptionTemplate": "{concept}",
  "lines": [
    { "id": 1, "side": "debit",  "label": "Tipo de gasto",  "strategy": "from_group",   "groupCode": "61130000", "suggestedChild": null },
    { "id": 2, "side": "credit", "label": "Pagaste con",     "strategy": "from_groups", "groupCodes": ["11110000","11120000","21200000"] }
  ]
}
```

### 4.5 Pagar Taxi

```json
{
  "code": "pagar_taxi",
  "version": 1,
  "name": "Pagar transporte",
  "modes": ["hogar"],
  "amountMode": "single",
  "descriptionTemplate": "{concept}",
  "lines": [
    { "id": 1, "side": "debit",  "label": "Tipo de gasto",  "strategy": "from_group",   "groupCode": "61160000", "suggestedChild": "61260002" },
    { "id": 2, "side": "credit", "label": "Pagaste con",     "strategy": "from_groups", "groupCodes": ["11110000","11120000","21200000"] }
  ]
}
```

### 4.6 Pagar Cita Médica

```json
{
  "code": "pagar_cita_medica",
  "version": 1,
  "name": "Pagar cita médica",
  "modes": ["hogar"],
  "amountMode": "single",
  "descriptionTemplate": "{concept}",
  "lines": [
    { "id": 1, "side": "debit",  "label": "Tipo de gasto",  "strategy": "from_group",   "groupCode": "61140000", "suggestedChild": null },
    { "id": 2, "side": "credit", "label": "Pagaste con",     "strategy": "from_groups", "groupCodes": ["11110000","11120000","21200000"] }
  ]
}
```

### 4.7 Pagar Cine

```json
{
  "code": "pagar_cine",
  "version": 1,
  "name": "Pagar entretenimiento",
  "modes": ["hogar"],
  "amountMode": "single",
  "descriptionTemplate": "{concept}",
  "lines": [
    { "id": 1, "side": "debit",  "label": "Tipo de gasto",  "strategy": "from_group",   "groupCode": "61180000", "suggestedChild": null },
    { "id": 2, "side": "credit", "label": "Pagaste con",     "strategy": "from_groups", "groupCodes": ["11110000","11120000","21200000"] }
  ]
}
```

### 4.8 Retiro Bancario

```json
{
  "code": "retiro_bancario",
  "version": 1,
  "name": "Retirar efectivo del banco",
  "modes": ["hogar"],
  "amountMode": "single",
  "descriptionTemplate": "Retiro: {concept}",
  "lines": [
    { "id": 1, "side": "debit",  "label": "Destino (efectivo)", "strategy": "from_group",   "groupCode": "11110000" },
    { "id": 2, "side": "credit", "label": "Desde (banco)",       "strategy": "from_group",   "groupCode": "11120000" }
  ]
}
```

### 4.9 Transferencia

```json
{
  "code": "transferencia",
  "version": 1,
  "name": "Transferir entre cuentas",
  "modes": ["hogar"],
  "amountMode": "single",
  "descriptionTemplate": "Transferencia: {concept}",
  "lines": [
    { "id": 1, "side": "debit",  "label": "Cuenta destino",  "strategy": "from_groups", "groupCodes": ["11110000","11120000"] },
    { "id": 2, "side": "credit", "label": "Cuenta origen",    "strategy": "from_groups", "groupCodes": ["11110000","11120000"] }
  ]
}
```

### 4.10 Pago Tarjeta de Crédito

```json
{
  "code": "pago_tarjeta",
  "version": 1,
  "name": "Pagar tarjeta de crédito",
  "modes": ["hogar"],
  "amountMode": "single",
  "descriptionTemplate": "Pago tarjeta: {concept}",
  "lines": [
    { "id": 1, "side": "debit",  "label": "Tarjeta a pagar",  "strategy": "from_group",   "groupCode": "21200000" },
    { "id": 2, "side": "credit", "label": "Desde (banco)",     "strategy": "from_group",   "groupCode": "11120000" }
  ]
}
```

## 5. API

### 5.1 `GET /api/plantillas` (require auth)

Devuelve todas las plantillas disponibles. El frontend filtra por `modes` según el modo del usuario. Cada línea incluye `availableAccounts` con las CuentaGlobal y CuentaUsuario del usuario que cumplen la estrategia declarada.

```jsonc
// Response 200
{
  "plantillas": [
    {
      "code": "pagar_servicios",
      "version": 1,
      "name": "Pagar servicios básicos",
      "modes": ["hogar"],
      "amount": { "type": "money", "required": true, "label": "Monto" },
      "concept": { "type": "text", "required": true, "label": "Concepto" },
      "date": { "type": "date", "default": "today", "required": true, "label": "Fecha" },
      "entity": { "type": "entity", "required": false, "label": "Relacionado con" },
      "amountMode": "single",
      "lines": [
        { "id": 1, "side": "debit",  "label": "Tipo de servicio",  "strategy": "from_group",    "groupCode": "61120000" },
        { "id": 2, "side": "credit", "label": "Pagaste con",       "strategy": "from_groups", "groupCodes": ["11110000","11120000","21200000"] }
      ]
    }
    // ... más plantillas
  ]
}
```

**Nota**: El backend enriquece cada línea según su estrategia:
- `from_group` / `from_groups`: resuelve las CuentaGlobal y CuentaUsuario del usuario que cuelgan de esos grupos, y las incluye como `availableAccounts` en cada línea.

### 5.2 `GET /api/plantillas/:code`

Devuelve una plantilla específica con cuentas disponibles resueltas.

```jsonc
// Response 200
{
  "plantilla": {
    "code": "pagar_servicios",
    // ... mismo que arriba, cada línea con `availableAccounts`
  }
}
```

### 5.3 `POST /api/apuntes`

Crea un apunte a partir de una plantilla (o sin plantilla, modo PRO).

**Request con plantilla (HOME):**
```jsonc
{
  "templateCode": "pagar_servicios",
  "date": "2026-07-05",
  "concept": "Luz julio",
  "amount": 85.50,
  "entityId": null,              // opcional
  "lines": [
    { "id": 1, "accountId": "61211002" },        // CuentaGlobal ID (Energía)
    { "id": 2, "accountId": "cuenta-usr-banco" } // CuentaUsuario ID
  ]
}
```

**Request sin plantilla (PRO wizard):**
```jsonc
{
  "templateCode": null,
  "date": "2026-07-05",
  "concept": "Pago a proveedor",
  "amountMode": "per_line",        // en PRO cada línea puede tener monto distinto
  "entityId": null,
  "lines": [
    { "id": 1, "accountId": "61240001", "side": "debit",  "amount": 85.50 },
    { "id": 2, "accountId": "efectivo-usr",  "side": "credit", "amount": 85.50 }
  ]
}
```

**Response 201:**
```jsonc
{
  "apunte": {
    "id": "apunte-xxx",
    "templateCode": "pagar_servicios",
    "date": "2026-07-05",
    "concept": "Luz julio",
    "amount": 85.50,
    "asientoId": "asiento-abc-123"
  },
  "asiento": {
    "id": "asiento-abc-123",
    "fecha": "2026-07-05",
    "descripcion": "Luz julio",
    "lines": [
      { "cuentaId": "61211002", "debito": 85.50, "credito": 0 },
      { "cuentaId": "cuenta-usr-banco", "debito": 0, "credito": 85.50 }
    ]
  }
}
```

### 5.4 Modo PRO sin plantilla

El endpoint `POST /api/apuntes` también acepta apuntes sin `templateCode`. En ese caso:

- El frontend envía líneas completas con `side` y `amount`
- `amountMode` puede ser `per_line` (cada línea con su monto) o `single`
- El backend valida que sum(débitos) = sum(créditos)
- Las cuentas deben pertenecer al usuario o ser globales

## 6. Validaciones del backend

### 6.1 Con plantilla (`templateCode` presente)

| # | Regla | Código |
|---|---|---|
| V1 | `templateCode` existe en el registro de plantillas | 400 |
| V2 | Todos los `lines[].id` existen en la plantilla | 400 |
| V3 | Cada `accountId` existe y es accesible por el usuario | 403/404 |
| V4 | Cada cuenta cumple la estrategia del slot: si `from_group`, la cuenta cuelga del grupo declarado | 400 |
| V5 | Si `amountMode === "single"`, todas las líneas usan el mismo `amount` | 400 |
| V6 | Periodo contable abierto | 400 |
| V7 | Cuentas activas | 400 |
| V8 | El asiento generado está balanceado (sum débitos = sum créditos) | 400 |
| V9 | Tenant isolation: usuario A no usa cuentas de usuario B | 403 |

### 6.2 Sin plantilla (PRO wizard)

| # | Regla |
|---|---|
| V3 | Cada `accountId` existe y es accesible por el usuario |
| V6 | Periodo contable abierto |
| V7 | Cuentas activas |
| V8 | Asiento balanceado (sum débitos = sum créditos) |
| V9 | Tenant isolation |

## 7. Backend: modelo de datos

No hay tabla `plantillas` en DB. Las plantillas viven como JSON y se cargan en memoria.

Se crea una tabla `apuntes` para registrar el uso de plantillas:

```prisma
model Apunte {
  id           String   @id @default(cuid())
  templateCode String?  // null si es PRO wizard
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

El `Asiento` ya existe del sprint 03. No se modifica.

## 8. Frontend: uso esperado de las plantillas

Este sprint no implementa frontend. Pero el spec define cómo el frontend DEBE consumir las plantillas:

### 8.1 Modo HOME

1. GET /api/plantillas → obtiene lista filtrada por `modes: ["hogar"]`
2. UI muestra botones/íconos por cada plantilla (ej: "Pagar servicios", "Depositar", "Sueldo"...)
3. Usuario selecciona una → GET /api/plantillas/:code → obtiene la plantilla con cuentas disponibles resueltas
4. UI renderiza los campos (`amount`, `concept`, `date`, `entity`) y los slots de cuenta con selectores filtrados
5. Usuario llena → POST /api/apuntes

### 8.2 Modo PRO (wizard)

1. Frontend pregunta paso a paso: "Gasto o Ingreso?" → "¿Qué grupo?" → "¿Qué cuenta hija?" → "¿Monto?" → "¿Cómo pagaste?" → ...
2. Al final, arma el payload sin `templateCode` y POST /api/apuntes

### 8.3 Consideraciones UI futuras

- Los `from_group` con `suggestedChild` pueden auto-seleccionar la sugerencia y agilizar
- Los `from_groups` pueden unificarse en un solo selector de cuentas del usuario
- El campo `entity` permite asociar a una entidad (banco, persona, etc.)

## 9. Plan de cuentas: template → grupo

Cada plantilla referencia grupos del plan de cuentas. Tabla de referencia:

| plantilla | Grupo DEBE | Grupo HABER |
|---|---|---|
| pagar_servicios | 61120000 Servicios del hogar | Efectivo/Bancos/Tarjetas |
| deposito_bancario | 11120000 Bancos (destino) | 11110000 Efectivo |
| registrar_sueldo | Efectivo/Bancos (destino) | 41010000 Trabajo dependiente |
| pagar_supermercado | 61130000 Alimentación | Efectivo/Bancos/Tarjetas |
| pagar_taxi | 61160000 Transporte | Efectivo/Bancos/Tarjetas |
| pagar_cita_medica | 61140000 Salud | Efectivo/Bancos/Tarjetas |
| pagar_cine | 61180000 Gastos no escenciales | Efectivo/Bancos/Tarjetas |
| retiro_bancario | 11110000 Efectivo (destino) | 11120000 Bancos |
| transferencia | Efectivo/Bancos (destino) | Efectivo/Bancos (origen) |
| pago_tarjeta | 21200000 Tarjetas crédito | 11120000 Bancos |

## 10. Success Criteria

- **SC-001**: Las 10 plantillas HOME están definidas como JSON y se cargan al iniciar el servidor.
- **SC-002**: GET /api/plantillas devuelve las 10 plantillas con cuentas disponibles resueltas.
- **SC-003**: POST /api/apuntes con `templateCode` válido crea asiento balanceado.
- **SC-004**: POST /api/apuntes sin `templateCode` (PRO wizard) crea asiento balanceado.
- **SC-005**: Validaciones V1-V9 rechazan apuntes inválidos con mensajes claros.
- **SC-006**: Apunte queda registrado y vinculado al Asiento generado.
- **SC-007**: POST /api/apuntes con `amountMode: "single"` replica el monto en todas las líneas.

## 11. Fuera de scope (sprint actual)

- UI / Frontend (sprint 006)
- Cuentas por defecto del usuario
- Asistente IA v0
- Conciliación de tarjeta
- Cuenta puente
- Plantillas PRO (ingreso_tercero, gasto_proyecto_puente, asiento_manual)
- Motor de plantillas en DB
- Historial de apuntes
- Edición de apuntes
