# Staging VPS: HAProxy same-origin

Guía paso a paso para publicar TADOR en un VPS con Docker y HAProxy.
El navegador solo ve `https://tador.example.tel` (puerto 443). Fastify sigue
escuchando en el puerto **3000 dentro** de la red Docker; ese puerto no se
expone a Internet.

## Quick path

1. DNS A/AAAA: `tador.example.tel` → IP pública del VPS.
2. En el VPS: `compose.staging.yaml` (Postgres privado + backend production + nginx SPA).
3. Env desde `.env.staging.example` (o un archivo de sitio como `.env.prod.nesistel`).
4. Publicar backend/web **solo en loopback** (`127.0.0.1:3000` y `127.0.0.1:8080`).
5. HAProxy termina TLS y enruta por path: `/api`, `/auth`, `/book`, `/health` → backend; resto → SPA.
6. `prisma migrate deploy` one-shot + smoke (health, login, un apunte).

## Topología

```text
Browser
   │  HTTPS :443
   ▼
HAProxy (TLS + SNI: tador.example.tel)
   │
   ├─ path /api /auth /book /health  →  127.0.0.1:3000  (Fastify)
   └─ path /*                        →  127.0.0.1:8080  (nginx / estáticos)
                                              │
                                         Docker network
                                              │
                                         postgres (sin puerto público)
```

| Superficie | Público | Interno |
|------------|---------|---------|
| HAProxy | 80 (redirect), 443 | — |
| Backend Fastify | no | `127.0.0.1:3000` o red Docker |
| SPA (nginx) | no | `127.0.0.1:8080` |
| PostgreSQL | no | solo red Compose |
| Vite `:5173` | no en staging | solo desarrollo local |
| Prisma Studio `:5555` | no | no |

## Cómo habla el frontend con la API (dev vs staging)

El cliente en `frontend/src/lib/api.ts` usa `BASE = ''` y hace
`fetch('/auth/login')`, `fetch('/api/apuntes')`, etc. **No hardcodea el
puerto 3000.**

| Entorno | Quién resuelve `/api` y `/auth` |
|---------|----------------------------------|
| Local / Compose dev | El **proxy de Vite** (`vite.config.ts`) reenvía a `VITE_PROXY_TARGET` (p. ej. `http://backend:3000`) |
| Staging / prod | **HAProxy** en `:443` reenvía esos paths al contenedor Fastify en `:3000` |

El navegador siempre llama al **mismo origen** (`https://tador.example.tel/...`).
El salto a `:3000` ocurre solo en el servidor (proxy → contenedor). Por eso
`CORS_ORIGIN` debe ser exactamente el origen público HTTPS, y las cookies
`secure` funcionan con `NODE_ENV=production`.

`VITE_PROXY_TARGET` **no** es una URL de API de producción: solo afecta al
servidor de desarrollo de Vite. El build estático no la necesita.

## Prerrequisitos en el VPS

