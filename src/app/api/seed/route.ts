import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureGroupAccounts, calculateShares, calculateLoan, Refs, postJournalEntry, VSLA_TRANSACTION_TYPES } from '@/lib/vsla-engine';

// POST /api/seed — populate demo data for the unified admin
export async function POST(req: NextRequest) {
  // Idempotent: clear existing data first (in dependency order)
  await db.auditLog.deleteMany();
  await db.vslaJournalEntry.deleteMany();
  await db.vslaAccount.deleteMany();
  await db.vslaTransaction.deleteMany();
  await db.vslaAttendance.deleteMany();
  await db.vslaMeeting.deleteMany();
  await db.vslaLoanRepayment.deleteMany();
  await db.vslaLoanGuarantor.deleteMany();
  await db.vslaLoan.deleteMany();
  await db.vslaLoanProduct.deleteMany();
  await db.vslaCycle.deleteMany();
  await db.vslaSavingWithdrawal.deleteMany();
  await db.vslaSaving.deleteMany();
  await db.vslaFine.deleteMany();
  await db.vslaSocialFundClaim.deleteMany();
  await db.vslaSocialFundContribution.deleteMany();
  await db.vslaOfficerRole.deleteMany();
  await db.vslaMember.deleteMany();
  await db.vslaGroup.deleteMany();
  await db.smsLog.deleteMany();
  await db.ussdSession.deleteMany();
  await db.payment.deleteMany();
  await db.nssfContribution.deleteMany();
  await db.revenueSplit.deleteMany();
  await db.partnerSettlement.deleteMany();
  await db.partner.deleteMany();
  await db.moduleEntitlement.deleteMany();
  await db.user.deleteMany();
  await db.tenant.deleteMany();
  await db.module.deleteMany();

  // 1. Tenants
  const tenants = await Promise.all([
    db.tenant.create({ data: { name: 'Kilimo Trust Uganda', code: 'KT-UG', country: 'UGANDA', plan: 'ENTERPRISE', status: 'ACTIVE', mrr: 2500000 } }),
    db.tenant.create({ data: { name: 'MobiPay Demo Co-op', code: 'MP-DEMO', country: 'UGANDA', plan: 'GROWTH', status: 'ACTIVE', mrr: 750000 } }),
    db.tenant.create({ data: { name: 'Nakivaale Refugee Settlement', code: 'NAK', country: 'UGANDA', plan: 'STARTER', status: 'TRIAL', mrr: 0 } }),
  ]);

  // 2. Users (passwords are demo only)
  const passwordHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; // "password"
  await Promise.all([
    db.user.create({ data: { tenantId: tenants[0].id, email: 'eric@mobipay.agrobase', name: 'Eric Mwangi', role: 'SUPER_ADMIN', passwordHash, status: 'ACTIVE' } }),
    db.user.create({ data: { tenantId: tenants[0].id, email: 'admin@kilimo.org', name: 'Beatrice Auma', role: 'TENANT_ADMIN', passwordHash, status: 'ACTIVE' } }),
    db.user.create({ data: { tenantId: tenants[0].id, email: 'officer@kilimo.org', name: 'Joel Okello', role: 'VSLA_OFFICER', passwordHash, status: 'ACTIVE' } }),
    db.user.create({ data: { tenantId: tenants[1].id, email: 'finance@coop.ug', name: 'Sarah Namutebi', role: 'TENANT_ADMIN', passwordHash, status: 'ACTIVE' } }),
    db.user.create({ data: { tenantId: tenants[0].id, email: 'partner@kilimotrust.org', name: 'Kilimo Trust Liaison', role: 'PARTNER_ADMIN', passwordHash, status: 'ACTIVE' } }),
  ]);

  // 3. Partner (Kilimo Trust) — captures the MoU terms
  const ktPartner = await db.partner.create({
    data: {
      code: 'KT',
      name: 'Kilimo Trust',
      type: 'IMPLEMENTING_PARTNER',
      contactName: 'John Mukasa',
      contactEmail: 'jmukasa@kilimotrust.org',
      contactPhone: '+256700000111',
      status: 'ACTIVE',
      agreementDate: new Date('2025-07-22'),
      agreementTerms: JSON.stringify({
        commission: { kilimoTrust: 55, mobipay: 45, costAllocation: 'NONE' },
        transactionFee: {
          mobipay: 70,
          kilimoTrust: 30,
          costAllocation: 'MOBIPAY_ABSORBS',
          note: "MobiPay's 70% covers system, USSD, and payment processing costs (gross split). KT receives full 30% with no cost deduction."
        },
        float: {
          kilimoTrust: 55,
          mobipay: 45,
          costAllocation: 'NONE',
          note: 'OVA held by Kilimo Trust. Float management risk transferred to KT.'
        },
        operationalRoles: {
          kilimoTrust: 'Farmer mobilization, coordination, M&E, all field activities in regions where KT has an existing farmer base',
          mobipay: 'System provision, onboarding of farmers once mobilized by KT, overall payment infrastructure',
        },
        nextSteps: [
          'Formalize into MoU between MobiPay and Kilimo Trust',
          'Confirm OVA account setup with respective MNOs under Kilimo Trust',
          'Align on farmer onboarding timelines once mobilization begins',
        ],
        signedOff: true,
        source: 'Eric Mwangi meeting with Kilimo Trust, 22 July 2026',
      }),
    },
  });

  // 4. VSLA Groups — each with UNIQUE per-group config (demonstrating dynamic behavior)
  const groupsData = [
    {
      tenantId: tenants[0].id, name: 'Buwama Rural Farmers VSLA', region: 'Central', district: 'Mpigi',
      // Savings config
      shareValue: 5000, minSavingsPerMeeting: 5000, maxSavingsPerMeeting: 25000,
      // Loan config
      loanInterestRate: 10, maxLoanMultiplier: 3, defaultLoanTermDays: 90, gracePeriodDays: 7, lateRepaymentPenaltyRate: 2,
      // Meeting config
      meetingFrequency: 'WEEKLY', meetingDay: 'TUESDAY', meetingStartTime: '14:00', meetingEndTime: '16:00', defaultMeetingLocation: 'Buwama Community Hall',
      // Welfare
      welfareContribution: 1000, socialFundMaxClaim: 200000,
      // Fines
      lateAttendanceFine: 500, absenceFine: 2000, lateRepaymentFine: 1000,
      // Share-out
      shareOutInterestSplit: 80, reservePercentage: 20,
    },
    {
      tenantId: tenants[0].id, name: 'Kayunga Coffee Growers VSLA', region: 'Central', district: 'Kayunga',
      shareValue: 5000, minSavingsPerMeeting: 5000, maxSavingsPerMeeting: 50000,
      loanInterestRate: 12, maxLoanMultiplier: 4, defaultLoanTermDays: 120, gracePeriodDays: 14, lateRepaymentPenaltyRate: 3,
      meetingFrequency: 'WEEKLY', meetingDay: 'THURSDAY', meetingStartTime: '15:00', meetingEndTime: '17:00', defaultMeetingLocation: 'Kayunga Co-op Society',
      welfareContribution: 2000, socialFundMaxClaim: 500000,
      lateAttendanceFine: 1000, absenceFine: 3000, lateRepaymentFine: 2000,
      shareOutInterestSplit: 90, reservePercentage: 10,
    },
    {
      tenantId: tenants[0].id, name: 'Nakivale Refugee Women VSLA', region: 'Western', district: 'Isingiro',
      // Smaller share value (lower income demographic)
      shareValue: 2000, minSavingsPerMeeting: 2000, maxSavingsPerMeeting: 10000,
      // Lower interest rate (refugee program subsidy)
      loanInterestRate: 8, maxLoanMultiplier: 2, defaultLoanTermDays: 60, gracePeriodDays: 14, lateRepaymentPenaltyRate: 1,
      meetingFrequency: 'BIWEEKLY', meetingDay: 'MONDAY', meetingStartTime: '10:00', meetingEndTime: '12:00', defaultMeetingLocation: 'Nakivale Settlement Zone 3',
      welfareContribution: 500, socialFundMaxClaim: 100000,
      // Smaller fines (lower income)
      lateAttendanceFine: 200, absenceFine: 1000, lateRepaymentFine: 500,
      shareOutInterestSplit: 100, reservePercentage: 0,
    },
    {
      tenantId: tenants[1].id, name: 'Mpigi Matooke Traders VSLA', region: 'Central', district: 'Mpigi',
      // Traders — higher share value (business capital)
      shareValue: 10000, minSavingsPerMeeting: 10000, maxSavingsPerMeeting: 100000,
      // Higher interest rate (commercial borrower)
      loanInterestRate: 15, maxLoanMultiplier: 3, defaultLoanTermDays: 30, gracePeriodDays: 0, lateRepaymentPenaltyRate: 5,
      meetingFrequency: 'MONTHLY', meetingDay: 'FRIDAY', meetingStartTime: '09:00', meetingEndTime: '11:00', defaultMeetingLocation: 'Mpigi Trading Centre',
      welfareContribution: 5000, socialFundMaxClaim: 1000000,
      // Higher fines (commercial group)
      lateAttendanceFine: 2000, absenceFine: 5000, lateRepaymentFine: 5000,
      shareOutInterestSplit: 70, reservePercentage: 30,
    },
    {
      tenantId: tenants[0].id, name: 'Jinja Cassava Cooperative VSLA', region: 'Eastern', district: 'Jinja',
      shareValue: 5000, minSavingsPerMeeting: 5000, maxSavingsPerMeeting: 30000,
      loanInterestRate: 10, maxLoanMultiplier: 3, defaultLoanTermDays: 180, gracePeriodDays: 30, lateRepaymentPenaltyRate: 2,
      meetingFrequency: 'WEEKLY', meetingDay: 'WEDNESDAY', meetingStartTime: '13:00', meetingEndTime: '15:00', defaultMeetingLocation: 'Jinja Coop Warehouse',
      welfareContribution: 1500, socialFundMaxClaim: 300000,
      lateAttendanceFine: 750, absenceFine: 2500, lateRepaymentFine: 1500,
      shareOutInterestSplit: 85, reservePercentage: 15,
    },
  ];

  const groups = [];
  for (const gd of groupsData) {
    const g = await db.vslaGroup.create({
      data: { ...gd, code: `VSLA-${groups.length + 1}-${Date.now().toString(36).toUpperCase().slice(-4)}`, status: 'ACTIVE', formedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) },
    });
    await ensureGroupAccounts(g.id);
    groups.push(g);
  }

  // 5. Members (8 per group on average)
  const firstNames = ['John', 'Mary', 'Peter', 'Sarah', 'James', 'Grace', 'David', 'Ruth', 'Samuel', 'Esther', 'Joseph', 'Hannah', 'Moses', 'Rebecca', 'Isaac', 'Deborah'];
  const lastNames = ['Mukasa', 'Nakato', 'Okello', 'Auma', 'Ssempa', 'Nabirye', 'Kato', 'Akello', 'Wasswa', 'Nalwoga', 'Byaruhanga', 'Atim'];
  const occupations = ['Farmer', 'Trader', 'Tailor', 'Teacher', 'Carpenter', 'Shopkeeper'];

  const members: Array<{ id: string; groupId: string; fullName: string; memberId: string }> = [];
  for (const group of groups) {
    const memberCount = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < memberCount; i++) {
      const fullName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const m = await db.vslaMember.create({
        data: {
          groupId: group.id,
          memberId: `MBR-${Date.now().toString(36).toUpperCase()}-${i}`,
          fullName,
          phone: `+2567${Math.floor(10000000 + Math.random() * 89999999)}`,
          nationalId: `CF${Math.floor(100000000 + Math.random() * 899999999)}`,
          gender: Math.random() > 0.5 ? 'FEMALE' : 'MALE',
          occupation: occupations[Math.floor(Math.random() * occupations.length)],
          nextOfKin: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
          nextOfKinPhone: `+2567${Math.floor(10000000 + Math.random() * 89999999)}`,
          status: 'ACTIVE',
          joinedAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        },
      });
      members.push({ id: m.id, groupId: group.id, fullName: m.fullName, memberId: m.memberId });
    }

    // Assign officer roles
    const groupMembers = members.filter((m) => m.groupId === group.id);
    if (groupMembers.length >= 3) {
      const roles = ['CHAIRPERSON', 'SECRETARY', 'TREASURER'];
      for (let i = 0; i < 3; i++) {
        await db.vslaOfficerRole.create({
          data: {
            groupId: group.id,
            memberId: groupMembers[i].id,
            role: roles[i],
            startDate: group.formedAt,
            status: 'ACTIVE',
            electedAt: group.formedAt,
          },
        });
      }
    }
  }

  // 6. Cycles
  for (const group of groups) {
    const cycleStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const cycleEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await db.vslaCycle.create({
      data: {
        groupId: group.id,
        name: `Cycle ${new Date().getFullYear()}-H1`,
        startDate: cycleStart,
        endDate: cycleEnd,
        status: 'ACTIVE',
        targetSavings: group.shareValue * 10 * 20,
      },
    });
  }

  // 7. Loan products per group — DIFFERENT products per group (demonstrating per-group customization)
  const groupProducts: Record<string, Array<{ name: string; code: string; interestRate: number; minAmount: number; maxAmount: number; termDays: number; gracePeriodDays: number; guarantorCount: number }>> = {
    'Buwama': [
      { name: 'School Fees', code: 'SCH', interestRate: 10, minAmount: 50000, maxAmount: 200000, termDays: 90, gracePeriodDays: 7, guarantorCount: 2 },
      { name: 'Farm Inputs', code: 'FARM', interestRate: 8, minAmount: 30000, maxAmount: 150000, termDays: 180, gracePeriodDays: 30, guarantorCount: 2 },
    ],
    'Kayunga': [
      { name: 'Coffee Harvest', code: 'CHV', interestRate: 12, minAmount: 100000, maxAmount: 500000, termDays: 120, gracePeriodDays: 14, guarantorCount: 3 },
      { name: 'Processing', code: 'PRC', interestRate: 14, minAmount: 50000, maxAmount: 300000, termDays: 90, gracePeriodDays: 14, guarantorCount: 2 },
      { name: 'Emergency', code: 'EM', interestRate: 18, minAmount: 20000, maxAmount: 100000, termDays: 30, gracePeriodDays: 0, guarantorCount: 1 },
    ],
    'Nakivale': [
      // Refugee women — small loans, low rates, longer grace
      { name: 'Micro Business', code: 'MIC', interestRate: 5, minAmount: 10000, maxAmount: 50000, termDays: 60, gracePeriodDays: 14, guarantorCount: 1 },
      { name: 'Emergency', code: 'EM', interestRate: 0, minAmount: 5000, maxAmount: 20000, termDays: 30, gracePeriodDays: 14, guarantorCount: 1 },
    ],
    'Mpigi Matooke': [
      // Traders — short-term working capital, higher rates
      { name: 'Working Capital', code: 'WC', interestRate: 15, minAmount: 100000, maxAmount: 1000000, termDays: 30, gracePeriodDays: 0, guarantorCount: 3 },
      { name: 'Bulk Purchase', code: 'BULK', interestRate: 18, minAmount: 500000, maxAmount: 3000000, termDays: 60, gracePeriodDays: 0, guarantorCount: 4 },
    ],
    'Jinja Cassava': [
      { name: 'Seasonal Planting', code: 'SEAS', interestRate: 10, minAmount: 50000, maxAmount: 300000, termDays: 180, gracePeriodDays: 30, guarantorCount: 2 },
      { name: 'Harvest Bridge', code: 'HBR', interestRate: 12, minAmount: 30000, maxAmount: 200000, termDays: 90, gracePeriodDays: 14, guarantorCount: 2 },
    ],
  };

  for (const group of groups) {
    const key = Object.keys(groupProducts).find((k) => group.name.includes(k));
    const products = key ? groupProducts[key] : [
      { name: 'Short-Term', code: 'ST', interestRate: 10, minAmount: 0, maxAmount: 200000, termDays: 60, gracePeriodDays: 0, guarantorCount: 2 },
    ];
    for (const p of products) {
      await db.vslaLoanProduct.create({
        data: { groupId: group.id, ...p, isActive: true },
      });
    }
  }

  // 8. Savings — multiple contributions per member
  let totalSavingsAmount = 0;
  for (const member of members) {
    const group = groups.find((g) => g.id === member.groupId)!;
    const contributionCount = 5 + Math.floor(Math.random() * 15);
    for (let i = 0; i < contributionCount; i++) {
      const amount = group.shareValue * (1 + Math.floor(Math.random() * 5));
      const sharesBought = calculateShares(amount, group.shareValue);
      const transactionRef = Refs.saving();
      const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);

      const saving = await db.vslaSaving.create({
        data: {
          groupId: member.groupId,
          memberId: member.id,
          amount,
          sharesBought,
          paymentMethod: Math.random() > 0.7 ? 'MOBILE_MONEY' : 'CASH',
          transactionRef,
          status: 'COMPLETED',
          createdAt,
        },
      });

      await db.vslaTransaction.create({
        data: {
          groupId: member.groupId,
          type: VSLA_TRANSACTION_TYPES.SAVING,
          amount,
          transactionRef,
          refType: 'SAVING',
          refId: saving.id,
          memberId: member.id,
          createdAt,
        },
      });

      totalSavingsAmount += amount;
    }
  }

  // 9. Loans
  let loanCount = 0;
  for (const member of members) {
    if (Math.random() < 0.4) continue; // ~60% of members have loans
    const group = groups.find((g) => g.id === member.groupId)!;
    const loanCount_ = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < loanCount_; i++) {
      const amount = 50000 + Math.floor(Math.random() * 200000);
      const calc = calculateLoan(amount, group.loanInterestRate, 60 + Math.floor(Math.random() * 120));
      const status = ['PENDING', 'APPROVED', 'DISBURSED', 'REPAID', 'OVERDUE'][Math.floor(Math.random() * 5)];
      const createdAt = new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000);
      const approvalDate = status !== 'PENDING' ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) : null;
      const disbursementDate = ['DISBURSED', 'REPAID', 'OVERDUE'].includes(status) ? new Date(createdAt.getTime() + 48 * 60 * 60 * 1000) : null;
      const amountRepaid = status === 'REPAID' ? calc.totalRepayable : status === 'OVERDUE' ? calc.totalRepayable * 0.3 : 0;

      await db.vslaLoan.create({
        data: {
          groupId: member.groupId,
          memberId: member.id,
          amount,
          interestRate: group.loanInterestRate,
          interestAmount: calc.interestAmount,
          totalRepayable: calc.totalRepayable,
          amountRepaid,
          outstanding: calc.totalRepayable - amountRepaid,
          purpose: ['School fees', 'Medical bills', 'Farm inputs', 'Business capital', 'Household needs'][Math.floor(Math.random() * 5)],
          termDays: calc.termDays,
          applicationDate: createdAt,
          approvalDate,
          disbursementDate,
          expectedRepaymentDate: calc.expectedRepaymentDate,
          closedDate: status === 'REPAID' ? new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000) : null,
          status,
          transactionRef: Refs.loan(),
        },
      });
      loanCount++;
    }
  }

  // 10. Meetings
  for (const group of groups) {
    const meetingCount = 5 + Math.floor(Math.random() * 10);
    for (let i = 0; i < meetingCount; i++) {
      const meetingDate = new Date(Date.now() - (meetingCount - i) * 7 * 24 * 60 * 60 * 1000);
      const groupMembers = members.filter((m) => m.groupId === group.id);
      const attendanceCount = Math.floor(groupMembers.length * (0.7 + Math.random() * 0.3));

      const meeting = await db.vslaMeeting.create({
        data: {
          groupId: group.id,
          meetingNumber: i + 1,
          title: `Meeting #${i + 1}`,
          agenda: i % 4 === 0 ? 'Loan applications and savings review' : i % 4 === 1 ? 'Welfare contribution and disbursement' : i % 4 === 2 ? 'Loan repayment collection' : 'General savings and group business',
          meetingDate,
          startTime: '14:00',
          endTime: '16:00',
          meetingType: 'REGULAR',
          location: group.district,
          status: 'CONCLUDED',
          attendanceCount,
          totalMembers: groupMembers.length,
          totalSavings: Math.floor(Math.random() * 50000) + 20000,
          totalLoanDisbursed: Math.random() > 0.5 ? Math.floor(Math.random() * 200000) : 0,
          totalLoanRepaid: Math.random() > 0.5 ? Math.floor(Math.random() * 100000) : 0,
        },
      });

      // Record attendance for random subset
      const present = groupMembers.slice(0, attendanceCount);
      for (const m of present) {
        await db.vslaAttendance.create({
          data: {
            meetingId: meeting.id,
            memberId: m.id,
            present: true,
            arrivalTime: '14:0' + Math.floor(Math.random() * 9),
            contributedSavings: Math.random() > 0.3 ? group.shareValue * (1 + Math.floor(Math.random() * 3)) : 0,
          },
        });
      }
    }
  }

  // 11. Social Fund contributions
  for (const member of members) {
    const contribCount = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < contribCount; i++) {
      const amount = (groups.find((g) => g.id === member.groupId)!.welfareContribution) * (1 + Math.floor(Math.random() * 3));
      await db.vslaSocialFundContribution.create({
        data: {
          groupId: member.groupId,
          memberId: member.id,
          amount,
          contributionType: 'REGULAR',
          paymentMethod: 'CASH',
          transactionRef: Refs.socialFundContribution(),
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // 12. Social Fund claims (a few)
  const claimTypes = ['MEDICAL', 'BEREAVEMENT', 'EMERGENCY', 'EDUCATION'];
  for (const group of groups) {
    const groupMembers = members.filter((m) => m.groupId === group.id);
    const claimCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < claimCount; i++) {
      const member = groupMembers[Math.floor(Math.random() * groupMembers.length)];
      const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
      const amount = 50000 + Math.floor(Math.random() * 200000);
      await db.vslaSocialFundClaim.create({
        data: {
          groupId: group.id,
          memberId: member.id,
          amount,
          claimType,
          description: `${claimType.toLowerCase()} assistance for ${member.fullName}`,
          status: ['PENDING', 'APPROVED', 'DISBURSED', 'REJECTED'][Math.floor(Math.random() * 4)],
          transactionRef: `SFC-${Date.now()}-${i}`,
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // 13. Fines
  for (const member of members) {
    if (Math.random() < 0.2) {
      const fineTypes = ['LATE_ATTENDANCE', 'LATE_REPAYMENT', 'DEFAULT', 'OTHER'];
      const fineType = fineTypes[Math.floor(Math.random() * fineTypes.length)];
      const amount = 1000 + Math.floor(Math.random() * 5000);
      const isPaid = Math.random() > 0.5;
      await db.vslaFine.create({
        data: {
          groupId: member.groupId,
          memberId: member.id,
          amount,
          fineType,
          description: `${fineType.toLowerCase().replace('_', ' ')} fine`,
          status: isPaid ? 'PAID' : 'OUTSTANDING',
          paidAt: isPaid ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
          paymentMethod: isPaid ? 'CASH' : null,
          transactionRef: Refs.fine(),
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // 14. NSSF contributions
  const nssfFarmers = ['Apollo Kato', 'Brenda Nabirye', 'Charles Wasswa', 'Dorothy Akello', 'Edward Ssempa', 'Florence Nalwoga', 'George Byaruhanga', 'Harriet Atim'];
  for (let i = 0; i < 30; i++) {
    const farmer = nssfFarmers[Math.floor(Math.random() * nssfFarmers.length)];
    const amount = 10000 + Math.floor(Math.random() * 50000);
    const tenant = tenants[Math.floor(Math.random() * tenants.length)];
    await db.nssfContribution.create({
      data: {
        tenantId: tenant.id,
        farmerName: farmer,
        farmerPhone: `+2567${Math.floor(10000000 + Math.random() * 89999999)}`,
        nationalId: `CF${Math.floor(100000000 + Math.random() * 899999999)}`,
        nssfNumber: `NSSF/${Math.floor(10000000 + Math.random() * 89999999)}`,
        amount,
        contributionMonth: `2025-${String(1 + Math.floor(Math.random() * 7)).padStart(2, '0')}`,
        paymentMethod: Math.random() > 0.3 ? 'MOBILE_MONEY' : 'BANK',
        partnerCode: Math.random() > 0.5 ? 'KT' : null,
        status: ['RECEIVED', 'CONFIRMED', 'FAILED'][Math.floor(Math.random() * 3)],
        smsSent: true,
        smsMessageId: `SMS-${Date.now()}-${i}`,
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 15. Payments
  for (let i = 0; i < 40; i++) {
    const tenant = tenants[Math.floor(Math.random() * tenants.length)];
    const amount = 5000 + Math.floor(Math.random() * 200000);
    await db.payment.create({
      data: {
        tenantId: tenant.id,
        reference: Refs.payment(),
        payerPhone: `+2567${Math.floor(10000000 + Math.random() * 89999999)}`,
        payerName: firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)],
        amount,
        currency: 'UGX',
        provider: ['MTN', 'AIRTEL', 'FLUTTERWAVE'][Math.floor(Math.random() * 3)],
        type: ['CONTRIBUTION', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'VSLA_SAVING'][Math.floor(Math.random() * 4)],
        status: ['SUCCESS', 'SUCCESS', 'PENDING', 'FAILED'][Math.floor(Math.random() * 4)],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 16. SMS logs
  const smsTemplates = [
    { code: 'NSSF_CONTRIBUTION_RECEIVED', category: 'NSSF', message: 'Hello {name}, we received your NSSF contribution of UGX {amount}. Reference: {ref}.' },
    { code: 'VSLA_LOAN_APPROVED', category: 'VSLA', message: 'Hello {name}, your VSLA loan of UGX {amount} has been approved.' },
    { code: 'VSLA_LOAN_DISBURSED', category: 'VSLA', message: 'Hello {name}, your loan of UGX {amount} has been disbursed.' },
    { code: 'VSLA_MEETING_REMINDER', category: 'VSLA', message: 'Reminder: VSLA meeting tomorrow at {time}.' },
    { code: 'VSLA_REPAYMENT_DUE', category: 'VSLA', message: 'Your loan repayment of UGX {amount} is due in 3 days.' },
    { code: 'PAYMENT_RECEIVED', category: 'PAYMENT', message: 'Payment of UGX {amount} received. Reference: {ref}.' },
  ];
  for (let i = 0; i < 60; i++) {
    const template = smsTemplates[Math.floor(Math.random() * smsTemplates.length)];
    await db.smsLog.create({
      data: {
        toPhone: `+2567${Math.floor(10000000 + Math.random() * 89999999)}`,
        message: template.message.replace('{name}', 'Member').replace('{amount}', '50000').replace('{ref}', `REF${i}`).replace('{time}', '14:00'),
        templateCode: template.code,
        category: template.category,
        provider: 'AFRICAS_TALKING',
        status: ['SENT', 'DELIVERED', 'SENT', 'FAILED'][Math.floor(Math.random() * 4)],
        cost: 22,
        retryCount: Math.random() > 0.8 ? 1 : 0,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        sentAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 17. USSD sessions
  const ussdMenus = ['ROOT', 'VSLA_BALANCE', 'VSLA_SAVINGS', 'NSSF_STATUS', 'LOAN_STATUS', 'MEETING_INFO'];
  for (let i = 0; i < 80; i++) {
    await db.ussdSession.create({
      data: {
        sessionId: `USSD-${Date.now()}-${i}`,
        phoneNumber: `+2567${Math.floor(10000000 + Math.random() * 89999999)}`,
        serviceCode: '*284*97#',
        text: '',
        currentMenu: ussdMenus[Math.floor(Math.random() * ussdMenus.length)],
        status: ['COMPLETED', 'COMPLETED', 'TIMED_OUT', 'FAILED'][Math.floor(Math.random() * 4)],
        duration: 30 + Math.floor(Math.random() * 120),
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 18. Revenue splits (Kilimo Trust MoU — gross split on transaction fees per Eric's wording:
  // "MobiPay: 70% - Covers system, USSD, and payment processing")
  for (let i = 0; i < 20; i++) {
    const streamType = ['COMMISSION', 'TRANSACTION_FEE', 'FLOAT_INTEREST'][Math.floor(Math.random() * 3)];
    const grossAmount = 10000 + Math.floor(Math.random() * 100000);
    const splits = streamType === 'COMMISSION'
      ? { partnerPct: 55, mobipayPct: 45 }
      : streamType === 'TRANSACTION_FEE'
      ? { partnerPct: 30, mobipayPct: 70 }
      : { partnerPct: 55, mobipayPct: 45 };
    // Cost deduction only applies to transaction fees (MNO + USSD costs)
    // Commission and float have no MNO cost — KT holds OVA, float risk transferred to KT
    const costDeduction = streamType === 'TRANSACTION_FEE' ? grossAmount * 0.01 : 0;
    const partnerShare = (grossAmount * splits.partnerPct) / 100;
    const mobipayShare = (grossAmount * splits.mobipayPct) / 100;
    // GROSS SPLIT (per MoU): MobiPay absorbs ALL MNO/USSD costs from its 70% share
    const partnerNet = partnerShare; // partner pays no costs
    const mobipayNet = mobipayShare - costDeduction; // MobiPay absorbs all costs

    await db.revenueSplit.create({
      data: {
        partnerId: ktPartner.id,
        streamType,
        transactionRef: `SPLIT-${Date.now()}-${i}`,
        grossAmount,
        partnerShare,
        mobipayShare,
        costDeduction,
        partnerNet,
        mobipayNet,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 19. Partner settlements (monthly)
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const period = `2025-${String(7 - monthOffset).padStart(2, '0')}`;
    for (const streamType of ['COMMISSION', 'TRANSACTION_FEE', 'FLOAT_INTEREST']) {
      const grossAmount = 50000 + Math.floor(Math.random() * 500000);
      const splits = streamType === 'COMMISSION' ? { partnerPct: 55, mobipayPct: 45 } : streamType === 'TRANSACTION_FEE' ? { partnerPct: 30, mobipayPct: 70 } : { partnerPct: 55, mobipayPct: 45 };
      await db.partnerSettlement.create({
        data: {
          partnerId: ktPartner.id,
          period,
          streamType,
          grossAmount,
          partnerShare: (grossAmount * splits.partnerPct) / 100,
          mobipayShare: (grossAmount * splits.mobipayPct) / 100,
          status: monthOffset < 3 ? 'PAID' : 'PENDING',
          paidAt: monthOffset < 3 ? new Date(Date.now() - monthOffset * 30 * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
  }

  // 20. Audit log entries — sample
  const auditActions = ['LOGIN', 'CREATE', 'UPDATE', 'APPROVE', 'DISBURSE', 'REPAY'];
  const auditEntities = ['VslaGroup', 'VslaLoan', 'VslaSaving', 'User', 'Payment', 'NssfContribution'];
  for (let i = 0; i < 50; i++) {
    await db.auditLog.create({
      data: {
        tenantId: tenants[Math.floor(Math.random() * tenants.length)].id,
        actorName: ['Eric Mwangi', 'Beatrice Auma', 'Joel Okello', 'Sarah Namutebi'][Math.floor(Math.random() * 4)],
        actorRole: ['SUPER_ADMIN', 'TENANT_ADMIN', 'VSLA_OFFICER'][Math.floor(Math.random() * 3)],
        action: auditActions[Math.floor(Math.random() * auditActions.length)],
        entityType: auditEntities[Math.floor(Math.random() * auditEntities.length)],
        description: 'Demo audit log entry',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Demo data seeded successfully',
    counts: {
      tenants: tenants.length,
      vslaGroups: groups.length,
      vslaMembers: members.length,
      nssfContributions: 30,
      payments: 40,
      smsLogs: 60,
      ussdSessions: 80,
      partners: 1,
      revenueSplits: 20,
      auditLogs: 50,
      totalSavingsAmount,
      loanCount,
    },
  });
}
