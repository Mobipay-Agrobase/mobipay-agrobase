# Full VSLA Module + Unified Platform Admin + Mobile App

> Branch: `feat/full-vsla-module-and-admin`
> Date: 23 July 2026
> Author: Eric Mwangi (MobiPay Agrobase)

## TL;DR

This branch delivers:
1. **Complete VSLA module** — 16 new Prisma models, 27 API routes, centralized VSLA engine, double-entry bookkeeping, social fund, cycles with share-out, loan guarantors, fines, officer roles
2. **Unified Platform Admin** — single-page admin (at `/admin-v3`) surfacing all 12 modules in one console with role-based demo logins
3. **Flutter mobile app** — 13 new screens under `mobile/lib/features/vsla_v3/` covering groups, savings, loans (with full lifecycle actions), meetings, social fund, NSSF
4. **Kilimo Trust partnership module** — MoU terms captured, live revenue splits, monthly settlements

## What's New in This Branch

### 1. VSLA Module — What Was Added

| Capability | Status Before | Status After |
|---|---|---|
| Group CRUD | ✓ (basic) | ✓ (with stats, audit log) |
| Member management | partial | ✓ (KYC, officer roles, exit tracking) |
| Savings | ✓ (bug: /1000 vs /5000) | ✓ (FIXED: uses group.shareValue) |
| Savings withdrawals | ✗ | ✓ |
| Loans | ✓ (basic) | ✓ (with products, guarantors, full lifecycle) |
| Loan products | ✗ | ✓ (per-cycle product definitions) |
| Loan guarantors | ✗ | ✓ |
| Loan repayments | ✓ (basic) | ✓ (with auto-close) |
| Cycles + share-out | ✗ | ✓ (one-click share-out computation) |
| Meetings + attendance | ✓ | ✓ (with bulk upsert, summary stats) |
| Social Fund | ✗ (dead WelfarePayment model) | ✓ (contributions + claims + workflow) |
| Fines | ✗ (config only) | ✓ (with pay/waive workflow) |
| Officer roles | ✗ (just isAdmin flag) | ✓ (CHAIRPERSON/SECRETARY/TREASURER with terms) |
| Double-entry bookkeeping | ✗ | ✓ (chart of accounts + journal entries + trial balance) |
| Master ledger | ✗ (dead VslaTransaction model) | ✓ (every operation writes to it) |
| Reports | ✗ | ✓ (trial balance, aging, member statements, portfolio) |
| Audit log | ✗ | ✓ (every VSLA action recorded) |

### 2. Bugs Fixed (from codebase audit)

| Bug | File | Fix |
|---|---|---|
| Share calc inconsistency (`/1000` vs `/5000`) | `src/app/api/vsla/route.ts` vs `savings/route.ts` | Both now use `group.shareValue` via `calculateShares()` in `vsla-engine.ts` |
| `totalSavings` hardcoded to 0 | `groups/route.ts` line 17 | Now computed via `db.vslaSaving.aggregate()` |
| Dead `VslaTransaction` model | Never written to | Now written by every VSLA operation |
| Dead `WelfarePayment` model | Never written to | Replaced with proper `VslaSocialFundContribution` + `VslaSocialFundClaim` |

### 3. New Files

**Backend (under `src/`):**
- `src/lib/vsla-engine.ts` — Centralized business logic (share calc, loan calc, aging, ledger posting, audit log)
- `src/lib/format.ts` — UGX/number/date formatters
- `src/lib/api-helpers.ts` — Client-side API helper + `useApi` hook
- `src/app/admin-v3/page.tsx` — Unified Platform Admin (1900+ lines, 12 module views)
- `src/app/api/auth/login/route.ts` — Demo login with 5 roles
- `src/app/api/seed/route.ts` — One-click demo data seeder
- 25+ new API routes under `src/app/api/vsla/*`, `src/app/api/admin/*`, `src/app/api/nssf/*`, `src/app/api/payments/*`, `src/app/api/sms/*`, `src/app/api/ussd/*`, `src/app/api/partners/*`

**Database:**
- `prisma/schema_vsla_full.prisma` — Complete schema reference (30+ models). Append the new models to your existing `prisma/schema.prisma`.

