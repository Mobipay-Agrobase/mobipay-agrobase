/**
 * Signed mobile session tokens (HMAC-SHA256).
 *
 * Fixes the forgeable-token vulnerability: the old mobile token was plain
 * `base64(userId:role:tenantId:timestamp)` and the middleware decoded it
 * with NO signature or expiry check — anyone who knew the format could
 * craft a SUPER_ADMIN token for any tenant.
 *
 * New format (opaque to clients — they never decode it, role/tenantId come
 * from the login response's `user` object):
 *
 *   <base64url(payload JSON)>.<base64url(HMAC-SHA256(payload))>
 *
 *   payload = { userId, role, tenantId, issuedAt, expiresAt }
 *
 * Properties:
 *   - Signature is verified with a constant-time comparison (no timing leaks).
 *   - Expiry is enforced server-side (default 30 days, override via env).
 *   - Verification FAILS CLOSED: any error (bad format, bad signature,
 *     expired, missing secret) returns null → middleware 401s.
 *   - Uses WebCrypto (crypto.subtle) + atob/btoa so the SAME code runs in
 *     the Edge middleware and in Node route handlers.
 *
 * Secret resolution: MOBILE_TOKEN_SECRET (dedicated, recommended) falling
 * back to NEXTAUTH_SECRET (already configured in every deployment).
 * Rotating either secret invalidates all outstanding mobile tokens
 * (users simply re-login).
 */

export interface MobileTokenPayload {
  userId: string
  role: string
  tenantId: string
  /** Epoch ms when the token was issued. */
  issuedAt: number
  /** Epoch ms after which the token is rejected. */
  expiresAt: number
}

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function getSecret(): string | null {
  const secret = process.env.MOBILE_TOKEN_SECRET || process.env.NEXTAUTH_SECRET
  return secret && secret.length > 0 ? secret : null
}

function getTtlMs(): number {
  const raw = Number(process.env.MOBILE_TOKEN_TTL_DAYS)
  return raw > 0 ? raw * 24 * 60 * 60 * 1000 : DEFAULT_TTL_MS
}

// ─── base64url helpers (Edge + Node safe) ──────────────────────────────────

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  // btoa is available in both the Edge Runtime and Node 16+.
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToString(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  return atob(b64)
}

// ─── HMAC-SHA256 via WebCrypto (Edge + Node safe) ───────────────────────────

async function hmacSign(data: string): Promise<string> {
  const secret = getSecret()
  if (!secret) {
    throw new Error('MOBILE_TOKEN_SECRET (or NEXTAUTH_SECRET) is not configured')
  }
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return bytesToBase64Url(new Uint8Array(signature))
}

/** Constant-time string equality (avoids timing attacks on the signature). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Issue a signed mobile session token.
 * Used by /api/auth/mobile-login after password verification.
 * @param ttlMs Optional lifetime override in ms (default: 30 days,
 *              or MOBILE_TOKEN_TTL_DAYS). Used by tests and for
 *              short-lived tokens.
 */
export async function createMobileToken(
  userId: string,
  role: string,
  tenantId: string,
  ttlMs?: number
): Promise<string> {
  const now = Date.now()
  const payload: MobileTokenPayload = {
    userId,
    role,
    tenantId,
    issuedAt: now,
    expiresAt: now + (ttlMs && ttlMs > 0 ? ttlMs : getTtlMs()),
  }
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await hmacSign(body)
  return `${body}.${signature}`
}

/**
 * Verify a mobile session token: format, signature, and expiry.
 * Returns the payload on success, or null on ANY failure (fail closed).
 * Used by the middleware Bearer-token path — never throws.
 */
export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    if (typeof token !== 'string' || token.length === 0) return null

    const dot = token.indexOf('.')
    if (dot <= 0 || dot === token.length - 1) return null
    const body = token.slice(0, dot)
    const signature = token.slice(dot + 1)

    // Verify the signature BEFORE parsing the payload (never trust, then check).
    const expected = await hmacSign(body)
    if (!timingSafeEqual(signature, expected)) return null

    const payload = JSON.parse(base64UrlToString(body)) as Partial<MobileTokenPayload>

    if (typeof payload.userId !== 'string' || payload.userId.length === 0) return null
    if (typeof payload.role !== 'string' || payload.role.length === 0) return null
    if (typeof payload.tenantId !== 'string' || payload.tenantId.length === 0) return null
    if (typeof payload.expiresAt !== 'number' || !Number.isFinite(payload.expiresAt)) return null
    if (Date.now() >= payload.expiresAt) return null

    return payload as MobileTokenPayload
  } catch {
    // Malformed token, bad base64, missing secret, … — always fail closed.
    return null
  }
}
