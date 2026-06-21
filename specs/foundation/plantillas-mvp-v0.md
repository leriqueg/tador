# Plantillas MVP v0

Este documento define una primera lista de plantillas para discutir antes de Spec Kit. No son contratos finales ni archivos JSON reales de la aplicación todavía. La decisión de producto es que, para el MVP, las plantillas pueden vivir como JSON versionado en el repositorio y más adelante migrar a base de datos si hace falta.

## Principio

Una plantilla convierte una intención de usuario en un asiento contable válido.

```text
Intención cotidiana -> datos mínimos -> validación -> asiento balanceado
```

En Modo Hogar, la plantilla debe ocultar la complejidad contable. En Modo PRO, puede pedir más datos o permitir elegir cuentas con mayor precisión.

## Lista inicial

| Código tentativo | Nombre | Modo | Intención |
|------------------|--------|------|-----------|
| `gasto_efectivo` | Gasté dinero en efectivo | Hogar / PRO | Registrar un egreso pagado con efectivo o billetera. |
| `gasto_banco` | Gasté desde banco | Hogar / PRO | Registrar un egreso pagado directamente desde cuenta bancaria. |
| `gasto_tarjeta_puente` | Compré con tarjeta usando puente | Hogar / PRO | Registrar gasto PYG, cuenta puente y deuda de tarjeta. |
| `ingreso_simple` | Recibí dinero | Hogar / PRO | Registrar ingreso propio recibido en banco, efectivo o billetera. |
| `ingreso_tercero` | Recibí dinero de tercero para custodiar/enviar | Hogar / PRO | Registrar fondos de tercero sin impacto PYG. |
| `traspaso` | Transferí dinero | Hogar / PRO | Mover saldo entre cuentas sin PYG. |
| `prestamo_recibido` | Pedí prestado | Hogar / PRO | Registrar entrada de dinero y obligación asociada. |
| `pago_tarjeta` | Pagué tarjeta | Hogar / PRO | Reducir banco/efectivo y deuda de tarjeta. |
| `gasto_proyecto_puente` | Gasté asociado a proyecto/persona | Hogar / PRO | Registrar gasto PYG asociado a una cuenta puente o entidad. |
| `asiento_manual` | Asiento manual | PRO | Crear asiento más abierto con líneas explícitas y validación de balance. |

## Plantillas candidatas prioritarias

Para arrancar, las más importantes son:

1. `gasto_efectivo`
2. `gasto_tarjeta_puente`
3. `ingreso_simple`
4. `ingreso_tercero`
5. `traspaso`
6. `gasto_proyecto_puente`
7. `asiento_manual`

`pago_tarjeta` y `prestamo_recibido` son importantes, pero pueden cerrarse después de validar los casos principales.

## Formato JSON conceptual

Ejemplo de estructura para una plantilla:

```json
{
  "code": "gasto_efectivo",
  "version": 1,
  "name": "Gasté dinero en efectivo",
  "modes": ["hogar", "pro"],
  "status": "draft",
  "intent": {
    "type": "expense",
    "phrases": [
      "gasté dinero",
      "pagué en efectivo",
      "compré algo con efectivo"
    ]
  },
  "ui": {
    "title": "Registrar gasto",
    "description": "Registra un gasto pagado con efectivo o billetera.",
    "confirmation": "Registraré {amount} como {concept} usando {paymentAccount}."
  },
  "fields": [
    {
      "name": "amount",
      "type": "money",
      "required": true,
      "label": "Monto"
    },
    {
      "name": "concept",
      "type": "text",
      "required": true,
      "label": "Concepto"
    },
    {
      "name": "date",
      "type": "date",
      "required": true,
      "default": "today",
      "label": "Fecha"
    },
    {
      "name": "expenseAccount",
      "type": "account",
      "required": true,
      "strategy": "ask_or_suggest",
      "accountRole": "expense",
      "label": "Categoría"
    },
    {
      "name": "paymentAccount",
      "type": "account",
      "required": true,
      "strategy": "user_default",
      "accountNature": "cash_or_wallet",
      "label": "Pagué con"
    },
    {
      "name": "entity",
      "type": "entity",
      "required": false,
      "strategy": "optional",
      "label": "Relacionado con"
    }
  ],
  "validations": [
    "amount_positive",
    "period_open",
    "accounts_active",
    "accounts_belong_to_user",
    "currency_matches_user"
  ],
  "journalEntry": {
    "description": "{concept}",
    "lines": [
      {
        "accountRef": "expenseAccount",
        "side": "debit",
        "amount": "{amount}"
      },
      {
        "accountRef": "paymentAccount",
        "side": "credit",
        "amount": "{amount}"
      }
    ]
  },
  "ai": {
    "enabled": true,
    "examples": [
      "Gasté 50 en almuerzo",
      "Pagué 8 en taxi",
      "Compré medicinas en efectivo"
    ]
  }
}
```

