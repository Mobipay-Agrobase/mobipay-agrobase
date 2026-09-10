/**
 * Unit tests for the signed SUPER_ADMIN tenant-simulation cookie.
 * Run: npx jest src/lib/__tests__/simulate-cookie.test.ts
 *
 * Regression lock: the `simulate_tenant` cookie must be IMPOSSIBLE to forge.
 * Before this fix the cookie was plain base64url(JSON) and the middleware
 * trusted it wholesale — a value crafted outside /api/admin/simulate/start
 * could set ANY tenantId, ANY expiry (never expires), and be replayed under
 * a different super-admin account. These tests pin the fix:
 *   1. Legitimately-issued cookies verify (roundtrip).
 *   2. Old-format unsigned cookies are rejected (the original exploit).
 *   3. Tampered payloads / signatures are rejected.
 *   4. Expired cookies are rejected (server-side clock, not payload trust).
 *   5. Cookies signed with the wrong (rotated) secret are rejected.
 *   6. With no secret configured, verification fails closed.
 *   7. Malformed inputs never throw.
 */
import { signSimulateCookie, verifySimulateCookie } from '../security/simulate-cookie'

function buildPayload(overrides: Record<string, unknown> = {}) {
  const now = Date.now()
  return {
    tenantId: 'clTenant123',
    tenantName: 'EKIBBO',
    tenantType: 'COOPERATIVE',
    country: 'UG',
    defaultCurrency: 'UGX',
    startedAt: now,
    expiresAt: now + 30 * 60 * 1000,
    startedBy: 'user_super_1',
    ...overrides,
  }
}

describe('Signed simulate_tenant cookie', () => {
  const ORIGINAL = { ...process.env }

  beforeEach(() => {
    // Isolate secret config per test.
    delete process.env.SIMULATE_COOKIE_SECRET
    delete process.env.MOBILE_TOKEN_SECRET
    delete process.env.NEXTAUTH_SECRET
    process.env.MOBILE_TOKEN_SECRET = 'test-secret-for-unit-tests'
  })

  afterAll(() => {
    // Restore whatever the environment had.
    for (const key of Object.keys(ORIGINAL)) process.env[key] = ORIGINAL[key]
  })

  it('round-trips: a cookie issued by /start verifies and carries the right payload', async () => {
    const cookie = await signSimulateCookie(buildPayload())
    const payload = await verifySimulateCookie(cookie)

    expect(payload).not.toBeNull()
    expect(payload!.tenantId).toBe('clTenant123')
    expect(payload!.tenantName).toBe('EKIBBO')
    expect(payload!.tenantType).toBe('COOPERATIVE')
    expect(payload!.startedBy).toBe('user_super_1')
    expect(payload!.expiresAt).toBeGreaterThan(Date.now())
    expect(payload!.startedAt).toBeLessThanOrEqual(Date.now())
  })

  it('rejects the OLD unsigned format (the original forge exploit)', async () => {
    // An attacker crafts plain base64url(JSON) with any tenantId and a
    // far-future expiry — exactly what the middleware trusted before.
    const forged = btoa(JSON.stringify(
      buildPayload({
        tenantId: 'clVictimTenant',
        expiresAt: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
      }),
    )).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    expect(await verifySimulateCookie(forged)).toBeNull()
  })

  it('rejects a tampered payload (re-signed body swap prevented by signature check)', async () => {
    const cookie = await signSimulateCookie(buildPayload())
    const dot = cookie.indexOf('.')
    const body = cookie.slice(0, dot)

    // Tamper the payload to point at another tenant, keep the signature.
    const decoded = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))
    decoded.tenantId = 'clOtherTenant'
    const tamperedBody = btoa(JSON.stringify(decoded))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    expect(await verifySimulateCookie(`${tamperedBody}.${cookie.slice(dot + 1)}`)).toBeNull()
  })

  it('rejects a garbage signature', async () => {
    const cookie = await signSimulateCookie(buildPayload())
    const dot = cookie.indexOf('.')
    expect(await verifySimulateCookie(`${cookie.slice(0, dot)}.AAAAgarbage`)).toBeNull()
  })

  it('rejects an expired cookie even when the signature is valid', async () => {
    const cookie = await signSimulateCookie(
      buildPayload({ expiresAt: Date.now() - 1000 }),
    )
    expect(await verifySimulateCookie(cookie)).toBeNull()
  })

  it('rejects cookies signed with a rotated (different) secret', async () => {
    const cookie = await signSimulateCookie(buildPayload())
    process.env.MOBILE_TOKEN_SECRET = 'rotated-secret-v2'
    expect(await verifySimulateCookie(cookie)).toBeNull()
  })

  it('fails closed when no secret is configured', async () => {
    delete process.env.MOBILE_TOKEN_SECRET
    delete process.env.NEXTAUTH_SECRET
    // Signing throws (server misconfiguration must be loud)…
    await expect(signSimulateCookie(buildPayload())).rejects.toThrow()
    // …and verification of any pre-existing value fails closed.
    expect(await verifySimulateCookie('anything.anything')).toBeNull()
  })

  it('never throws on malformed inputs', async () => {
    for (const bad of ['', 'no-dot-here', '.', 'a.', '.b', '!!!.???', 'x.y.z']) {
      await expect(verifySimulateCookie(bad)).resolves.toBeNull()
    }
  })

  it('exposes startedBy so the middleware can bind the cookie to the issuing super-admin', async () => {
    const cookie = await signSimulateCookie(buildPayload({ startedBy: 'user_super_9' }))
    const payload = await verifySimulateCookie(cookie)
    expect(payload!.startedBy).toBe('user_super_9')
  })
})
