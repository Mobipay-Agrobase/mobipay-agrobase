/**
 * Unit tests for signed mobile session tokens.
 * Run: npx jest src/lib/__tests__/mobile-token.test.ts
 *
 * Regression lock: the mobile Bearer token must be IMPOSSIBLE to forge.
 * Before this fix the token was plain base64(userId:role:tenantId:timestamp)
 * and the middleware decoded it with no signature/expiry check — anyone
 * could craft a SUPER_ADMIN token for any tenant. These tests pin the fix:
 *   1. Legitimately-issued tokens verify (roundtrip).
 *   2. Old-format unsigned tokens are rejected (the original exploit).
 *   3. Tampered payloads / signatures are rejected.
 *   4. Expired tokens are rejected.
 *   5. Tokens signed with the wrong (rotated) secret are rejected.
 *   6. With no secret configured, verification fails closed.
 */
import { createMobileToken, verifyMobileToken } from '../mobile/mobile-token'

describe('Signed mobile tokens', () => {
  const ORIGINAL_SECRET = process.env.MOBILE_TOKEN_SECRET
  const ORIGINAL_NEXTAUTH = process.env.NEXTAUTH_SECRET

  beforeEach(() => {
    // Isolate secret config per test.
    delete process.env.MOBILE_TOKEN_SECRET
    delete process.env.NEXTAUTH_SECRET
    process.env.MOBILE_TOKEN_SECRET = 'test-secret-for-unit-tests'
  })

  afterAll(() => {
    // Restore whatever the environment had.
    if (ORIGINAL_SECRET !== undefined) process.env.MOBILE_TOKEN_SECRET = ORIGINAL_SECRET
    else delete process.env.MOBILE_TOKEN_SECRET
    if (ORIGINAL_NEXTAUTH !== undefined) process.env.NEXTAUTH_SECRET = ORIGINAL_NEXTAUTH
    else delete process.env.NEXTAUTH_SECRET
  })

  it('round-trips: an issued token verifies and carries the right identity', async () => {
    const token = await createMobileToken('user_1', 'EKB_EXTENSION', 'tenant_9')
    const payload = await verifyMobileToken(token)

    expect(payload).not.toBeNull()
    expect(payload!.userId).toBe('user_1')
    expect(payload!.role).toBe('EKB_EXTENSION')
    expect(payload!.tenantId).toBe('tenant_9')
    expect(payload!.expiresAt).toBeGreaterThan(Date.now())
    expect(payload!.issuedAt).toBeLessThanOrEqual(Date.now())
  })

  it('keeps the token opaque to structural guessing (payload.signature, no colons)', async () => {
    const token = await createMobileToken('user_1', 'FARMER', 'tenant_9')
    const [body, sig] = token.split('.')
    expect(body).toBeDefined()
    expect(sig).toBeDefined()
    expect(token).not.toContain(':')
  })

  it('REJECTS the old unsigned base64 format (the original forgeable-token exploit)', async () => {
    // Exactly what an attacker crafted pre-fix: base64(userId:role:tenantId:timestamp)
    const forged = Buffer.from(
      `cl0001:SUPER_ADMIN:cl0001:${Date.now()}`
    ).toString('base64')

    const payload = await verifyMobileToken(forged)
    expect(payload).toBeNull()
  })

  it('REJECTS a forged SUPER_ADMIN token even when the attacker formats it like the new scheme', async () => {
    // Attacker builds payload JSON claiming SUPER_ADMIN over tenant_9…
    const fakePayload = {
      userId: 'attacker',
      role: 'SUPER_ADMIN',
      tenantId: 'tenant_9',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 86_400_000,
    }
    const body = Buffer.from(JSON.stringify(fakePayload)).toString('base64url')
    // …and appends a garbage signature (they don't know the secret).
    const forged = `${body}.ZmFrZVNpZ25hdHVyZQ`
    expect(await verifyMobileToken(forged)).toBeNull()

    // …or no signature at all.
    expect(await verifyMobileToken(body)).toBeNull()
  })

  it('REJECTS a tampered payload with a valid signature (swap role to SUPER_ADMIN)', async () => {
    // Take a legitimately-signed token for a low-privilege user…
    const token = await createMobileToken('user_1', 'EKB_FARMER', 'tenant_9')
    const [body, sig] = token.split('.')

    // …decode the payload, escalate the role, re-encode, keep the old signature.
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'))
    payload.role = 'SUPER_ADMIN'
    const tamperedBody = Buffer.from(JSON.stringify(payload)).toString('base64url')

    expect(await verifyMobileToken(`${tamperedBody}.${sig}`)).toBeNull()
  })

  it('REJECTS a tampered signature', async () => {
    const token = await createMobileToken('user_1', 'EKB_MD', 'tenant_9')
    const [body, sig] = token.split('.')
    const flipped = sig.slice(0, -2) + (sig.endsWith('aa') ? 'bb' : 'aa')
    expect(await verifyMobileToken(`${body}.${flipped}`)).toBeNull()
  })

  it('REJECTS an expired token', async () => {
    // ttlMs of 1ms → issued already expired by the time we verify.
    const token = await createMobileToken('user_1', 'EKB_EXTENSION', 'tenant_9', 1)
    await new Promise((r) => setTimeout(r, 5)) // let it lapse
    expect(await verifyMobileToken(token)).toBeNull()
  })

  it('REJECTS tokens signed with a different secret (secret rotation)', async () => {
    const token = await createMobileToken('user_1', 'EKB_EXTENSION', 'tenant_9')

    process.env.MOBILE_TOKEN_SECRET = 'a-different-rotated-secret'
    expect(await verifyMobileToken(token)).toBeNull()
  })

  it('falls back to NEXTAUTH_SECRET when MOBILE_TOKEN_SECRET is absent', async () => {
    delete process.env.MOBILE_TOKEN_SECRET
    process.env.NEXTAUTH_SECRET = 'nextauth-fallback-secret'

    const token = await createMobileToken('user_1', 'EKB_EXTENSION', 'tenant_9')
    expect(await verifyMobileToken(token)).not.toBeNull()
  })

  it('fails CLOSED when no secret is configured at all', async () => {
    delete process.env.MOBILE_TOKEN_SECRET
    delete process.env.NEXTAUTH_SECRET

    // Even a token that was valid moments ago must stop verifying.
    process.env.MOBILE_TOKEN_SECRET = 'tmp'
    const token = await createMobileToken('user_1', 'EKB_EXTENSION', 'tenant_9')
    delete process.env.MOBILE_TOKEN_SECRET

    expect(await verifyMobileToken(token)).toBeNull()
  })

  it('rejects malformed inputs without throwing', async () => {
    for (const junk of ['', 'nodots', 'a.', '.b', '!!!.???', `${'A'.repeat(64)}.short`]) {
      await expect(verifyMobileToken(junk)).resolves.toBeNull()
    }
  })

  it('produces a different signature for every distinct payload (no replay across users)', async () => {
    const t1 = await createMobileToken('user_1', 'EKB_EXTENSION', 'tenant_9')
    const t2 = await createMobileToken('user_2', 'EKB_EXTENSION', 'tenant_9')
    expect(t1.split('.')[1]).not.toBe(t2.split('.')[1])
  })
})
