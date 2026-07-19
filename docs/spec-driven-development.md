# Metodología de desarrollo: Spec-Kit, Gentleman.AI y TDD

**Fecha:** 2026-07-18  
**Última actualización:** 2026-07-19

TADOR se desarrolló mediante Spec-Driven Development (SDD) con
[GitHub Spec-Kit](https://github.com/github/spec-kit) para estructurar la
definición de capacidades, y el ecosistema Gentleman.AI para ejecutar la
implementación asistida bajo una disciplina Test-Driven Development (TDD).

Cada incremento se formuló como una capacidad acotada con requisitos,
escenarios de aceptación, plan técnico, tareas ordenadas, pruebas y evidencia
de verificación. La especificación gobierna el trabajo; el agente de
implementación no sustituye los requisitos ni decide por fuera de sus límites.

## Flujo de desarrollo

```mermaid
flowchart LR
    N[Necesidad de producto] --> C[Constitución]
    C --> S[Spec-Kit: specify y clarify]
    S --> P[Spec-Kit: plan]
    P --> D[Diseño, investigación y contratos]
    D --> T[Spec-Kit: tasks]
    T --> G[Gentleman.AI: implementación TDD]
    G --> V[Tests, lint, typecheck y CI]
    V --> A[ADRs y documentación]
```

La propiedad central del proceso es la **trazabilidad**: una decisión puede
seguirse desde el principio rector y el requisito hasta la tarea, el código y
la prueba que aporta evidencia.

## 1. Spec-Driven Development

SDD desplaza parte de la validación hacia el inicio del ciclo. La especificación
describe **qué comportamiento y resultado se necesita**; el plan decide **cómo
se integrará técnicamente**; las tareas convierten el diseño en unidades
ejecutables. Así se reduce el riesgo de implementar una solución técnicamente
correcta para un problema mal definido.

En TADOR, SDD y TDD operan en niveles complementarios:

| Disciplina | Pregunta principal | Evidencia |
|------------|--------------------|----------|
| SDD con Spec-Kit | ¿Estamos construyendo la capacidad correcta? | escenarios, requisitos y criterios de éxito |
| Diseño/ADRs | ¿Por qué se eligió este enfoque? | alternativas, consecuencias y decisiones |
| TDD con Gentleman.AI | ¿El código cumple el comportamiento acordado? | prueba que falla, implementación mínima y regresión |
| CI/calidad | ¿La integración conserva los acuerdos? | typecheck, lint, cobertura y suites |

## 2. GitHub Spec-Kit en el repositorio

El repositorio fue inicializado con Spec-Kit `0.9.6.dev0` y la integración
`cursor-agent`, registradas en `.specify/init-options.json` y
`.specify/integration.json`. La integración instaló skills especializadas para
constitución, especificación, clarificación, planificación, tareas,
implementación, checklists y análisis de consistencia.

El workflow `.specify/workflows/speckit/workflow.yml` formaliza el ciclo:

```text
specify → revisión de spec → plan → revisión de plan → tasks → implement
```

Los gates entre especificación y plan impiden avanzar automáticamente con un
artefacto no revisado. Las extensiones de Git crean la rama de feature antes de
especificar y ofrecen puntos de commit antes y después de cada fase. La
extensión `agent-context` actualiza el contexto del agente después de
especificar y planificar, manteniendo disponibles las restricciones activas.

## 3. Jerarquía de artefactos

### Constitución

`.specify/memory/constitution.md` contiene principios obligatorios: dos modos
sobre un motor, partida doble, aislamiento por usuario, TDD, seguridad,
concurrencia, Clean Architecture y aritmética monetaria exacta. Funciona como
restricción transversal para todos los sprints.

### Documentos fundacionales

`specs/foundation/` estabiliza vocabulario, alcance del MVP, modos Hogar/PRO,
casos canónicos, plan de cuentas, reportes y estrategia incremental. Estos
documentos evitan que cada feature redefina el negocio.

### Especificación de capacidad

Cada `specs/{número}-{capacidad}/spec.md` contiene escenarios priorizados,
requisitos funcionales, casos límite y resultados medibles. Debe poder leerse
sin depender de decisiones de framework.

### Plan técnico

`plan.md` registra contexto técnico, estructura, estrategia de pruebas y un
**Constitution Check**. Este control obliga a revisar, antes del diseño, asuntos
como tenant, integridad contable, dinero exacto, seguridad e idempotencia.

### Diseño, contratos e investigación

Según el riesgo de la capacidad, el directorio incluye `research.md`,
`data-model.md`, `contracts/`, `quickstart.md` u otros inventarios. Se documentan
alternativas y límites antes de convertirlos en tareas.

Para frontend, esta fase también produjo mockups con Stitch. Sus capturas y HTML
se conservaron como referencias, mientras `DESIGN.md`, el inventario de
componentes y Storybook transformaron la exploración visual en contratos
reutilizables. Véase
[`diseno-visual-y-storybook.md`](diseno-visual-y-storybook.md).

### Tareas

`tasks.md` ordena el trabajo por dependencias y por historias verificables. En
comportamientos críticos incluye primero las pruebas y después el código de
producción.

### ADRs

`docs/adr/` conserva decisiones que afectan más de una especificación o cuya
justificación debe sobrevivir al sprint. Por ejemplo, idempotencia concurrente,
saldos derivados y el aplazamiento de IA v0.

## 4. Implementación con Gentleman.AI y TDD

Sobre los artefactos producidos por Spec-Kit, el ecosistema Gentleman.AI se
utilizó para ejecutar tareas de implementación, revisión y verificación dentro
de Cursor. Las reglas persistentes del proyecto trasladan al agente las
restricciones de arquitectura, seguridad, exactitud monetaria y estilo; las
skills especializadas aportan procedimientos repetibles para implementar y
analizar cada incremento.

La unidad de trabajo no fue un prompt aislado, sino una tarea trazable de
`tasks.md`. Para comportamiento de negocio, el ciclo aplicado fue:

```mermaid
flowchart LR
    T[Tarea + requisito] --> R[Red: prueba que falla]
    R --> G[Green: implementación mínima]
    G --> F[Refactor: mejorar diseño]
    F --> Q[Quality gates]
    Q -->|falla| R
    Q -->|pasa| N[Siguiente tarea]
```

### Red

Se expresa el comportamiento esperado en una prueba unitaria o de integración.
En el motor contable esto incluye balance de asientos, dinero decimal,
aislamiento por tenant, periodos, idempotencia y carreras concurrentes.

### Green

El agente implementa el cambio mínimo que satisface el escenario, respetando
los puertos de aplicación y evitando introducir reglas de dominio en rutas,
repositorios o componentes visuales.

### Refactor

Con las pruebas en verde se ajustan nombres, responsabilidades y duplicación sin
cambiar el contrato observable. Los tests de arquitectura protegen la dirección
de dependencias durante esta fase.

### Verificación

TypeScript, oxlint, Vitest, PostgreSQL de integración y, según el alcance,
Playwright validan el incremento. El resultado se contrasta con los criterios
`SC-*` y las tareas marcadas; una ejecución histórica siempre queda ligada a su
fecha y commit.

La asistencia por agentes acelera la producción y revisión de código, pero no
constituye evidencia por sí misma. La evidencia es el artefacto versionado, la
prueba reproducible y el cumplimiento observable del requisito.

## 5. Ejemplo de trazabilidad: motor contable

| Nivel | Evidencia |
|-------|----------|
| Principio | Constitución II exige Asientos atómicos y balanceados |
| Escenario | Spec 003: guardar uno balanceado y rechazar uno descuadrado |
| Requisito | `FR-002`: débitos y créditos deben coincidir |
| Criterio | `SC-001`: ningún asiento descuadrado puede persistirse |
| Diseño | Plan 003 ubica reglas en dominio/aplicación y persistencia en PostgreSQL |
| Decisión | ADR 0003/0004 define idempotencia y control concurrente |
| Implementación | Servicio contable + repositorio transaccional |
| Verificación | Unitarias de dinero/invariantes e integración contra PostgreSQL |

Esta cadena es más fuerte que afirmar “el sistema funciona”: permite mostrar qué
significa funcionar y dónde se prueba.

## 6. Incrementos y estado

El proyecto sigue el principio “un sprint = una spec = una capacidad
verificable”. La secuencia cubre plataforma, catálogos, motor contable,
plantillas, reportes y las interfaces Hogar/PRO.

La numeración expresa identidad histórica, no necesariamente orden de entrega.
El directorio `008-ia-v0` se conserva, pero la capacidad fue excluida del cierre
del MVP por ADR 0002. `009-frontend-pro-avanzado` fue implementado después de
007 sin renumerar los directorios. Esta decisión muestra una propiedad
importante de SDD: cambiar alcance de forma explícita sin borrar la historia.

> La constitución aún contiene una referencia histórica a IA v0 dentro de los
> criterios de cierre. Para el alcance vigente, ADR 0002 y los documentos de
> roadmap posteriores son la decisión aplicable. Esta divergencia se documenta
> como deuda de gobernanza.

## 7. Controles de calidad del proceso

- **Clarificación antes del diseño:** preguntas y respuestas quedan en la spec.
- **Criterios verificables:** los requisitos usan resultados observables y
  escenarios independientes.
- **Constitution Check:** el plan debe declarar cumplimiento o justificar una
  excepción.
- **Orden por dependencias:** las tareas fundacionales preceden las historias
  que dependen de ellas.
- **Trazabilidad de decisiones:** cambios transversales se registran en ADRs.
- **Verificación automatizada:** CI ejecuta tipado, lint, unitarias, integración
  y cobertura.
- **Documentación viva:** specs y docs se actualizan cuando una decisión cambia
  semántica o alcance.

## 8. Beneficios y límites

| Aspecto | Beneficio observado | Riesgo o límite |
|---------|---------------------|-----------------|
| Alcance incremental | Reduce el tamaño de cada decisión | Puede fragmentar la visión si no existe documentación fundacional |
| Trazabilidad | Facilita auditoría y revisión | Requiere mantener sincronizados artefactos y código |
| Diseño anticipado | Expone riesgos contables y de seguridad | Un plan excesivo puede quedar obsoleto |
| TDD desde requisitos | Conecta pruebas con valor de negocio | Tener muchas pruebas no garantiza buenas aserciones |
| ADRs | Conservan el “por qué” | Las decisiones posteriores deben marcar qué texto anterior reemplazan |

SDD tampoco demuestra causalmente que cada acierto provenga del proceso. Su
aporte verificable es reducir ambigüedad, hacer visibles los compromisos y
permitir revisar coherencia entre intención e implementación.

## Referencias internas

- [Configuración de integración Spec-Kit](../.specify/integration.json)
- [Workflow SDD](../.specify/workflows/speckit/workflow.yml)
- [Extensiones y hooks](../.specify/extensions.yml)
- [Constitución](../.specify/memory/constitution.md)
- [Especificación del motor contable](../specs/003-motor-contable/spec.md)
- [Plan del motor contable](../specs/003-motor-contable/plan.md)
- [Tareas del motor contable](../specs/003-motor-contable/tasks.md)
- [ADR 0002 — IA diferida](adr/0002-sprint-08-ia-deferred-009-pro-analysis.md)
- [Índice de documentación](README.md)
