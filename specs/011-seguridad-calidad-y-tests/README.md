# Sprint 010 — Seguridad, calidad y tests

**Branch**: `sprint/010-seguridad-calidad-y-tests`  
**Fecha**: 2026-07-16  
**Estado**: **cerrado** — informe `docs/software-quality-report.md` **APROBADO** (2026-07-18)

## Objetivo del sprint

Documentar y mantener el estado real de:

1. **Pruebas** (pirámide 70/20/10, conteos por capa)
2. **Calidad** (herramientas aplicadas + brechas)
3. **Seguridad** (SCA + secretos + SAST + DAST + revisión OWASP)

Los artefactos canónicos viven en `docs/`. Este directorio de specs **solo** contiene
el procedimiento para actualizarlos sin crear ruido ni tocar archivos ajenos.

## Mapa de artefactos (única fuente de verdad)

| Tema | Archivo canónico | Badge en README |
|------|------------------|-----------------|
| Pruebas | [`docs/testing-strategy.md`](../../docs/testing-strategy.md) | Tests · 70/20/10 |
| Calidad | [`docs/quality-tooling.md`](../../docs/quality-tooling.md) | Typecheck · Lint |
| Seguridad | [`docs/security.md`](../../docs/security.md) | Security |
| Informe consolidado | [`docs/software-quality-report.md`](../../docs/software-quality-report.md) | — |
| Entrega del proyecto | [`docs/delivery-checklist.md`](../../docs/delivery-checklist.md) | — (sin badge) |
| Cabecera / resumen | [`README.md`](../../README.md) | todos los anteriores |

## Documentos de este sprint

| Archivo | Propósito |
|---------|-----------|
| [`update-procedure.md`](./update-procedure.md) | **Cómo** ejecutar métricas de calidad y seguridad y alimentar el informe |
| [`close-quality-gaps.md`](./close-quality-gaps.md) | **Cómo** implementar las brechas de calidad/seguridad más adelante |
| Este `README.md` | Índice y límites de alcance |

## Fuera de alcance de este sprint

- No reescribir specs de sprints 000–008.
- No cambiar lógica de negocio durante la medición; las correcciones se planifican
  a partir de hallazgos validados.
- No crear documentos duplicados fuera de `docs/` + este directorio.
- No mencionar en docs de producto el contexto académico de la entrega.
