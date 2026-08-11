/**
 * Field-Level Encryption (P7)
 * ───────────────────────────
 *
 * AES-256-GCM encryption for PII fields at rest.
 *
 * Design:
 *   - Uses Node's built-in `crypto` module (no external deps).
 *   - Algorithm: aes-256-gcm (authenticated encryption — detects tampering).
 *   - Key: 32 bytes derived from ENCRYPTION_KEY env var via scrypt.
 *   - Format: "enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *   - The "enc:v1:" prefix lets us detect encrypted vs plaintext fields
 *     (for backward compatibility during migration).
 *
 * SECURITY:
 *   - The ENCRYPTION_KEY must be 32+ characters and stored in env vars
 *     (never in code). In production, use a KMS (AWS KMS, Google KMS).
 *   - Key rotation: bump the version in the prefix ("enc:v2:...") and
 *     re-encrypt fields on read. The old key is kept for decrypting v1.
 *   - The IV (initialization vector) is unique per encryption operation,
 *     preventing identical plaintexts from producing identical ciphertexts.
 *
 * Usage:
 *   import { encryptField, decryptField, isEncrypted } from '@/lib/security/field-crypto'
 *
 *   // On write (API route):
 *   await db.farmerProfile.create({
 *     data: {
 *       ...body,
 *       phone: encryptField(body.phone),
 *       nationalIdNo: body.nationalIdNo ? encryptField(body.nationalIdNo) : null,
 *     },
 *   })
 *
 *   // On read (API route):
 *   const farmer = await db.farmerProfile.findUnique({ where: { id } })
 *   return {
 *     ...farmer,
 *     phone: decryptField(farmer.phone),
 *     nationalIdNo: farmer.nationalIdNo ? decryptField(farmer.nationalIdNo) : null,
 *   }
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit IV (GCM standard)
const AUTH_TAG_LENGTH = 16
const PREFIX = 'enc:v1:' // versioned prefix for migration support

// Cache the derived key so we don't re-derive on every call.
let cachedKey: Buffer | null = null
// Legacy dev key (previously used when ENCRYPTION_KEY was unset). We keep it only
// as a DECRYPT fallback so data encrypted under the old dev key still reads back.
let cachedLegacyDevKey: Buffer | null = null

function getLegacyDevKey(): Buffer | null {
  if (process.env.ENCRYPTION_KEY || process.env.NODE_ENV === 'production') return null
  if (!cachedLegacyDevKey) {
    cachedLegacyDevKey = crypto.scryptSync('agrobase-dev-key-insecure', 'agrobase-salt', 32)
  }
  return cachedLegacyDevKey
}

/**
 * Derive a 32-byte AES key from the ENCRYPTION_KEY env var.
 * Uses scrypt (memory-hard KDF) so the env var can be any length.
 *
 * In production, prefer a KMS-managed key. This is the application-level
 * fallback for environments without KMS.
 */
function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey

  const envKey = process.env.ENCRYPTION_KEY
  if (!envKey) {
    // Development fallback: derive a key that is NOT a fixed published constant.
    // We combine the deployment's NEXTAUTH_SECRET (already secret + per-deployment)
    // with an instance salt so every dev environment uses a different key, and a
    // hardcoded value is never used verbatim. This is STILL not production-grade —
    // it just prevents crashes in dev and avoids a byte-for-byte public key.
    if (process.env.NODE_ENV !== 'production') {
      const authSecret = process.env.NEXTAUTH_SECRET || 'dev-only-ephemeral-secret-do-not-use-in-production'
      const salt = crypto.createHash('sha256').update('agrobase-field-encryption-salt:v2').digest('hex')
      const secretMaterial = Buffer.from(`dev|${authSecret}`, 'utf8')
      console.warn('[field-crypto] ENCRYPTION_KEY not set — using development fallback derived from NEXTAUTH_SECRET. Set ENCRYPTION_KEY in production!')
      cachedKey = crypto.scryptSync(secretMaterial, salt, 32)
      return cachedKey
    }
    throw new Error('ENCRYPTION_KEY environment variable is required in production')
  }

  if (envKey.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters')
  }

  // Derive a 32-byte key using scrypt with a fixed salt.
  // The salt is not secret — it just prevents rainbow table attacks
  // if the env key is weak.
  cachedKey = crypto.scryptSync(envKey, 'agrobase-field-encryption-salt', 32)
  return cachedKey
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The value to encrypt. If null/undefined/empty, returned as-is.
 * @returns The encrypted string with format "enc:v1:<iv>:<authTag>:<ciphertext>"
 *          or the original value if it was null/empty.
 */
