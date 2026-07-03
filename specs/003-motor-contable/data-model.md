# Data Model: Sprint 03 — Motor contable

## Asiento

```
id              String    @id @default(cuid())
bookId          String
fecha           DateTime              ← fecha del hecho económico
concepto        String                ← descripción libre
tipo            AsientoTipo           ← manual | reversa
asientoOriginalId String?             ← si es reversa, apunta al original
idempotencyKey  String?   @unique
anulado         Boolean   @default(false)
anuladoAt       DateTime?
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
```

- **Ownership**: Pertenece al Book del usuario via bookId.
- **Validación**: Σ debito = Σ credito. Mínimo 2 líneas. Cuentas postables. Periodo abierto.

## Línea de asiento

```
id         String    @id @default(cuid())
asientoId  String
cuentaId   String                ← CuentaUsuario (debe ser postable)
debito     Decimal   @default(0) ← > 0 si es débito
credito    Decimal   @default(0) ← > 0 si es crédito
createdAt  DateTime  @default(now())
```

- **Validación por línea**: (debito > 0 AND credito = 0) OR (credito > 0 AND debito = 0).
- **Validación por asiento**: Σ debito = Σ credito.

## AsientoVersion (auditoría)

```
id          String   @id @default(cuid())
asientoId   String
version     Int
snapshot    JSON     ← copia del asiento + líneas antes del cambio
modifiedBy  String   ← userId que hizo el cambio
createdAt   DateTime @default(now())
```

## PeriodoContable

```
id          String   @id @default(cuid())
bookId      String
año         Int                ← ej: 2026
abierto     Boolean  @default(true)
cerradoAt   DateTime?
reabiertoAt DateTime?
createdAt   DateTime @default(now())
```

- **Ciclo de vida**: Se crea automáticamente al primer asiento del año.
- **Transiciones**: abierto → cerrado (close) → abierto (reopen).

## Relaciones

```
Book 1──N Asiento
Asiento 1──N LineaAsiento
Asiento 1──N AsientoVersion
Asiento *──1 Asiento (asientoOriginalId: self-ref para reversa)
Book 1──N PeriodoContable
CuentaUsuario 1──N LineaAsiento
```

## Notas

- Saldos: calculados en tiempo real desde líneas. No se materializan en MVP.
- PYG: query sobre líneas con cuentas clasificadas como ingreso/gasto.
- Balance: query sobre líneas con cuentas clasificadas como activo/pasivo/patrimonio.
- Las cuentas de CuentaUsuario obtienen su clasificación (ingreso/gasto/activo/pasivo) desde la jerarquía de CuentaGlobal (vía globalId).
