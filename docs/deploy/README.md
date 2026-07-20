# Deploy — guías de despliegue

**Fecha:** 2026-07-20

Modalidades documentadas para sacar TADOR de desarrollo local a un VPS
público detrás de un reverse proxy.

## Modalidad recomendada (MVP staging)

**Same-origin detrás de HAProxy:** un solo dominio HTTPS; el navegador habla
solo con `:443`. HAProxy reparte por path hacia el SPA estático y hacia
Fastify en la red interna.

| Guía | Cuándo usarla |
|------|----------------|
| [HAProxy same-origin (staging VPS)](haproxy-same-origin.md) | Staging/QA en VPS con HAProxy y `compose.staging.yaml` |

Artefactos:

- `compose.staging.yaml`
- `frontend/Dockerfile` target `production` + `frontend/nginx.conf`
- `.env.staging.example` (contrato) → `.env.staging` o `.env.prod.nesistel` en el host
- `.env.production.example` (contrato de producción final)

## Por qué no dos dominios (por defecto)

El cliente SPA usa rutas **relativas** (`/auth`, `/api`, …) y cookies de
sesión. Un subdominio `api.*` obliga a CORS, `CORS_ORIGIN` y cuidado con
cookies; no aporta valor al MVP.

## Relación con el resto de docs

- Variables y secretos: [`../environment-files.md`](../environment-files.md)
- Compose de desarrollo (no usar tal cual en staging): [`../dockerizacion.md`](../dockerizacion.md)
- Checklist de entrega: [`../delivery-checklist.md`](../delivery-checklist.md)
