import { NextRequest, NextResponse } from 'next/server'
import { checkPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth'
import { clientIp, jsonError, rateLimit } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  if (!rateLimit(`login:${ip}`, 10, 10 * 60 * 1000)) {
    return jsonError('Too many attempts. Try again later.', 429)
  }

  let password = ''
  try {
    const body = await req.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return jsonError('Invalid request', 400)
  }

  if (!checkPassword(password)) {
    return jsonError('Wrong password', 401)
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
