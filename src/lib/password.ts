/**
 * Password Hashing Utility (Argon2id + bcrypt migration)
 * ─────────────────────────────────────────────────────
 * 
 * SECURITY:
 * - New passwords are hashed with Argon2id (memory-hard, won PHC).
 * - bcrypt hashes from the V2/V3 migration period are still verifiable.
 * - When a bcrypt user logs in, their password is silently re-hashed with Argon2id.
 * - Legacy plaintext passwords are REJECTED — those users must reset.
 * 
 * Argon2id parameters (OWASP-recommended as of 2024):
 * - memoryCost: 19456 KiB (19 MB)
 * - timeCost: 2 iterations
 * - parallelism: 1
 * - These balance security vs. login latency (~100ms on a 2-core server).
 */

import bcrypt from 'bcryptjs'
import { hash, verify } from '@node-rs/argon2'

// Argon2id algorithm constant — @node-rs/argon2 uses numeric values:
// 0 = Argon2d, 1 = Argon2i, 2 = Argon2id
// We use the numeric value directly because isolatedModules doesn't allow const enums.
const ARGON2ID = 2

const BCRYPT_ROUNDS = 12

// Argon2id parameters — OWASP 2024 recommendations
const ARGON2_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19456,  // 19 MB
  timeCost: 2,        // 2 iterations
  parallelism: 1,
}

/**
 * Hash a plain-text password using Argon2id.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return hash(plainText, ARGON2_OPTIONS)
}

/**
 * Verify a plain-text password against a stored hash.
 * 
 * Supports:
 * - Argon2id hashes (preferred — starts with $argon2id$)
 * - bcrypt hashes (legacy — starts with $2a$, $2b$, $2y$)
 * - REJECTS plaintext passwords (security fix — was previously a backdoor)
 * 
 * Returns an object indicating whether the password is valid AND whether
 * the hash should be upgraded to Argon2id.
 */
export async function verifyPassword(
  plainText: string,
  storedHash: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  // Argon2id hash detection
  if (storedHash.startsWith('$argon2')) {
    try {
      const isValid = await verify(storedHash, plainText)
      return { valid: isValid, needsRehash: false }
    } catch {
      return { valid: false, needsRehash: false }
    }
  }

  // bcrypt hash detection (legacy — migrate to Argon2id on next login)
  if (storedHash.startsWith('$2')) {
    const isValid = await bcrypt.compare(plainText, storedHash)
    return { valid: isValid, needsRehash: isValid } // rehash if valid
  }

  // SECURITY FIX: Removed legacy plaintext-password backdoor.
  // Previous code accepted plaintext passwords via `if (plainText === storedHash) return true`
  // — this was a V1→V3 migration shim that became a permanent backdoor.
  // All passwords must now be hashed. Plaintext-hash users must reset their password.
  console.error('[security] Rejected non-bcrypt, non-argon2 password hash. User must reset password.')
  return { valid: false, needsRehash: false }
}

/**
 * Legacy boolean-returning verify — for backward compatibility with
 * code that hasn't been updated to handle the rehash flow.
 * 
 * DEPRECATED: Use verifyPassword() instead and handle needsRehash.
 */
export async function verifyPasswordLegacy(
  plainText: string,
  storedHash: string
): Promise<boolean> {
  const result = await verifyPassword(plainText, storedHash)
  return result.valid
}

/**
 * Check whether a stored hash is already using Argon2id.
 */
export function isArgon2Hash(hash: string): boolean {
  return hash.startsWith('$argon2id$')
}

/**
 * Check whether a stored hash is bcrypt (legacy).
 */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')
}

/**
 * Check whether a stored hash is hashed (any supported algorithm).
 */
export function isHashed(hash: string): boolean {
  return isArgon2Hash(hash) || isBcryptHash(hash)
}
