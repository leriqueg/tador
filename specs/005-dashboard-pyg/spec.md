# Feature Specification: Sprint 05 — Dashboard PYG y Posición

**Feature Branch**: `sdd/definiciones`

**Created**: 2026-06-22 | **Last Updated**: 2026-07-07

**Status**: Draft

**Input**: Sprint 05, `specs/foundation/reporte-pyg-mvp.md`, `specs/foundation/modos-hogar-pro.md`, constitución v1.5.0.

---

## 1. Overview

Este sprint entrega el **dashboard obligatorio del MVP** con dos paneles separados (PYG y Posición), más los **contratos de API** que ambos modos (Hogar y PRO) consumen.

### Mode scope

| Aspecto | Alcance de este sprint |
|---------|----------------------|
| **API + data contracts** | Se definen e implementan para servir a ambos modos |
| **UI base** | Se entrega una visualización funcional mode-agnostic |
| **UI Hogar** | Sprint 06 — Frontend Hogar |
| **UI PRO** | Sprint 07 — Frontend PRO ligero |

El backend expone un solo conjunto de endpoints. La UI de cada modo decide qué indicadores mostrar, con qué nivel de detalle y qué terminology usar.

---

## 2. API Contracts

El backend expone endpoints que devuelven datos estructurados. No incluyen formato ni presentación — eso lo resuelve la UI de cada modo.

### 2.1 GET /api/reports/pyg?year={year}

Devuelve el resultado del ejercicio PYG.

```typescript
// Response
{
  year: number;                    // Ejercicio consultado
  totalIncome: number;             // Total ingresos (Decimal)
  totalExpenses: number;           // Total egresos como valor positivo
  netResult: number;               // Ingresos - Gastos (puede ser negativo)
  monthlySeries: Array<{
    month: number;                 // 1-12
    income: number;
    expenses: number;              // Valor positivo
    balance: number;               // Income - expenses (puede ser negativo)
  }>;
  topIncome: Array<{
    accountId: string;
    accountCode: string;           /// Código del plan de cuentas
    accountName: string;
    accumulated: number;
  }>;
  topExpenses: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    accumulated: number;
  }>;
}
```

**Reglas de negocio:**
- `totalIncome` se calcula desde cuentas clasificadas como ingreso.
- `totalExpenses` se calcula desde cuentas clasificadas como gasto/egreso.
- `monthlySeries` incluye los 12 meses del año, incluso si un mes tiene saldo cero.
- `topIncome` y `topExpenses` se ordenan de mayor a menor acumulado. Si hay empate, orden alfabético.
- Cuentas puente, cuentas de balance y medios de pago NO deben aparecer en ningún total PYG.
- Los valores usan `decimal.js` (o equivalente). El frontend recibe `number` y aplica formato según moneda del usuario.

### 2.2 GET /api/reports/position

Devuelve la posición financiera actual a la fecha de consulta.

```typescript
// Response
{
  totalAvailable: number;          /// Suma saldos cuentas activo líquido
  totalReceivables: number;        /// Suma saldos cuentas por cobrar
  totalPayables: number;           /// Suma saldos cuentas pasivo (valor positivo)
  netPosition: number;             /// Available + Receivables - Payables
  breakdown: {
    available: Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      balance: number;
    }>;
    receivables: Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      balance: number;
    }>;
    payables: Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      balance: number;             /// Valor positivo (lo que se debe)
    }>;
  };
}
```

**Reglas de negocio:**
- `totalAvailable` = cuentas de activo líquido (efectivo, bancos, billeteras electrónicas).
- `totalReceivables` = cuentas de activo por cobrar (préstamos a terceros, cuentas por cobrar).
- `totalPayables` = cuentas de pasivo (tarjetas, préstamos, cuentas por pagar). Se devuelve como valor positivo.
- Cuentas de ingreso/egreso NO deben aparecer en ningún total de posición.
- El cálculo se hace a la fecha de consulta (no tiene selector de fecha en el MVP, pero la API acepta `?date=` para uso futuro).

---

## 3. Reportes por modo

### 3.1 Hogar — Lo que ve el usuario

| Indicador | Fuente de datos | ¿Qué responde? |
|-----------|-----------------|----------------|
| Ingresos del período | `pyg.totalIncome` | ¿Cuánto me ingresó? |
| Gastos del período | `pyg.totalExpenses` | ¿Cuánto gasté? |
| Resultado neto | `pyg.netResult` | ¿Gasté menos de lo que gané? |
| Evolución mensual | `pyg.monthlySeries` | ¿Voy mejor o peor que antes? |
| Top categorías de gasto | `pyg.topExpenses` | ¿En qué se me va la plata? |
| Disponible | `position.totalAvailable` | ¿Cuánto efectivo tengo ahora? |
| Deudas | `position.totalPayables` | ¿Cuánto debo? |

