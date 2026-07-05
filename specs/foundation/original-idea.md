# TADOR - idea original y requerimientos informales

Este documento captura la conversación inicial sobre TADOR antes de convertirla en constitución, specs y fases formales con Spec Kit. No es una especificación cerrada: es una base de producto para preservar decisiones, lenguaje de dominio, alcance del MVP y dudas que deben resolverse durante el diseño.

## Visión

TADOR será una aplicación web para facilitar la economía del hogar y permitir una transición natural hacia un uso profesional ligero. El nombre juega con la frase "CON TADOR, puedes facilitar tu economía del hogar": TADOR será también una mascota, probablemente Pacho, un perro poodle amable pero serio con las finanzas.

La inspiración principal viene de Conta Hogar, una aplicación antigua que permitía registrar apuntes de forma rápida, manejar cuentas simples, consultar saldos, agrupar ingresos/egresos y hacer traspasos. Ese modelo era fácil de usar, pero no soportaba bien necesidades más avanzadas: tarjetas de crédito, gastos diferidos, cuentas puente, reportes por periodo, CxC/CxP, análisis profesional o una separación contable clara entre balance y PYG.

TADOR debe conservar la velocidad y sencillez de captura de Conta Hogar, pero con un motor contable interno correcto: todo registro económico debe poder convertirse en un asiento balanceado, auditable y extensible mediante plantillas.

## Proyecto de referencia

El proyecto `con-tador` queda como referencia histórica y conceptual. Contiene el software anterior en Symfony/MySQL, specs de evolución y ejemplos de dominio, pero no recibirá mantenimiento para este remake.

TADOR arranca desde cero en el repo nuevo.

## Stack decidido

### Frontend

- React
- TypeScript
- Vite
- Mantine
- Zustand
- React Query

### Backend

- Node.js
- Fastify
- PostgreSQL
- Prisma

### Infraestructura

- Docker

### IA local

- Modelo local pequeño, ejecutado en infraestructura propia o VPS.
- Uso inicial: interpretar lenguaje natural y sugerir plantillas.
- La IA no ejecuta asientos directamente ni decide contabilidad de forma autónoma.

El backend se desarrollará primero, con TDD. En una segunda iteración se trabajará el frontend y el diseño de páginas. Después de tener backend y frontend funcionales, se incorporará una capa IA para Modo Hogar como interpretador de apuntes y sugeridor de plantillas.

## Principios de producto

- TADOR debe servir a usuarios de hogar que solo quieren controlar su dinero sin aprender contabilidad.
- TADOR debe permitir crecer hacia un uso profesional independiente sin migrar a otro producto.
- Modo Hogar y Modo PRO no son, por ahora, conceptos económicos o de pricing: son niveles de expectativa del usuario y de complejidad de la UI. En el futuro el modo podría convertirse en factor de valor por suscripción, sin cambiar el modelo de datos.
- Los mismos datos deben poder sobrevivir al cambio de modo. La diferencia está en opciones visibles, densidad de campos, informes y plantillas disponibles.
- La contabilidad correcta debe estar en el motor; la experiencia simple debe estar en la UI.
- No se quiere inventar una contabilidad nueva: se quieren plantillas y métodos de captura sencillos que produzcan registros contables apropiados.

## Glosario inicial

### Asiento

Unidad atómica y balanceada por principios contables y por reglas de la aplicación. Es la representación interna real de un hecho económico.

### Apunte

Plantilla de una acción preconfigurada, con parámetros variables ingresados por el usuario, usada para plasmar una idea cotidiana de ingreso, gasto, compra, cobro, pago, préstamo o uso de medio de pago como un asiento contable.

En Modo Hogar, los apuntes son la forma principal de registrar información. El usuario no debería tener que pensar en líneas contables.

### Movimiento

Nombre tentativo para una forma más abierta de crear asientos en Modo PRO. Sería poco usado y sujeto a validación contable simple. Este término queda en observación porque puede confundirse con el modelo legacy; puede evolucionar a "asiento manual" o "registro contable manual".

