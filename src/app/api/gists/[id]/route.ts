import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/auth'
import {
  buildFileData,
  jsonError,
  serializeDetail,
  validateGistPayload,
} from '@/lib/api-helpers'

type RouteParams = { params: Promise<{ id: string }> }

async function loadGist(id: string) {
  return db.gist.findUnique({
    where: { id },
    include: { tags: true, files: true },
  })
}

// GET /api/gists/:id?t=token — public/unlisted for everyone, secret needs the token (or admin).
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const gist = await loadGist(id)
  if (!gist) return jsonError('Gist not found', 404)

  const admin = await isAdmin()
  if (!admin) {
    if (gist.visibility === 'secret') {
      const token = new URL(req.url).searchParams.get('t') ?? ''
      if (!gist.secretToken || token !== gist.secretToken) {
        return jsonError('Gist not found', 404)
      }
    } else if (gist.visibility === 'unlisted') {
      // reachable by link, but hidden from lists — nothing extra to check
    }
  }

  // Count the visit asynchronously (skip for the admin)
  if (!admin) {
    db.gist
      .update({ where: { id }, data: { views: { increment: 1 } } })
      .catch(() => undefined)
  }

  const detail = serializeDetail(gist)
  if (!admin) {
    detail.secretToken = ''
  }
  return NextResponse.json({ gist: detail })
}

// PATCH /api/gists/:id — update (admin only).
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin())) return jsonError('Unauthorized', 401)
  const { id } = await params
  const existing = await loadGist(id)
  if (!existing) return jsonError('Gist not found', 404)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('Invalid JSON', 400)
  }

  const parsed = validateGistPayload(body)
  if (!parsed.ok) return jsonError(parsed.error, 400)

  const visibility =
    parsed.data.visibility === 'secret' && !existing.secretToken
      ? { visibility: 'secret', secretToken: crypto.randomUUID().replaceAll('-', '') }
      : { visibility: parsed.data.visibility }

  const gist = await db.gist.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      ...visibility,
      tags: {
        deleteMany: {},
        create: parsed.data.tags.map((name) => ({ name })),
      },
      files: {
        deleteMany: {},
        create: buildFileData(parsed.data.files),
      },
    },
    include: { tags: true, files: true },
  })

  return NextResponse.json({ gist: serializeDetail(gist) })
}

// DELETE /api/gists/:id — remove (admin only).
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin())) return jsonError('Unauthorized', 401)
  const { id } = await params
  const existing = await db.gist.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return jsonError('Gist not found', 404)

  await db.gist.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
