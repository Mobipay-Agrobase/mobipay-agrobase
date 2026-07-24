# VSLA Integration Architecture

## Core Principle: VSLA Cashbox is the Central Ledger

All money flowing in/out of a VSLA group goes through the **cashbox**. Every module that touches VSLA money creates a `VslaCashboxEntryV2` record + a `VslaTransactionV2` record. This keeps the group's financial position always accurate.

```
                    ┌─────────────────────────────────────────────────┐
                    │           VSLA Group Cashbox                     │
                    │   (running balance = sum of all entries)         │
                    └──────────┬──────────────┬─────────────┬─────────┘
                               │              │             │
                    ┌──────────▼──┐  ┌───────▼────┐  ┌────▼──────┐
                    │   SAVINGS   │  │   LOANS    │  │  WELFARE  │
                    │  (IN)       │  │  (OUT/IN)  │  │  (IN/OUT) │
                    └─────────────┘  └────────────┘  └───────────┘
                         ↑               ↑↓              ↑↓
                    ┌────┴────┐    ┌─────┴─────┐   ┌────┴─────┐
                    │ Members │    │ Loan Mgmt │   │ Insurance│
                    │ save    │    │ Module    │   │ Claims   │
                    └─────────┘    └───────────┘   └──────────┘
                         ↑               ↑              ↑
                    ┌────┴────┐    ┌─────┴─────┐   ┌────┴─────┐
                    │ Mobile  │    │ MoMo      │   │ Carbon   │
                    │ Money   │    │ Gateway   │   │ Credits  │
                    └─────────┘    └───────────┘   └──────────┘
```

## Integration Details per Module

### 1. Loan Management (Institutional Loans)
**Flow**: VSLA member repayment history → credit score → MFI loan eligibility
- VSLA loan repayment history (from `VslaTransactionV2` where type=LOAN_REPAYMENT) feeds into the credit scoring engine
- When a member applies for an institutional MFI loan, the system checks their VSLA repayment rate
- Good VSLA repayment history → higher credit score → better loan terms
- **API hook**: `GET /api/vsla-v2/members/[id]/passbook` → extract repayment history → pass to credit scoring engine

### 2. Input Purchase (Bulk Buy)
**Flow**: Group decides to buy inputs → cashbox pays → input distribution tracked
- Group admin creates a bulk input purchase order
- Cashbox entry: `type=LOAN_OUT, amount=totalCost` (cashbox decreases)
- Input distribution tracks which members received inputs
- When members pay for inputs, cashbox entry: `type=SAVING_IN` (cashbox increases)
- **API hook**: `POST /api/vsla-v2/cashbox/[groupId]/entry` with `type=LOAN_OUT` + `refType=INPUT_PURCHASE` + `refId=purchaseId`

### 3. Product Sales (Collective Selling)
**Flow**: Group sells produce collectively → proceeds deposited to cashbox → share-out increases
- Group admin records a collective sale
- Cashbox entry: `type=SAVING_IN, amount=saleAmount` (cashbox increases)
- Each member's share of the sale is calculated proportionally to their shares
- At cycle close (share-out), the increased cashbox means higher per-share payout
- **API hook**: `POST /api/vsla-v2/cashbox/[groupId]/entry` with `type=SAVING_IN` + `refType=PRODUCT_SALE` + `refId=saleId`

### 4. Marketplace
**Flow**: VSLA group lists produce on marketplace → buyer purchases → sale proceeds auto-deposit to cashbox
- Group admin creates a marketplace listing (linked to VSLA group)
- When a buyer purchases, the marketplace payment completes
- Auto-create cashbox entry: `type=SAVING_IN` (proceeds go to group cashbox)
- SMS notification sent to group admin + key holders
- **API hook**: Marketplace order completion webhook → `POST /api/vsla-v2/cashbox/[groupId]/entry`

### 5. Crop Insurance
**Flow**: Welfare fund covers insurance premiums → insurance claims auto-deposit to cashbox
- Group decides to buy crop insurance for members
- Cashbox entry: `type=WELFARE_OUT, amount=premiumTotal` (welfare fund pays)
- If an insurance claim is approved:
  - Cashbox entry: `type=SAVING_IN, amount=claimAmount` (claim payout deposited)
  - SMS notification to all affected members
- **API hook**: Insurance claim approval → `POST /api/vsla-v2/cashbox/[groupId]/entry` with `type=SAVING_IN` + `refType=INSURANCE_CLAIM`

### 6. Mobile Money (MoMo)
**Flow**: Loan disbursements + repayments via MTN/Airtel → cashbox updated via payment gateway callback
- When a loan is disbursed via MoMo:
  - Payment gateway sends callback → verify signature → update payment status
  - Auto-create cashbox entry: `type=LOAN_OUT` (cashbox decreases)
