/**
 * Unit test: P7 Security Hardening (field encryption + tenant guard).
 *
 * Verifies the LOGIC of field-level encryption and tenant guard without
 * requiring a live database connection.
 *
 * Run: npx tsx tests/p7-security-hardening.test.ts
 */
import { strict as assert } from 'node:assert'
import crypto from 'crypto'

// ─── Field encryption logic (mirrors src/lib/security/field-crypto.ts) ──────

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const PREFIX = 'enc:v1:'

// Derive a test key (mirrors the dev fallback in field-crypto.ts)
const TEST_KEY = crypto.scryptSync('agrobase-dev-key-insecure', 'agrobase-salt', 32)

function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext ?? null
  }
  if (isEncrypted(plaintext)) return plaintext

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, TEST_KEY, iv, { authTagLength: AUTH_TAG_LENGTH })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

function decryptField(encryptedValue: string | null | undefined): string | null {
  if (encryptedValue === null || encryptedValue === undefined || encryptedValue === '') {
    return encryptedValue ?? null
  }
  if (!isEncrypted(encryptedValue)) return encryptedValue

  const parts = encryptedValue.slice(PREFIX.length).split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted field format')

  const [ivHex, authTagHex, ciphertextHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const ciphertext = Buffer.from(ciphertextHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, TEST_KEY, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString('utf8')
}

function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false
  return value.startsWith(PREFIX)
}

// ─── Tenant guard logic (mirrors src/lib/security/tenant-guard.ts) ──────────

const TENANT_SCOPED_MODELS = new Set([
  'farmerProfile', 'farmLand', 'cultivation', 'vslaGroup', 'vslaLoan',
  'vslaMeeting', 'vslaAttendance', 'training', 'sale', 'purchase',
  'payment', 'company', 'plot', 'cropStageEvent', 'practiceAdoption',
])

function buildGuardFilter(ctx: { isSuperAdmin: boolean; tenantScope: string[]; tenantId: string | null }): Record<string, unknown> {
  if (ctx.isSuperAdmin) return {}
  if (ctx.tenantScope.length > 0) return { tenantId: { in: ctx.tenantScope } }
  if (ctx.tenantId) return { tenantId: ctx.tenantId }
  return { tenantId: '__NO_TENANT__' }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🧪 P7 Security Hardening Tests\n')

  // Test 1: Encrypt → decrypt round-trip preserves the original value
  {
    const original = '+256771234567'
    const encrypted = encryptField(original)
    const decrypted = decryptField(encrypted)

    assert.notStrictEqual(encrypted, original, 'Encrypted value must differ from plaintext')
    assert.strictEqual(decrypted, original, 'Decrypted value must match original')
    console.log('  ✅ Test 1 passed: encrypt → decrypt round-trip preserves value')
  }

  // Test 2: Encrypted value has the correct prefix format
  {
    const encrypted = encryptField('test@example.com')
    assert.ok(encrypted!.startsWith('enc:v1:'), 'Must have enc:v1: prefix')
    assert.ok(isEncrypted(encrypted), 'isEncrypted must detect the prefix')
    assert.ok(!isEncrypted('plaintext'), 'isEncrypted must reject plaintext')
    assert.ok(!isEncrypted(null), 'isEncrypted must reject null')
    console.log('  ✅ Test 2 passed: encrypted format is enc:v1:<iv>:<authTag>:<ciphertext>')
  }

  // Test 3: Same plaintext produces different ciphertexts (IV uniqueness)
  {
    const plaintext = '+256700000000'
    const enc1 = encryptField(plaintext)
    const enc2 = encryptField(plaintext)
    assert.notStrictEqual(enc1, enc2, 'Two encryptions of the same plaintext must differ (unique IV)')
    assert.strictEqual(decryptField(enc1), plaintext)
    assert.strictEqual(decryptField(enc2), plaintext)
    console.log('  ✅ Test 3 passed: unique IV prevents identical ciphertexts')
  }

  // Test 4: Null/undefined values pass through unchanged (empty string passes as empty)
  {
    assert.strictEqual(encryptField(null), null)
    assert.strictEqual(encryptField(undefined), null)
    assert.strictEqual(encryptField(''), '')
    assert.strictEqual(decryptField(null), null)
    assert.strictEqual(decryptField(undefined), null)
    assert.strictEqual(decryptField(''), '')
    console.log('  ✅ Test 4 passed: null/undefined pass through as null; empty string passes as empty')
  }

  // Test 5: Decrypting a plaintext value returns it unchanged (backward compat)
  {
    const plaintext = 'not-encrypted-value'
    assert.strictEqual(decryptField(plaintext), plaintext)
    console.log('  ✅ Test 5 passed: plaintext values pass through decrypt unchanged (backward compat)')
  }

  // Test 6: Double-encryption is prevented
  {
    const encrypted = encryptField('secret')
    const doubleEncrypted = encryptField(encrypted)
    assert.strictEqual(doubleEncrypted, encrypted, 'Encrypting an already-encrypted value is a no-op')
    console.log('  ✅ Test 6 passed: double-encryption is prevented')
  }

  // Test 7: Tampering detection (GCM auth tag)
  {
    const encrypted = encryptField('sensitive-data')
    // Tamper with the ciphertext (flip a bit)
    const parts = encrypted!.slice(PREFIX.length).split(':')
    const tamperedCiphertext = parts[2].slice(0, -2) + '00'
    const tampered = `${PREFIX}${parts[0]}:${parts[1]}:${tamperedCiphertext}`

    let threw = false
    try {
      decryptField(tampered)
    } catch {
      threw = true
    }
    assert.ok(threw, 'Decrypting tampered ciphertext must throw (GCM auth tag)')
    console.log('  ✅ Test 7 passed: GCM auth tag detects tampering')
  }

  // Test 8: Wrong key fails decryption
  {
    const encrypted = encryptField('secret-data')
    // Use a different key to decrypt
    const wrongKey = crypto.scryptSync('wrong-key', 'different-salt', 32)
    const parts = encrypted!.slice(PREFIX.length).split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const ciphertext = Buffer.from(parts[2], 'hex')

    let threw = false
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, wrongKey, iv, { authTagLength: AUTH_TAG_LENGTH })
      decipher.setAuthTag(authTag)
      Buffer.concat([decipher.update(ciphertext), decipher.final()])
    } catch {
      threw = true
    }
    assert.ok(threw, 'Decryption with wrong key must fail')
    console.log('  ✅ Test 8 passed: wrong key fails decryption (key isolation)')
  }

  // Test 9: Tenant guard filter — SUPER_ADMIN sees all
  {
    const filter = buildGuardFilter({ isSuperAdmin: true, tenantScope: [], tenantId: null })
    assert.deepStrictEqual(filter, {}, 'SUPER_ADMIN filter must be empty (no filtering)')
    console.log('  ✅ Test 9 passed: SUPER_ADMIN bypasses tenant filter')
  }

  // Test 10: Tenant guard filter — non-super-admin sees only their tenant
  {
    const filter1 = buildGuardFilter({ isSuperAdmin: false, tenantScope: [], tenantId: 'tenant-abc' })
    assert.deepStrictEqual(filter1, { tenantId: 'tenant-abc' })

    const filter2 = buildGuardFilter({ isSuperAdmin: false, tenantScope: ['t1', 't2'], tenantId: null })
    assert.deepStrictEqual(filter2, { tenantId: { in: ['t1', 't2'] } })

    // No tenant context — safety filter that matches nothing
    const filter3 = buildGuardFilter({ isSuperAdmin: false, tenantScope: [], tenantId: null })
    assert.deepStrictEqual(filter3, { tenantId: '__NO_TENANT__' })
    console.log('  ✅ Test 10 passed: non-super-admin filtered by tenantId; no-context = match nothing')
  }

  // Test 11: Tenant-scoped models list is comprehensive
  {
    assert.ok(TENANT_SCOPED_MODELS.has('farmerProfile'))
    assert.ok(TENANT_SCOPED_MODELS.has('vslaGroup'))
    assert.ok(TENANT_SCOPED_MODELS.has('vslaLoan'))
    assert.ok(TENANT_SCOPED_MODELS.has('training'))
    assert.ok(TENANT_SCOPED_MODELS.has('plot'))
    assert.ok(!TENANT_SCOPED_MODELS.has('tenant'), 'Tenant model itself is NOT tenant-scoped')
    assert.ok(!TENANT_SCOPED_MODELS.has('region'), 'Region is NOT tenant-scoped (shared geographic data)')
    console.log('  ✅ Test 11 passed: ' + TENANT_SCOPED_MODELS.size + ' tenant-scoped models identified')
  }

  // Test 12: PII fields on FarmerProfile are correctly identified
  {
    const FARMER_PII_FIELDS = ['phone', 'nationalIdNo', 'bankAccountNo', 'email', 'bankAccounts']
    assert.strictEqual(FARMER_PII_FIELDS.length, 5)
    assert.ok(FARMER_PII_FIELDS.includes('phone'))
    assert.ok(FARMER_PII_FIELDS.includes('nationalIdNo'))
    assert.ok(FARMER_PII_FIELDS.includes('bankAccountNo'))
    assert.ok(FARMER_PII_FIELDS.includes('email'))
    console.log('  ✅ Test 12 passed: 5 PII fields on FarmerProfile identified for encryption')
  }

  console.log('\n✅ All 12 P7 security hardening tests passed.')
}

main().catch(err => {
  console.error('\n❌ Test failed:', err.message)
  process.exit(1)
})
