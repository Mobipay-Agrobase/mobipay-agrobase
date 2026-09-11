/**
 * Unit tests for field-level PII encryption / decryption.
 * Run: npx jest src/lib/__tests__/field-crypto.test.ts
 *
 * Regression lock for the "enc:v1: ciphertext shown in the farmer detail
 * page" bug: data imported/seeded while the server ran WITHOUT
 * ENCRYPTION_KEY (dev fallback keys) must still decrypt on a server WITH
 * ENCRYPTION_KEY set (production). Before the fix, decryptField only tried
 * the legacy dev key when ENCRYPTION_KEY was unset AND NODE_ENV != production
 * — in production it returned the raw ciphertext, which the UI rendered as
 * an overflowing "enc:v1:…" string.
 *
 * Cases:
 *   1. Roundtrip with ENCRYPTION_KEY (encrypt → decrypt).
 *   2. Legacy dev v1 key (fixed constant — used by the Ekibbo import script)
 *      still decrypts when ENCRYPTION_KEY IS set.
 *   3. Legacy dev v2 key (default ephemeral secret) still decrypts when
 *      ENCRYPTION_KEY IS set.
 *   4. Tampered ciphertext can't be decrypted (returns raw value, flagged by
 *      isUndecryptable so UIs mask it).
 *   5. Plaintext passes through unchanged.
 */
import crypto from 'crypto'
import { encryptField, decryptField, isUndecryptable } from '../security/field-crypto'

const PRIMARY_KEY = 'unit-test-primary-encryption-key-32-chars-min!'
const LEGACY_V1_SALT = 'agrobase-salt'
const LEGACY_V1_SECRET = 'agrobase-dev-key-insecure'
const V2_SALT = Buffer.from(
  crypto.createHash('sha256').update('agrobase-field-encryption-salt:v2').digest('hex'),
)

function encryptWithKey(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 })
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return `enc:v1:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${enc.toString('hex')}`
}

describe('field-crypto decrypt fallback keys', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeAll(() => {
    // Set BEFORE the first encrypt/decrypt call — keys are derived lazily
    // and cached, so the whole suite runs under this production-like env.
    process.env.ENCRYPTION_KEY = PRIMARY_KEY
    delete process.env.NEXTAUTH_SECRET
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
  })

  afterAll(() => {
    process.env.ENCRYPTION_KEY = ORIGINAL_ENV.ENCRYPTION_KEY
    process.env.NEXTAUTH_SECRET = ORIGINAL_ENV.NEXTAUTH_SECRET
    ;(process.env as Record<string, string | undefined>).NODE_ENV = ORIGINAL_ENV.NODE_ENV
  })

  test('roundtrip with the primary ENCRYPTION_KEY', () => {
    const enc = encryptField('+256700123456')!
    expect(enc.startsWith('enc:v1:')).toBe(true)
    expect(decryptField(enc)).toBe('+256700123456')
  })

  test('data encrypted under the LEGACY dev v1 key decrypts in production', () => {
    // Exact key used by scripts/import-ekibbo-real-data.ts when it ran
    // without ENCRYPTION_KEY (the source of the farmer-detail ciphertext bug).
    const legacyKey = crypto.scryptSync(LEGACY_V1_SECRET, LEGACY_V1_SALT, 32)
    const legacyEnc = encryptWithKey('+256771234567', legacyKey)
    expect(decryptField(legacyEnc)).toBe('+256771234567')
  })

  test('data encrypted under the legacy v2 dev-default key decrypts in production', () => {
    const v2DefaultKey = crypto.scryptSync(
      Buffer.from('dev|dev-only-ephemeral-secret-do-not-use-in-production', 'utf8'),
      V2_SALT,
      32,
    )
    const legacyEnc = encryptWithKey('test@example.com', v2DefaultKey)
    expect(decryptField(legacyEnc)).toBe('test@example.com')
  })

  test('tampered ciphertext decrypts to NULL (raw blob never returned)', () => {
    const enc = encryptField('+256700123456')!
    // Flip ciphertext bytes (keep valid hex) → auth tag must fail on every key.
    // enc layout: "enc:v1:<iv>:<authTag>:<ciphertext>" → 5 segments when split on ':'.
    const parts = enc.split(':')
    const flipped = (parseInt(parts[4].slice(0, 2), 16) ^ 0xff).toString(16).padStart(2, '0')
    const tampered = `${parts.slice(0, 4).join(':')}:${flipped + parts[4].slice(2)}`
    // Hard guarantee: the API layer must NEVER hand back the ciphertext blob.
    expect(decryptField(tampered)).toBeNull()
    // The stored raw value is still detectable for masking when read directly.
    expect(isUndecryptable(tampered)).toBe(true)
  })

  test('plaintext passes through unchanged and null stays null', () => {
    expect(decryptField('+256700000000')).toBe('+256700000000')
    expect(decryptField(null)).toBeNull()
    expect(encryptField(null)).toBeNull()
  })
})
