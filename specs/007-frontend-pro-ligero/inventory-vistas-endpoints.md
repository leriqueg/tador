# Inventory: vistas ↔ endpoints (Sprint 07 PRO ligero)

**Alcance**: Modo PRO ligero + migración de namespaces Hogar. Fuera: 009 análisis, 008 IA.

## 1. Rutas frontend

| # | Ruta PRO | Propósito | Spec | Estado |
|---|----------|-----------|------|--------|
| 1 | `/pro/dashboard` | Hub | US0/US5 | Pendiente |
| 2 | `/pro/entries` | EntryBuilder | US2 | Pendiente |
| 3 | `/pro/entries/manual` | Asiento manual | US3 | Pendiente |
| 4 | `/pro/accounts` | Árbol + crear bajo madre | US4 | Pendiente |
| 5 | `/pro/entities` | Entidades (org capabilities) | US1/US2 | Pendiente |
| 6 | `/pro/finances` | Landing | US5 | Pendiente |
| 7 | `/pro/finances/pyg` | P&G base | US5 | Pendiente |
| 8 | `/pro/finances/balance` | Posición | US5 | Pendiente |
| 9 | `/pro/finances/apuntes` | Historial | US5 | Pendiente |
| 10 | `/pro/settings` | Ajustes | — | Pendiente |

| # | Ruta Hogar (migración) | Notas |
|---|------------------------|-------|
| H1 | `/hogar/dashboard` … | Mover rutas actuales; redirects desde legacy `/dashboard` etc. |
| H2 | Guard | `mode` mismatch → other namespace |

Onboarding: puede permanecer `/onboarding` (pre-namespace) y luego saltar a `/pro|hogar/dashboard`.

## 2. APIs

| Endpoint | Uso PRO 007 | Notas |
|----------|-------------|-------|
| `GET/PATCH` book config | mode, onboarding | Existente |
| `GET/POST /api/entities` | org + capabilities | Extender payload capacidades |
| `GET/POST /api/accounts` | árbol, create under parent | Codes in projection for PRO UI |
| `GET /api/plantillas` | opcional / híbrido | No requerido para builder libre |
| `POST /api/apuntes` | EntryBuilder | ± templateCode |
| `POST /api/entries` | Asiento manual | Sprint 03 |
| `GET /api/reports/pyg` | finanzas | Igual Hogar |
| `GET /api/reports/position` | balance | Igual Hogar |
| `GET /api/reports/balance` | opcional | Si ya existe; no análisis 009 |

## 3. Componentes P0

- `ModeNamespaceGuard`
- `EntryBuilder` (+ steps, burst)
- `ManualEntryForm`
- `AccountsTreePro`
- `OrganizationCapabilitiesFields`
- Reuse: money inputs, ValidationMessage, AppShell (PRO theme variant)

## 4. Criterio de avance

- [ ] Spec + plan + tasks aprobados
- [ ] Capacidades Entidad en API
- [ ] Namespaces + redirects
- [ ] EntryBuilder + manual + árbol
- [ ] Quickstart smoke
