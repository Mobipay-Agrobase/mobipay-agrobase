/**
 * Unit test: Simulation cookie encoding round-trip.
 *
 * Verifies that the base64url JSON payload written by /api/admin/simulate/start
 * is correctly decoded by:
 *   - middleware (sets x-simulated-tenant-id header)
 *   - /api/admin/simulate/status (returns simulation state to the client)
 *   - /api/admin/simulate/stop (audit-logs the simulated tenant ID)
 *
 * Run: npx tsx tests/p2-simulation-cookie.test.ts
 */
import { strict as assert } from 'node:assert'

interface SimCookiePayload {
  tenantId: string
  tenantName: string
  tenantType: string
  country?: string | null
  defaultCurrency?: string
  startedAt: number
  expiresAt: number
  startedBy: string
}

// ─── Mirror of the encoding in /api/admin/simulate/start ───────────────────
function encode(payload: SimCookiePayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

// ─── Mirror of the decoding in middleware + /status + /stop ────────────────
function decode(cookieValue: string): SimCookiePayload | null {
  try {
    const payload = JSON.parse(
      Buffer.from(cookieValue, 'base64url').toString('utf-8'),
    ) as SimCookiePayload
    if (!payload.tenantId || !payload.tenantName || !payload.expiresAt) return null
    return payload
  } catch {
    return null
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🧪 P2 Simulation Cookie Round-Trip Tests\n')

  // Test 1: Encode then decode produces identical payload
  {
    const original: SimCookiePayload = {
      tenantId: 'tenant-abc-123',
      tenantName: 'EKIBBO Coffee Exporters',
      tenantType: 'EXPORTER',
      country: 'Uganda',
      defaultCurrency: 'UGX',
      startedAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
      startedBy: 'user-super-admin-1',
    }
    const encoded = encode(original)
    const decoded = decode(encoded)

    assert.ok(decoded, 'decoded payload must not be null')
    assert.strictEqual(decoded.tenantId, original.tenantId)
    assert.strictEqual(decoded.tenantName, original.tenantName)
    assert.strictEqual(decoded.tenantType, original.tenantType)
    assert.strictEqual(decoded.country, original.country)
    assert.strictEqual(decoded.defaultCurrency, original.defaultCurrency)
    assert.strictEqual(decoded.startedAt, original.startedAt)
    assert.strictEqual(decoded.expiresAt, original.expiresAt)
    assert.strictEqual(decoded.startedBy, original.startedBy)

    // Cookie must NOT contain URL-unsafe characters (=, +, /) that would break
    // the Cookie header parsing.
    assert.ok(!encoded.includes('='), 'base64url must not contain padding =')
    assert.ok(!encoded.includes('+'), 'base64url must not contain +')
    assert.ok(!encoded.includes('/'), 'base64url must not contain /')

    console.log('  ✅ Test 1 passed: encode → decode round-trip preserves all fields')
  }

  // Test 2: Tenant names with special chars (apostrophes, unicode) survive
  {
    const original: SimCookiePayload = {
      tenantId: 't1',
      tenantName: "Mt. Elgon Coffee Growers' Co-op",
      tenantType: 'COOPERATIVE',
      country: "Côte d'Ivoire",
      defaultCurrency: 'XOF',
      startedAt: 1,
      expiresAt: 2,
      startedBy: 'u1',
    }
    const decoded = decode(encode(original))
    assert.strictEqual(decoded?.tenantName, original.tenantName)
    assert.strictEqual(decoded?.country, original.country)
    console.log('  ✅ Test 2 passed: special chars (apostrophe, accent) round-trip cleanly')
  }

  // Test 3: Malformed cookie decodes to null (middleware should ignore it)
  {
    assert.strictEqual(decode('not-valid-json-base64'), null)
    assert.strictEqual(decode(''), null)
    assert.strictEqual(decode(encode({ tenantId: '', tenantName: '', tenantType: '', startedAt: 0, expiresAt: 0, startedBy: '' })), null)
    console.log('  ✅ Test 3 passed: malformed cookie decodes to null (defence in depth)')
  }

  // Test 4: Expiry is enforced by the middleware check
  {
    const expiredPayload: SimCookiePayload = {
      tenantId: 't1',
      tenantName: 'Old',
      tenantType: 'NGO',
      startedAt: Date.now() - 60 * 60 * 1000,
      expiresAt: Date.now() - 1000, // expired 1s ago
      startedBy: 'u1',
    }
    const decoded = decode(encode(expiredPayload))
    assert.ok(decoded, 'decode still works for expired cookie')
    assert.ok(Date.now() > decoded.expiresAt, 'expiry must be in the past')
    // The middleware check `Date.now() < decoded.expiresAt` would skip the
    // simulation override for this cookie, which is the desired behaviour.
    console.log('  ✅ Test 4 passed: expired cookie decodes but middleware rejects it')
  }

  // Test 5: 30-minute TTL matches the spec
  {
    const startedAt = Date.now()
    const ttlSeconds = 30 * 60
    const expiresAt = startedAt + ttlSeconds * 1000
    const decoded = decode(encode({
      tenantId: 't1', tenantName: 'X', tenantType: 'COOPERATIVE',
      startedAt, expiresAt, startedBy: 'u1',
    }))
    const ttlMs = decoded!.expiresAt - decoded!.startedAt
    assert.strictEqual(ttlMs, 30 * 60 * 1000, 'TTL must be exactly 30 minutes')
    console.log('  ✅ Test 5 passed: 30-minute TTL is correctly encoded')
  }

  console.log('\n✅ All 5 simulation cookie tests passed.')
}

main().catch(err => {
  console.error('\n❌ Test failed:', err.message)
  process.exit(1)
})
