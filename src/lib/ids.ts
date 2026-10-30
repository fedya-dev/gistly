import { randomBytes } from 'crypto'

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Short, URL-safe, collision-friendly id (default 10 chars ~ 62^10). */
export function generateId(length = 10): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

/** Secret token for protected gists. */
export function generateToken(): string {
  return randomBytes(16).toString('base64url')
}