### Traspaso o transferencia

Plantilla de asiento contable basada en trasladar un valor desde una cuenta a otra. Puede representar reclasificación, transferencia bancaria, depósito, pago de créditos u otros movimientos entre cuentas sin impacto directo en PYG.

### Tag

Marca o referencia de contexto usada en apuntes, asientos e informes. En TADOR, los tags deben apoyarse en el módulo de Entidades cuando representen objetos con nombre propio como `Mariuxi`, `Santiago`, `Banco Bolivariano`, `AMEX` o `Netflix`.

También pueden existir etiquetas simples de uso libre cuando no representen una entidad real, por ejemplo `Regalos 2026`, `Viaje Quito` o `Casa en arriendo`, pero la dirección de diseño es que todo nombre propio reutilizable viva como Entidad.

## Modo Hogar

El Modo Hogar debe ser usable por cualquier persona con menús cortos, frases amigables y pocas decisiones técnicas. No debe mostrar códigos de cuenta ni cuentas madre.

Ejemplos de intención de usuario:

- Recibí dinero.
- Gasté dinero.
- Pedí prestado a alguien.
- Compré con tarjeta.
- Compré un regalo para alguien.

Las plantillas deben pedir solo los datos necesarios para que el usuario registre rápido. Cuando haga falta crear una cuenta, la UI debe guiar por procesos intuitivos como:

- Crear tarjeta de crédito.
- Crear cuenta bancaria.
- Crear billetera electrónica.
- Crear cuenta por cobrar.

Una madre de familia que trabaja en relación de dependencia durante años no necesita registrar negocio, materia prima ni documentos profesionales. Para ella, su salario y sus gastos deben ser simples.

## Modo PRO

El Modo PRO sigue siendo amigable, no un ERP pesado. La diferencia es que permite capturar más intención contable y usar menos valores por defecto.

Ejemplos:

- Al usar "pedí dinero a", puede pedir si se trata de una entidad financiera o una persona.
- Puede distinguir entre "registrar gasto de fontanero para el hogar" y "registrar compra de repuestos para el negocio".
- Puede permitir seleccionar cuenta madre al crear cuentas.
- Puede incluir apuntes simples y una forma más abierta de crear asientos.

La transición Hogar -> PRO debe permitir que una persona que empieza un negocio como profesional independiente active opciones profesionales sin perder su historial.

## MVP

### Incluido

- Multiusuario con autoregistro mediante correo electrónico.
- Recuperación de contraseña.
- Seguridad y propiedad de datos desde el primer día: todo debe modelarse por usuario/tenant.
- Configuración inicial de moneda y formato de moneda al registrar la cuenta.
- La moneda no debería poder cambiarse después, porque alteraría todo el libro.
- Plan de cuentas general mantenido para todos los usuarios del sistema.
- Plan de cuentas personalizado por usuario sobre la estructura general.
- Plan de cuentas basado en NIIF, con codificación tipo `1 Activo`, `2 Pasivo`, `3 Capital`, etc.
- Modo Hogar y Modo PRO.
- Asientos contables internos balanceados.
- Apuntes como plantillas de captura rápida.
- Traspasos/transferencias.
- Módulo base de Entidades como catálogo de objetos con nombre propio.
- Tags o etiquetas simples para contexto no estructurado.
- Cuentas puente/bypass para acumular y controlar gastos, proyectos o contextos.
- Saldos actuales por cuenta en Modo Hogar y Modo PRO.
- Dashboard con panel PYG por ejercicio y panel de posición (disponible, por cobrar, por pagar) como reporte obligatorio del MVP.
- Cierre anual con opción de reapertura para modificaciones.
- UI mobile-first, pero compatible con desktop para el MVP.
- Asistente IA v0 en Modo Hogar, después de backend y frontend, para interpretar frases simples y sugerir plantillas.

### Fuera del MVP

