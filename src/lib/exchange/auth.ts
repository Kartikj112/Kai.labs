// ── Kai Exchange — admin auth ────────────────────────────────────────────────
// Server-only. Single-admin gate using one shared password (ADMIN_PASSWORD).
// The cookie stores an HMAC of a fixed session string keyed by the password —
// so the raw password is never written to the cookie and can't be derived from
// it. Fails closed: if ADMIN_PASSWORD is unset, no one can log in.

import { createHmac, timingSafeEqual } from 'node:crypto'

export const ADMIN_COOKIE = 'kai_admin'
const SESSION_STRING = 'kai-admin-session-v1'

function adminSecret(): string {
  return process.env.ADMIN_PASSWORD ?? ''
}

export function isAdminConfigured(): boolean {
  return adminSecret().length > 0
}

/** The session token written to the cookie on successful login. */
export function adminToken(): string {
  return createHmac('sha256', adminSecret()).update(SESSION_STRING).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/** Constant-time check of a submitted password against ADMIN_PASSWORD. */
export function checkPassword(pw: string): boolean {
  const secret = adminSecret()
  if (!secret) return false
  return safeEqual(pw, secret)
}

/** Validate a cookie value against the expected session token. */
export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token || !isAdminConfigured()) return false
  return safeEqual(token, adminToken())
}
