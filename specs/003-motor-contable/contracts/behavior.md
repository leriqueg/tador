# Contract: Sprint 03 — Motor contable

**Updated**: 2026-07-18

Este contrato describe comportamiento observable, no implementación.

## Inputs

- Usuario autenticado con libro.
- Datos del asiento: fecha, concepto, líneas (cuentaId, debito/credito).
- Idempotency-Key opcional (header).
- Acciones: crear, editar, anular, cerrar periodo, reabrir periodo.

## Outputs

- Asiento creado, editado o anulado con validación de balance.
- Saldo actual y acumulado por cuenta.
- Período cerrado o reabierto.
- PYG y Balance del ejercicio.
- Error estructurado cuando las validaciones fallan.

## Invariants

- Σ debito = Σ credito en todo asiento persistido.
- Nunca debito > 0 AND credito > 0 en una misma línea.
- Ningún asiento en periodo cerrado puede crearse, editarse ni anularse.
- Una anulación crea siempre un reverso exacto.
- IdempotencyKey repetida nunca crea duplicados.
- Una carrera con la misma IdempotencyKey devuelve el ganador del índice único.
- Las familias protegidas no pueden confirmar un saldo natural proyectado negativo mientras su política esté activa.
- La lectura y validación de saldo se serializa por cuenta dentro de la transacción de escritura.
- Los saldos se derivan de líneas; no se mantienen con triggers, columnas de saldo ni vistas materializadas.
- Datos de un usuario nunca expuestos a otro usuario.

## Balance policy

| Familia | Naturaleza | Condición V12 |
|---------|------------|---------------|
| `1111` efectivo/billeteras | Débito | `débitos - créditos >= 0` |
| `1112` bancos | Débito | `débitos - créditos >= 0` |
| `1132` CxC personales | Débito | `débitos - créditos >= 0` |
| `2112` CxP personales | Crédito | `créditos - débitos >= 0` |
| `2120` tarjetas | Crédito | `créditos - débitos >= 0` |

La política es `true` por defecto y se configura por `CuentaUsuario` o por
`ActivacionCuentaGlobal` para el usuario autenticado.
