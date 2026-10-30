import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/auth'

// GET /api/tags — most used tags with counts (public gists only for guests).
export async function GET() {
  const admin = await isAdmin()

  const rows = await db.tag.groupBy({
    by: ['name'],
    where: admin ? {} : { gist: { visibility: 'public' } },
    _count: { name: true },
    orderBy: { _count: { name: 'desc' } },
    take: 14,
  })

  return NextResponse.json({
    tags: rows.map((row) => ({ name: row.name, count: row._count.name })),
  })
}
