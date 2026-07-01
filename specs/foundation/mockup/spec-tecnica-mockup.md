# Especificación Técnica — Mockup Funcional TADOR

> **Propósito**: Este documento describe las rutas, vistas y requerimientos funcionales del mockup frontend de TADOR. Sirve como input para que un sistema de diseño UI-UX (otra IA o herramienta visual) genere el HTML+CSS+JS del mockup navegable.
>
> **Estado**: Foundation — Especificación para mockup, no para implementación final.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Lenguaje | TypeScript |
| Framework UI | React 19+ |
| Build | Vite 6+ |
| Componentes | Mantine 8+ (mobile-first) |
| Estado UI | Zustand |
| Estado servidor | TanStack Query / React Query |
| Charts | Pendiente de definir (para dashboard PYG) |
| Forms | Mantine forms |
| Ruteo | React Router v7+ |

**Idioma de UI**: Español. Código, rutas, comentarios en inglés.

**Principios de diseño**: Mobile-first. Hogar oculta complejidad contable. PRO puede revelarla.

---

## Rutas del Mockup

### Rutas Públicas (sin autenticación)

| Ruta | Vista | Descripción |
|------|-------|-------------|
| `/` | Landing | Página principal del producto TADOR |
| `/login` | Login | Autenticación de usuario |
| `/register` | Registro | Creación de cuenta nueva |
| `/qa` | Q&A | Preguntas frecuentes |
| `/contact` | Contacto | Formulario y datos de contacto |

### Rutas App (requieren autenticación — opcional para mockup)

| Ruta | Vista | Descripción |
|------|-------|-------------|
| `/app/dashboard` | Dashboard Hogar | Resumen PYG, saldos principales |
| `/app/apuntes` | Apuntes | Registro de gastos/ingresos cotidianos |
| `/app/cuentas` | Cuentas | Listado de cuentas del usuario |
| `/app/entidades` | Entidades | Catálogo de personas/bancos/tarjetas |
| `/app/config` | Configuración | Moneda, formato, modo Hogar/PRO |

> Para el mockup, implementar SOLO las rutas públicas. Las rutas app pueden listarse como "próximamente" o con placeholder.

---

## Vistas del Mockup

### 1. Landing Page (`/`)

**Objetivo**: Presentar TADOR como solución para la economía del hogar con base contable correcta. Invitar a registrarse.

**Secciones requeridas**:

| Sección | Contenido |
|---------|-----------|
| **Hero** | Título principal (`TADOR` o `TADOR — Tu economía del hogar, con base contable`), subtítulo breve que explique el concepto, CTA principal ("Comenzar gratis" / "Probar TADOR") |
| **Beneficios** | 3-4 tarjetas con icono + título + descripción breve. Ej: "Apuntes en lenguaje cotidiano", "Dashboard claro de ingresos y gastos", "De Hogar a PRO sin migrar", "Tus datos, seguros" |
| **Cómo funciona** | Paso a paso visual: 1. Creás tu cuenta, 2. Configurás tu moneda, 3. Registrás gastos en lenguaje simple, 4. Ves tu dashboard |
| **Modos** | Comparativa Hogar vs PRO: Hogar es simple, guiado, sin códigos. PRO da más control sin ser ERP. |
| **CTA final** | "Empezá hoy" / "Probá TADOR gratis" |
| **Footer** | Links a: Q&A, Contacto, Login. Marca TADOR. |

**Requerimientos funcionales**:
- Diseño mobile-first (columna en mobile, filas en desktop)
- Navegación superior con logo + links (Landing, Q&A, Contacto, Login/Registro)
- Los CTAs deben llevar a `/register` o `/login`

---

### 2. Login (`/login`)

**Objetivo**: Autenticar al usuario.

**Elementos**:
- Título: "Iniciar sesión"
- Campo: Email
- Campo: Contraseña (con toggle visibilidad)
- Botón: "Ingresar" (full-width en mobile)
- Link: "¿Olvidaste tu contraseña?" (placeholder, sin funcionalidad en mockup)
- Link: "¿No tenés cuenta? Registrate" → `/register`
- Diseño centrado, tarjeta sobre fondo limpio

**Requerimientos funcionales**:
- Validación visual de campos (requeridos, formato email)
- Estado de error simulable (ej: "Email o contraseña incorrectos")
- Estado loading en el botón al "enviar"
- No requiere funcionalidad real de auth — solo flujo visual

---

### 3. Registro (`/register`)

**Objetivo**: Crear una cuenta nueva.

**Elementos**:
- Título: "Crear cuenta"
- Campo: Nombre completo
- Campo: Email
- Campo: Contraseña (con requisitos mínimos: 8 caracteres, 1 mayúscula)
- Campo: Confirmar contraseña
- Botón: "Crear cuenta"
- Link: "Ya tengo cuenta. Iniciar sesión" → `/login`
- Mismo diseño que Login (tarjeta centrada)

