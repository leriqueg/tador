# Checklist de entrega del proyecto

**Fecha de corte:** 2026-07-18

**Última actualización:** 2026-07-18

Seguimiento de los entregables exigidos para la revisión y calificación del
proyecto. Este documento es la **lista de control operativa**; el contenido
descriptivo vive en el `README.md` y en `docs/`.

> No duplicar aquí la historia del producto. Solo estado, URLs y gaps del README.

---

## 1. Documentación completa (`README.md`)

| Ítem | Estado | Notas / ubicación |
|------|--------|-------------------|
| a. Descripción general del proyecto | ✅ | README — Origen, Visión, Modos Hogar/PRO |
| b. Stack tecnológico | ✅ | README — sección Stack (+ badges) |
| c. Instalación y ejecución | ✅ | README — “Inicio rápido con Docker”, migraciones y puertos |
| d. Estructura del proyecto | ✅ | README — estructura de `backend/`, `frontend/`, `specs/`, `docs/`, Docker y CI |
| e. Funcionalidades principales | ✅ | README — paneles PYG/posición, modos, sprints |
| f. Usuario y contraseña de prueba | ❌ Pendiente | Añadir en README cuando exista usuario seed o credenciales de demo estables |

**Acción pendiente:** añadir credenciales de demo cuando exista un usuario seed
estable (sin reutilizar secretos de producción).

---

## 2. Código fuente

| Ítem | Estado | Notas |
|------|--------|-------|
| Repositorio en GitHub | ✅ | `https://github.com/leriqueg/tador` |
| Público (preferido) | ✅ / verificar | Confirmar visibilidad pública antes de la entrega |
| Privado justificado | — | Solo si aplica; en ese caso conceder acceso al revisor según instrucciones del curso |

---

## 3. Despliegue / publicación

| Ítem | Estado | URL |
|------|--------|-----|
| App en funcionamiento | ❌ Pendiente | _añadir URL aquí_ |
| URL también en README | ❌ Pendiente | Sección “Despliegue” o badge |

**Acción pendiente:** publicar (p. ej. Railway, Fly, Render, VPS) y documentar
URL + variables de entorno necesarias (sin pegar secretos).

---

## 4. Presentación (slides)

| Ítem | Estado | URL / archivo |
|------|--------|---------------|
| Slides del proyecto | ❌ Pendiente | _Google Slides / Canva / PDF en repo_ |
| Enlace o archivo referenciado en README | ❌ Pendiente | |

**Acción pendiente:** crear presentación y enlazarla desde README (o subir el
archivo bajo `docs/` y enlazarlo).

---

## 5. Vídeo de explicación

| Ítem | Estado | URL |
|------|--------|-----|
| Vídeo con explicación propia | ❌ Pendiente | _YouTube / Drive / …_ |
| Captura de pantalla mientras se explica (obligatorio) | ❌ Pendiente | |
| Cámara / rostro (opcional) | — | Opcional |
| URL en README | ❌ Pendiente | |

**Acción pendiente:** grabar screencast del flujo (login → onboarding/dashboard →
apuntes / reportes) y publicar enlace público.

---

## 6. Contenido que debe estar en el directorio del código

| Recurso | Estado |
|---------|--------|
| Documentación | ✅ `README.md` + `docs/` + `specs/` |
| Información de despliegue | ⚠️ Cuando exista URL → documentar en README y marcar aquí |
| Slides (enlace o archivo) | ❌ |

---

## 7. Datos del formulario de entrega

Completar al enviar (copiar desde aquí al formulario):

| Campo | Valor |
|-------|-------|
| Nombre completo | _pendiente_ |
| Email de inscripción | _pendiente_ |
| URL del repositorio GitHub | `https://github.com/leriqueg/tador` |
| URL de despliegue | _pendiente_ |
| URL de las slides | _pendiente_ |
| URL del vídeo | _pendiente_ |
| Usuario de prueba | _pendiente_ |
| Contraseña de prueba | _pendiente_ |

**Fecha objetivo de entrega (referencia del temario):** 2026-07-20  
(Se puede enviar antes o después; fuera de plazo los tiempos de corrección pueden variar.)

---

## Orden de cierre recomendado

```text
1. Completar el gap restante del README (credenciales demo)
2. Despliegue + URL
3. Slides + URL
4. Vídeo (pantalla) + URL
5. Marcar este checklist en ✅
6. Rellenar formulario de entrega con las URLs de la sección 7
```

Tras cada ítem cerrado, actualizar **solo** este archivo y el README (URLs /
secciones nuevas). No crear checklists paralelos.
