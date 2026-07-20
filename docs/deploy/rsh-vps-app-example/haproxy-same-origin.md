# Staging VPS: HAProxy same-origin

Guía paso a paso para publicar TADOR en un VPS con Docker y HAProxy.
El navegador solo ve `https://tador.example.tel` (puerto 443). Fastify sigue
escuchando en el puerto **3000 dentro** de la red Docker; ese puerto no se
expone a Internet.

Hay **dos modos** según el HAProxy del host:

| Modo | Cuándo | Quién parte `/api` vs SPA |
|------|--------|---------------------------|
| **Modular Softwareholics** (este VPS) | `conf.d/` + `maps/local-hosts.map` (host → un backend; no editar `20-frontends.cfg`) | **nginx** del SPA (`frontend/nginx.conf`) |
| **Standalone** | HAProxy propio con ACLs de path | **HAProxy** ([`haproxy.cfg.example`](haproxy.cfg.example)) |

## Quick path (modular — recomendado en nesisstel)

1. DNS A/AAAA: `tador.nesis.tel` → IP pública del VPS.
2. En el VPS: `compose.staging.yaml` (Postgres privado + backend production + nginx SPA/gateway).
3. Env desde `.env` / `.env.staging` (`CORS_ORIGIN=https://tador.nesis.tel`).
4. Frontend en red externa `rsh-net-prod` (container_name `tador-stg-frontend`) + loopback `127.0.0.1:8080` para smoke.
5. HAProxy: línea en `maps/local-hosts.map` + backend en `conf.d/40-backends-local.cfg` → `tador-stg-frontend:80`.
6. Cert: `make cert-get DOMAIN=tador.nesis.tel EMAIL=…` en `/home/haproxy/haproxy`.
7. `prisma migrate deploy` one-shot + smoke (health, login, un apunte).

## Topología (modular)

```text
Browser
   │  HTTPS :443
   ▼
HAProxy (TLS + SNI + local-hosts.map)
   │
   └─ host tador.nesis.tel  →  tador-stg-frontend:80  (nginx)
                                    │
                    ┌───────────────┴───────────────┐
                    │ /api /auth /book /health      │ /*
                    ▼                               ▼
              backend:3000                    estáticos SPA
              (Compose network)               (nginx root)
                    │
               postgres (sin puerto público)
```

| Superficie | Público | Interno |
|------------|---------|---------|
| HAProxy | 80 (ACME), 443 | red `rsh-net-prod` |
| Backend Fastify | no | Compose + loopback `127.0.0.1:3000` (smoke) |
| SPA (nginx gateway) | no | `rsh-net-prod` + loopback `127.0.0.1:8080` |
| PostgreSQL | no | solo red Compose |
| Vite `:5173` | no en staging | solo desarrollo local |
| Prisma Studio `:5555` | no | no |

## Cómo habla el frontend con la API (dev vs staging)

El cliente en `frontend/src/lib/api.ts` usa `BASE = ''` y hace
`fetch('/auth/login')`, `fetch('/api/apuntes')`, etc. **No hardcodea el
puerto 3000.**

| Entorno | Quién resuelve `/api` y `/auth` |
|---------|----------------------------------|
| Local / Compose dev | El **proxy de Vite** (`vite.config.ts`) → `VITE_PROXY_TARGET` |
| Staging modular (este VPS) | **nginx** en el contenedor SPA → `backend:3000` |
| Staging standalone | **HAProxy** path ACLs → Fastify `:3000` |

El navegador siempre llama al **mismo origen** (`https://tador.nesis.tel/...`).
`CORS_ORIGIN` debe coincidir exacto con ese origen HTTPS; cookies `secure`
requieren `NODE_ENV=production`.

`VITE_PROXY_TARGET` **no** es una URL de API de producción: solo afecta al
servidor de desarrollo de Vite.

## Prerrequisitos en el VPS