- When a member repays via MoMo:
  - Payment gateway callback → verify → update loan repayment
  - Auto-create cashbox entry: `type=LOAN_REPAY_IN` (cashbox increases)
- **API hook**: Payment callback (`/api/payments/callback/[provider]`) → if payment type=VSLA → create cashbox entry

### 7. SMS Notifications
**Flow**: All VSLA events send SMS via Africa's Talking
- Already implemented in V2 APIs:
  - Member registration → welcome SMS with PIN
  - Login → OTP via SMS
  - Loan application → notify all key holders
  - Loan approved/rejected → notify member
  - Loan disbursed → notify member + key holders
  - Cycle close → notify all members with share-out amount
- **Integration**: VSLA V2 SMS service (`src/lib/vsla-v2/sms.ts`) is already wired

### 8. USSD
**Flow**: Members access VSLA via USSD on feature phones
- Member dials USSD code → enters member ID + PIN
- USSD menu options:
  1. Check my savings balance
  2. Check my loan status
  3. Apply for loan
  4. View next meeting
  5. Repay loan (via MoMo)
- **API hook**: USSD session handler calls V2 APIs (`/api/vsla-v2/members/login-otp`, `/api/vsla-v2/loan/eligibility-check`, etc.)

### 9. Payment Gateway
**Flow**: VSLA cashbox integrates with payment gateway → gateway enforces cashbox limit
- Before any disbursement, the payment gateway checks the group's cashbox balance
- If disbursement amount > cashbox balance → block + alert admin
- This prevents groups from over-lending beyond their available funds
- **API hook**: Payment gateway pre-check → `GET /api/vsla-v2/groups/[id]` → check `cashboxBalance`

### 10. NSSF Contributions
**Flow**: VSLA members make NSSF contributions from their savings
- Member authorizes NSSF deduction from their VSLA savings
- Cashbox entry: `type=LOAN_OUT` (member's savings decrease)
- NSSF contribution record created with `partnerCode=KT` (if Kilimo Trust program)
- SMS confirmation sent to member
- **API hook**: NSSF contribution creation → also create VSLA cashbox entry

### 11. Reports
**Flow**: VSLA data feeds into platform-wide reports
- Group financials → consolidated tenant report
- Member statements → individual farmer profile
- Loan portfolio → risk assessment report
- Attendance → engagement report
- **API hook**: `GET /api/vsla-v2/groups/[id]/report` → feeds into Reports module

### 12. Carbon Credits
**Flow**: VSLA groups participating in carbon projects → credit payouts to cashbox
- Carbon project verifies a group's sustainable practices
- Carbon credit payout calculated
- Cashbox entry: `type=SAVING_IN, amount=payoutAmount` (carbon income deposited)
- At cycle close, carbon income is included in share-out distribution
- **API hook**: Carbon credit payout → `POST /api/vsla-v2/cashbox/[groupId]/entry` with `refType=CARBON_CREDIT`

## Integration Priority

| Phase | Module | Why First |
|---|---|---|
| **Phase 1** (now) | Mobile Money + SMS | Already wired — loan disbursements need MoMo to be real |
| **Phase 2** (next) | USSD | Members need phone access — most VSLA members don't have smartphones |
| **Phase 3** | Reports + Member Passbook | Officers need visibility into group health |
| **Phase 4** | Loan Management + Credit Scoring | VSLA repayment history → MFI loan eligibility |
| **Phase 5** | Input Purchase + Product Sales + Marketplace | Group commerce flows |
| **Phase 6** | Crop Insurance + NSSF + Carbon Credits | Specialized integrations |

## Member Passbook (Bank-Style Statement)

Each member can view their VSLA transactions like a bank passbook:
- Chronological list of all transactions (savings, loans, repayments, welfare, fines, share-out)
- Running balance after each transaction
- Summary: total savings, total shares, outstanding loans, attendance rate
- Loan history with approval status and key holder votes
- Meeting attendance history

**API**: `GET /api/vsla-v2/members/[id]/passbook`
**Web UI**: Accessible from Group Detail → click any member → opens passbook
**Mobile UI**: Member dashboard → "My Statement" → passbook view
**Farmer Profile**: VSLA passbook embedded in the farmer profile page (linked by phone number or national ID)

## Group Report (Dashboard with Charts)

Each group has a comprehensive report with:
- **Overview**: members, key holders, loans, cashbox, savings, outstanding, fines, attendance
- **Charts**: monthly savings trend (bar), loan portfolio distribution (pie), attendance trend (bar)
- **Ledger**: full transaction history (date, type, member, in/out, reference) — last 100 entries
- **Top Savers**: leaderboard of members by total savings
- **Config**: current group settings (share price, multiplier, fines, etc.)

**API**: `GET /api/vsla-v2/groups/[id]/report`
**Web UI**: Group card → "View Details" → 5-tab dialog (Overview, Charts, Ledger, Top Savers, Config)