- Registros periódicos.
- Facturas.
- Cuentas por cobrar formales (módulo documental).
- Cuentas por pagar formales (módulo documental).
- Índices financieros.
- Compras diferidas en tarjetas de crédito.
- Conciliación bancaria o de tarjetas.
- Inventarios.
- Kardex.
- Control de materia prima como módulo de inventario.
- Reportes avanzados, comparativos, índices o exportaciones formales.
- Asistente IA avanzado que tome decisiones contables autónomas.
- Personalidad de Pacho como guía conversacional completa.

## Plan de cuentas

TADOR tendrá un catálogo general de cuentas basado en NIIF. El usuario podrá crear su propio plan de cuentas usando esa estructura.

Ejemplo conceptual:

```text
4 Gastos
4.01 Gastos emergentes
4.01.01 Gastos por salud
4.01.01.001 Farmacias & Medicinas
4.01.01.002 Clínicas & Hospitales
4.01.01.003 Doctores & Terapias
4.01.01.999 Otros gastos de salud
```

Si el usuario necesita una cuenta específica, por ejemplo `Dentistas`, podría crear:

```text
4.01.01.004 Dentistas
```

La idea inicial es trabajar con tres niveles visibles de agrupación y cuentas postables debajo de esas madres. Hogar y PRO deben poder llegar al mismo resultado por UI, pero Hogar no mostrará códigos ni estructura técnica.

El plan definitivo debe trabajarse más adelante a partir del proyecto legacy y revisarse contra NIIF.

## Cuentas puente y bypass

Los movimientos que impliquen medios de pago como tarjetas, bancos o billeteras pueden usar una cuenta bypass o puente para acumular gastos, proyectos o contextos.

Ejemplos actuales del uso personal:

- `Gastos Varios 2026`
- `Gastos Varios 2025`
- `Casa en arriendo`

La cuenta puente permite llevar control de un contexto sin romper la contabilidad. Por ejemplo, en una "Casa en arriendo" se podrían registrar gastos de mantenimiento e ingresos de arriendos, manteniendo saldos y reportes útiles.

Este patrón debe mantenerse como contabilidad normal representada por plantillas, no como un hack de UI.

## Entidades

TADOR tendrá un módulo de Entidades desde el MVP como catálogo base de objetos con nombre propio. Una Entidad no significa automáticamente cliente, proveedor, CxC o CxP. Es una abstracción más general para representar personas, instituciones, medios financieros, plataformas o relaciones que pueden aparecer en cuentas, apuntes, tags, plantillas e informes.

Regla principal:

```text
Entidad = objeto con nombre propio
Relación contable = cómo esa entidad participa en cuentas, apuntes, asientos o módulos futuros
```

Ejemplos de Entidades:

- Bancos y cooperativas: `Banco Bolivariano`, `Banco Pichincha`, `JEP`.
- Emisores o marcas de tarjeta: `AMEX`, `Bankard`, `Visa`, `Mastercard`.
- Personas: `Mariuxi`, `Tía Toya`, `Jessica`.
- Familiares o dependientes: `Santiago`, `Alekey`.
- Clientes.
- Proveedores.
- Colegas.
- Instituciones públicas.
- Plataformas o comercios frecuentes: `Netflix`, `Spotify`, `Hapi`.

### Clasificación inicial de Entidades

Una Entidad debe tener un tipo principal y, si hace falta, roles o capacidades adicionales. El tipo ayuda a la UI; los roles ayudan a activar comportamientos sin crear tablas separadas como `bancos`, `proveedores` o `clientes`.

Tipos candidatos:

- `financial_institution`: banco, cooperativa, fintech, casa de valores.
- `card_issuer`: emisor, marca o producto de tarjeta.
- `person`: persona natural genérica.
- `family_member`: familiar.
- `dependent`: dependiente, hijo o persona cuyo gasto se quiere analizar.
- `friend`: amistad o contacto personal.
- `client`: cliente.
- `supplier`: proveedor.
- `colleague`: colega o contacto profesional.
- `government`: institución pública.
- `platform`: plataforma, suscripción o comercio frecuente.
- `other`: otro.

Roles o capacidades candidatas:

