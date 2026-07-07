# ─── TADOR Frontend — development ─────────────────────────────────
# Source code is mounted as a bind volume; this image only provides
# the Node.js runtime and pre-installed dependencies.

FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Dev server (source is mounted via compose volume)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
