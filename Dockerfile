FROM node:20-bookworm-slim AS base

WORKDIR /app

# Install build tools for native modules like better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM deps AS build

WORKDIR /app

COPY . .

RUN mkdir -p public

ENV NODE_ENV=production

RUN npm run build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Directory for SQLite volume
RUN mkdir -p /data

COPY data/local.db /data/local.db

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

