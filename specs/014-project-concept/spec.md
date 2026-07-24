# Feature Specification: Concepto Proyectos (+ provisión futura)

**Feature Branch**: `feat/project-concept`  
**Created**: 2026-07-24  
**Status**: Design draft (documentación only — **no Speckit, no implementación en este PR**)  
**Input**: Conversaciones de diseño 2026-07-24 (migración demo, puente vs proyecto, caso pensión/hijo, provisión Hogar).

## Quick path

1. Leer **Decisiones** (tabla).
2. Leer **Caso canónico** (pensión + proyecto).
3. Revisar **Fuera de alcance** antes de Speckit/implementación.

## Intent

Permitir en TADOR un **contexto de esfuerzo** llamado **Proyecto** (ej. “Proyecto UP - Santiago”): fondear, atribuir gastos/ingresos y liquidar remanentes contra otras obligaciones (ej. pensiones), **sin** mezclar ese saldo con Disponible / CxC / CxP del panel de posición.

La **provisión** (reconocer una obligación del periodo antes de liquidarla) se **define aquí** como diseño futuro; **no** se implementa en este feature aún.

---

## Decisiones

| Tema | Decisión |
|------|----------|
| Nombre UI | **Proyecto** |
| `TipoEntidad` (código) | `project` |
| `TipoCuenta` de la cuenta aprovisionada | `project` (hermano de `bridge`, no reutilizar el label “Puente”) |
| Grupo global padre | `11500000` **Proyectos**, hijo de `11000000` Activo corriente (percha estructural) |
| ¿Es “activo financiero / disponible”? | **No.** Ubicación en plan ≠ liquidez. Debe excluirse del panel de posición (igual que `bridge`). |
| Creación de cuenta | Solo vía provisión de Entidad `project` (mismo patrón que `bank` / `card_issuer`) |
| Plantilla `gasto_proyecto_puente` | **Fuera** de este feature; el uso inicial es elegir la cuenta Proyecto como opción de balance al registrar (junto a Billetera / Banco / Tarjeta) |
| Provisión de obligaciones | **Diseño documental** en este spec; implementación en feature posterior |
| Speckit | **No ejecutar** hasta revisión humana |

---

## Bridge vs Proyecto

| | **Bridge** (hoy) | **Proyecto** (este concepto) |
|--|------------------|------------------------------|
| Rol | Contexto operativo / bypass (año, tarjeta, neteo) | Contexto de **esfuerzo** con identidad propia |
| Pregunta | ¿Por qué canal/año pasó? | ¿Cuánto he destinado / costado este esfuerzo? |
| UI | “Puente” | Apartado **Proyectos** |
| Entidad | Opcional / genérica | Entidad tipo `project` |
| Reportes posición | Excluido | Excluido |
| Mecánica contable | Balance de contexto | Misma familia mecánica; **subtipo de producto distinto** |

**Frase guía:** *bridge es la herramienta genérica; proyecto es el caso de uso nombrado.*

---

## Ubicación en el plan de cuentas (cuando se implemente)

Añadir al plan canónico (`plan-de-cuentas-final.csv` + seeds foundations/backend):

```text
11500000;Proyectos;false;11000000;group;asset;ConEntidadAutomatica;Proyecto;;
```

| Campo | Valor |
|-------|--------|
| `codigo` | `11500000` |
| `nombre` | Proyectos |
| `esPostable` | `false` (grupo) |
| `codigoPadre` | `11000000` |
| `permiteCustom` | `ConEntidadAutomatica` |
| `relacionadasEntidades` | `Proyecto` (o etiqueta alineada al tipo `project`) |

**Excel:** cuando se implemente, actualizar la hoja fuente del plan en `specs/foundation/plan-de-cuentas/` con esa fila y regenerar CSV/JSON seed (foundations + copia en `backend/data/plan-de-cuentas/`).

Mapa de provisión de Entidad (futuro código):

```text
project → CuentaUsuario tipoCuenta=project bajo 11500000
```

---

