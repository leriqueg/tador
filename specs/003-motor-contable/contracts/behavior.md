# Contract: Sprint 03 — Motor contable

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
- Datos de un usuario nunca expuestos a otro usuario.
