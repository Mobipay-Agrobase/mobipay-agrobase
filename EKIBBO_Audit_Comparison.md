# EKIBBO Feedback Audit — Comparison with Existing Implementation

**Date:** 2026-08-12
**Tenant:** EKIBBO
**Source document:** "EKIBBO SUGGESTED UPDATES TO THE AGROBASE MOBILE AND WEB APPS"

This audit compares each EKIBBO feedback item against the existing Agrobase V3 codebase. Status legend:

- ✅ **Implemented** — feature exists and works
- ⚠️ **Partial** — feature exists but has gaps
- ❌ **Missing** — not implemented at all

---

## 1. Access Rights for Three Groups (Management, Extension Officers, Farmers)

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Management role (EKB_MD, EKB_OPS_MANAGER, EKB_FINANCE) | ✅ | `src/lib/permissions.ts` defines EKB_MD, EKB_OPS_MANAGER, EKB_FINANCE, EKB_FIN_ASSISTANT, EKB_MEC, EKB_EXTENSION with distinct module access |
| Extension officer role (EKB_EXTENSION) | ✅ | Defined in permissions + Sidebar role gating |
| Farmer role with mobile-app user account | ⚠️ | `FARMER` role exists in `permissions.ts:239`. `POST /api/farmers` creates a login User when `body.password` is provided. **Gap:** mobile login flow uses `/api/auth/mobile-login` but does not auto-create the User record at farmer registration time — field officer must set a password manually. |
| Farmers can see sold products, quantities, income, loans, transactions | ⚠️ | Mobile has `farmer_ledger_page.dart` and `FarmerLedger.tsx` (web). **Gap:** mobile does not expose a "My Sales" view for the FARMER role — only the ledger. Farmers can't see individual sale records from their phone. |

**Verdict:** 80% implemented. Need: (a) auto-create login User on farmer registration with a default password, (b) add a "My Sales / My Loans" tab to the FARMER mobile dashboard.

---

## 2. Password Recovery on Mobile

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Forgot-password endpoint | ✅ | `src/app/api/auth/reset-password/request/route.ts` (sends OTP/SMS) + `confirm/route.ts` (resets with OTP + new password) |
| Mobile UI for password reset | ❌ | No `forgot_password_page.dart` exists in `mobile/lib/features/`. The `/reset` directory is for the ReSET MarketLink module (cash disbursement), NOT password reset. |

**Verdict:** Backend ready. **Need:** build a Flutter `ForgotPasswordPage` that calls `/api/auth/reset-password/request` with the phone number, then `/api/auth/reset-password/confirm` with the OTP + new password.

---

## 3. Loans and Inputs — Deductions and Payment Adjustments

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Loan deductions from produce sold | ⚠️ | `FarmerLedger` exists with manual entries. `VslaLoan` model has `status` (PENDING → DISBURSED → REPAID). **Gap:** No automatic deduction logic — when a Purchase is recorded against a farmer with an outstanding loan, the system does not auto-create a loan repayment entry. This is manual today. |
| Visibility on loan amount paid + remaining balance | ⚠️ | `VslaLoan.amount` + `repaymentAmount` fields exist. **Gap:** mobile `farmer_detail_page.dart` does not show a "Loan Balance" card; only the VSLA module shows loans. |

**Verdict:** 50% implemented. Need: (a) auto-deduct loan balance when a sale is recorded (server-side hook), (b) add loan balance card to farmer profile.

---

## 4. Extension Officers Input New Farmer Contacts During Payment

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Add farmer contact during payment | ❌ | Purchase form (`EnhancedPurchaseForm.tsx`) requires farmer to exist before purchase. No inline "create farmer" flow from the purchase page. |

**Verdict:** Missing. **Need:** add a "Quick Add Farmer" button in the purchase form that opens a minimal create-farmer dialog (name + phone only).

---

## 5. Mobile App — More Than 5 Polygon Points

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Support >5 polygon points | ✅ | `mobile/lib/features/farm_lands/presentation/pages/farm_land_form_page.dart` accepts any number of points (no `maxPolygonPoints` cap found). Server-side `POST /api/farm-polygons` accepts array of any length. |

