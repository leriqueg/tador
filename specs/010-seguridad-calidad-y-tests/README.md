# Sprint 010 — Seguridad, calidad y tests

**Branch**: `sprint/010-seguridad-calidad-y-tests`  
**Fecha**: 2026-07-16  
**Estado**: documentación viva (conteos y badges se refrescan; auditoría JudgmentDay pendiente)

## Objetivo del sprint

Documentar y mantener el estado real de:

1. **Pruebas** (pirámide 70/20/10, conteos por capa)
2. **Calidad** (herramientas aplicadas + brechas)
3. **Seguridad** (secure-by-design + JudgmentDay pendiente)

Los artefactos canónicos viven en `docs/`. Este directorio de specs **solo** contiene
el procedimiento para actualizarlos sin crear ruido ni tocar archivos ajenos.

## Mapa de artefactos (única fuente de verdad)

| Tema | Archivo canónico | Badge en README |
|------|------------------|-----------------|
| Pruebas | [`docs/testing-strategy.md`](../../docs/testing-strategy.md) | Tests · 70/20/10 |
| Calidad | [`docs/quality-tooling.md`](../../docs/quality-tooling.md) | Typecheck · Lint |
| Seguridad | [`docs/security.md`](../../docs/security.md) | Security |
| Entrega del proyecto | [`docs/delivery-checklist.md`](../../docs/delivery-checklist.md) | — (sin badge) |
| Cabecera / resumen | [`README.md`](../../README.md) | todos los anteriores |

## Documentos de este sprint

| Archivo | Propósito |
|---------|-----------|
| [`update-procedure.md`](./update-procedure.md) | **Cómo** recontar tests, actualizar badges y docs (paso a paso) |
| [`close-quality-gaps.md`](./close-quality-gaps.md) | **Cómo** implementar las brechas de calidad/seguridad más adelante |
| Este `README.md` | Índice y límites de alcance |

## Fuera de alcance de este sprint

- No reescribir specs de sprints 000–008.
- No cambiar lógica de negocio salvo correcciones que JudgmentDay confirme.
- No crear documentos duplicados fuera de `docs/` + este directorio.
- No mencionar en docs de producto el contexto académico de la entrega.
