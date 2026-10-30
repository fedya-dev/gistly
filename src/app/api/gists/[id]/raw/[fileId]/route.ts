import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/auth'
import { jsonError } from '@/lib/api-helpers'

type RouteParams = { params: Promise<{ id: string; fileId: string }> }

// GET /api/gists/:id/raw/:fileId?t=token — raw file content (?dl=1 to download).
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id, fileId } = await params
  const gist = await db.gist.findUnique({
    where: { id },
    include: { files: true },
  })
  if (!gist) return jsonError('Gist not found', 404)

  if (!(await isAdmin()) && gist.visibility === 'secret') {
    const token = new URL(req.url).searchParams.get('t') ?? ''
    if (!gist.secretToken || token !== gist.secretToken) {
      return jsonError('Gist not found', 404)
    }
  }

  const file = gist.files.find((f) => f.id === fileId)
  if (!file) return jsonError('File not found', 404)

  const download = new URL(req.url).searchParams.get('dl') === '1'
  const safeName = (file.filename.split(/[\\/]/).pop() || 'snippet.txt').replace(/["\r\n]/g, '')

  return new Response(file.content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      ...(download
        ? { 'Content-Disposition': `attachment; filename="${safeName}"` }
        : {}),
    },
  })
}