**Reglas de presentación Hogar:**
- NO se muestran códigos de cuenta (`accountCode`).
- Los nombres de cuenta deben ser legibles (sin tecnicismos).
- El panel de posición se etiqueta como "Lo que tengo y lo que debo" (no "Posición financiera").
- El Top 10 puede llamarse "¿En qué gastaste?".
- Los egresos se muestran como valores positivos (barras rojas), ingresos como barras verdes.
- No se diferencia entre "gasto real" e "inversión" — todo gasto es gasto.

### 3.2 PRO — Lo que ve el usuario

| Indicador | Fuente de datos | ¿Qué responde? |
|-----------|-----------------|----------------|
| Ingresos del período | `pyg.totalIncome` | ¿Cuánto ingresó? |
| Gastos del período | `pyg.totalExpenses` | ¿Cuánto gasté? |
| Resultado del ejercicio | `pyg.netResult` | ¿Gané o perdí? |
| Evolución mensual | `pyg.monthlySeries` | Tendencia del ejercicio |
| Top ingresos | `pyg.topIncome` | ¿Qué me genera ingresos? |
| Top gastos | `pyg.topExpenses` | ¿En qué gasto más? |
| Disponible | `position.totalAvailable` | Efectivo y bancos |
| Por cobrar | `position.totalReceivables` | ¿Cuánto me deben? |
| Por pagar | `position.totalPayables` | ¿Cuánto debo? |
| Activos | `position.totalAvailable + totalReceivables` | ¿Qué tengo? |
| Pasivos | `position.totalPayables` | ¿Qué debo? |
| Posición neta | `position.netPosition` | ¿Estoy en posición positiva? |
| Desglose por cuenta | `position.breakdown` | ¿Dónde está mi dinero exactamente? |

**Reglas de presentación PRO:**
- PUEDE mostrar códigos de cuenta (`accountCode`) junto al nombre.
- Los paneles se etiquetan con terminología contable: "Posición financiera", "Resultado del ejercicio", "Flujo".
- El desglose de posición (`breakdown`) PUEDE expandirse para ver cuentas individuales.
- PRO diferencia conceptualmente gasto real de inversión (aunque el registro contable sea el mismo, la UI puede etiquetar cuentas de activo durable de forma distinta).

---

## 4. User Stories

### US-001 (Hogar) — Ver resultado anual

> Como usuario Hogar, quiero ver de un vistazo cuánto ingresé, cuánto gasté y si estoy gastando más de lo que gano.

**Priority**: P1 | **Mode**: Hogar + PRO

**Independent Test**: Crear asientos de ingresos y egresos en un ejercicio, verificar que el dashboard muestra totales correctos y neto.

**Acceptance**:
1. **Given** un ejercicio con ingresos y egresos, **When** consulto el dashboard, **Then** veo total ingresos, total gastos y resultado neto sin códigos de cuenta.

---

### US-002 (Hogar) — Ver evolución mensual

> Como usuario Hogar, quiero ver un gráfico mes a mes para saber si voy mejor o peor que antes.

**Priority**: P1 | **Mode**: Hogar + PRO

**Independent Test**: Crear datos en varios meses, verificar serie mensual completa (12 meses) con ingresos (verde), egresos (rojo) y saldo (línea negra).

**Acceptance**:
1. **Given** movimientos en varios meses, **When** consulto el gráfico mensual, **Then** veo los 12 meses del ejercicio aunque no tengan datos.

---

### US-003 (Hogar) — Ver en qué gasto

> Como usuario Hogar, quiero ver mis categorías principales de gasto para entender a dónde se va mi plata.

**Priority**: P2 | **Mode**: Hogar + PRO

**Independent Test**: Crear más de 10 cuentas de gasto con importes, verificar que el Top 10 ordena correctamente y muestra solo nombres (sin códigos en Hogar).

**Acceptance**:
1. **Given** varias cuentas de gasto, **When** consulto el dashboard, **Then** veo máximo 10 categorías ordenadas de mayor a menor.

---

### US-004 (Hogar) — Ver deudas

> Como usuario Hogar, quiero ver cuánto debo en total (tarjetas, préstamos) para no confundir "tener plata en el banco" con "estar bien".