**Mobile (under `mobile/lib/features/vsla_v3/`):**
- 13 Dart files: config, api_service, models, login, home, dashboard, vsla_groups, vsla_group_detail, vsla_loans, vsla_savings, vsla_meetings, vsla_social_fund, nssf
- `mobile/pubspec_v3.yaml` — dependencies for the v3 app
- `mobile/README_VSLA_V3.md` — comprehensive setup guide

## Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| Super Admin | `eric@mobipay.agrobase` | `mobipay2025` | All 12 modules, all tenants |
| Tenant Admin | `admin@kilimo.org` | `kilimo2025` | VSLA, NSSF, payments, reports |
| VSLA Officer | `officer@kilimo.org` | `officer2025` | VSLA field operations |
| Partner Admin | `partner@kilimotrust.org` | `partner2025` | Revenue splits, settlements |
| Finance | `finance@coop.ug` | `finance2025` | Payments, NSSF, billing |

## How to Test

### Backend + Admin
1. Switch to this branch: `git checkout feat/full-vsla-module-and-admin`
2. Append the new models from `prisma/schema_vsla_full.prisma` to your existing `prisma/schema.prisma` (or use the full file as a reference)
3. Run `bun run db:push` to apply schema changes
4. Run `bun run dev`
5. Visit `/admin-v3` — you'll see the login screen with one-click demo logins
6. After login, the admin auto-seeds demo data (3 tenants, 5 VSLA groups, 42 members, 32 loans, 561 savings records, Kilimo Trust partner with MoU terms)

### Mobile App
1. The v3 mobile files are at `mobile/lib/features/vsla_v3/`
2. To run as a standalone app, replace `mobile/lib/main.dart` with `mobile/lib/main_v3.dart`
3. Update `Config.baseUrl` in `mobile/lib/features/vsla_v3/data/config.dart` to point at your backend
4. `flutter pub get` then `flutter run`

## Kilimo Trust Partnership — MoU Terms Captured

The partnership module stores the agreed revenue split structure:

| Stream | Kilimo Trust | MobiPay | Notes |
|---|---|---|---|
| **A. Program Commission** | 55% | 45% | KT leads mobilization |
| **B. Transaction Fees** | 30% | 70% | MP absorbs system + USSD + MNO costs |
| **C. Float Income** | 55% | 45% | KT holds OVA, float risk transferred to KT |

The `/api/admin/revenue-split` endpoint creates per-transaction splits with cost deductions. The `/api/partners/[id]/settlements` endpoint generates monthly settlement statements per stream.

⚠️ **Approval Needed**: Before wiring auto-split at transaction time (currently batch settlement), Eric needs to confirm the gross-vs-net treatment of MNO costs on the 70% transaction fee share, and whether the 55/45 float split applies before or after MNO interest is paid.

## Architecture Decisions

1. **Double-entry bookkeeping from Day 1** — every financial transaction posts debits and credits. Trial balance auto-generates per group.
2. **Single-instance multi-tenant** — VSLA groups have `tenantId` for row-level isolation. No per-tenant DB schemas.
3. **Monthly batch settlement** for KT revenue splits (MVP). Auto-split at transaction time is a v2 upgrade.
4. **USSD-first for members** — mobile app for officers; USSD for member self-service (via `/api/ussd`).
5. **Audit log is non-blocking** — every write fires `writeAuditLog()` async; failures don't roll back the operation.

## Migration Path to Production

1. Append new models to `prisma/schema.prisma` (from `schema_vsla_full.prisma`)
2. Run `prisma migrate dev --name add-full-vsla-module`
3. Move `/admin-v3/page.tsx` to wherever you want the unified admin (e.g. `/admin` if you want to replace the existing one, or keep `/admin-v3` as a parallel view)
4. Wire authentication — currently uses demo tokens; replace with your existing NextAuth setup
5. Update the new API routes to use your existing `getServerSession()` for auth
6. The Flutter app's `Config.baseUrl` needs to point at your production domain

## What's Next (Pending Eric's Approval)

1. **Wire auto-split at transaction time** (currently batch) — pending approval on Kilimo revenue split %
2. **MTN MoMo + Airtel Money integration** for loan disbursements — pending Joel providing merchant credentials
3. **USSD shortcode activation** — pending Joel configuring Africa's Talking USSD to point at our endpoints
4. **V2 data migration** — pending Eric providing CSV or cPanel access
5. **NSSF API sandbox** — pending NSSF providing API docs