## Flujos soportados (comportamiento deseado)

### 1. Fondeo

Traspaso de medio líquido → Proyecto.

```text
Dr  Proyecto (contexto)
Cr  Banco / Billetera
```

### 2. Gasto / ingreso atribuido al proyecto

El **PYG global** usa la categoría real (Arriendo, Comisiones, …).  
El **Proyecto** participa como cuenta de balance de contexto (y/o dimensión de entidad), de modo que se pueda armar un “PYG del proyecto” más adelante.

Ejemplo (gasto pagado desde banco, atribuido al proyecto) — forma exacta del asiento a fijar en Speckit:

- Debe subir el indicador PYG correcto (ej. Arriendo).
- Debe poder agregarse al costo del proyecto.

### 3. Liquidación / aplicación entre contextos

Traspaso Proyecto ↔ otra cuenta de obligación/contexto (ej. Pensiones) para rebajar saldos a mano (Hogar hoy).

```text
Dr  Pensiones
Cr  Proyecto
```

(o el sentido inverso según saldos).

### 4. Lecturas

| Lectura | Fuente |
|---------|--------|
| Panel posición (Disponible / CxC / CxP) | **Sin** saldos `project` |
| PYG del libro | Cuentas ingreso/gasto |
| “Costo del proyecto” (futuro) | Agregación de movimientos asociados al proyecto / entidad |

---

## Caso canónico: pensión + proyecto (hijo en el exterior)

### Situación real

1. Al inicio del mes: envío de dinero al exterior → **fondea** la cuenta Proyecto (gastos del hijo).
2. Cuenta **Pensiones**: registra / reconoce la pensión del mes (hoy manual; mañana = **provisión**).
3. Durante el mes: gastos adicionales en el Proyecto.
4. Al cierre: si sobró dinero en Proyecto, **traspaso manual** Proyecto → Pensiones para rebajar la obligación.

Saldo positivo en Proyecto (legacy) = “mandé de más / aún no apliqué el descuento a pensiones”. Es control operativo, no “disponible”.

### Ciclo con nombres TADOR

```text
Provisión pensión (futuro)     → reconoce obligación del periodo en Pensiones
Fondeo proyecto                → Banco/Billetera → Proyecto
Gastos del proyecto            → PYG categorías + contexto Proyecto
Liquidación remanente          → Proyecto → Pensiones (aplicación)
```

---

## Provisión (diseño futuro — no implementar aún)

### Definición Hogar (MVP conceptual)

**Provisión** = reconocer en el periodo una obligación o destino de fondos **antes** de completar el pago o la liquidación cruzada.

No es el fondeo. No es el gasto PYG. No es la liquidación.

| Concepto | Qué hace | Ejemplo |
|----------|----------|---------|
| Provisión | Crea/aumenta obligación o reserva del periodo | “Pensión junio = 400” |
| Fondeo | Mueve dinero a un contexto | Envío → Proyecto |
| Gasto del contexto | Afecta PYG (+ proyecto) | Comisión, arriendo, etc. |
| Liquidación / aplicación | Cruza contextos o paga la provisión | Sobrante Proyecto → Pensiones |
| Reversión / ajuste | Corrige exceso/faltante | Ajuste fin de mes |

### Relación con el producto actual

- Hogar **aún no** tiene módulo de provisiones.
- Hoy el usuario simula provisión + liquidación con **registros y traspasos manuales**.
- Al implementar Proyectos, esos traspasos deben seguir siendo válidos.
- Un sprint futuro de “Provisiones” deberá:
  - plantilla o flujo guiado de provisión (pensión u otras obligaciones),
  - política de cuentas (qué se debita/acredita),
  - y cómo la liquidación contra Proyecto/Bancos cierra el ciclo.

### Fuera de provisión (explícito)

- Asientos automáticos de provisión en este feature.
- Cierre contable NIIF / pasivos estimados corporativos.
- Multi-moneda del envío al exterior (sigue reglas actuales del libro).

---

## User scenarios (para cuando se implemente)

