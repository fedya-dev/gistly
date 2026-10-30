import { createHmac, timingSafeEqual, createHash } from 'crypto'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'gistly_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin'
}

function getSecret(): string {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) {
    return process.env.AUTH_SECRET
  }
  // Stable fallback derived from the admin password, so sessions survive restarts
  return createHash('sha256')
    .update(`gistly:${getAdminPassword()}`)
    .digest('hex')
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('base64url')
}

export function createSessionToken(): string {
  const exp = String(Date.now() + SESSION_TTL_MS)
  return `${exp}.${sign(exp)}`
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return false
  const exp = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = sign(exp)
  if (sig.length !== expected.length) return false
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false
  } catch {
    return false
  }
  const expMs = Number(exp)
  return Number.isFinite(expMs) && expMs > Date.now()
}

export function checkPassword(input: string): boolean {
  const expected = Buffer.from(getAdminPassword())
  const given = Buffer.from(input ?? '')
  if (expected.length !== given.length) return false
  return timingSafeEqual(expected, given)
}

/** Server-side helper usable in route handlers. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}
