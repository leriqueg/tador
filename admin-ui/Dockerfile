# ─── TADOR Admin UI — development ─────────────────────────────────
# Source is mounted as a bind volume; this image provides Node + deps.

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
