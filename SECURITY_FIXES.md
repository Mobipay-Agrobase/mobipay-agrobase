# Security Fixes — V3 Hardening (July 2026)

This document describes the 8 security fixes applied in response to the V2 hack.
All fixes use **open source tools only** — no paid SaaS required.

## Fix #1: Remove Hardcoded JWT Secret Fallback (CRITICAL)

**File:** `src/lib/auth.ts`

**Problem:** The NextAuth secret had a hardcoded fallback:
```ts
secret: process.env.NEXTAUTH_SECRET || 'agrobase-v3-dev-secret-change-in-production'
```
This string is in the git history. If `NEXTAUTH_SECRET` env var was missing in production, anyone could forge JWTs.

**Fix:** No fallback. In production, the app **refuses to start** if `NEXTAUTH_SECRET` is missing or shorter than 32 chars. In dev, it logs a loud warning and uses an ephemeral secret.

**Action required:** Set `NEXTAUTH_SECRET` in Vercel env vars (Project Settings → Environment Variables):
```bash
openssl rand -base64 32
```

## Fix #2: Enforce 2FA at Login (CRITICAL)

**Files:** `src/app/api/auth/2fa/login-check/route.ts` (new), `src/app/api/auth/2fa/challenge/route.ts` (new)

**Problem:** The existing 2FA routes (`/setup`, `/verify`, `/disable`) let users *enable* 2FA, but the `authorize` callback in `auth.ts` **never checked `twoFactorEnabled`**. So 2FA was pure security theater — an attacker with the password bypassed it entirely.

**Fix:** Two-step login flow:
1. Frontend posts email+password to `/api/auth/2fa/login-check`
2. If 2FA is enabled, server returns a 5-min challenge token (signed JWT)
3. User submits TOTP code (or backup code) to `/api/auth/2fa/challenge`
4. On success, frontend proceeds with NextAuth credentials signin
5. Backup codes are now **single-use** (removed from DB after use)

**Frontend integration required:** The login page must implement the two-step flow. The existing `/api/auth/2fa/setup` and `/api/auth/2fa/verify` routes are unchanged — users still enroll via those.

## Fix #3: Webhook Signature Verification (HIGH)

**Files:** `src/lib/payments/flutterwave.ts`, `src/app/api/payments/callback/[provider]/route.ts`

**Problem:** 
- Flutterwave verifier used `===` (timing-attack vulnerable)
- Payment callback had `isValidSignature = false` hardcoded — rejecting ALL real webhooks while accepting `provider=test` (spoofable)

**Fix:**
- Flutterwave: uses `crypto.timingSafeEqual` (constant-time comparison)
- Payment callback: real per-provider verification for Flutterwave, MTN MoMo, Airtel Money
- `provider=test` only allowed in non-production environments
- All rejected webhooks are logged for forensic analysis

**Action required:** Set these env vars in Vercel:
- `FLW_WEBHOOK_HASH` (from Flutterwave dashboard)
- `MTN_MOMO_CALLBACK_SECRET` (from MTN MoMo API portal)
- `AIRTEL_CALLBACK_SECRET` (from Airtel Money API portal)

## Fix #4: Mobile App Security (HIGH)

**Files:** `mobile/lib/core/security/secure_storage.dart`, `biometric_service.dart`, `secure_http_client.dart`, `device_security.dart`, `mobile/pubspec.yaml`, `mobile/android/app/src/main/AndroidManifest.xml`

**Problem:**
- Auth tokens stored in `SharedPreferences` (plaintext XML — readable via backup/root)
- No certificate pinning (MITM possible on dev networks)
- Cleartext HTTP traffic not disabled
- No biometric auth
- No root/jailbreak detection

**Fix:**
- `flutter_secure_storage` — stores tokens in iOS Keychain / Android Keystore
- `local_auth` — biometric prompt for app unlock + mandatory for financial ops
- `http_certificate_pinning` — pins production cert SHA-256 hashes
- `root_jailbreak_sniffer` — refuses financial ops on compromised devices
- `AndroidManifest.xml`: `allowBackup=false`, `usesCleartextTraffic=false`, `debuggable=false`

**Action required:**
1. Replace `SharedPreferences` usage in `auth_provider.dart` with `SecureStorage`
2. Add actual production certificate hashes to `_pinnedHashes` in `secure_http_client.dart`
3. Wire `BiometricService.authenticateForFinancialOp()` into disburse/approve screens
4. Run `flutter pub get` in `mobile/`

## Fix #5: Zod Input Validation (HIGH)

**Files:** `src/lib/security/validation-handler.ts` (new), `src/lib/security/schemas/payment-schemas.ts` (new)

**Problem:** Only ~9% of API routes (23 of 250) used Zod validation. The existing `validate.ts` utility was dead code — never imported. The rest did manual `if (!field) return 400` checks.

**Fix:**
- Created `withValidation()` wrapper — drop-in for any POST/PUT route
- Created `payment-schemas.ts` with strict schemas for: PaymentDisburse, NssfContribution, VslaLoanApplication, VslaSaving, UserRegistration, Login
- All schemas use `.strict()` to reject unknown fields (prevents mass-assignment)
- Enforced max amounts (UGX 10M disbursement, 5M loan, 1M saving) as a fraud control
- Phone numbers validated with regex
- Passwords require 8+ chars + uppercase + lowercase + number