**Requerimientos funcionales**:
- Validación: contraseñas coinciden, email válido
- Toggle visibilidad en campos de contraseña
- Feedback visual de requisitos de contraseña
- No requiere funcionalidad real de registro

---

### 4. Q&A (`/qa`)

**Objetivo**: Responder dudas frecuentes sobre TADOR.

**Secciones requeridas**:

| Categoría | Preguntas sugeridas |
|-----------|-------------------|
| **General** | ¿Qué es TADOR?, ¿Para quién es?, ¿En qué se diferencia de Conta Hogar?, ¿Es gratis? |
| **Técnico** | ¿Mis datos están seguros?, ¿Puedo usar TADOR en el celular?, ¿Qué pasa si quiero usar funciones más avanzadas? |
| **Contable** | ¿Necesito saber contabilidad?, ¿Qué es un asiento?, ¿Puedo migrar mis datos de Conta Hogar? |

**Requerimientos funcionales**:
- Acordeón/expandible: cada pregunta se expande al hacer clic para mostrar la respuesta
- Solo una respuesta abierta a la vez (o toggle independiente, da igual)
- Categorías como separadores visuales o tabs
- Diseño limpio, centrado en legibilidad

---

### 5. Contacto (`/contact`)

**Objetivo**: Canal de comunicación con el equipo.

**Elementos**:
- Título: "Contactanos"
- Formulario:
  - Campo: Nombre
  - Campo: Email
  - Campo: Asunto (select o input)
  - Campo: Mensaje (textarea)
  - Botón: "Enviar mensaje"
- Información adicional:
  - Email de contacto: `hola@tador.app` (ejemplo)
  - (opcional) Redes sociales o GitHub del proyecto

**Requerimientos funcionales**:
- Validación de campos requeridos
- Textarea expandible
- No requiere envío real — solo simulación visual (toast de "Mensaje enviado" al hacer clic)
- Diseño mobile-first

---

## Requerimientos Cross-Cutting (aplican a todas las vistas)

### Navegación
- **Header**: Logo TADOR (texto o icono), nav links (Landing, Q&A, Contacto), botón "Ingresar" / "Comenzar"
- **Mobile**: Menú hamburguesa que despliega los links
- **Footer**: Logo, links, copyright (`© 2026 TADOR`)

### Estados visuales por componente
- **Default**: estado normal
- **Hover/Focus**: feedback en links, botones e inputs
- **Loading**: skeleton o spinner en zonas que simulen carga
- **Error**: mensajes de error inline en formularios, no alert() ni console
- **Empty**: vista vacía con ilustración o mensaje amigable (para secciones placeholder)

### Branding / UI Kit (para mantener consistencia)

| Elemento | Especificación |
|----------|---------------|
| **Paleta** | Tranquila, profesional. Verde azulado como primary (asociación financiera sin ser frío). La IA de diseño elige la paleta exacta. |
| **Tipografía** | Sistema (Inter, system-ui) o similar sans-serif legible |
| **Border radius** | Suave (8px-12px en tarjetas) |
| **Sombras** | Sutil, en tarjetas y modales |
| **Iconos** | Lucide, Tabler Icons o Heroicons — línea consistente |
| **Tono UI** | Amigable, profesional. Nada corporativo frío, nada infantil. |

### Responsive Breakpoints (referencia)

| Dispositivo | Ancho |
|------------|-------|
| Mobile | < 640px |
| Tablet | 640px - 1024px |
| Desktop | > 1024px |

---

## Notas para la IA de diseño UI-UX

1. **Idioma**: Todos los textos visibles en español rioplatense (voseo: "empezá", "registrate", "contactanos").
2. **No hay funcionalidad real backend**: El mockup es completamente frontend. Los formularios simulan envío con feedback visual (toast, loading, error simulado). No hay persistencia.
3. **Mobile-first**: Diseñar primero para pantalla de 375px, luego expandir a tablet y desktop.
4. **Tono**: TADOR es una herramienta financiera AMIGABLE. Ni Excel frío ni app infantil. Pensar en una persona que quiere ordenar su economía sin sentir que está haciendo contabilidad.
5. **Modo oscuro**: Opcional pero valorado.
6. **Archivos esperados**: HTML semántico, CSS moderno (Grid, Flexbox, custom properties), JS vanilla o React mínimo para interactividad (tabs, acordeón, menú mobile, validación de formularios). No se requiere framework de JS para el mockup — HTML+CSS+JS vanilla alcanza.

---

## Próximos pasos (post-mockup)

Este mockup cubre la cara pública de TADOR (landing + auth + info). La siguiente etapa será mockup de la **app interna**: dashboard Hogar, registro de apuntes, saldos, configuración, y vista PRO. Esas se especificarán en un documento aparte cuando este mockup esté aprobado.
