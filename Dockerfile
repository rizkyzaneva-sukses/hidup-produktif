FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# DATABASE_URL is needed for prisma generate in postinstall
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN npm run build

# Dedicated stage: install production deps (for prisma CLI runtime)
FROM base AS prod-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN npm ci --omit=dev

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Copy ALL production node_modules so prisma CLI has every transitive dep it needs
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy entrypoint script
COPY entrypoint.sh ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "entrypoint.sh"]
