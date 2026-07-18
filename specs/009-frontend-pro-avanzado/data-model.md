# Data Model: Sprint 09

## Apunte.entityId (write rule)

- On create (income/expense plantillas): if `entityId` omitted and a line references `CuentaUsuario` with `tipoCuenta` in `bank|card` and non-null `entidadId`, set `entityId` to that value.
- If multiple distinct bank/card entities on lines → prefer explicit client `entityId` or first bank/card line (document in contract); prefer reject ambiguity with 400 if two different entidadIds.
- Transferencias: do not auto-set.

## Cost / yield aggregation (read)

- Costs: sum amounts where `entityId = X` and expense account codigo in `62010001|62010002|62010003`.
- Yield: sum where `entityId = X` and income codigo `41120002`.
- Do not net.

## Chart labels

CuentaGlobal names updated by codigo upsert on seed.
