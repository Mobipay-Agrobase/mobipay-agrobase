/**
 * Signed SUPER_ADMIN tenant-simulation cookie (HMAC-SHA256).
 *
 * Closes the "unsigned simulate_tenant cookie" finding from the security
 * review follow-up (the web-side equivalent of the forgeable mobile token).
 *
 * Before this fix, /api/admin/simulate/start set `simulate_tenant` to plain
 * `base64url(JSON payload)` with NO signature. The middleware trusted the
 * payload wholesale — so a value crafted outside the start route could:
 *   - set ANY tenantId (bypassing the start route's checks: target must
 *     exist, be active, and not be the platform root tenant),
 *   - set ANY expiry (the middleware honoured the cookie's own expiresAt,
 *     so a forged cookie never expired),
 *   - be replayed under a DIFFERENT super-admin account on the same browser
 *     (nothing bound the cookie to the super-admin who started it).
 *
 * New format (mirrors the signed mobile-token scheme):
 *
 *   <base64url(payload JSON)>.<base64url(HMAC-SHA256(payload))>
 *
 *   payload = { tenantId, tenantName, tenantType, country, defaultCurrency,
 *              startedAt, expiresAt, startedBy }
 *
 * Properties:
 *   - Signature verified with a constant-time comparison (no timing leaks).
 *   - Expiry enforced server-side at verification time (not trusted from
 *     the payload alone — a forged/rotated expiry without a valid
 *     signature is rejected).
 *   - `startedBy` binds the cookie to the exact super-admin session that
 *     started the simulation; the middleware refuses to honour it for any
 *     other user.
 *   - Verification FAILS CLOSED: any error (bad format, bad signature,
 *     expired, missing secret) returns null → the middleware simply does
 *     not simulate.
 *   - Uses WebCrypto (crypto.subtle) + atob/btoa so the SAME code runs in
 *     the Edge middleware and in Node route handlers.
 *
 * Secret resolution: SIMULATE_COOKIE_SECRET (dedicated, optional) falling
 * back to MOBILE_TOKEN_SECRET, then NEXTAUTH_SECRET. Production already
 * has MOBILE_TOKEN_SECRET configured, so no deployment env change is
 * required; rotating any of these secrets invalidates outstanding
 * simulation cookies (super-admins just re-start the simulation).
 */

export interface SimulateCookiePayload {
  tenantId: string
  tenantName: string
  tenantType: string
  country?: string | null
  defaultCurrency?: string | null
  /** Epoch ms when the simulation started. */
  startedAt: number
  /** Epoch ms after which the simulation is rejected. */
  expiresAt: number
  /** userId of the SUPER_ADMIN who started the simulation. */
  startedBy: string
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

function getSecret(): string | null {
  const secret =
    process.env.SIMULATE_COOKIE_SECRET ||
    process.env.MOBILE_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET
  return secret && secret.length > 0 ? secret : null
}

async function hmacSign(data: string): Promise<string> {
  const secret = getSecret()
  if (!secret) {
    throw new Error(
      'SIMULATE_COOKIE_SECRET (or MOBILE_TOKEN_SECRET / NEXTAUTH_SECRET) is not configured',
    )
  }
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
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
 * Sign a simulation cookie value for the given payload.
 * Used by /api/admin/simulate/start after RBAC + tenant validation.
 */
export async function signSimulateCookie(
  payload: SimulateCookiePayload,
): Promise<string> {
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await hmacSign(body)
  return `${body}.${signature}`
}

/**
 * Verify a `simulate_tenant` cookie value: format, signature, and expiry.
 * Returns the payload on success, or null on ANY failure (fail closed).
 * Used by the middleware, /status and /stop — never throws.
 *
 * NOTE: this verifies the cryptographic integrity only. Callers that also
 * know the requesting user (e.g. the middleware) should additionally check
 * `payload.startedBy === currentUserId` to prevent cookie replay across
 * super-admin accounts on the same browser.
 */
export async function verifySimulateCookie(
  value: string,
): Promise<SimulateCookiePayload | null> {
  try {
    if (typeof value !== 'string' || value.length === 0) return null

    const dot = value.indexOf('.')
    if (dot <= 0 || dot === value.length - 1) return null
    const body = value.slice(0, dot)
    const signature = value.slice(dot + 1)

    // Verify the signature BEFORE parsing the payload (never trust, then check).
    const expected = await hmacSign(body)
    if (!timingSafeEqual(signature, expected)) return null

    const payload = JSON.parse(base64UrlToString(body)) as Partial<SimulateCookiePayload>

    if (typeof payload.tenantId !== 'string' || payload.tenantId.length === 0) return null
    if (typeof payload.tenantName !== 'string') return null
    if (typeof payload.tenantType !== 'string') return null
    if (typeof payload.startedBy !== 'string' || payload.startedBy.length === 0) return null
    if (typeof payload.startedAt !== 'number' || !Number.isFinite(payload.startedAt)) return null
    if (typeof payload.expiresAt !== 'number' || !Number.isFinite(payload.expiresAt)) return null
    if (Date.now() >= payload.expiresAt) return null

    return payload as SimulateCookiePayload
  } catch {
    // Malformed cookie, bad base64, missing secret, … — always fail closed.
    return null
  }
}
