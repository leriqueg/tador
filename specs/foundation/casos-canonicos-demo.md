# Casos canónicos demostrativos

Estos casos no son specs ni tests finales. Son ejemplos narrativos para conservar las situaciones que motivan TADOR y luego convertirlas en plantillas, pruebas o flujos de UI.

## Caso 1 - Regalo pagado con tarjeta y entidad afectada

### Narrativa

El usuario compra un Apple Watch como regalo para Mariuxi, lo paga con AMEX y quiere saber después cuánto gastó en regalos relacionados con Mariuxi.

### Intención Hogar

```text
Compré un regalo para Mariuxi con AMEX.
```

### Datos conceptuales

| Elemento | Valor |
|----------|-------|
| Entidad afectada | Mariuxi |
| Cuenta PYG | Regalos |
| Medio de pago | AMEX |
| Cuenta puente sugerida | Gastos Varios 2026 |

### Resultado esperado

- El gasto aparece en PYG como regalo.
- AMEX refleja deuda o consumo pendiente.
- Mariuxi queda disponible como dimensión de búsqueda/informe.
- La cuenta puente permite controlar el bypass sin perder el PYG.

## Caso 2 - Ingreso por cumpleaños recibido de una persona

### Narrativa

Mariuxi regala dinero al usuario por su cumpleaños. No es sueldo ni ingreso profesional. El usuario quiere clasificarlo como otros ingresos y poder buscar ingresos relacionados con Mariuxi.

### Intención Hogar

```text
Recibí dinero de Mariuxi por mi cumpleaños.
```

### Datos conceptuales

| Elemento | Valor |
|----------|-------|
| Entidad origen | Mariuxi |
| Cuenta PYG | Otros ingresos / regalos recibidos |
| Cuenta destino | Banco o billetera |

### Resultado esperado

- El ingreso aparece separado de nómina o trabajo profesional.
- El saldo del banco o billetera aumenta.
- Mariuxi queda asociada al apunte para consulta futura.

## Caso 3 - Gasto de salud usando cuenta estándar

### Narrativa

El usuario compra medicinas en farmacia. No quiere crear una cuenta nueva porque el catálogo global ya trae una cuenta de salud útil para todos.

### Intención Hogar

```text
Gasté en farmacia.
```

### Datos conceptuales

| Elemento | Valor |
|----------|-------|
| Cuenta PYG | Farmacias & Medicinas |
| Medio de pago | Banco, billetera o tarjeta |
| Entidad opcional | Farmacia específica si se quiere registrar |

### Resultado esperado

- El gasto queda clasificado bajo Salud.
- El usuario Hogar no ve el código de cuenta.
- El usuario PRO puede ver la ubicación dentro del plan de cuentas.

## Caso 4 - Cuenta bancaria creada por el usuario

### Narrativa

El usuario necesita registrar su cuenta Banco Bolivariano 2026. El catálogo global no debe traer esa cuenta concreta, pero sí debe saber dónde ubicar cuentas bancarias.

### Intención Hogar

```text
Crear cuenta bancaria.
```

### Datos conceptuales

| Elemento | Valor |
|----------|-------|
| Entidad | Banco Bolivariano |
| Tipo de cuenta | Cuenta bancaria |
| Cuenta madre | Bancos y cooperativas |
| Cuenta creada | Bolivariano 2026 |

### Resultado esperado

- Se crea una Entidad `Banco Bolivariano` si no existe.
- Se crea una cuenta postable del usuario bajo la rama correcta.
- Se conserva una estructura compatible con el plan global.

## Caso 5 - Cuenta puente anual para gastos varios

### Narrativa

El usuario usa una cuenta puente `Gastos Varios 2026` para concentrar consumos con tarjeta y luego poder revisar saldos o flujos sin mezclar el PYG con el medio de pago.

### Intención Hogar/PRO

```text
Usar Gastos Varios 2026 como puente para compras con tarjeta.
```

### Datos conceptuales

| Elemento | Valor |
|----------|-------|
| Cuenta puente | Gastos Varios 2026 |
| Medio de pago | AMEX, Visa, Mastercard, banco o billetera |
| Cuentas PYG | Varían según gasto |

### Resultado esperado

- La cuenta puente puede netear en cero.
- Los gastos siguen apareciendo en sus cuentas PYG correctas.
- El usuario puede revisar el puente como control operativo.

## Caso 6 - Trabajo cobrado parcialmente sin módulo formal de CxC

### Narrativa

El usuario registra un trabajo profesional y todavía no existe módulo formal de facturas o CxC. Necesita dejar espacio para representar el derecho de cobro y luego el pago.

### Intención PRO provisional

```text
Registrar trabajo realizado y luego pago recibido.
```

### Datos conceptuales

| Elemento | Valor |
|----------|-------|
| Cuenta de ingreso | Trabajos realizados |
| Cuenta de balance | Cuenta por cobrar o banco |
| Entidad opcional | Cliente o persona relacionada |

### Resultado esperado

- El MVP permite registrar la operación con cuentas contables normales.
- No se crean facturas ni documentos formales.
- En el futuro, el módulo CxC podrá convertir este patrón en documento + aplicaciones.

## Caso 7 - Cierre anual y reapertura

### Narrativa

El usuario cierra 2026 para evitar modificaciones accidentales, pero luego detecta un error y necesita reabrir.

### Intención

```text
Cerrar año 2026.
Reabrir año 2026 para corregir.
```

### Resultado esperado

- El cierre anual protege el periodo contra cambios silenciosos.
- La reapertura permite correcciones conscientes.
- Queda pendiente definir si las correcciones se harán por edición, reverso o ajuste.

## Pendiente

- Convertir estos casos en pruebas reales cuando existan plantillas.
- Agregar importes concretos.
- Definir líneas contables esperadas.
- Separar casos Hogar y PRO.
- Agregar casos de multiusuario y aislamiento de datos.
