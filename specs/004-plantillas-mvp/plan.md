# Implementation Plan: Sprint 04 — Plantillas MVP

**Branch**: `sprint/004-plantillas`  
**Spec**: [spec.md](./spec.md)

## Summary

Implement motor de plantillas que permite registrar apuntes contables desde plantillas JSON predefinidas (HOME) o desde wizard libre (PRO). Backend-only: JSONs, endpoints, validación, generación de asientos y tabla Apunte.

## Architectural Context

- Backend: Fastify + TypeScript ESM + Prisma + PostgreSQL
- Ya existe: motor contable (asientos, líneas, periodos, CuentaGlobal, CuentaUsuario)
- Se agrega: carga de plantillas JSON, endpoint GET /api/plantillas, POST /api/apuntes, validación de slots, tabla Apunte

## Design Decisions

1. **Plantillas como JSON** — en `backend/src/plantillas/*.json`. Se cargan en memoria al startup. Sin tabla en DB.
2. **Mismo endpoint para HOME y PRO** — `POST /api/apuntes` acepta con o sin `templateCode`. Con template: valida contra plantilla. Sin template: solo valida balance + cuentas.
3. **Estrategias de línea** — `from_group` (una cuenta hija de un grupo), `from_groups` (de varios grupos), `fixed` (cuenta fija).
4. **amountMode** — `single` (mismo monto en todas las líneas) o `per_line` (futuro).
5. **Validación de jerarquía** — Para `from_group`/`from_groups`, se verifica que la cuenta seleccionada (CuentaGlobal o CuentaUsuario) cuelgue del grupo declarado.

## Implementation Phases

### Phase 1: Plantillas JSON + loader

- Crear `backend/src/plantillas/` con 10 archivos JSON
- `index.ts` que carga todos los JSON, los valida contra un schema mínimo y los exporta
- Registrar en el servidor (plugin Fastify)

### Phase 2: GET /api/plantillas endpoint

- Listar plantillas (opcional: filtrar por modo)
- Resolver cuentas disponibles por línea según estrategia
- GET /api/plantillas/:code con una plantilla específica

### Phase 3: Tabla Apunte + Prisma migration

- Modelo `Apunte` en schema.prisma
- Migración

### Phase 4: POST /api/apuntes (con plantilla)

- Validar templateCode, líneas, cuentas
- Validar jerarquía grupo → cuenta
- Aplicar amountMode single
- Generar asiento via accounting-service
- Guardar Apunte + Asiento en transacción

### Phase 5: POST /api/apuntes (sin plantilla / PRO)

- Validar líneas con side + amount
- Validar balance
- Generar asiento sin vincular plantilla

### Phase 6: Tests

- Unit: parsing de template JSON, validación de líneas
- Integration: GET /api/plantillas devuelve 10
- Integration: POST /api/apuntes con cada template → asiento balanceado
- Integration: POST /api/apuntes PRO wizard → asiento balanceado
- Integration: errores V1-V9

## Risks

| Risk | Mitigation |
|---|---|
| Validar jerarquía CuentaGlobal requiere consultas recursivas | Limitar a 3 niveles, usar Prisma relations |
| Plantillas cambian en el futuro | JSON versionado, carga al startup |
| amountMode per_line en PRO sin template duplica lógica | Usar mismo validador de balance existente |
