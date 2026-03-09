# Build stage: install deps and build Next.js (native better-sqlite3 needs build tools)
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Disable TLS cert verification during build (e.g. corporate proxy / clock skew)
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Install build deps for better-sqlite3 + ca-certificates so npm can fetch over HTTPS
RUN apt-get -o Acquire::Max-FutureTime=86400 update -y \
  && apt-get install -y ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY . .

# Install deps in-container (avoid host node_modules on Windows).
# Give Node more memory so npm doesn't get killed during native build (e.g. better-sqlite3).
# Use npm install; npm ci can crash with "Exit handler never called" in some Docker setups.
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN rm -rf node_modules \
  && npm install \
  && test -f node_modules/next/dist/bin/next || (echo "next not installed" && exit 1)

# Build (next is installed above)
RUN node node_modules/next/dist/bin/next build

# Production stage: run the standalone server
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Optional: create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy standalone output (includes traced deps and better-sqlite3 native binary)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# DATABASE_URL can be set at runtime (e.g. file path or URL for SQLite)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
