# Inventario: vistas, mockups y endpoints

**Spec**: [spec.md](./spec.md) · **Fecha**: 2026-07-10 (actualizado)  
**Propósito**: Mapa de rutas UI ↔ mockups ↔ APIs **antes** de implementar pantallas autenticadas.  
**Alcance**: Modo Hogar (Sprint 06). Fuera: PRO avanzado, IA v0, Pacho interactivo.

**Catálogo de componentes UI (Storybook / diseño):** vive en el codebase — [`frontend/docs/component-inventory.md`](../../frontend/docs/component-inventory.md). Este archivo **no** duplica ese catálogo.

---

## Decisiones de documentación

| Tema | Decisión |
|------|----------|
| ¿Inventario de componentes en 006? | **No.** Es transversal; documentar en `frontend/docs/` + Storybook. |
| ¿Sprint Spec Kit “design-system”? | **No por ahora.** Fuente de marca: `specs/foundation/mockup/stitch/DESIGN.md`. |
| ¿Specs fuera del repo? | **Durante MVP, en el repo** (Spec Kit). Post-MVP: archivar `specs/` y dejar docs de arquitectura en el producto. |
| Pacho | **Post-MVP** en vistas funcionales. Stories experimentales OK. Futuro: `off` \| `messages` \| `character`. |

---

## 1. Mapa de vistas planificadas

Rutas en inglés (código). Copy de UI en español neutro.

| # | Ruta | Vista | Mockup Stitch | US / FR | Estado UI |
|---|------|-------|---------------|---------|-----------|
| 1 | `/` | Landing | `landing_page_tador_neutro` | Marketing | **Hecho** |
| 2 | `/login` | Login | `login_tador_neutro` | FR-002 | **Hecho** (auth real) |
| 3 | `/register` | Registro | `registro_tador_neutro` | FR-002 | **Hecho** (auth real) |
| 4 | `/faq` | Preguntas frecuentes | `preguntas_frecuentes_tador_neutro` | Marketing | **Hecho** |
| 5 | `/contact` | Contacto | `contacto_tador_neutro` | Marketing | Pendiente — **`mailto:`** (sin API) |
| 6 | `/onboarding` | Primer uso guiado | `onboarding_tador_mobile` + `onboarding_tador_desktop` | US1, FR-009/010 | Pendiente — modo + moneda + timezone (UTC) |
| 7 | `/dashboard` | Resumen Hogar (PYG + posición) | `dashboard_hogar_tador` (primario) | US3, FR-007 | Pendiente — post-login destino si libro OK |
| 8 | `/entries` | Apuntes (nuevo + recientes) | `apuntes_tador` | US2, FR-005 | Pendiente |
| 9 | `/accounts` | Cuentas + saldos | `cuentas_tador` | FR-003, FR-006 | Pendiente |
| 10 | `/entities` | Entidades | `entidades_tador` | FR-004 | Pendiente — CxC/CxP informales vía Entidad |
| 11 | `/settings` | Ajustes (libro / moneda / formato) | `configuraci_n_tador` | FR-002 | Pendiente |
| 12 | `/recovery` | Recuperar contraseña | (definir mockup / flujo) | FR-003 de 001 | Pendiente — depende email config (delta 001) |

### Onboarding (detalle)

- Wizard multi-paso al **primer login** (libro no inicializado).
- Captura: **modo (Hogar | PRO)**, **moneda**, **timezone** (default `UTC`).
- Desktop: moneda + mensaje guía (mockup incluye Pacho — **omitir mascota**).
- Post-MVP: al inicializar el libro MAY crearse vistas materializadas / índices para dashboard limpio (fuera de Sprint 06).
- Guía: callout tipográfico / tip banner — no personaje.

### Redirect post-auth

| Condición | Destino |
|-----------|---------|
| Libro no inicializado (falta modo/moneda/timezone del wizard) | `/onboarding` |
| Libro inicializado | `/dashboard` |
| Registro exitoso | mismo criterio (suele ser `/onboarding`) |

### Shell autenticado

| Nav (ES) | Ruta |
|----------|------|
| Resumen | `/dashboard` |
| Apuntes | `/entries` |
| Cuentas | `/accounts` |
| Entidades | `/entities` |
| Ajustes | `/settings` |

Componente objetivo: **AppShell** (ver inventario frontend). Sin avatar Pacho.

### Fuera de Sprint 06

| Mockup | Motivo |
|--------|--------|
| `dashboard_pro_*` | Sprint 07 |
| `registro_pro_*` | Sprint 07 / 08 |
| `dashboard_con_pacho_removable_tador` (slots Pacho) | Post-MVP; layout sin mascota si se reutiliza |
| Stories `Mascot/Pacho` | Librería experimental solamente |