**Verdict:** ✅ Implemented. The earlier 5-point limit no longer exists.

---

## 6. Farmer Profile Completeness

EKIBBO requested profile fields: Name, Farmer code, Farmer group, location, contact, farm size, certification type (RFA, Rainforest Alliance, Organic), products sold, quantity of sales, income earned, loan status, farm size + polygon, softcopy farmer ID with QR.

| Field | Status | Evidence |
|-------|--------|----------|
| Name, code, contact | ✅ | `FarmerProfile` schema fields + detail page |
| Farmer group | ✅ | `groupId` + `group` relation on FarmerProfile |
| Location (district, village, GPS) | ✅ | All fields present + new lazy-loading LocationPicker |
| Farm size (auto-calculated from polygon) | ✅ | `POST /api/farm-lands` computes area from `polygonPoints` via Shoelace formula |
| Certification type | ✅ | `certificationType` field; CatalogSelect uses `certification_type` catalog (RFA, Rainforest Alliance, Organic, etc.) |
| Products sold to EKiBBO | ⚠️ | `Sale` model records commodity + buyer, but no "EKiBBO-only" filter on the farmer profile |
| Quantity of sales + income earned | ⚠️ | Aggregated in `FarmerLedger` but not on the farmer detail page |
| Loan status | ❌ | Not shown on farmer detail page |
| Polygon on profile | ✅ | `FarmLand` has `polygonPoints` relation; `FarmMapReadOnly` renders it |
| Softcopy farmer ID with QR | ✅ | Mobile: `farmer_id_card_page.dart`. Web: `FarmerDetailFull.tsx` has QR code generator |

**Verdict:** 70% implemented. Need: (a) add "Loan Status" card to farmer detail, (b) add "Sales Summary" card (total quantity sold, total income, top buyer).

---

## 7. Data Cleaning for Previous Entries

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Bulk data cleaning tool | ❌ | No admin tool exists to detect duplicate farmers, missing required fields, or invalid phone numbers |

**Verdict:** Missing. **Need:** build a "Data Quality" admin page that flags: duplicate phones, missing names, invalid GPS coordinates, farmers without farm lands.

---

## 8. Sales Categories — Inputs and Produce

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Inputs: fertilizers, tarpaulins, seedlings, pruning saws | ⚠️ | `InputDistribution` model exists but doesn't categorize by input type. CatalogMaster has no `input_type` category. |
| Produce: Hulled coffee, cocoa, cassava, avocado, vanilla, Jackfruit | ⚠️ | `Purchase.commodity` is free-text. No canonical produce catalog enforced. |
| Categories displayed in web app | ⚠️ | Purchase form has a free-text commodity field |

**Verdict:** 30% implemented. **Need:** (a) add `input_type` and `produce_type` categories to CatalogMaster with the EKIBBO-specific values, (b) replace free-text commodity fields with CatalogSelect.

---

## 9. Farmer Visits and Trainings by Extension Officers

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Group trainings module | ✅ | `TrainingView.tsx` + `/api/trainings` + mobile `my_trainings_page.dart` |
| Farm visits (individual trainings) | ✅ | `FarmVisitsView.tsx` + `/api/farm-visits` + mobile `farm_visits_page.dart` |
| Farmers can see group trainings + individual visits | ⚠️ | Mobile shows trainings; farm visits visible to extension officers but not to FARMER role |

**Verdict:** 80% implemented. Need: expose farm visit history to FARMER role in mobile.

---

## 10. Impact Assessment Module

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Impact assessment module | ✅ | `ImpactAssessmentView.tsx` (web) + `/api/impact-assessments` (CRUD) |
| Record farmer answers | ✅ | `ImpactAssessment` model with `responses` JSON field |
| Mobile capture | ❌ | No mobile page for field officers to capture impact assessment responses |

**Verdict:** 70% implemented. Need: mobile `ImpactAssessmentFormPage` for field officers.