## Campos comunes

| Campo | Uso |
|-------|-----|
| `code` | Identificador estable de la plantilla. |
| `version` | Versión de la plantilla para migraciones futuras. |
| `name` | Nombre visible. |
| `modes` | Modos donde aplica: Hogar, PRO o ambos. |
| `intent` | Ayuda a UI e IA a reconocer la intención. |
| `ui` | Textos de pantalla y confirmación. |
| `fields` | Datos que la plantilla necesita. |
| `validations` | Reglas previas a generar el asiento. |
| `journalEntry` | Receta conceptual del asiento. |
| `ai` | Frases de ejemplo y activación para el asistente IA v0. |

## Estrategias de cuenta

| Estrategia | Significado |
|------------|-------------|
| `fixed` | Usa una cuenta conocida del catálogo global o del usuario. |
| `user_default` | Usa la cuenta por defecto del usuario para esa naturaleza. |
| `ask_user` | El usuario debe elegir. |
| `ask_or_suggest` | El sistema sugiere, pero el usuario puede cambiar. |
| `from_entity_relation` | Se deriva de una Entidad, por ejemplo banco o tarjeta. |
| `create_if_missing` | La UI puede guiar la creación si no existe. |

## Ejemplos de plantillas

### `gasto_tarjeta_puente`

Uso: taxi UBER con AMEX, regalo con tarjeta, compra cotidiana con tarjeta.

Asiento conceptual:

```text
DEBE  Cuenta PYG de gasto
HABER Cuenta puente
DEBE  Cuenta puente
HABER Tarjeta de crédito
```

Reglas:

- La tarjeta no genera PYG.
- La cuenta puente debe quedar neteada si todo ocurre en el mismo asiento.
- El PYG debe quedar en la cuenta de gasto.
- Puede asociarse una Entidad/tag.

### `ingreso_tercero`

Uso: dinero de Tía Toya recibido para hijo, fondos en custodia, dinero de otra persona.

Asiento conceptual:

```text
DEBE  Banco / efectivo recibido
HABER Fondo de tercero / obligación
```

Reglas:

- No genera PYG.
- Debe identificar Entidad relacionada cuando sea posible.
- Debe permitir cruce futuro contra proyecto, envío o devolución.

### `gasto_proyecto_puente`

Uso: comisión asociada a `Proyecto UP - Santiago`, gasto de hijo, gasto de casa en arriendo.

Asiento conceptual:

```text
DEBE  Cuenta PYG de gasto
HABER Cuenta puente / proyecto
```

Puede combinarse con otro asiento o plantilla que mueva efectivo/banco contra la cuenta puente.

### `traspaso`

Uso: banco a billetera, banco a banco, retiro de efectivo.

Asiento conceptual:

```text
DEBE  Cuenta destino
HABER Cuenta origen
```

Reglas:

- No genera PYG.
- Ambas cuentas deben ser de balance, pasivo, activo o puente según el caso.
- No debe usarse para ocultar gastos.

### `asiento_manual`

Uso: casos PRO que no encajan en una plantilla simple.

Reglas:

- Solo Modo PRO.
- Debe validar balance.
- No debe permitir guardar asientos descuadrados.
- Debe pedir descripción clara.
- Queda pendiente si permite borrador.

## Relación con IA v0

La IA v0 no genera asientos. Solo debe producir una sugerencia estructurada:

```json
{
  "templateCode": "gasto_tarjeta_puente",
  "confidence": 0.91,
  "fields": {
    "amount": 9.2,
    "concept": "taxi UBER",
    "paymentAccountHint": "AMEX",
    "expenseAccountHint": "Taxis",
    "bridgeAccountHint": "Gastos Varios 2026"
  },
  "needsConfirmation": true
}
```

El backend debe validar usuario, cuentas, periodo, moneda, plantilla y reglas contables antes de ejecutar.

## Pendiente

- Definir campos exactos de cada plantilla MVP.
- Decidir si cada plantilla genera uno o varios asientos.
- Definir defaults por usuario: efectivo, banco principal, tarjeta principal, puente anual.
- Definir cómo se versionan cambios de plantillas.
- Definir si algunas plantillas se ocultan en Hogar y solo aparecen en PRO.
