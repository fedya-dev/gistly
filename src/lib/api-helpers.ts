import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Gist, File as GistFile, Tag } from '@prisma/client'
import type { GistDetailDTO, GistSummaryDTO, Visibility } from '@/lib/gist'
import { detectLanguage } from '@/lib/languages'
import { isAdmin } from '@/lib/auth'

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function requireAdmin(): Promise<NextResponse | null> {
  if (!(await isAdmin())) {
    return jsonError('Unauthorized', 401)
  }
  return null
}

type GistFileSummary = Pick<GistFile, 'id' | 'filename' | 'language' | 'position'>
type GistWithRelations = Gist & { tags: Tag[]; files: GistFile[] }
type GistForSummary = Gist & { tags: Tag[]; files: GistFileSummary[] }

export function serializeSummary(gist: GistForSummary): GistSummaryDTO {
  const files = [...gist.files].sort((a, b) => a.position - b.position)
  return {
    id: gist.id,
    title: gist.title,
    description: gist.description,
    visibility: gist.visibility as Visibility,
    views: gist.views,
    tags: gist.tags.map((t) => t.name),
    createdAt: gist.createdAt.toISOString(),
    updatedAt: gist.updatedAt.toISOString(),
    fileCount: files.length,
    firstFilename: files[0]?.filename ?? 'snippet.txt',
    firstLanguage: files[0]?.language ?? 'text',
  }
}

export function serializeDetail(gist: GistWithRelations): GistDetailDTO {
  const files = [...gist.files]
    .sort((a, b) => a.position - b.position)
    .map((f) => ({
      id: f.id,
      filename: f.filename,
      content: f.content,
      language: f.language,
      position: f.position,
    }))
  return {
    ...serializeSummary(gist),
    secretToken: gist.secretToken,
    files,
  }
}

export interface IncomingFile {
  filename: string
  content: string
}

export const MAX_FILES = 20
export const MAX_FILE_CHARS = 400_000
export const MAX_TOTAL_CHARS = 1_200_000

export function validateGistPayload(body: unknown):
  | { ok: true; data: { title: string; description: string; visibility: Visibility; tags: string[]; files: IncomingFile[] } }
  | { ok: false; error: string } {
  const b = body as Record<string, unknown>
  const title = typeof b.title === 'string' ? b.title.trim() : ''
  if (!title || title.length > 160) return { ok: false, error: 'Invalid title' }

  const description = typeof b.description === 'string' ? b.description.trim().slice(0, 600) : ''
  const visibility = (['public', 'unlisted', 'secret'].includes(b.visibility as string)
    ? b.visibility
    : 'public') as Visibility

  const rawTags = Array.isArray(b.tags) ? b.tags : []
  const tags = rawTags
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => t.length >= 2 && t.length <= 24)
    .slice(0, 8)

  const rawFiles = Array.isArray(b.files) ? b.files : []
  const files: IncomingFile[] = []
  let total = 0
  for (const f of rawFiles) {
    const filename = typeof f?.filename === 'string' ? f.filename.trim().slice(0, 160) : ''
    const content = typeof f?.content === 'string' ? f.content : ''
    if (!filename || !content.trim()) continue
    total += content.length
    if (total > MAX_TOTAL_CHARS) return { ok: false, error: 'Too much content' }
    files.push({ filename, content: content.slice(0, MAX_FILE_CHARS) })
  }
  if (files.length === 0 || files.length > MAX_FILES) {
    return { ok: false, error: 'Provide 1-20 files with name and content' }
  }

  return { ok: true, data: { title, description, visibility, tags, files } }
}

export function buildFileData(files: IncomingFile[]) {
  return files.map((f, index) => ({
    id: crypto.randomUUID(),
    filename: f.filename,
    content: f.content,
    language: detectLanguage(f.filename).id,
    position: index,
  }))
}

/** Best-effort client IP behind the Caddy proxy. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'local'
}

/** Very small in-memory rate limiter (per IP). */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count += 1
  return true
}

export { db }