- `can_have_bank_accounts`: puede relacionarse con cuentas bancarias.
- `can_issue_credit_cards`: puede relacionarse con tarjetas de crédito.
- `can_be_tagged`: puede usarse como afectación/tag en apuntes.
- `can_be_customer`: puede ser cliente.
- `can_be_supplier`: puede ser proveedor.
- `can_have_receivables`: puede tener CxC cuando exista el módulo.
- `can_have_payables`: puede tener CxP cuando exista el módulo.
- `can_be_report_dimension`: puede usarse como dimensión de informe.

Ejemplos:

```text
Entidad: Banco Bolivariano
Tipo: financial_institution
Roles: can_have_bank_accounts, can_issue_credit_cards

Cuenta: Bolivariano 2026
Tipo de cuenta: cuenta bancaria
Entidad relacionada: Banco Bolivariano
```

```text
Entidad: Mariuxi
Tipo: person
Roles: can_be_tagged, can_be_report_dimension

Apunte: Compra de regalo
Cuenta PYG: Regalos
Medio de pago: AMEX
Entidad/tag afectado: Mariuxi
```

```text
Entidad: Cliente ABC
Tipo: client
Roles futuros: can_be_customer, can_have_receivables

Módulo futuro CxC: factura emitida y saldo pendiente apuntan a esta Entidad.
```

### Relación con CxC y CxP

El módulo de Entidades no implica crear en el MVP un módulo formal de CxC/CxP. Es al revés: un módulo futuro de CxC o CxP necesita poder apuntar a una Entidad.

En el MVP se puede usar Entidad para:

- asociar una cuenta bancaria con su institución financiera,
- asociar una tarjeta con su emisor,
- marcar una persona relacionada con un gasto, ingreso o regalo,
- filtrar informes por entidad/tag,
- preparar migraciones futuras desde cuentas personales legacy.

Post-MVP, sobre las mismas Entidades se podrán activar documentos, facturas, cuentas por cobrar, cuentas por pagar, vencimientos, aplicaciones de cobro/pago y reportes por tercero.

## Tags en el MVP

En Conta Hogar, los tags eran útiles porque permitían marcar afectaciones generales sin validar demasiado. En TADOR MVP se mantienen como una experiencia de marcado rápida, pero cuando el tag represente un nombre propio debería resolverse o crearse como Entidad.

Ejemplos de uso:

- Compra de Apple Watch como regalo, afecta `Gastos 2026`, pagado con AMEX, entidad/tag `Mariuxi`.
- Ingreso por cumpleaños, clasificado como otros ingresos, depositado en banco, entidad/tag `Mariuxi`.
- Consulta posterior de cuánto ingreso o gasto se relacionó con `Mariuxi` en el año.

Para casos estructurados como "María me debe dinero", en el MVP se registra con cuentas de balance por cobrar vinculadas a la Entidad persona. En el futuro, el módulo documental formal de CxC/CxP apuntará a la misma Entidad.

## Ingresos, descuentos y valores negativos

Se detectó una duda conceptual importante sobre ingresos netos, descuentos y cuentas por cobrar.

Ejemplo:

```text
Sueldo 1000.00
Seguro Social -110.00
```

Una lectura de flujo personal podría decir:

```text
Ingresos: 900.00
Egresos: 0.00
CxC: 900.00
```

En contabilidad más formal, podría ser necesario distinguir ingreso bruto, deducciones, retenciones, gastos o aportes. Esta diferencia no debe bloquear el MVP, pero debe quedar abierta para resolverse al definir el plan de cuentas estándar y las plantillas.

Decisión provisional:

- El MVP debe permitir importes negativos en cuentas de ingreso o egreso cuando el usuario lo necesite.
- El motor debe mantener la posibilidad de representar mejor el bruto, los descuentos y el neto en plantillas futuras.
- En Modo PRO, esta diferencia probablemente se resuelva mejor con cuentas específicas y, más adelante, con documentos/CxC/CxP.

## Profesional independiente y clasificación de ingresos

El usuario quiere evitar inflar cuentas al registrar actividad profesional.