### US1 — Crear un Proyecto (P1)

Como usuario Hogar/PRO, quiero crear un Proyecto con nombre propio y obtener su cuenta de contexto, para no mezclarlo con bancos ni puentes anuales.

**Acceptance**

1. Given libro activo, When creo Entidad tipo Proyecto “UP - Santiago”, Then existe `CuentaUsuario` bajo `11500000` con `tipoCuenta=project`.
2. Given esa cuenta, When consulto panel de posición, Then su saldo **no** suma a Disponible / CxC / CxP.

### US2 — Fondear y liquidar (P1)

Como usuario, quiero traspasar desde/hacia el Proyecto (banco ↔ proyecto, proyecto ↔ pensiones) para fondear y rebajar obligaciones a mano.

**Acceptance**

1. Given Proyecto y Banco, When traspaso fondeo, Then saldos reflejan el movimiento balanceado.
2. Given remanente en Proyecto y saldo en Pensiones, When traspaso liquidación, Then rebaja la obligación según el importe.

### US3 — Atribuir gasto al proyecto (P2)

Como usuario, quiero registrar un gasto (ej. arriendo) que afecte el PYG global y quede asociado al Proyecto.

**Acceptance**

1. Given categoría Arriendo y Proyecto, When registro el gasto atribuido, Then PYG de arriendo sube y el movimiento es agregable al proyecto.

### US4 — Provisión (P3, futuro)

Como usuario, quiero provisionar la pensión del mes sin haber liquidado aún contra Proyecto/Banco.

**Acceptance** (feature posterior): Given periodo abierto, When provisiono pensión, Then la cuenta de obligación refleja el mes; liquidaciones posteriores la reducen.

---

## Requirements (diseño; implementación posterior)

- **FR-001**: El plan global MUST incluir grupo no postable `11500000` Proyectos.
- **FR-002**: MUST existir `TipoEntidad=project` y provisión atómica de `CuentaUsuario` con `tipoCuenta=project` bajo ese grupo.
- **FR-003**: Cuentas `project` MUST excluirse del panel de posición (Disponible / CxC / CxP).
- **FR-004**: UI MUST presentar Proyectos en apartado propio (no como “Puente” genérico).
- **FR-005**: Traspasos fondeo/liquidación MUST poder usar cuentas `project` como cualquier cuenta de balance de contexto.
- **FR-006**: El diseño de **provisión** MUST documentarse (este archivo) antes de codificarse; este feature MUST NOT implementar provisiones automáticas.
- **FR-007**: MUST NOT confundir Proyecto con CxC/CxP persona (“cuánto debo/me deben a Santiago”) salvo que el usuario cree explícitamente esas cuentas aparte.

### Constitution alignment

- **Accounting Impact**: Proyecto es contexto de balance excluido de posición; PYG sigue en cuentas de ingreso/gasto.
- **Tenant & Privacy**: Entidad y cuenta pertenecen al usuario/libro.
- **Modes**: Hogar usa traspasos manuales primero; PRO puede reutilizar el mismo modelo con más densidad.

---

## Fuera de alcance (este documento / este branch)

- Ejecutar Speckit (`/speckit-specify`, plan, tasks).
- Migraciones Prisma, seeds, UI, API.
- Plantillas nuevas (`gasto_proyecto_puente`, provisión pensión).
- Informe “PYG por proyecto” en dashboard.
- Cambios en `deploy/nesistel` o migración `test20260719`.

---

## Success criteria (para el momento de implementación)

- [ ] Grupo `11500000` en CSV + JSON seed (foundations y `backend/data`).
- [ ] Entidad `project` + cuenta `tipoCuenta=project` aprovisionada.
- [ ] Posición ignora saldos project.
- [ ] Tests de dominio/API/UI mínima en verde.
- [ ] Caso canónico pensión↔proyecto reproducible con traspasos (sin motor de provisión).

## Next step

Revisión humana de este spec → luego Speckit (specify/plan/tasks) → implementación en rama dedicada.