**Priority**: P2 | **Mode**: Hogar

**Acceptance**:
1. **Given** cuentas de pasivo con saldo, **When** consulto el dashboard, **Then** veo "Deudas: $X" como lectura separada del PYG.
2. **Given** cuentas de efectivo con saldo, **When** consulto el dashboard, **Then** veo "Disponible: $X".

---

### US-005 (PRO) — Ver posición completa

> Como usuario PRO, quiero ver disponible, por cobrar y por pagar por separado para entender mi liquidez y mis compromisos.

**Priority**: P2 | **Mode**: PRO

**Independent Test**: Crear cuentas de activo líquido, por cobrar y pasivo con saldos, verificar los tres totales del panel de posición.

**Acceptance**:
1. **Given** cuentas de banco/efectivo, cuentas por cobrar y pasivos, **When** consulto el dashboard en modo PRO, **Then** veo disponible, por cobrar y por pagar como lecturas separadas con desglose por cuenta.
2. **Given** que el modo cambia a Hogar, **Then** el panel de posición muestra solo disponible y deudas (sin por cobrar).

---

### US-006 (PRO) — Diferenciar gasto de inversión

> Como usuario PRO, quiero que la UI me ayude a distinguir un gasto corriente de una compra de activo (ej: laptop) para no distorsionar mi lectura de rentabilidad.

**Priority**: P3 | **Mode**: PRO

**Nota**: Esta story depende de la clasificación de cuentas (activo durable vs gasto). En el MVP se resuelve por etiquetado de cuenta en el plan de cuentas. Implementación completa post-MVP con depreciación.

**Acceptance**:
1. **Given** una cuenta clasificada como activo durable, **When** se muestra en el Top 10 PRO, **Then** aparece con indicación visual de "activo" (no como gasto puro).

---

### Edge Cases (todos los modos)

- Ejercicio sin datos — todos los totales en cero, gráfico mensual vacío.
- Meses sin ingresos o sin egresos — la serie mensual muestra ceros en esas columnas.
- Saldo mensual negativo — la línea negra cruza por debajo de cero.
- Cuentas puente con saldo pero sin PYG — no alteran totales PYG.
- Más de 10 cuentas con importes — solo se muestran las 10 más altas.
- Usuario sin cuentas de pasivo o por cobrar — posición muestra ceros en esas categorías.
- Movimientos que afectan balance y PYG en el mismo asiento — cada panel refleja solo su fuente.
- Usuario en modo Hogar con cuentas por cobrar — el panel de posición no las muestra (solo disponible y deudas).

---

## 5. Functional Requirements

### 5.1 API requirements

| ID | Requirement | Mode |
|----|-------------|------|
| FR-API-001 | El sistema MUST exponer `GET /api/reports/pyg?year={year}` que devuelva ingresos, gastos, neto y serie mensual. | Ambos |
| FR-API-002 | La serie mensual MUST incluir 12 meses, incluso los que tengan saldo cero. | Ambos |
| FR-API-003 | El endpoint PYG MUST devolver Top 10 ingresos y Top 10 egresos ordenados por acumulado descendente. | Ambos |
| FR-API-004 | El endpoint PYG MUST excluir cuentas puente, medios de pago y cuentas de balance de sus totales. | Ambos |
| FR-API-005 | El sistema MUST exponer `GET /api/reports/position` que devuelva disponible, por cobrar, por pagar y desglose por cuenta. | Ambos |
| FR-API-006 | El endpoint de posición MUST excluir cuentas de ingreso/egreso de sus totales. | Ambos |
| FR-API-007 | Ambos endpoints MUST filtrar por usuario autenticado (tenant isolation). | Ambos |
| FR-API-008 | Ambos endpoints MUST usar `decimal.js` (o equivalente) para cálculos, sin punto flotante JS. | Ambos |

### 5.2 Presentation requirements (Hogar)

| ID | Requirement |
|----|-------------|
| FR-H-001 | El panel PYG MUST mostrar: total ingresos, total gastos, resultado neto. |
| FR-H-002 | El panel PYG MUST incluir un gráfico mensual con barras verdes (ingresos), barras rojas (egresos) y línea negra (saldo). |
| FR-H-003 | El panel PYG MUST incluir Top 10 de egresos mostrando solo nombre de cuenta (sin código). |
| FR-H-004 | El panel de posición MUST mostrar "Disponible" y "Deudas" como lecturas simples. NO debe mostrar "Por cobrar". |
| FR-H-005 | Los egresos MUST mostrarse como valores positivos en el gráfico. |
| FR-H-006 | NO se deben mostrar códigos de cuenta en ningún lugar del dashboard Hogar. |
| FR-H-007 | El formato monetario MUST respetar la moneda configurada por el usuario. |

