# ---------- Base Image ----------
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# ---------- Dependencies (only PROD deps) ----------
FROM base AS deps
RUN pnpm install --prod --frozen-lockfile

# ---------- Build ----------
FROM base AS build
COPY . .
# Install ALL deps for building (including devDependencies for nest CLI)
RUN pnpm install --frozen-lockfile
RUN pnpm build
# Verify the build succeeded
RUN ls -la dist/ && test -f dist/main.js

# ---------- Production Image ----------
FROM node:20-slim AS production

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

RUN addgroup --system nodejs && adduser --system nestjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/harmonics.json ./harmonics.json
COPY package.json ./

USER nestjs
EXPOSE 3003
CMD ["node", "dist/main.js"]