- [ ] Docker Engine + Compose plugin
- [ ] HAProxy 2.x (o el stack de proxy del host) con soporte TLS/SNI
- [ ] Firewall: solo SSH restringido + 80/443 públicos
- [ ] DNS: `tador.example.tel` apunta al VPS
- [ ] Certificado TLS (Let's Encrypt u otro) para ese hostname

Sustituye `tador.example.tel` por tu dominio real en todos los ejemplos.

---

## Paso 1 — DNS y TLS

1. Crea el registro DNS del hostname hacia la IP del VPS.
2. Emite el certificado (ej. `certbot certonly --standalone` o el flujo que
   ya use tu HAProxy).
3. Rutas típicas de PEM (ajusta a tu host):

```text
/etc/haproxy/certs/tador.example.tel.pem   # fullchain + key concatenados
```

HAProxy suele esperar un único `.pem` (certificado + intermediarios + clave).

---

## Paso 2 — Usar `compose.staging.yaml` (no el Compose de desarrollo)

| Manifiesto | Uso |
|------------|-----|
| `compose.yaml` | Laptop: Vite, bind mounts, Postgres publicado, Studio |
| `compose.staging.yaml` | VPS staging: imágenes `production`, Postgres sin puerto público, loopback para HAProxy |

Artefactos Docker de staging:

- Backend: `backend/Dockerfile` target `production`
- Frontend: `frontend/Dockerfile` target `production` (nginx + `frontend/nginx.conf`)
- Env: [`.env.staging.example`](../../.env.staging.example) → `.env.staging` en el host
  (o `.env.prod.nesistel` para la red nesisstel)

```bash
cp .env.staging.example .env.staging
# reemplazar REPLACE_* ; CORS_ORIGIN=https://tador.example.tel
```

Notas:

- `NODE_ENV` debe ser exactamente `production`.
- DB `tador_staging` ≠ `tador_dev` / `tador_test`.
- No copies el `.env` de tu laptop.
- Puertos host ya van a `127.0.0.1` en el Compose de staging.

---

## Paso 3 — Build y migraciones

En el VPS, desde el checkout de la rama de staging:

```bash
ENV_FILE=.env.staging   # o .env.prod.nesistel

docker compose --env-file "$ENV_FILE" -f compose.staging.yaml up -d --build

docker compose --env-file "$ENV_FILE" -f compose.staging.yaml run --rm backend \
  npx prisma migrate deploy

# Optional demo seed (catalog + test20260719). Requires non-production NODE_ENV
# inside the one-shot; see compose.staging.seed.yaml.
# docker compose --env-file "$ENV_FILE" \
#   -f compose.staging.yaml -f compose.staging.seed.yaml \
#   run --rm seed sh -c \
#   'npm ci && npx prisma generate && npm run seed:catalogos && npm run migrate:test20260719'
```

Smoke interno antes de abrir el dominio:

```bash
curl -sS http://127.0.0.1:3000/health
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/
```

---

## Paso 4 — HAProxy: path routing same-origin

Ejemplo mínimo (ajusta sockets, certificados y nombres). Una copia
anotada está en [`haproxy.cfg.example`](haproxy.cfg.example).

Ideas clave:

```text
acl host_tador hdr(host) -i tador.example.tel
acl is_api path_beg /api /auth /book /health

use_backend be_tador_api if host_tador is_api
use_backend be_tador_web if host_tador
```

Backends:

```text
backend be_tador_api
  server tador_api 127.0.0.1:3000 check

backend be_tador_web
  server tador_web 127.0.0.1:8080 check
```

Recomendado en el frontend HTTP de HAProxy:

- redirect 80 → 443
- `http-request set-header X-Forwarded-Proto https`
- `option forwardfor`
- timeouts razonables para API

Tras `systemctl reload haproxy` (o el equivalente):

```bash
curl -sS https://tador.example.tel/health
curl -sS -o /dev/null -w '%{http_code}\n' https://tador.example.tel/
```

---

## Paso 5 — Checklist de aceptación

- [ ] `https://tador.example.tel/health` responde OK
- [ ] La SPA carga por HTTPS (sin mezclar contenido HTTP)
- [ ] Registro / login / logout con cookie de sesión
- [ ] Crear un apunte y ver dashboard
- [ ] `ss -tlnp` / firewall: **no** hay 5432, 3000, 5173, 5555 abiertos al mundo
- [ ] `ENABLE_PLANTILLAS_ADMIN=false`
- [ ] `REQUIRE_EMAIL_VERIFICATION=false` mientras el email sea stub
- [ ] Backup de Postgres documentado (aunque sea `pg_dump` + restore de prueba)

---

## Errores frecuentes

| Síntoma | Causa probable |
|---------|----------------|
| Login OK en local, cookie no en staging | `NODE_ENV` ≠ `production` o sitio servido por HTTP |
| CORS / credenciales fallan | `CORS_ORIGIN` no coincide exacto con `https://tador.example.tel` |
| SPA carga pero `/api` 502 | Backend caído o HAProxy apunta mal al puerto |
| `/api` sirve `index.html` | Regla de path mal ordenada; el backend web atrapa la API |
| Vite en producción | Estás usando el Compose de desarrollo; cambia a build estático |

## Fuera de alcance de esta guía

- Email real y `REQUIRE_EMAIL_VERIFICATION=true`.
- Alta disponibilidad multi-nodo.
- `compose.production.yaml` separado (hoy staging Compose + `.env.production` basta).

## Next step

Configurar HAProxy con [`haproxy.cfg.example`](haproxy.cfg.example) y completar
el checklist de aceptación.
