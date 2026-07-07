# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma/ ./prisma/
COPY src/ ./src/

RUN npx prisma generate
RUN npx tsc

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 appuser

COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts

COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
