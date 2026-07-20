# ─── Development ───────────────────────────────────────────────────
# Source is bind-mounted via compose; this image provides Node + deps.
FROM node:22-alpine AS development

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate && npm run dev"]

# ─── Build ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma/ ./prisma/
COPY src/ ./src/

RUN npx prisma generate
RUN npx tsc

# ─── Production ────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 appuser

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
