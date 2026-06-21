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

## Caso 8 - Taxi UBER con AMEX usando puente anual

### Narrativa

El usuario registra un consumo de taxi por UBER pagado con tarjeta de crédito AMEX. El consumo incluye impuestos locales, pero en el MVP se registra el gasto completo, sin cálculo automático de impuestos.

### Registro legacy

```text
Gastos Variables - Taxis: -9.20
Cuenta de Gastos Varios 2026: -9.20
Cuenta de Gastos Varios 2026: +9.20
Tarjeta de Crédito - AMEX: -9.20
```

### Lectura esperada

| Pregunta | Resultado |
|----------|-----------|
| PYG AMEX | 0.00; la tarjeta no es el gasto, solo el medio de pago. |
| PYG Gastos Varios 2026 | 9.20 de gasto acumulado para análisis del puente/centro. |
| Balance AMEX | Aumenta la deuda de tarjeta en 9.20. |
| Balance Gastos Varios 2026 | 0.00; no debe quedar pendiente en el puente. |

### Asiento objetivo propuesto

En un sistema de partida doble, esto puede generarse como un solo asiento con cuatro líneas:

```text
DEBE  Gasto - Taxis                         9.20
HABER Cuenta puente - Gastos Varios 2026    9.20
DEBE  Cuenta puente - Gastos Varios 2026    9.20
HABER Tarjeta de crédito - AMEX             9.20
```

Resultado:

- El PYG se reconoce en `Gasto - Taxis`.
- La deuda se reconoce en `AMEX`.
- La cuenta puente queda en cero.
- El gasto puede analizarse por puente/centro `Gastos Varios 2026`.

## Caso 9 - Mangas para Alekey pagados por transferencia bancaria

### Narrativa

El usuario compra revistas/mangas para su hijo Alekey por 23.00 y paga por transferencia desde Banco Bolivariano. Quiere que el gasto quede asociado al hijo, pero sin que Alekey quede debiendo dinero.

### Registro legacy

```text
Gastos - Libros, Revista y Prensa: -23.00
Cuenta Alekey: -23.00
Cuenta Alekey: +23.00
Banco Bolivariano: -23.00
```

### Lectura esperada

| Pregunta | Resultado |
|----------|-----------|
| PYG Banco Bolivariano | 0.00; el banco solo es medio de pago. |
| PYG Cuenta Alekey | 23.00 de gasto asociado a Alekey. |
| Balance Banco Bolivariano | Disminuye en 23.00. |
| Balance Cuenta Alekey | 0.00; Alekey no debe dinero. |

### Asiento objetivo propuesto

```text
DEBE  Gasto - Libros, Revista y Prensa      23.00
HABER Cuenta puente - Alekey                23.00
DEBE  Cuenta puente - Alekey                23.00
HABER Banco Bolivariano                     23.00
```

Resultado:

- El PYG se reconoce en la cuenta de libros/revistas.
- El medio de pago es Banco Bolivariano.
- Alekey funciona como Entidad o dimensión de análisis.
- La cuenta puente de Alekey queda en cero.

## Caso 10 - Dinero recibido de Tía Toya para hijo en Argentina

### Narrativa

Tía Toya deposita 120.00 en Banco Pacífico para el hijo del usuario en Argentina. Ese dinero no es ingreso propio del usuario: es dinero de tercero que el usuario debe custodiar o enviar.

### Registro legacy

```text
Cuenta Tía Toya: -120.00
Banco Pacífico: +120.00
```

### Lectura esperada

| Pregunta | Resultado |
|----------|-----------|
| PYG Cuenta Tía Toya | 0.00; no es ingreso ni gasto propio. |
| PYG Banco Pacífico | 0.00; recibir el depósito no cuesta ni genera ingreso propio. |
| Balance Cuenta Tía Toya | Obligación de 120.00 con Tía Toya. |
| Balance Banco Pacífico | Aumenta en 120.00. |

### Asiento objetivo propuesto

```text
DEBE  Banco Pacífico                         120.00
HABER Fondos de terceros - Tía Toya          120.00
```

Resultado:

- Banco Pacífico aumenta.
- Se reconoce una obligación/fondo de tercero con Tía Toya.
- No hay impacto PYG.

## Caso 11 - Envío a hijo en Argentina con comisión

### Narrativa

El usuario necesita enviar 120.00 para su hijo en Argentina y paga 8.00 de comisión. Para hacerlo, primero retira 150.00 desde Banco Bolivariano hacia efectivo/billetera. La comisión no debe quedar como gasto corriente general: debe asociarse al proyecto/asunto `Proyecto UP - Santiago`.

### Registro legacy descrito

Primer asiento: sacar efectivo.

```text
Banco Bolivariano: -150.00
Billetera: +150.00
```

Segundo asiento: salida para envío y comisión.

```text
Proyecto UP - Santiago: +128.00
Billetera: -128.00
```

Tercer asiento: registrar comisión como gasto del proyecto.

```text
Gastos Varios - Comisiones Bancarias: -8.00
Proyecto UP - Santiago: -8.00
```

Cuarto asiento descrito: cruce de deuda con superávit.

```text
Proyecto UP - Santiago: -120.00
Tía Toya: +120.00
```

### Lectura esperada

| Pregunta | Resultado |
|----------|-----------|
| PYG bancos/billetera | 0.00; solo mueven dinero. |
| PYG Proyecto UP - Santiago | 8.00 de comisión asociada al proyecto. |
| Balance Billetera | Baja por el efectivo usado. |
| Balance Proyecto UP - Santiago | Debe reflejar el valor enviado pendiente de cruzar. |
| Balance Tía Toya | Debe netear el fondo recibido cuando se envía el dinero. |

### Asientos objetivo propuestos

1. Transferencia de banco a efectivo:

```text
DEBE  Billetera                              150.00
HABER Banco Bolivariano                      150.00
```

2. Envío de 120.00 más comisión pagada de 8.00:

```text
DEBE  Proyecto UP - Santiago                 128.00
HABER Billetera                              128.00
```

3. Reconocimiento de comisión como gasto del proyecto:

```text
DEBE  Gasto - Comisiones Bancarias             8.00
HABER Proyecto UP - Santiago                   8.00
```

Después de este punto, `Proyecto UP - Santiago` debería conservar 120.00 como valor enviado/cubierto por el fondo de Tía Toya.

4. Cruce correcto contra el fondo recibido de Tía Toya:

```text
DEBE  Fondos de terceros - Tía Toya          120.00
HABER Proyecto UP - Santiago                 120.00
```

Resultado:

- Banco Bolivariano baja 150.00.
- Billetera sube 150.00 y luego baja 128.00.
- La comisión de 8.00 se reconoce como PYG del proyecto.
- El fondo de Tía Toya se cruza por 120.00.
- `Proyecto UP - Santiago` y `Tía Toya` quedan neteados.

## Pendiente

- Convertir estos casos en pruebas reales cuando existan plantillas.
- Definir líneas contables esperadas.
- Separar casos Hogar y PRO.
- Agregar casos de multiusuario y aislamiento de datos.