**Action required:** Wire `withValidation()` into the remaining ~227 routes. Start with financial routes (`/api/payments/disburse`, `/api/nssf/contribute`, `/api/vsla/loans`).

## Fix #6: Remove Plaintext Password Backdoor (CRITICAL)

**File:** `src/lib/password.ts`

**Problem:** The `verifyPassword` function had a legacy migration shim:
```ts
if (plainText === storedHash) return true
```
This accepted plaintext passwords stored in the DB — a permanent backdoor.

**Fix:** Removed entirely. Any non-bcrypt, non-argon2 hash is rejected. Users with plaintext passwords must reset via the forgot-password flow.

**Action required:** Run this query to find affected users:
```sql
SELECT id, phone, email FROM "User" 
WHERE "passwordHash" NOT LIKE '$2%' 
  AND "passwordHash" NOT LIKE '$argon2%' 
  AND "passwordHash" IS NOT NULL;
```
Then trigger password resets for each.

## Fix #7: Tamper-Evident Audit Log (MEDIUM)

**Files:** `src/lib/security/secure-audit-logger.ts` (new), `prisma/schema.prisma` (added `SecureAuditLog` model)

**Problem:** The existing `AuditLog` table allows UPDATE/DELETE — an attacker (or malicious insider) could tamper with logs to cover their tracks. Only ~2% of API routes wrote audit logs anyway.

**Fix:**
- New `SecureAuditLog` model with hash-chained entries
- Each entry's `hash = SHA-256(prevHash + canonical(data) + timestamp)`
- `chainIndex` for sequential verification
- `verifyAuditChain()` function — run daily via cron, alert on any breaks
- Captures: `userId`, `actorName`, `actorRole`, `action`, `entityType`, `entityId`, `metadata`, `ipAddress`, `userAgent`, `httpMethod`, `path`

**Action required:**
1. Run `bunx prisma db push --accept-data-loss` (adds the table)
2. In Postgres: `REVOKE UPDATE, DELETE ON "SecureAuditLog" FROM app_role;`
3. Wire `logSecureAction()` into financial routes (replace existing `logAction()` calls)
4. Set up a daily cron to run `verifyAuditChain()` and alert on breaks

## Fix #8: Argon2id Password Hashing (MEDIUM)

**File:** `src/lib/password.ts`

**Problem:** Used bcrypt with 12 rounds. bcrypt is CPU-hard but not memory-hard — vulnerable to GPU/ASIC attacks. Argon2id (PHC winner) is memory-hard and resistant.

**Fix:**
- Installed `@node-rs/argon2` (native binding, fast)
- New passwords hashed with Argon2id (memoryCost: 19MB, timeCost: 2, parallelism: 1 — OWASP 2024 recommendations)
- Existing bcrypt hashes still verifiable — gradual migration
- **Silent rehash**: when a bcrypt user logs in successfully, their password is re-hashed with Argon2id automatically (no password reset campaign needed)
- `verifyPassword()` now returns `{ valid, needsRehash }` — auth.ts handles the rehash

**Action required:** None — migration is automatic. Over time, the entire user base moves to Argon2id as they log in.

---

## What's Still Pending

These were NOT done in this round — they require external accounts or budget:

| Item | Why Pending | Cost |
|---|---|---|
| WAF (Cloudflare) | Need a Cloudflare account | Free tier OK |
| KMS/Vault for secrets | Need AWS/GCP account | ~$1-5/month |
| Snyk dependency scanning | Need Snyk account | Free tier OK |
| PCI DSS SAQ-A documentation | Need compliance officer | Time only |
| Third-party pen test | Need budget | $5-15K |
| SQLCipher for mobile DB encryption | Drift migration needed | Free (open source) |

## Verification

After deploying, verify each fix:

```bash
# 1. JWT secret — app should refuse to start in prod without NEXTAUTH_SECRET
# (Set the env var in Vercel first, then redeploy)

# 2. 2FA — try logging in with a 2FA-enabled user
# Should prompt for TOTP code

# 3. Webhook — send a test webhook without signature
# Should return 401

# 4. Mobile — run the app on a rooted device
# Should refuse financial operations

# 5. Zod — POST invalid data to a financial route
# Should return 400 with field-level errors

# 6. Plaintext password — try logging in with a user whose hash isn't bcrypt/argon2
# Should fail

# 7. Audit chain — run verifyAuditChain()
# Should return { intact: true, totalChecked: N, brokenAt: [] }

# 8. Argon2 — log in with a bcrypt user, check DB
# passwordHash should now start with $argon2id$
```

## Environment Variables to Set in Vercel

```
NEXTAUTH_SECRET=<32+ char random string, generate with: openssl rand -base64 32>
FLW_WEBHOOK_HASH=<from Flutterwave dashboard>
MTN_MOMO_CALLBACK_SECRET=<from MTN MoMo API portal>
AIRTEL_CALLBACK_SECRET=<from Airtel Money API portal>
```
