import type {
  GistDetailDTO,
  GistSummaryDTO,
  Visibility,
} from '@/lib/gist'

export interface GistPayload {
  title: string
  description: string
  visibility: Visibility
  tags: string[]
  files: { filename: string; content: string }[]
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data as { error?: string }).error ?? `Request failed (${res.status})`
    const err = new Error(message) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return data as T
}

export function fetchSession() {
  return request<{ isAdmin: boolean }>('/api/auth/session', { cache: 'no-store' })
}

export function loginRequest(password: string) {
  return request<{ ok: true }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export function logoutRequest() {
  return request<{ ok: true }>('/api/auth/logout', { method: 'POST' })
}

export interface GistListResult {
  gists: GistSummaryDTO[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}

export function listGists(params: { q?: string; tag?: string; page?: number }) {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.tag) sp.set('tag', params.tag)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return request<GistListResult>(`/api/gists${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  })
}

export function listTags() {
  return request<{ tags: { name: string; count: number }[] }>('/api/tags', {
    cache: 'no-store',
  })
}

export function fetchGist(id: string, token?: string) {
  const sp = new URLSearchParams()
  if (token) sp.set('t', token)
  const qs = sp.toString()
  return request<{ gist: GistDetailDTO }>(`/api/gists/${id}${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  })
}

export function createGist(payload: GistPayload) {
  return request<{ gist: GistDetailDTO }>('/api/gists', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateGist(id: string, payload: GistPayload) {
  return request<{ gist: GistDetailDTO }>(`/api/gists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteGist(id: string) {
  return request<{ ok: true }>(`/api/gists/${id}`, { method: 'DELETE' })
}

export function rawFileUrl(gistId: string, fileId: string, opts?: { token?: string; download?: boolean }) {
  const sp = new URLSearchParams()
  if (opts?.token) sp.set('t', opts.token)
  if (opts?.download) sp.set('dl', '1')
  const qs = sp.toString()
  return `/api/gists/${gistId}/raw/${fileId}${qs ? `?${qs}` : ''}`
}
