# Auditoría de Clean Architecture — Resumen para personas

Documento breve y sin tecnicismos profundos. El detalle técnico y las
instrucciones para resolverlo están en `technical-remediation.ai.md` (pensado
para dárselo a una IA).

## ¿Qué se revisó?

Se comprobó si el backend cumple la regla de arquitectura que exige la
constitución del proyecto (Principio VIII y `specs/foundation/stack-architecture.md`):
las dependencias deben ir **de afuera hacia adentro**:

`API → Aplicación → Dominio`, y la Infraestructura implementa contratos del
dominio/aplicación. Es decir: lo de adentro (reglas de negocio) no debe conocer
lo de afuera (base de datos, framework web).

## Veredicto: se cumple **a medias**

- El **núcleo (dominio)** está muy bien: es puro, sin base de datos ni framework.
- La **capa de aplicación** y las **rutas (API)** se saltan la regla: hablan
  directamente con la base de datos (Prisma), en lugar de hacerlo a través de
  contratos. Eso rompe la dirección de dependencias que pide la constitución.

## Problemas principales (en lenguaje simple)

1. **La lógica de negocio conoce la base de datos.** Varios servicios de la capa
   de aplicación usan Prisma directamente. Deberían pedir los datos a un
   "repositorio" abstracto, sin saber que por detrás hay Prisma.

2. **Los contratos están en el lugar equivocado.** Las "interfaces" de
   repositorios y servicios se definen dentro de infraestructura, cuando deberían
   vivir en la capa de aplicación (quien los usa es su dueño).

3. **Las rutas HTTP hacen demasiado.** Muchas rutas consultan la base de datos y
   contienen reglas de negocio dentro del propio manejador web. Deberían ser
   "delgadas": recibir la petición, llamar a un servicio y devolver la respuesta.

4. **SQL crudo en la capa de aplicación.** El servicio de reportes escribe
   consultas SQL directamente; eso es un detalle de infraestructura.

5. **Detalle técnico acoplado (menor).** El cifrado de contraseñas (argon2) se usa
   directamente en un caso de uso; debería estar detrás de una abstracción.

## ¿Qué se recomienda hacer?

- Crear una carpeta de **contratos (puertos)** en la capa de aplicación y mover
  ahí todas las interfaces de repositorios y servicios.
- Sacar Prisma de la capa de aplicación y de las rutas: todo acceso a datos debe
  pasar por repositorios implementados **solo** en infraestructura.
- Adelgazar las rutas para que únicamente orquesten servicios.
- Poner el cifrado de contraseñas y el SQL de reportes detrás de abstracciones.

Todo esto se puede hacer **por partes pequeñas**, sin cambiar la base de datos ni
las respuestas de la API, ejecutando las pruebas después de cada cambio.

## ¿Qué NO hay que tocar?

- El dominio (ya está correcto).
- El esquema de base de datos, las migraciones ni las rutas/respuestas públicas.
- El cálculo monetario con `decimal.js` (obligatorio por el Principio IX).

## Impacto

Es una mejora de **mantenibilidad y orden**, no un cambio de funcionalidad. El
objetivo es que el proyecto respete la arquitectura que ya definió su propia
constitución, para que crezca sin volverse frágil.