---

## 2. Endpoints backend ↔ vistas

### 2.1 Ya cableados (`src/lib/api.ts`)

| Endpoint | Vista |
|----------|-------|
| `POST /auth/register` | `/register` |
| `POST /auth/login` | `/login` |
| `POST /auth/logout` | sesión |
| `GET /auth/me` | bootstrap |
| `GET /auth/verify/:token` | cliente listo; sin página |
| `POST /auth/resend-verification` | cliente listo; sin página |

### 2.2 Por vista autenticada

#### `/onboarding` + `/settings`

| Endpoint | Uso |
|----------|-----|
| `GET /book` | Moneda, locale, formato, `currencyLocked` |
| `PATCH /book/config` | Guardar config |

#### `/accounts`

| Endpoint | Uso |
|----------|-----|
| `GET /api/chart` | Catálogo + activaciones |
| `POST /api/chart/:id/activate` | Activar global si aplica |
| `GET /api/accounts` | Listado (FR-014 — implementado; sin saldo en proyección) |
| `POST /api/accounts` | Crear cuenta |
| `GET /api/balances/:cuentaId` | Saldo por cuenta (F3: el listado no embebe saldo) |

#### `/entities`

| Endpoint | Uso |
|----------|-----|
| `GET/POST /api/entities` | Listar / crear |
| `PUT/DELETE /api/entities/:id` | Editar / eliminar |

#### `/entries` (+ `/entries/new`)

**UX (locked 2026-07-13)**: template-driven QuickAdd — *not* PRO EntryBuilder.

| Capa / zona | Comportamiento |
|-------------|----------------|
| Frecuentes | 4–6 tiles (`FrequentTemplatesGrid`) |
| Tipo | Gasto \| Ingreso \| Transferencia (`KindSegment`) |
| Categoría | ≤6 chips; ≤3 plantillas visibles |
| Búsqueda | Typeahead (`TemplateSearch`) |
| Mini-form | Cuenta sticky + monto + descripción (`ApunteMiniForm`) |
| Burst | “Guardar y registrar otro” |
| Deep link | `/entries/new?plantilla=<code>` |

| Endpoint | Uso |
|----------|-----|
| `GET /api/plantillas?mode=hogar` | Plantillas |
| `GET /api/plantillas/:code` | Detalle |
| `POST /api/apuntes` | Registrar |
| `GET /api/apuntes` | Recientes / historial (004 FR §5.4 — implementado) |
| `GET /api/accounts` | Selector de cuenta en mini-form |

#### `/dashboard`

| Endpoint | Uso |
|----------|-----|
| `GET /api/reports/pyg?year=` | Panel PYG (canónico `year`; follow-up 005 alinea runtime) |
| `GET /api/reports/position` | Posición |

### 2.3 Gaps cerrados en specs

| Gap | Spec | Estado |
|-----|------|--------|
| `GET /api/accounts` | 002 FR-014 + contrato | **Código listo** (F1–F3); tests integración requieren Postgres |
| `GET /api/apuntes` | 004 §5.4 | **Código listo** (F1–F3) |
| Query PYG `year` | 005 FR-API-001 | **Código listo** (`year` canónico; `año` alias) |

### 2.4 No usar en Hogar

| Endpoint | Motivo |
|----------|--------|
| `/api/entries` CRUD | PRO / Sprint 07 |
| `GET /api/reports/balance` | PRO |
| Period close/reopen | No cotidiano Hogar |
| Tags CRUD | Sin mockup Hogar |

---

## 3. Storybook / componentes

Ver **[`frontend/docs/component-inventory.md`](../../frontend/docs/component-inventory.md)** para definiciones, anatomía, props y estado.

**P0 antes de pantallas autenticadas:** ValidationMessage, AppShell, OnboardingWizard (sin Pacho), PygPanelHogar, PositionPanel, ApunteForm/ApunteMiniForm, ApunteConfirm.

**US2 adicionales:** FrequentTemplatesGrid, KindSegment, CategoryChips, TemplateSearch, RecentEntriesList.

---

## 4. Criterio de avance

- [x] Acordar rutas (§1) e inventario de componentes en frontend docs
- [x] Gaps API documentados e implementados (002 / 004 / 005 follow-ups)
- [x] Storybook P0 del inventario
- [x] Clarificaciones producto 2026-07-12 (redirect, onboarding, email, mailto, CxC Hogar)
- [ ] Extender `BookConfig` (mode, timeZone, onboardingCompletedAt) + cliente API T002
- [ ] Cablear páginas autenticadas (US1 → US2 → US3) + `/recovery` (UI; email real = delta 001)

Ver también [tasks.md](./tasks.md) (generado vía Spec Kit).