Ejemplo planteado:

- Factura 2000 al mes.
- Paga dos subcontratistas de 500 cada uno.
- Desde su perspectiva profesional, no quiere ver ingresos de 2000 y gastos de 1000 si el neto real propio es 1000.

Esto queda como una discusión contable pendiente para validar contra NIIF y el plan de cuentas. En el MVP no se implementarán documentos ni CxC/CxP formales, pero se debe dejar espacio para que el usuario pueda representar estas situaciones con cuentas contables y apuntes.

## Cierres y periodos

En el MVP debe existir cierre anual con opción de reapertura para modificaciones.

Para Modo Hogar, el informe esencial es el saldo actual por cuenta, sea activo, pasivo, capital, ingreso o egreso.

Para Modo PRO, más adelante se incorporarán breakdowns por mes, ejercicios, consultas por periodos particulares y PYG comparativos.

Queda pendiente definir exactamente qué bloquea el cierre anual:

- creación de nuevos asientos,
- edición de asientos existentes,
- reversos,
- ajustes,
- consultas,
- o solo modificaciones directas.

## Reporte PYG MVP

El MVP tendrá un dashboard obligatorio con dos lecturas separadas: panel PYG por ejercicio y panel de posición a la fecha de consulta. El panel PYG es indispensable porque ya existe conceptualmente en el proyecto legacy y TADOR no debería perder esa lectura mínima.

Ejemplo:

```text
Ejercicio: 2026
Total Ingresos: $102,000
Total Gastos: $101,500
Neto: $500
```

El dashboard debe incluir:

- gráfico mensual con eje X por meses y eje Y por importe,
- ingresos mensuales como barras verdes con valores positivos,
- egresos mensuales como barras rojas con valores positivos,
- saldo mensual como línea negra con nodos,
- gráfico pie azul con Top 10 de ingresos acumulados del ejercicio,
- gráfico pie rojo con Top 10 de egresos acumulados del ejercicio.

Este reporte debe agregarse desde cuentas de ingreso y egreso. No debe confundirse con saldos de balance ni cuentas puente.

Detalle separado: `reporte-pyg-mvp.md`.

## Seguridad y datos

Aunque el autoregistro no necesariamente sea la primera pantalla construida, el MVP debe modelarse desde el inicio como multiusuario y seguro.

Requisitos base:

- Cada usuario es propietario de su libro.
- Todo plan de cuentas personalizado, entidad, tag, asiento y configuración debe pertenecer a un usuario.
- No debe existir lectura cruzada entre usuarios.
- La moneda y formato de moneda se definen al crear la cuenta.
- La moneda no debería cambiarse después del registro.

## UI y experiencia

La UI será mobile-first, pero debe funcionar en desktop para el MVP.

El botón principal de creación puede llevar a una navegación guiada por intenciones:

- Quiero registrar un gasto.
- Quiero recibir dinero.
- Quiero comprar con tarjeta.
- Quiero transferir dinero.
- Quiero registrar un regalo.

La discusión detallada de UI/UX queda para una iteración posterior. El backend debe prepararse con endpoints y plantillas que soporten este flujo.

## Asistente IA v0

TADOR incorporará una capa de IA local después de implementar el backend y el frontend base. Esta capacidad forma parte del cierre del MVP en Modo Hogar, pero no debe bloquear el diseño del motor contable.

El objetivo inicial no es tener un contador autónomo, sino un interpretador de lenguaje natural que ayude al usuario a llegar rápido a una plantilla.

Ejemplo:

```text
Usuario: Acabo de gastar $50.00 en un almuerzo.
IA: Entiendo. Lo registraré como alimentación usando efectivo. ¿Confirmas?
```

Flujo esperado:

```text
Texto del usuario
  -> IA interpreta intención, monto, concepto y posibles cuentas
  -> Backend valida plantilla, usuario, cuentas, periodo y permisos
  -> Usuario confirma
  -> Backend ejecuta la plantilla normal
```

La IA debe producir una sugerencia estructurada, por ejemplo:

```json
{
  "intent": "registrar_gasto",
  "template": "alimentacion_efectivo",
  "amount": 50,
  "concept": "almuerzo",
  "confidence": 0.91,
  "needsConfirmation": true
}
```

Reglas:

- La IA no crea asientos directamente.
- La IA no salta validaciones del backend.
- La IA no modifica periodos cerrados.
- La IA no debe decidir casos contables complejos sin confirmación o preguntas adicionales.
- La IA debe sugerir plantillas conocidas y pedir datos faltantes.
- La ejecución final siempre pasa por las APIs normales de TADOR.

Casos adecuados para IA v0:

- "Gasté 50 en almuerzo".
- "Compré medicina con efectivo".
- "Recibí 100 de Mariuxi por mi cumpleaños".
- "Pagué internet con tarjeta".

Casos fuera de IA v0:

- Diferidos de tarjeta.
- Facturas y documentos.
- CxC/CxP formal.
- Retenciones, impuestos complejos o decisiones profesionales ambiguas.
- Ejecución sin confirmación.

## Mascota y tono

La mascota de TADOR será Pacho, un perro poodle de cara amigable pero muy serio con las finanzas.

La personalidad de Pacho y su presencia en onboarding, guías o mensajes queda fuera del MVP funcional inicial.

## Plantillas candidatas para el MVP

Esta lista debe cerrarse antes de generar specs formales:

- Recibí dinero.
- Gasté dinero.
- Compré con tarjeta.
- Traspaso / transferencia.
- Pedí prestado.
- Pagué tarjeta o crédito.
- Registro con tag.
- Registro PRO más abierto, posiblemente llamado movimiento o asiento manual.

Cada plantilla deberá definirse con:

- intención de usuario,
- campos mínimos en Hogar,
- campos adicionales en PRO,
- cuentas involucradas,
- líneas contables generadas,
- validaciones,
- ejemplos de test.

## Endpoints candidatos para inventario inicial

Lista preliminar para orientar el backend TDD:

```text
POST /auth/register
POST /auth/login
POST /auth/recover
POST /auth/reset
GET  /me
PATCH /me/mode
GET  /account-plan
GET  /accounts
POST /accounts
GET  /accounts/:id/balance
GET  /accounts/:id/ledger
GET  /entities
POST /entities
PATCH /entities/:id
GET  /tags
POST /tags
POST /entries
GET  /entries
GET  /journal-entries
POST /journal-entries/manual
POST /transfers
POST /periods/:year/close
POST /periods/:year/reopen
GET  /settings/currency
```

Los nombres son tentativos y deben ajustarse cuando se diseñe el contrato real.

## Decisiones abiertas

- Confirmar si "Movimiento" queda como término nuevo o se reemplaza por "Asiento manual".
- Definir plantillas exactas del MVP.
- Definir regla exacta para cuentas bypass: cuándo son obligatorias, opcionales o sugeridas.
- Definir cómo se crean y ubican cuentas puente en el plan de cuentas.
- Definir el modelo exacto de Entidades: tipos, roles, unicidad por usuario y relación con tags.
- Definir el plan de cuentas NIIF estándar inicial.
- Resolver el tratamiento de ingresos brutos, descuentos y netos.
- Definir el alcance real del Modo PRO dentro del MVP sin documentos ni CxC/CxP.
- Definir el comportamiento exacto del cierre anual.
- Definir si habrá estados de asiento: confirmado, borrador, reversado, ajustado.
- Definir si el asiento manual PRO permite solo cuentas postables o cualquier cuenta hoja.
- Definir límites del catálogo de tags y su futura migración a Entidades.

## Próximo paso sugerido

Antes de pedir a Spec Kit que genere constitución o specs, conviene cerrar tres insumos:

1. Glosario mínimo definitivo.
2. Plantillas MVP con ejemplos de entrada y asiento generado.
3. Esqueleto del plan de cuentas estándar.

Con eso se podrá generar una constitución enfocada en TADOR y specs iniciales para backend TDD.
