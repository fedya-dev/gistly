/**
 * Seeds a few demo gists so the app doesn't look empty on first run.
 * Run with: bun scripts/seed.mts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const demo = [
  {
    id: 'demo-ts-api',
    title: 'Next.js route handler with Zod validation',
    description:
      'A typed POST endpoint that validates the body with Zod before touching the database.',
    visibility: 'public',
    secretToken: '',
    tags: ['nextjs', 'typescript', 'zod'],
    files: [
      {
        filename: 'route.ts',
        language: 'typescript',
        content: `import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const CreateTask = z.object({
  title: z.string().min(1).max(120),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.coerce.date().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = CreateTask.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const task = await db.task.create({ data: parsed.data });
  return NextResponse.json({ task }, { status: 201 });
}
`,
      },
    ],
  },
  {
    id: 'demo-sql-window',
    title: 'SQL window functions cheat sheet',
    description: 'Running totals, rankings and gaps — the four window patterns I use weekly.',
    visibility: 'public',
    secretToken: '',
    tags: ['sql', 'postgres', 'analytics'],
    files: [
      {
        filename: 'window-functions.sql',
        language: 'sql',
        content: `-- 1. Running total of daily revenue
SELECT
  day,
  revenue,
  SUM(revenue) OVER (ORDER BY day) AS running_total
FROM daily_revenue;

-- 2. Top 3 products per category
SELECT * FROM (
  SELECT
    category,
    product,
    units,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY units DESC) AS rank
  FROM product_sales
) ranked
WHERE rank <= 3;

-- 3. Month-over-month change with LAG
SELECT
  month,
  revenue,
  LAG(revenue) OVER (ORDER BY month) AS prev_month,
  ROUND(
    100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
    / LAG(revenue) OVER (ORDER BY month),
    1
  ) AS pct_change
FROM monthly_revenue;

-- 4. Find gaps between user actions
SELECT
  user_id,
  action,
  created_at,
  created_at - LAG(created_at) OVER (
    PARTITION BY user_id ORDER BY created_at
  ) AS gap_from_previous
FROM events
WHERE user_id = 42;
`,
      },
    ],
  },
  {
    id: 'demo-md-readme',
    title: 'README template for side projects',
    description: 'The minimal README structure that makes small projects look professional.',
    visibility: 'public',
    secretToken: '',
    tags: ['readme', 'template'],
    files: [
      {
        filename: 'README.md',
        language: 'markdown',
        content: `# Project Name

> One-sentence pitch — what it does and for whom.

![status](https://img.shields.io/badge/status-beta-orange)

## Features

- **Fast** — starts in milliseconds, no config needed
- **Self-hosted** — your data never leaves your server
- **Simple** — one container, one database file

## Quick start

\`\`\`bash
docker compose up -d
\`\`\`

Open **http://localhost:3000** and you are done.

## Configuration

| Variable        | Default | Description                   |
| --------------- | ------- | ----------------------------- |
| \`PORT\`          | \`3000\`  | HTTP port                     |
| \`ADMIN_PASSWORD\` | —       | Password for the admin area   |

## License

MIT
`,
      },
    ],
  },
  {
    id: 'demo-dockerfile',
    title: 'Dockerfile: Bun + Next.js standalone',
    description: 'Multi-stage build kept unlisted — share it only with people who have the link.',
    visibility: 'unlisted',
    secretToken: '',
    tags: ['docker', 'bun', 'deploy'],
    files: [
      {
        filename: 'Dockerfile',
        language: 'dockerfile',
        content: `FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN bun run build

FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["bun", "server.js"]
`,
      },
    ],
  },
  {
    id: 'demo-secret-env',
    title: 'Server environment presets (private)',
    description: 'Production values I keep between environments. Opened only with the secret link.',
    visibility: 'secret',
    secretToken: 'k9demo-token42',
    tags: ['config', 'server'],
    files: [
      {
        filename: '.env.production',
        language: 'ini',
        content: `# Shared production presets
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# App
ADMIN_PASSWORD=<set-your-own>
AUTH_SECRET=<openssl rand -hex 32>

# Database (SQLite volume)
DATABASE_URL=file:/app/db/gistly.db
`,
      },
    ],
  },
]

for (const gist of demo) {
  await db.gist.upsert({
    where: { id: gist.id },
    update: {},
    create: {
      id: gist.id,
      title: gist.title,
      description: gist.description,
      visibility: gist.visibility,
      secretToken: gist.secretToken,
      tags: { create: gist.tags.map((name) => ({ name })) },
      files: {
        create: gist.files.map((f, i) => ({
          id: `${gist.id}-file-${i}`,
          filename: f.filename,
          content: f.content,
          language: f.language,
          position: i,
        })),
      },
    },
  })
}

const count = await db.gist.count()
console.log(`Seeded. Gists in database: ${count}`)
await db.$disconnect()
