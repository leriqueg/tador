# Tareas: Sprint 00 — Foundation Spec Kit

## Revisión de Carga de Trabajo

| Campo | Valor |
|-------|-------|
| Líneas estimadas cambiadas | 50–100 (solo ediciones documentales) |
| Riesgo de presupuesto 400 líneas | Bajo |
| PR encadenados recomendados | No |
| Estrategia de entrega | single-pr |
| Estrategia de cadena | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Unidades de trabajo sugeridas

| Unidad | Objetivo | PR | Notas |
|--------|----------|----|-------|
| 1 | Constitución + verificación de specs | PR único | Documentación pura; no hay código de producto |

---

## Fase 1: Constitución del proyecto

- [x] 1.1 Extraer principios constitucionales: sintetizar los 12 gates del constitution check en `specs/000-foundation-spec-kit/plan.md` (líneas 36–47) más las reglas de los foundation docs en un documento único `specs/constitucion.md`
- [x] 1.2 Redactar `specs/constitucion.md` con: preámbulo, principios rectores (alcance MVP, tenant/privacy, integridad contable, TDD, IA segura, concurrencia, arquitectura limpia, higiene de deps), regla de gobierno (un sprint = un spec = una capacidad verificable), y procedimiento de enmienda
- [x] 1.3 Verificar que `specs/constitucion.md` no contiene placeholders (ningún `[NEEDS CLARIFICATION]`, `TODO`, `TBD` o texto de plantilla genérica)

## Fase 2: Verificación de specs por sprint

- [x] 2.1 Verificar FR-003 en sprints 01–08: cada spec.md debe declarar alcance, historias de usuario, requisitos funcionales, entidades clave y criterios de éxito
- [x] 2.2 Verificar FR-004 en sprints 01–08: cada spec.md debe incluir la sección "Constitution Alignment" con Tenant & Privacy, Accounting Impact, MVP/Sprint Boundary y Testing Obligation
- [x] 2.3 Verificar FR-005 en sprints 01–08: ningún spec.md debe contener decisiones de implementación (nombres de librerías, frameworks, APIs, estructura de directorios de código)
- [x] 2.4 Verificar FR-002: existe un spec por cada sprint MVP (01–08) con spec.md presente
- [x] 2.5 Corregir cualquier brecha encontrada en 2.1–2.4 (p. ej., agregar sección faltante, mover decisión de implementación al plan.md o design.md correspondiente)
  - Sin brechas encontradas: todos los specs 01–08 cumplen FR-002, FR-003, FR-004 y FR-005.

## Fase 3: Cierre del sprint

- [x] 3.1 Marcar `spec.md` de Sprint 00 como "Ratified" (cambiar Status de Draft a Ratified)
- [x] 3.2 Registrar decisiones abiertas o deuda técnica documental en `specs/000-foundation-spec-kit/research.md`
- [x] 3.3 Confirmar que el equipo puede identificar el siguiente sprint a planificar en menos de 5 minutos (SC-004)
