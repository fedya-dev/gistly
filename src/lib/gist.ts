export type Visibility = 'public' | 'unlisted' | 'secret'

export const VISIBILITIES: Visibility[] = ['public', 'unlisted', 'secret']

export interface GistFileDTO {
  id: string
  filename: string
  content: string
  language: string
  position: number
}

export interface GistSummaryDTO {
  id: string
  title: string
  description: string
  visibility: Visibility
  views: number
  tags: string[]
  createdAt: string
  updatedAt: string
  fileCount: number
  firstFilename: string
  firstLanguage: string
}

export interface GistDetailDTO extends GistSummaryDTO {
  secretToken: string
  files: GistFileDTO[]
}

export function buildGistUrl(gist: { id: string; visibility?: string; secretToken?: string }): string {
  if (
    gist.visibility === 'secret' &&
    gist.secretToken
  ) {
    return `${location.origin}/?g=${gist.id}&t=${gist.secretToken}`
  }
  return `${location.origin}/?g=${gist.id}`
}

export function parseTags(input: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input.split(/[,\s]+/)) {
    const tag = raw.trim().toLowerCase().replace(/^#/, '').replace(/[^a-zа-я0-9._-]/gi, '')
    if (tag.length < 2 || tag.length > 24 || seen.has(tag)) continue
    seen.add(tag)
    out.push(tag)
    if (out.length >= 8) break
  }
  return out
}