### 5.3 Presentation requirements (PRO)

| ID | Requirement |
|----|-------------|
| FR-P-001 | El panel PYG MUST mostrar: total ingresos, total gastos, resultado neto. |
| FR-P-002 | El panel PYG MUST incluir un gráfico mensual con barras verdes (ingresos), barras rojas (egresos) y línea negra (saldo). |
| FR-P-003 | El panel PYG MUST incluir Top 10 ingresos y Top 10 egresos con código y nombre de cuenta. |
| FR-P-004 | El panel de posición MUST mostrar: disponible, por cobrar y por pagar como tres totales separados. |
| FR-P-005 | El panel de posición PUEDE expandirse para mostrar desglose por cuenta individual (`breakdown`). |
| FR-P-006 | El dashboard PUEDE mostrar códigos de cuenta junto a los nombres. |
| FR-P-007 | El formato monetario MUST respetar la moneda configurada por el usuario. |

### 5.4 Common requirements

| ID | Requirement |
|----|-------------|
| FR-C-001 | El dashboard MUST tener un selector de ejercicio anual (aplica a ambos modos). |
| FR-C-002 | El panel PYG y el panel de posición MUST presentarse como lecturas separadas; ningún total de un panel se deriva del otro. |
| FR-C-003 | El sistema MUST preservar el modo activo del usuario entre sesiones. |

---

## 6. Success Criteria

| ID | Criterio | Verificación |
|----|----------|-------------|
| SC-001 | El dashboard carga en menos de 3 segundos para un libro piloto (< 500 asientos). | Test de performance |
| SC-002 | 100 % de los meses del ejercicio aparecen en la serie mensual, incluso sin datos. | Test de integración |
| SC-003 | Las cuentas puente no alteran los totales PYG. | Test contable |
| SC-004 | El Top 10 ordena correctamente de mayor a menor acumulado. | Test de integración |
| SC-005 | El panel de posición refleja saldos actuales sin incluir cuentas de ingreso/egreso. | Test contable |
| SC-006 | Cambiar saldos de balance no altera totales PYG del ejercicio, y viceversa. | Test de integración |
| SC-007 | Un usuario en modo Hogar no ve códigos de cuenta en ningún panel. | Test de UI |
| SC-008 | Un usuario en modo PRO ve disponible, por cobrar y por pagar como tres totales separados. | Test de UI |

---

## 7. Constitution Alignment

- **Mode integrity**: Hogar y PRO operan sobre el mismo backend. Este sprint entrega los datos; los sprints 06 y 07 construyen la UI específica de cada modo.
- **Tenant & Privacy**: Todos los endpoints filtran por usuario autenticado.
- **Accounting Impact**: El dashboard solo lee datos existentes (asientos, saldos). No crea ni modifica asientos.
- **MVP/Sprint Boundary**: Incluye panel PYG anual y panel de posición. Quedan fuera: PYG comparativo, drill-down por asiento, filtros por entidad/tag, reportes por centro de costo, ratios, exportación formal, estados de cuenta por Entidad.
- **Hogar scope**: El panel de posición Hogar solo muestra disponible y deudas (oculta por cobrar). Esto es intencional — en Hogar la pregunta es "¿estoy bien?" no "¿qué me deben?".
- **PRO scope**: El panel de posición PRO expone disponible, por cobrar y por pagar con desglose. Esto sienta las bases para los módulos formales de CxC/CxP post-MVP.
- **Testing**: Los cálculos PYG y posición deben tener tests contables que verifiquen: totales correctos, exclusión de cuentas puente en PYG, exclusión de ingreso/egreso en posición, y separación de fuentes entre paneles.

---

## 8. Assumptions

- Los valores se calculan en tiempo real contra la base de datos (sin cache en el MVP).
- `decimal.js` está disponible o se agrega como dependencia para cálculos financieros.
- El motor contable (Sprint 03) ya entrega asientos balanceados y saldos por cuenta.
- El plan de cuentas (Sprint 02) ya tiene clasificación NIIF que permite distinguir activo líquido, por cobrar, pasivo, ingreso y gasto.
- La UI Hogar y PRO se construyen en sprints separados (06 y 07). Este sprint entrega una UI base funcional más los contratos de API.
- El selector de fecha en posición (`?date=`) se agrega al contrato pero no se expone en la UI del MVP.
