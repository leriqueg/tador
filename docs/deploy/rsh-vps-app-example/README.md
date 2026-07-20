# Deploy — guías de despliegue en la red RSH

**Fecha:** 2026-07-20

Modalidades documentadas para sacar TADOR de desarrollo local a un VPS
público detrás de un reverse proxy.

## Modalidad recomendada (MVP staging)

**Same-origin detrás de HAProxy:** un solo dominio HTTPS; el navegador habla
solo con `:443`.

En el VPS Softwareholics (HAProxy modular: host → un backend), el path split
`/api|/auth|/book|/health` lo hace **nginx** del SPA; HAProxy solo termina TLS
y enruta por hostname (`local-hosts.map`). En HAProxy standalone, el split
puede vivir en ACLs de path ([`haproxy.cfg.example`](haproxy.cfg.example)).

| Guía | Cuándo usarla |
|------|----------------|
| [HAProxy same-origin (staging VPS)](haproxy-same-origin.md) | Staging/QA en VPS con HAProxy y `compose.staging.yaml` |

Artefactos:

- `compose.staging.yaml` (red externa `rsh-net-prod` para el frontend)
- `frontend/Dockerfile` target `production` + `frontend/nginx.conf` (path gateway)
- `.env.staging.example` (contrato) → `.env` / `.env.staging` / `.env.prod.nesistel` en el host
- `.env.production.example` (contrato de producción final)

## Por qué no dos dominios (por defecto)

El cliente SPA usa rutas **relativas** (`/auth`, `/api`, …) y cookies de
sesión. Un subdominio `api.*` obliga a CORS, `CORS_ORIGIN` y cuidado con
cookies; no aporta valor al MVP.

## Relación con el resto de docs

- Variables y secretos: [`../../environment-files.md`](../environment-files.md)
- Compose de desarrollo (no usar tal cual en staging): [`../../dockerizacion.md`](../dockerizacion.md)
- Checklist de entrega: [`../../delivery-checklist.md`](../delivery-checklist.md)
