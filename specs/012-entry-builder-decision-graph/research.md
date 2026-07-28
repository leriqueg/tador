# Research: EntryBuilder decision graph

## Decision: Graph ≠ plantillas

Plantillas encode valid accounting (sides, groups). The graph encodes **UX questions**. Leaves point at `templateCode` or free lines.

**Rejected**: Discover tree by filtering plantilla list (becomes Hogar).

## Decision: Frontend-owned static graph

JSON/TS module in frontend for MVP. No graph API. Backend stays apunte/plantilla.

**Rejected**: Full backend workflow engine (overkill).

## Decision: INGRESO-first MVP

Paths: sueldo → `registrar_sueldo`; cliente → free apunte + `can_be_customer`; otro → free income.

EGRESO/TRANSFER: minimal linear subgraph so capture is not blocked.

## Decision: No IA

Static options only (008 excluded).
