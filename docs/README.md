# Índice de documentación TADOR

**Fecha**: 2026-07-18  
**Última actualización**: 2026-07-19

Este índice apunta a la documentación operativa y a las decisiones de
arquitectura vigentes. La descripción general, estado del producto y comandos
principales parten del [`README.md` del proyecto](../README.md).

## Documentación principal

1. [Arquitectura de software](arquitectura-software.md)
2. [Metodología: GitHub Spec-Kit, Gentleman.AI y TDD](spec-driven-development.md)
3. [Diseño visual: de Stitch a Storybook](diseno-visual-y-storybook.md)
4. [Dominio y motor contable](motor-contable/README.md)
5. [Calidad de software](software-quality-report.md)
6. [Seguridad](security.md)
7. [Dockerización y reproducibilidad](dockerizacion.md)

Esta secuencia conecta problema, método de desarrollo, solución técnica y
evidencia. Cada documento distingue capacidades implementadas, decisiones y
limitaciones para evitar presentar objetivos futuros como resultados actuales.

> **Alcance de la evidencia.** El stack efectivo del frontend es React + Vite +
> Tailwind. Zod aparece como dependencia, pero no valida aún el borde HTTP. El
> informe de calidad documenta una ejecución histórica del 2026-07-18 asociada
> a un commit concreto.

## Arquitectura y proceso

- [Arquitectura de software](arquitectura-software.md)
- [Metodología: GitHub Spec-Kit, Gentleman.AI y TDD](spec-driven-development.md)
- [Diseño visual: de mockups de Stitch a biblioteca Storybook](diseno-visual-y-storybook.md)
- [Dockerización y reproducibilidad](dockerizacion.md)

## Motor contable

- [Resumen del motor contable](motor-contable/README.md)
- [Arquitectura y capacidades](motor-contable/arquitectura-y-capacidades.md)
- [Flujo de escritura, concurrencia e idempotencia](motor-contable/flujo-escritura-concurrencia.md)
- [Saldos derivados y política no-negativa](motor-contable/saldos-y-politica-no-negativa.md)

## ADR

- [ADR 0001 — Stack architecture and library baseline](adr/0001-stack-architecture-and-library-baseline.md)
- [ADR 0002 — IA diferida y Sprint 009](adr/0002-sprint-08-ia-deferred-009-pro-analysis.md)
- [ADR 0003 — Escrituras contables idempotentes y concurrentes](adr/0003-idempotent-concurrent-accounting-writes.md)
- [ADR 0004 — Saldos derivados y control concurrente](adr/0004-derived-balances-and-concurrent-overdraft-guard.md)
- [ADR 0005 — IDs de texto (CUID) en Asiento y LineaAsiento](adr/0005-text-cuid-primary-keys-for-ledger.md)

## Calidad, seguridad y pruebas

- [Informe de calidad y seguridad (2026-07-18)](software-quality-report.md)
- [Estrategia de pruebas](testing-strategy.md)
- [Herramientas de calidad](quality-tooling.md)
- [Seguridad](security.md)
- [Checklist de entrega](delivery-checklist.md)

## Operación

- [Archivos de entorno](environment-files.md)

## Entrega

- [Checklist de entrega](delivery-checklist.md)
- [README principal del proyecto](../README.md)
