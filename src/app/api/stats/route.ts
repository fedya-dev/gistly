import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/auth'
import { clientIp, rateLimit } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const ACTIVITY_DAYS = 182 // ~26 weeks
const TOP_TAGS = 10
const TOP_LANGUAGES = 8

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// GET /api/stats — aggregated insights. Guests only see public gists,
// the admin sees everything.
export async function GET(req: NextRequest) {
  const ip = clientIp(req)
  if (!rateLimit(`stats:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const admin = await isAdmin()
  const where: Prisma.GistWhereInput = admin ? {} : { visibility: 'public' }
  const since = new Date(Date.now() - (ACTIVITY_DAYS - 1) * 24 * 60 * 60 * 1000)
  since.setUTCHours(0, 0, 0, 0)

  const [gistCount, fileCount, viewsAgg, visibilityGroup, tagGroup, languageGroup, recentGists, mostViewed, latest, linesRow] =
    await Promise.all([
      db.gist.count({ where }),
      db.file.count({ where: { gist: where } }),
      db.gist.aggregate({ where, _sum: { views: true } }),
      db.gist.groupBy({ by: ['visibility'], where, _count: { _all: true } }),
      db.tag.groupBy({
        by: ['name'],
        where: { gist: where },
        _count: { name: true },
        orderBy: { _count: { name: 'desc' } },
        take: TOP_TAGS,
      }),
      db.file.groupBy({
        by: ['language'],
        where: { gist: where },
        _count: { language: true },
        orderBy: { _count: { language: 'desc' } },
        take: TOP_LANGUAGES,
      }),
      db.gist.findMany({
        where: { ...where, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      db.gist.findFirst({
        where: { ...where, views: { gt: 0 } },
        orderBy: { views: 'desc' },
        select: { id: true, title: true, views: true },
      }),
      db.gist.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, createdAt: true },
      }),
      // Count newlines across all file contents directly in SQLite.
      db.$queryRaw<{ lines: number | null }[]>`
        SELECT SUM(LENGTH(content) - LENGTH(REPLACE(content, CHAR(10), '')) + 1) AS lines
        FROM File
        WHERE gistId IN (SELECT id FROM Gist WHERE ${admin ? Prisma.empty : Prisma.sql`visibility = 'public'`})
      `,
    ])

  // Contiguous daily buckets, aligned so every week starts on Sunday.
  const counts = new Map<string, number>()
  for (const g of recentGists) {
    const key = dayKey(g.createdAt)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const start = new Date(since)
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()) // back to Sunday

  const activity: { date: string; count: number }[] = []
  for (let d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = dayKey(d)
    activity.push({ date: key, count: counts.get(key) ?? 0 })
  }

  const totalLines = Number(linesRow[0]?.lines ?? 0)

  return NextResponse.json({
    totals: {
      gists: gistCount,
      files: fileCount,
      lines: totalLines,
      views: viewsAgg._sum.views ?? 0,
    },
    visibility: Object.fromEntries(visibilityGroup.map((g) => [g.visibility, g._count._all])),
    tags: tagGroup.map((t) => ({ name: t.name, count: t._count.name })),
    languages: languageGroup.map((l) => ({ id: l.language, count: l._count.language })),
    activity,
    mostViewed,
    latest: latest
      ? { id: latest.id, title: latest.title, createdAt: latest.createdAt.toISOString() }
      : null,
  })
}