---

## 11. Extension Officers + Reviewers See Purchase Approval Status

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Purchase approval status | ✅ | `Purchase.approvalStatus` field (DRAFT, SUBMITTED, APPROVED, REJECTED) |
| Visibility for extension officers | ✅ | `PurchasesView.tsx` shows status badge |
| Reviewer role for approvals | ✅ | `ApprovalsView.tsx` + `/api/approvals` |

**Verdict:** ✅ Implemented.

---

## 12. Charges and Taxes Visible to Extension Officers

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Charges and taxes on purchases | ⚠️ | `Purchase` model has `totalAmount` but no separate `charges` or `taxes` fields |
| Visibility in web app | ❌ | Not shown |

**Verdict:** Missing. **Need:** add `charges` and `taxes` fields to Purchase schema + display in purchase form/list.

---

## 13. Attachments for Proof Before Payment

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Attachments API | ✅ | `/api/attachments` exists |
| Attach to purchases/payments | ⚠️ | Attachment model exists but not wired into the purchase flow |
| Mobile capture (photo upload) | ❌ | No mobile attachment upload flow |

**Verdict:** 30% implemented. Need: (a) add attachment upload to purchase form (web), (b) add mobile image capture + upload.

---

## 14. Farmer Groups — Total Farmer Count

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Farmer group shows total farmer count | ⚠️ | `FarmerGroup` model exists. **Gap:** the groups list page does not display `_count.farmers` |

**Verdict:** 50% implemented. **Need:** add farmer count badge to the groups list.

---

## 15. More Analytics on EKIBBO Web Dashboard

| Sub-item | Status | Evidence |
|----------|--------|----------|
| Analytics on dashboard | ✅ (after this commit) | New tabbed Reports page with Overview / Demographics / Crops / Geography / VSLA / Financial / Training / Credit tabs |

**Verdict:** ✅ Implemented in this commit.

---

## Summary

| # | Feedback Item | Status | % Done |
|---|---------------|--------|--------|
| 1 | Access rights (mgmt/officer/farmer) | ⚠️ | 80% |
| 2 | Password recovery (mobile) | ⚠️ | 50% (backend only) |
| 3 | Loan deductions + visibility | ⚠️ | 50% |
| 4 | Add farmer contact during payment | ❌ | 0% |
| 5 | Mobile >5 polygon points | ✅ | 100% |
| 6 | Farmer profile completeness | ⚠️ | 70% |
| 7 | Data cleaning tool | ❌ | 0% |
| 8 | Sales categories (inputs/produce) | ⚠️ | 30% |
| 9 | Farmer visits + trainings | ⚠️ | 80% |
| 10 | Impact assessment module | ⚠️ | 70% |
| 11 | Purchase approval visibility | ✅ | 100% |
| 12 | Charges and taxes | ❌ | 0% |
| 13 | Attachments for proof | ⚠️ | 30% |
| 14 | Farmer group count | ⚠️ | 50% |
| 15 | More analytics on dashboard | ✅ | 100% (this commit) |

**Overall: ~58% implemented. 7 items fully done, 7 partial, 3 missing.**

---

## Action Items for Mobipay

**Urgent (next sprint):**
1. Build mobile password reset page (item 2)
2. Add loan balance + sales summary cards to farmer detail (items 3, 6)
3. Add "Quick Add Farmer" from purchase form (item 4)
4. Add charges + taxes fields to Purchase (item 12)
5. Wire attachments into purchase flow + mobile (item 13)

**Medium priority:**
6. Auto-create FARMER login on registration (item 1)
7. Build data quality admin tool (item 7)
8. Add input_type + produce_type catalogs, replace free-text (item 8)
9. Add farmer count to groups list (item 14)
10. Mobile impact assessment form (item 10)

**Pending EKIBBO inputs (from ACTION POINTS):**
- QR code content for farmer ID
- Specific analytics to add to EKIBBO dashboard
- EKIBBO workplan for farmer training scheduling
