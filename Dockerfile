# syntax=docker/dockerfile:1

# Base image — pinned to Node 22 LTS on Alpine
FROM node:22-alpine AS base

# ---------- deps: install all dependencies ----------
FROM base AS deps
# libc6-compat: some native deps (e.g. Prisma engines) expect glibc symbols
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma
RUN npm ci

# ---------- builder: generate Prisma client + build Next ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN ./node_modules/.bin/prisma generate
RUN npm run build

# ---------- runner: minimal standalone runtime ----------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as a non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
