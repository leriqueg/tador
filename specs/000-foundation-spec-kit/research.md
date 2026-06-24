# Research: Sprint 00 - Foundation Spec Kit

## Decision: Sprint boundary

Documentation and governance only; no product runtime behavior.

**Rationale**: Prevents broad MVP specs and keeps each sprint independently plannable.

**Alternatives considered**: Full MVP planning in one spec.

## Decision: Testing posture

Use TDD for backend behavior once Sprint 01 establishes test tooling.

**Rationale**: Constitution requires test-first core behavior and tenant/accounting protection.

**Alternatives considered**: Manual testing only.

## Decision: Tenant/privacy default

All user-owned data must be scoped by authenticated user.

**Rationale**: Financial data is private and multiuser from the MVP.

**Alternatives considered**: Add tenant scoping later.

---

## Close-out: Sprint 00 — Foundation Spec Kit

**Status**: Ratified — 2026-06-24
**Next sprint to plan**: Sprint 01 — Plataforma base (`specs/001-plataforma-base/spec.md`)

### Tareas ejecutadas

| Fase | Tarea | Estado |
|------|-------|--------|
| 1 | Constitución del proyecto (1.1–1.3) | ✅ Completo |
| 2 | Verificación FR-002 a FR-005 en specs 01–08 (2.1–2.5) | ✅ Sin brechas |
| 3 | Cierre del sprint (3.1–3.3) | ✅ Completo |

### Resultados de verificación (Fase 2)

Todos los specs 01–08 cumplen sin correcciones necesarias:

- **FR-003**: Cada spec declara alcance (header + input), historias de usuario, requisitos funcionales, entidades clave y criterios de éxito.
- **FR-004**: Cada spec incluye sección "Constitution Alignment" con las 4 subsecciones requeridas: Tenant & Privacy, Accounting Impact, MVP/Sprint Boundary, Testing Obligation.
- **FR-005**: Ningún spec contiene decisiones de implementación (librerías, frameworks, APIs, estructura de directorios de código).
- **FR-002**: Existe exactamente un spec por sprint 01–08 (nota: 007 está en `specs/007-frontend-pro-ligero/`, no `007-frontend-pro/`).

### Confirmación SC-004

El equipo puede identificar el siguiente sprint a planificar en menos de 5 minutos:

1. Revisar `specs/` — 8 directorios numerados 001–008 + 000.
2. Scannear estados en los spec.md — todos en Draft excepto 000 (Ratified).
3. El siguiente es `001-plataforma-base/spec.md`.
4. La constitución (`constitucion.md` §Regla de Gobierno) lista los 8 sprints con sus capacidades como referencia rápida.

### Deuda documental registrada

- **Notación de directorio**: El directorio `007-frontend-pro-ligero/` aparece con guion intermedio (`pro-ligero`) mientras que en `constitucion.md` figura como "Frontend PRO ligero". Consistente pero vale la pena notarlo para futuras referencias cruzadas.
- **Sin decisiones abiertas conocidas**: Todos los alcances, sprints y criterios están definidos. La próxima decisión técnica (package manager, Node LTS concreta, etc.) corresponde a Sprint 01.
