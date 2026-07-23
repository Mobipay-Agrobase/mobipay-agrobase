# VSLA Module V1 Backup

**Backed up:** 23 July 2026
**Reason:** Replaced by VSLA V2 per SRS v3 document from CEO Nana Kwabena Agyei

## What's in this backup

| File/Folder | Original Location | Description |
|---|---|---|
| `schema_v1_backup.prisma` | `prisma/schema.prisma` | Full Prisma schema including V1 VSLA models |
| `api_vsla/` | `src/app/api/vsla/` | All V1 VSLA API routes (groups, loans, savings, meetings, etc.) |
| `VslaView_v1.tsx` | `src/components/modules/VslaView.tsx` | V1 VSLA admin UI component |
| `LoansView_v1.tsx` | `src/components/modules/LoansView.tsx` | V1 institutional loans UI component |
| `mobile_vsla/` | `mobile/lib/features/vsla/` | V1 Flutter VSLA screens |
| `mobile_vsla_v3/` | `mobile/lib/features/vsla_v3/` | V3 Flutter VSLA screens (from earlier work) |

## Why V1 was replaced

V1 was a generic savings/loan tracker. The SRS specifies a **ceremonial VSLA platform** with:
- Key holders (3-6 per group) with unanimous loan approval
- E-Teller role (any member can record transactions at meetings)
- Auto-eligibility check before human approval
- SMS OTP for member login
- LOAN FREEZE 30 days before cycle end
- Cycle close = archive, no further edits
- Group cashbox concept
- Member KYC (photo + ID capture)
- Welcome SMS with PIN on registration

V2 implements all of these.

## How to restore V1 (if needed)

1. Copy `api_vsla/` back to `src/app/api/vsla/`
2. Copy `VslaView_v1.tsx` back to `src/components/modules/VslaView.tsx`
3. Copy `mobile_vsla/` back to `mobile/lib/features/vsla/`
4. Restore the V1 Prisma models from `schema_v1_backup.prisma`
5. Run `bunx prisma db push`
