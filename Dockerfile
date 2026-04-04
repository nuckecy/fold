FROM node:22-alpine AS base

WORKDIR /app

# Install ALL dependencies (including devDependencies needed for build)
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Copy source and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base /app/public ./public
COPY --from=base --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy drizzle files for DB migration at startup
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=base /app/src/db ./src/db
COPY --from=base /app/node_modules ./node_modules

# Startup script: push schema then start server
COPY --from=base /app/start.sh ./start.sh
RUN chmod +x start.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "./start.sh"]
