import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/auth'
import { generateId, generateToken } from '@/lib/ids'
import {
  buildFileData,
  jsonError,
  rateLimit,
  requireAdmin,
  serializeDetail,
  serializeSummary,
  validateGistPayload,
} from '@/lib/api-helpers'

const PER_PAGE = 12

// GET /api/gists?q=&tag=&page= — public gists for everyone, all gists for the admin.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim().slice(0, 100)
  const tag = (searchParams.get('tag') ?? '').trim().toLowerCase().slice(0, 24)
  const page = Math.min(500, Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1))

  const admin = await isAdmin()
  const where: Prisma.GistWhereInput = {}
  if (!admin) {
    where.visibility = 'public'
  }
  if (tag) {
    where.tags = { some: { name: tag } }
  }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { tags: { some: { name: { contains: q } } } },
      { files: { some: { filename: { contains: q } } } },
      { files: { some: { content: { contains: q } } } },
    ]
  }

  const [total, gists] = await Promise.all([
    db.gist.count({ where }),
    db.gist.findMany({
      where,
      include: {
        tags: true,
        files: { select: { id: true, filename: true, language: true, position: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
    }),
  ])

  return NextResponse.json({
    gists: gists.map(serializeSummary),
    total,
    page,
    perPage: PER_PAGE,
    hasMore: page * PER_PAGE < total,
  })
}

// POST /api/gists — create (admin only).
export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  const ip = (req.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim()
  if (!rateLimit(`create:${ip}`, 30, 60 * 1000)) {
    return jsonError('Too many requests', 429)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('Invalid JSON', 400)
  }

  const parsed = validateGistPayload(body)
  if (!parsed.ok) return jsonError(parsed.error, 400)

  const id = generateId(10)
  const gist = await db.gist.create({
    data: {
      id,
      title: parsed.data.title,
      description: parsed.data.description,
      visibility: parsed.data.visibility,
      secretToken: parsed.data.visibility === 'secret' ? generateToken() : '',
      tags: { create: parsed.data.tags.map((name) => ({ name })) },
      files: { create: buildFileData(parsed.data.files) },
    },
    include: { tags: true, files: true },
  })

  return NextResponse.json({ gist: serializeDetail(gist) }, { status: 201 })
}
