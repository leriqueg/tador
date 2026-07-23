# ─── TADOR Admin UI ─────────────────────────────────────────────────
# Dev (compose.yaml): default stage
# Staging/prod: --target production (static nginx under /admin-ui/)

# ─── Development ────────────────────────────────────────────────────
FROM node:22-alpine AS development

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ─── Build SPA (public base /admin-ui/) ─────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html ./
COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src

ARG VITE_BASE_PATH=/admin-ui/
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN npm run build

# ─── Production: nginx serves dist under /admin-ui/ ─────────────────
FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html/admin-ui

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/admin-ui/ || exit 1
