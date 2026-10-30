# ---------- deps ----------
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------- builder ----------
FROM deps AS builder
WORKDIR /app

COPY . .
RUN bunx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db
# Produces .next/standalone (+ copies ./public and .next/static into it)
RUN bun run build

# ---------- runner ----------
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/app/db/gistly.db

# Standalone Next.js server (server.js + trimmed node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma CLI + engines so the entrypoint can run `prisma db push`
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh && mkdir -p /app/db

VOLUME ["/app/db"]
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