- [ ] Docker Engine + Compose plugin
- [ ] HAProxy modular (`/home/haproxy/haproxy`) o standalone 2.x con TLS/SNI
- [ ] Red Docker `rsh-net-prod` (si modo modular)
- [ ] Firewall: solo SSH restringido + 80/443 públicos
- [ ] DNS: hostname apunta al VPS
- [ ] Certificado TLS (Let's Encrypt vía `make cert-get` en el stack HAProxy)

---

## Paso 1 — DNS y TLS (modular)

1. Registro DNS del hostname hacia la IP del VPS.
2. Desde `/home/haproxy/haproxy` (usuario `haproxy`):

```bash
make cert-get DOMAIN=tador.nesis.tel EMAIL=admin@softwareholics.com
make validate && make reload
```

PEM resultante: `certs/tador.nesis.tel.pem` (HAProxy carga el directorio
`/etc/haproxy/certs/` con SNI).

---

## Paso 2 — Usar `compose.staging.yaml`

| Manifiesto | Uso |
|------------|-----|
| `compose.yaml` | Laptop: Vite, bind mounts, Postgres publicado, Studio |
| `compose.staging.yaml` | VPS staging: imágenes `production`, Postgres privado, nginx gateway, red `rsh-net-prod` |

```bash
# En este VPS el contrato vive en `.env` (instancia de `.env.staging.example`)
docker compose --env-file .env -f compose.staging.yaml up -d --build

docker compose --env-file .env -f compose.staging.yaml run --rm backend \
  npx prisma migrate deploy
```

Smoke interno (loopback) antes del dominio:

```bash
curl -sS http://127.0.0.1:3000/health
curl -sS http://127.0.0.1:8080/health          # vía nginx → Fastify
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/
```

---

## Paso 3 — HAProxy modular (sin tocar `20-frontends.cfg`)

En `/home/haproxy/haproxy`:

**`maps/local-hosts.map`** (TAB entre host y backend):

```text
tador.nesis.tel backend-tador-app
```

**`conf.d/40-backends-local.cfg`:**

```text
backend backend-tador-app
    balance roundrobin
    option forwardfor
    option httpchk GET /
    http-check expect status 200
    server tador-web tador-stg-frontend:80 resolvers docker init-addr last,libc,none check
```

Luego:

```bash
make validate && make reload
docker exec haproxy getent hosts tador-stg-frontend
```

No uses `edge-paths-*.map` para `/api`: esos mapas son globales a todos los hosts.

---

## Paso 4 — HAProxy standalone (otros VPS)

Si el host no usa la capa modular map-based, adapta
[`haproxy.cfg.example`](haproxy.cfg.example): ACLs `host_tador` +
`path_beg /api /auth /book /health` hacia dos backends loopback.
En ese caso nginx puede seguir haciendo de gateway o puedes apuntar la API
directo a `:3000` desde HAProxy.

---

## Paso 5 — Checklist de aceptación

- [ ] `https://tador.nesis.tel/health` responde OK
- [ ] La SPA carga por HTTPS
- [ ] Registro / login / logout con cookie de sesión
- [ ] Crear un apunte y ver dashboard
- [ ] `127.0.0.1:3000` / `:8080` solo en loopback; Postgres TADOR sin puerto host
- [ ] `ENABLE_PLANTILLAS_ADMIN=false`
- [ ] `REQUIRE_EMAIL_VERIFICATION=false` mientras el email sea stub
- [ ] Backup de Postgres documentado

---

## Errores frecuentes

| Síntoma | Causa probable |
|---------|----------------|
| Login OK en local, cookie no en staging | `NODE_ENV` ≠ `production` o sitio por HTTP |
| CORS / credenciales fallan | `CORS_ORIGIN` ≠ `https://tador.nesis.tel` |
| SPA carga pero `/api` 502 | Backend caído o nginx no alcanza `backend:3000` |
| `/api` sirve `index.html` | Falta location de proxy en `nginx.conf` (modo modular) |
| HAProxy 503 NOSRV | Frontend no está en `rsh-net-prod` o nombre distinto de `tador-stg-frontend` |
| Vite en producción | Estás usando el Compose de desarrollo |

## Fuera de alcance de esta guía

- Email real y `REQUIRE_EMAIL_VERIFICATION=true`.
- Alta disponibilidad multi-nodo.
- `compose.production.yaml` separado (hoy staging Compose + env de sitio basta).