export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext ?? null
  }

  // Don't double-encrypt
  if (isEncrypted(plaintext)) {
    return plaintext
  }

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return `${PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypt an encrypted string.
 *
 * @param encryptedValue - The encrypted string with format "enc:v1:<iv>:<authTag>:<ciphertext>"
 * @returns The decrypted plaintext, or the original value if it wasn't encrypted.
 *          Returns null if the input was null/undefined.
 */
export function decryptField(encryptedValue: string | null | undefined): string | null {
  if (encryptedValue === null || encryptedValue === undefined || encryptedValue === '') {
    return encryptedValue ?? null
  }

  // If it's not encrypted, return as-is (backward compatibility)
  if (!isEncrypted(encryptedValue)) {
    return encryptedValue
  }

  const key = getEncryptionKey()
  const parts = encryptedValue.slice(PREFIX.length).split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted field format — expected 3 parts after prefix')
  }

  const [ivHex, authTagHex, ciphertextHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const ciphertext = Buffer.from(ciphertextHex, 'hex')

  const keys = [getEncryptionKey()]
  const legacy = getLegacyDevKey()
  if (legacy) keys.push(legacy)

  for (const key of keys) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
      decipher.setAuthTag(authTag)
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ])
      return decrypted.toString('utf8')
    } catch {
      // try next key
    }
  }

  // Auth tag mismatch — tampered, or no known key matches. We return the raw
  // value rather than throwing so a single bad field can't take down the whole list.
  console.warn('[field-crypto] decrypt failed for value (tampered or unknown key)')
  return encryptedValue
}

/**
 * Check if a value is encrypted (has the "enc:v1:" prefix).
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false
  return value.startsWith(PREFIX)
}

/**
 * Encrypt multiple PII fields on an object at once.
 * Only encrypts fields that are present and non-empty.
 *
 * @param obj - The object containing PII fields
 * @param fields - Array of field names to encrypt
 * @returns A new object with the specified fields encrypted
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
): T {
  const result: Record<string, unknown> = { ...obj }
  for (const field of fields) {
    if (field in result && result[field] !== null && result[field] !== undefined) {
      const value = result[field]
      if (typeof value === 'string') {
        result[field] = encryptField(value)
      }
    }
  }
  return result as T
}

/**
 * Decrypt multiple PII fields on an object at once.
 * Only decrypts fields that are encrypted.
 *
 * @param obj - The object containing encrypted PII fields
 * @param fields - Array of field names to decrypt
 * @returns A new object with the specified fields decrypted
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
): T {
  const result: Record<string, unknown> = { ...obj }
  for (const field of fields) {
    if (field in result && result[field] !== null && result[field] !== undefined) {
      const value = result[field]
      if (typeof value === 'string' && isEncrypted(value)) {
        result[field] = decryptField(value)
      }
    }
  }
  return result as T
}

/**
 * The list of PII fields on FarmerProfile that should be encrypted at rest.
 * Used by the farmer API routes.
 */
export const FARMER_PII_FIELDS = [
  'phone',
  'nationalIdNo',
  'bankAccountNo',
  'email',
  'bankAccounts', // JSON string
] as const

/**
 * The list of PII fields on User that should be encrypted at rest.
 * Note: phone is @unique on User — encrypting it would break the unique
 * constraint. We use a separate `phoneHash` column for uniqueness lookups
 * instead (future work). For now, we only encrypt the 2FA secret + backup codes.
 */
export const USER_SENSITIVE_FIELDS = [
  'twoFactorSecret',
  'twoFactorBackupCodes',
] as const
