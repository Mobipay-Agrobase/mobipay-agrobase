/**
 * P7 Migration Script — Encrypt existing plaintext PII in FarmerProfile.
 *
 * Usage:
 *   ENCRYPTION_KEY=<key> DATABASE_URL=<neon-url> npx tsx scripts/encrypt-existing-pii.ts
 *
 * What it does:
 *   1. Reads all FarmerProfile rows.
 *   2. For each row, checks if phone/nationalIdNo/email/bankAccountNo is
 *      already encrypted (has "enc:v1:" prefix). If so, skips it.
 *   3. If not encrypted, encrypts the value and updates the row.
 *   4. Runs in batches of 50 to avoid overwhelming the DB.
 *   5. Reports a summary at the end.
 *
 * Safety properties:
 *   - Idempotent: re-running on already-encrypted data is a no-op.
 *   - Each update is independent (not wrapped in a single transaction)
 *     so a failure on one row doesn't roll back the others.
 *   - The ENCRYPTION_KEY must be the same key used by the app at runtime.
 *     If the key changes after migration, the app won't be able to decrypt.
 *   - The script prints the key length and first 8 chars (for verification)
 *     but never the full key.
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const db = new PrismaClient()

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const PREFIX = 'enc:v1:'

let cachedKey: Buffer | null = null

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey

  const envKey = process.env.ENCRYPTION_KEY
  if (!envKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }
  if (envKey.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters')
  }

  cachedKey = crypto.scryptSync(envKey, 'agrobase-field-encryption-salt', 32)
  return cachedKey
}

function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false
  return value.startsWith(PREFIX)
}

function encryptField(plaintext: string): string {
  if (isEncrypted(plaintext)) return plaintext

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

const PII_FIELDS = ['phone', 'nationalIdNo', 'email', 'bankAccountNo'] as const

async function main() {
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  P7 Migration: Encrypt Existing Plaintext PII in FarmerProfile')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('')

  // Verify ENCRYPTION_KEY is set
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    console.error('❌ ENCRYPTION_KEY environment variable is not set.')
    console.error('   Generate one with: openssl rand -base64 32')
    process.exit(1)
  }
  console.log(`  ENCRYPTION_KEY: ${key.slice(0, 8)}...${key.slice(-4)} (${key.length} chars)`)
  console.log('')

  // Count total farmers
  const totalFarmers = await db.farmerProfile.count()
  console.log(`  Total FarmerProfile rows: ${totalFarmers}`)
  console.log('')

  // Process in batches
  const BATCH_SIZE = 50
  let processed = 0
  let encrypted = 0
  let skipped = 0
  let failed = 0
  const errors: Array<{ farmerId: string; field: string; error: string }> = []

  for (let offset = 0; offset < totalFarmers; offset += BATCH_SIZE) {
    const batch = await db.farmerProfile.findMany({
      skip: offset,
      take: BATCH_SIZE,
      select: { id: true, phone: true, nationalIdNo: true, email: true, bankAccountNo: true },
    })

    for (const farmer of batch) {
      processed++
      const updates: Record<string, string | null> = {}
      let needsUpdate = false

      for (const field of PII_FIELDS) {
        const value = farmer[field]
        if (value && !isEncrypted(value)) {
          try {
            updates[field] = encryptField(value)
            needsUpdate = true
          } catch (err) {
            errors.push({
              farmerId: farmer.id,
              field,
              error: err instanceof Error ? err.message : String(err),
            })
            failed++
          }
        }
      }

      if (needsUpdate) {
        try {
          await db.farmerProfile.update({
            where: { id: farmer.id },
            data: updates,
          })
          encrypted++
          if (encrypted % 10 === 0) {
            console.log(`  Progress: ${processed}/${totalFarmers} processed, ${encrypted} encrypted`)
          }
        } catch (err) {
          errors.push({
            farmerId: farmer.id,
            field: '(update)',
            error: err instanceof Error ? err.message : String(err),
          })
          failed++
        }
      } else {
        skipped++
      }
    }
  }

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  MIGRATION SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log(`  Total farmers:   ${totalFarmers}`)
  console.log(`  Processed:       ${processed}`)
  console.log(`  Encrypted:       ${encrypted}`)
  console.log(`  Already encrypted (skipped): ${skipped}`)
  console.log(`  Failed:          ${failed}`)
  console.log('')

  if (errors.length > 0) {
    console.log('  Errors:')
    for (const e of errors.slice(0, 10)) {
      console.log(`    ${e.farmerId} / ${e.field}: ${e.error}`)
    }
    if (errors.length > 10) {
      console.log(`    ... and ${errors.length - 10} more`)
    }
    console.log('')
  }

  // Verify a sample
  if (encrypted > 0) {
    console.log('  Verification (sample 3 farmers):')
    const samples = await db.farmerProfile.findMany({
      take: 3,
      select: { id: true, phone: true, nationalIdNo: true, email: true, bankAccountNo: true },
    })
    for (const s of samples) {
      const phoneEncrypted = isEncrypted(s.phone)
      const emailEncrypted = s.email ? isEncrypted(s.email) : null
      console.log(`    ${s.id}: phone=${phoneEncrypted ? 'ENC ✓' : 'PLAIN ✗'} email=${emailEncrypted === null ? 'null' : emailEncrypted ? 'ENC ✓' : 'PLAIN ✗'}`)
    }
    console.log('')
  }

  if (failed === 0) {
    console.log('  ✓ Migration completed successfully.')
  } else {
    console.log(`  ⚠ Migration completed with ${failed} error(s).`)
  }
  console.log('')
}

main()
  .catch((err) => {
    console.error('')
    console.error('❌ Migration failed:', err.message)
    console.error('')
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
