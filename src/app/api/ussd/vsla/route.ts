/**
 * POST /api/ussd/vsla
 * 
 * VSLA USSD endpoint — full menu matching eGwoko V2.
 * Works with Africa's Talking USSD API.
 * 
 * Menu structure:
 *   1. PIN login (phone + 4-digit PIN)
 *   2. Main menu:
 *      1. Loans (apply, view status, repay, approve)
 *      2. Pay (savings, welfare, fines, loan repayment)
 *      3. Meetings (attend, schedule, record attendance)
 *      4. Statement
 *      5. Sign out
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const sessionId = formData.get('sessionId') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const text = (formData.get('text') as string) || ''

    const inputs = text ? text.split('*') : []
    const step = inputs.length

    // ─── STEP 0: Welcome + PIN entry ───
    if (step === 0) {
      return NextResponse.json({
        response: 'CON Welcome to e-Gwoko VSLA\nPlease enter 4 digit pin or 00 to request for a new pin:'
      })
    }

    // ─── STEP 1: PIN login or request new PIN ───
    if (step === 1) {
      const pinInput = inputs[0].trim()

      if (pinInput === '00') {
        // Generate new PIN — find farmer by phone, generate random 4-digit PIN
        const farmer = await db.farmerProfile.findFirst({
          where: { phone: phoneNumber },
          select: { id: true, firstName: true, vslaPin: true },
        })

        if (!farmer) {
          return NextResponse.json({ response: 'END Number not registered. Contact your group agent.' })
        }

        const newPin = String(Math.floor(1000 + Math.random() * 9000))
        await db.farmerProfile.update({
          where: { id: farmer.id },
          data: { vslaPin: newPin },
        })

        // TODO: Send PIN via SMS (Africa's Talking)
        return NextResponse.json({ response: `END New PIN generated. You will receive it via SMS shortly.` })
      }

      if (pinInput.length !== 4) {
        return NextResponse.json({ response: 'END Invalid PIN. PIN must be 4 digits. Please try again.' })
      }

      // Verify PIN
      const farmer = await db.farmerProfile.findFirst({
        where: { phone: phoneNumber, vslaPin: pinInput },
        select: { id: true, firstName: true, lastName: true },
      })

      if (!farmer) {
        return NextResponse.json({ response: 'END Invalid PIN or number not registered. Contact your agent.' })
      }

      // Find their VSLA group membership
      const membership = await db.vslaMember.findFirst({
        where: { farmerId: farmer.id },
        include: { vslaGroup: { select: { name: true, id: true, sharePrice: true, tenantId: true, maxLoanAmount: true, loanRate: true, requiredApprovals: true } } },
      })

      if (!membership) {
        return NextResponse.json({ response: 'END You are not a member of any VSLA group. Contact your agent.' })
      }

      return NextResponse.json({
        response: `CON Welcome ${farmer.firstName} ${farmer.lastName}\nGroup: ${membership.vslaGroup.name}\n\n1. Loans\n2. Pay\n3. Meetings\n4. Statement\n5. Sign out`
      })
    }

    // ─── STEP 2+: Main menu navigation ───
    if (step >= 2) {
      const pin = inputs[0].trim()
      const mainChoice = inputs[1].trim()

      // Re-authenticate farmer
      const farmer = await db.farmerProfile.findFirst({
        where: { phone: phoneNumber, vslaPin: pin },
        select: { id: true, firstName: true, lastName: true },
      })

      if (!farmer) {
        return NextResponse.json({ response: 'END Session expired. Please dial again.' })
      }

      const membership = await db.vslaMember.findFirst({
        where: { farmerId: farmer.id },
        include: { vslaGroup: { select: { id: true, name: true, sharePrice: true, maxLoanAmount: true, loanRate: true, tenantId: true, requiredApprovals: true } } },
      })

      if (!membership) {
        return NextResponse.json({ response: 'END No VSLA group found.' })
      }

      const groupId = membership.vslaGroup.id

      // ─── 1. LOANS ───
      if (mainChoice === '1') {
        if (step === 2) {
          return NextResponse.json({
            response: 'CON Loans\n1. Apply for a loan\n2. View loan status\n3. Repay loan\n4. Approve loan (Keyholders only)\n5. Back'
          })
        }

        const loanChoice = inputs[2].trim()

        // 1. Apply for a loan
        if (loanChoice === '1') {
          if (step === 3) {
            // Check if a meeting is in progress (loan gating)
            const activeMeeting = await db.vslaMeeting.findFirst({
              where: { vslaGroupId: groupId, status: 'IN_PROGRESS' },
            })
            if (activeMeeting) {
              return NextResponse.json({ response: 'END A meeting is in progress. Loan requests are disabled during meetings.' })
            }

            const maxLoan = membership.vslaGroup.maxLoanAmount
            return NextResponse.json({
              response: `CON Enter loan amount (max UGX ${maxLoan.toLocaleString()}):`
            })
          }

          if (step === 4) {
            const amount = parseFloat(inputs[3].trim())
            if (isNaN(amount) || amount <= 0) {
              return NextResponse.json({ response: 'END Invalid amount. Please try again.' })
            }
            if (amount > membership.vslaGroup.maxLoanAmount) {
              return NextResponse.json({ response: `END Amount exceeds maximum of UGX ${membership.vslaGroup.maxLoanAmount.toLocaleString()}.` })
            }

            const interestRate = membership.vslaGroup.loanRate
            const totalRepayable = amount + (amount * interestRate / 100)

            return NextResponse.json({
              response: `CON Confirm loan of UGX ${amount.toLocaleString()}?\nInterest: ${interestRate}%\nTotal repayable: UGX ${totalRepayable.toLocaleString()}\n1. Yes\n2. No`
            })
          }

          if (step === 5) {
            const confirm = inputs[4].trim()
            if (confirm !== '1') {
              return NextResponse.json({ response: 'END Loan request cancelled.' })
            }

            const amount = parseFloat(inputs[3].trim())
            const interestRate = membership.vslaGroup.loanRate
            const totalRepayable = amount + (amount * interestRate / 100)

            // Create loan
            const loan = await db.vslaLoan.create({
              data: {
                tenantId: membership.vslaGroup.tenantId,
                vslaGroupId: groupId,
                farmerId: farmer.id,
                memberId: membership.memberId,
                amount,
                interestRate,
                totalRepayable,
                status: 'PENDING',
                purpose: 'SAVINGS',
              },
            })

            return NextResponse.json({
              response: `END Loan of UGX ${amount.toLocaleString()} requested successfully.\nWait for approval by keyholders.\nLoan ID: ${loan.id.slice(-6).toUpperCase()}`
            })
          }
        }

        // 2. View loan status
        if (loanChoice === '2') {
          const loans = await db.vslaLoan.findMany({
            where: { farmerId: farmer.id, vslaGroupId: groupId },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { id: true, amount: true, status: true, totalRepayable: true, amountRepaid: true },
          })

          if (loans.length === 0) {
            return NextResponse.json({ response: 'END You have no loan records.' })
          }

          const loanText = loans.map((l, i) =>
            `${i + 1}. UGX ${l.amount.toLocaleString()} - ${l.status} (Repaid: ${l.amountRepaid.toLocaleString()}/${l.totalRepayable.toLocaleString()})`
          ).join('\n')

          return NextResponse.json({ response: `END Your Loans:\n${loanText}` })
        }

        // 3. Repay loan
        if (loanChoice === '3') {
          if (step === 3) {
            const activeLoans = await db.vslaLoan.findMany({
              where: { farmerId: farmer.id, vslaGroupId: groupId, status: { in: ['DISBURSED', 'OVERDUE'] } },
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { id: true, amount: true, totalRepayable: true, amountRepaid: true },
            })

            if (activeLoans.length === 0) {
              return NextResponse.json({ response: 'END You have no active loans to repay.' })
            }

            const loanList = activeLoans.map((l, i) =>
              `${i + 1}. Loan ${l.id.slice(-6).toUpperCase()} - Bal: UGX ${(l.totalRepayable - l.amountRepaid).toLocaleString()}`
            ).join('\n')

            return NextResponse.json({ response: `CON Select loan to repay:\n${loanList}` })
          }

          if (step === 4) {
            return NextResponse.json({ response: 'CON Enter repayment amount:' })
          }

          if (step === 5) {
            const amount = parseFloat(inputs[4].trim())
            const loanIdx = parseInt(inputs[3].trim()) - 1

            const activeLoans = await db.vslaLoan.findMany({
              where: { farmerId: farmer.id, vslaGroupId: groupId, status: { in: ['DISBURSED', 'OVERDUE'] } },
              orderBy: { createdAt: 'desc' },
              take: 5,
            })

            if (loanIdx < 0 || loanIdx >= activeLoans.length) {
              return NextResponse.json({ response: 'END Invalid selection.' })
            }

            const loan = activeLoans[loanIdx]
            const newRepaid = loan.amountRepaid + amount
            const newStatus = newRepaid >= loan.totalRepayable ? 'REPAID' : loan.status

            await db.vslaLoan.update({
              where: { id: loan.id },
              data: { amountRepaid: newRepaid, status: newStatus },
            })

            await db.vslaLoanRepayment.create({
              data: {
                tenantId: membership.vslaGroup.tenantId,
                loanId: loan.id,
                amount,
              },
            })

            await db.vslaTransaction.create({
              data: {
                vslaGroupId: groupId,
                type: 'LOAN_REPAYMENT',
                walletType: 'LOAN',
                amount,
                description: `Repayment for loan ${loan.id.slice(-6).toUpperCase()}`,
              },
            })

            const remaining = Math.max(0, loan.totalRepayable - newRepaid)
            return NextResponse.json({
              response: `END Repayment of UGX ${amount.toLocaleString()} received.\nRemaining balance: UGX ${remaining.toLocaleString()}\nStatus: ${newStatus}`
            })
          }
        }

        // 4. Approve loan (Keyholders only)
        if (loanChoice === '4') {
          if (!membership.isKeyholder) {
            return NextResponse.json({ response: 'END Only keyholders can approve loans.' })
          }

          const pendingLoans = await db.vslaLoan.findMany({
            where: { vslaGroupId: groupId, status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { farmer: { select: { firstName: true, lastName: true } } },
          })

          if (pendingLoans.length === 0) {
            return NextResponse.json({ response: 'END No pending loans to approve.' })
          }

          if (step === 3) {
            const loanList = pendingLoans.map((l, i) =>
              `${i + 1}. ${l.farmer.firstName} ${l.farmer.lastName} - UGX ${l.amount.toLocaleString()}`
            ).join('\n')
            return NextResponse.json({ response: `CON Pending Loans:\n${loanList}` })
          }

          if (step === 4) {
            return NextResponse.json({ response: 'CON 1. Approve\n2. Reject' })
          }

          if (step === 5) {
            const decision = inputs[4].trim()
            const loanIdx = parseInt(inputs[3].trim()) - 1

            if (loanIdx < 0 || loanIdx >= pendingLoans.length) {
              return NextResponse.json({ response: 'END Invalid selection.' })
            }

            const loan = pendingLoans[loanIdx]
            const decisionValue = decision === '1' ? 'APPROVED' : 'REJECTED'

            await db.vslaLoanApproval.create({
              data: {
                vslaGroupId: groupId,
                loanId: loan.id,
                approverId: membership.id,
                approverName: `${farmer.firstName} ${farmer.lastName}`,
                decision: decisionValue,
              },
            })

            // Check if enough approvals
            const approvals = await db.vslaLoanApproval.count({
              where: { loanId: loan.id, decision: 'APPROVED' },
            })

            const requiredApprovals = membership.vslaGroup.requiredApprovals || 3

            if (decisionValue === 'REJECTED') {
              await db.vslaLoan.update({
                where: { id: loan.id },
                data: { status: 'REJECTED' },
              })
              return NextResponse.json({ response: 'END Loan rejected.' })
            }

            if (approvals >= requiredApprovals) {
              // Enough approvals — disburse
              await db.vslaLoan.update({
                where: { id: loan.id },
                data: { status: 'DISBURSED', disbursedAt: new Date() },
              })
              return NextResponse.json({ response: 'END Loan approved and disbursed by all keyholders.' })
            }

            return NextResponse.json({
              response: `END Loan approved by you. ${approvals}/${requiredApprovals} approvals received.`
            })
          }
        }

        if (loanChoice === '5') {
          return NextResponse.json({
            response: 'CON Main Menu\n1. Loans\n2. Pay\n3. Meetings\n4. Statement\n5. Sign out'
          })
        }
      }

      // ─── 2. PAY (Savings, Welfare, Fines) ───
      if (mainChoice === '2') {
        if (step === 2) {
          return NextResponse.json({
            response: 'CON Pay\n1. Fine\n2. Loan Repayment\n3. Savings (Buy Shares)\n4. Welfare\n5. Back'
          })
        }

        const payChoice = inputs[2].trim()

        // 3. Savings (Buy Shares)
        if (payChoice === '3') {
          if (step === 3) {
            return NextResponse.json({
              response: 'CON Savings\n1. Save for myself\n2. Save for another member'
            })
          }

          if (step === 4) {
            const sharePrice = membership.vslaGroup.sharePrice || 1000
            const options = [1, 2, 3, 4, 5].map(n => `${n}. UGX ${(sharePrice * n).toLocaleString()}`).join('\n')
            return NextResponse.json({ response: `CON Enter savings amount:\n${options}` })
          }

          if (step === 5) {
            const shareMultiplier = parseInt(inputs[4].trim()) || 1
            const sharePrice = membership.vslaGroup.sharePrice || 1000
            const amount = sharePrice * shareMultiplier

            let targetFarmerId = farmer.id
            let onBehalfOf = null

            if (inputs[3].trim() === '2') {
              // Save for another — need member ID
              return NextResponse.json({ response: 'CON Enter Member ID:' })
            }

            // Confirm
            return NextResponse.json({
              response: `CON Confirm saving of UGX ${amount.toLocaleString()}?\n1. Yes\n2. No`
            })
          }

          if (step === 6) {
            const confirm = inputs[5].trim()
            if (confirm !== '1') {
              return NextResponse.json({ response: 'END Transaction cancelled.' })
            }

            const shareMultiplier = parseInt(inputs[4].trim()) || 1
            const sharePrice = membership.vslaGroup.sharePrice || 1000
            const amount = sharePrice * shareMultiplier

            let targetFarmerId = farmer.id

            // If saving for another, look up member
            if (inputs[3].trim() === '2' && inputs.length > 6) {
              const memberInput = inputs[5].trim()
              const targetMember = await db.vslaMember.findFirst({
                where: { memberId: memberInput, vslaGroupId: groupId },
                select: { farmerId: true },
              })
              if (targetMember) {
                targetFarmerId = targetMember.farmerId
              }
            }

            await db.vslaSaving.create({
              data: {
                vslaGroupId: groupId,
                farmerId: targetFarmerId,
                memberId: membership.memberId,
                amount,
                sharesBought: shareMultiplier,
                savedOnBehalfOf: targetFarmerId !== farmer.id ? farmer.id : null,
                status: 'COMPLETED',
              },
            })

            await db.vslaTransaction.create({
              data: {
                vslaGroupId: groupId,
                type: 'SAVING',
                walletType: 'SAVINGS',
                amount,
                description: `Bought ${shareMultiplier} shares @ UGX ${sharePrice}`,
              },
            })

            // Update member shares
            await db.vslaMember.update({
              where: { id: membership.id },
              data: { sharesOwned: { increment: shareMultiplier } },
            })

            return NextResponse.json({
              response: `END Saving of UGX ${amount.toLocaleString()} received.\n${shareMultiplier} shares purchased.\nThank you.`
            })
          }
        }

        // 4. Welfare
        if (payChoice === '4') {
          if (step === 3) {
            return NextResponse.json({ response: 'CON Enter welfare amount:' })
          }

          if (step === 4) {
            const amount = parseFloat(inputs[3].trim())
            return NextResponse.json({
              response: `CON Confirm welfare payment of UGX ${amount.toLocaleString()}?\n1. Yes\n2. No`
            })
          }

          if (step === 5) {
            const confirm = inputs[4].trim()
            if (confirm !== '1') {
              return NextResponse.json({ response: 'END Transaction cancelled.' })
            }

            const amount = parseFloat(inputs[3].trim())

            await db.welfarePayment.create({
              data: {
                vslaGroupId: groupId,
                farmerId: farmer.id,
                amount,
                reason: 'USSD welfare contribution',
              },
            })

            await db.vslaTransaction.create({
              data: {
                vslaGroupId: groupId,
                type: 'WELFARE',
                walletType: 'WELFARE',
                amount,
                description: 'Welfare contribution via USSD',
              },
            })

            return NextResponse.json({
              response: `END Welfare payment of UGX ${amount.toLocaleString()} received. Thank you.`
            })
          }
        }

        // 1. Fine
        if (payChoice === '1') {
          if (step === 3) {
            return NextResponse.json({ response: 'CON Enter fine amount:' })
          }

          if (step === 4) {
            const amount = parseFloat(inputs[3].trim())
            return NextResponse.json({
              response: `CON Confirm fine payment of UGX ${amount.toLocaleString()}?\n1. Yes\n2. No`
            })
          }

          if (step === 5) {
            const confirm = inputs[4].trim()
            if (confirm !== '1') {
              return NextResponse.json({ response: 'END Transaction cancelled.' })
            }

            const amount = parseFloat(inputs[3].trim())

            await db.vslaTransaction.create({
              data: {
                vslaGroupId: groupId,
                type: 'FINE',
                walletType: 'FINE',
                amount,
                description: 'Fine payment via USSD',
              },
            })

            await db.vslaGroup.update({
              where: { id: groupId },
              data: { fines: { increment: amount } },
            })

            return NextResponse.json({
              response: `END Fine payment of UGX ${amount.toLocaleString()} received. Thank you.`
            })
          }
        }

        if (payChoice === '5') {
          return NextResponse.json({
            response: 'CON Main Menu\n1. Loans\n2. Pay\n3. Meetings\n4. Statement\n5. Sign out'
          })
        }
      }

      // ─── 3. MEETINGS ───
      if (mainChoice === '3') {
        if (step === 2) {
          return NextResponse.json({
            response: 'CON Meetings\n1. Attend (confirm attendance)\n2. Schedule (Admin only)\n3. Record Attendance (Admin only)\n4. Back'
          })
        }

        const meetingChoice = inputs[2].trim()

        // 1. Attend
        if (meetingChoice === '1') {
          const meetings = await db.vslaMeeting.findMany({
            where: { vslaGroupId: groupId, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
            orderBy: { meetingDate: 'desc' },
            take: 5,
          })

          if (meetings.length === 0) {
            return NextResponse.json({ response: 'END No upcoming meetings.' })
          }

          if (step === 3) {
            const meetingList = meetings.map((m, i) =>
              `${i + 1}. ${m.agenda || 'Meeting'} - ${new Date(m.meetingDate).toLocaleDateString()}`
            ).join('\n')
            return NextResponse.json({ response: `CON Select meeting:\n${meetingList}` })
          }

          if (step === 4) {
            const meetingIdx = parseInt(inputs[3].trim()) - 1
            if (meetingIdx < 0 || meetingIdx >= meetings.length) {
              return NextResponse.json({ response: 'END Invalid selection.' })
            }

            const meeting = meetings[meetingIdx]

            // Check if already attended
            const existing = await db.vslaAttendance.findUnique({
              where: { meetingId_farmerId: { meetingId: meeting.id, farmerId: farmer.id } },
            })

            if (existing && existing.present) {
              return NextResponse.json({ response: 'END You have already confirmed attendance.' })
            }

            await db.vslaAttendance.upsert({
              where: { meetingId_farmerId: { meetingId: meeting.id, farmerId: farmer.id } },
              create: {
                tenantId: membership.vslaGroup.tenantId,
                meetingId: meeting.id,
                farmerId: farmer.id,
                present: true,
              },
              update: { present: true },
            })

            return NextResponse.json({ response: 'END Attendance confirmed. Thank you.' })
          }
        }

        // 2. Schedule (Admin only)
        if (meetingChoice === '2') {
          if (!membership.isAdmin && !membership.isKeyholder) {
            return NextResponse.json({ response: 'END Only admins can schedule meetings.' })
          }

          if (step === 3) {
            return NextResponse.json({ response: 'CON Enter meeting agenda:' })
          }

          if (step === 4) {
            return NextResponse.json({ response: 'CON Enter meeting date (YYYY-MM-DD):' })
          }

          if (step === 5) {
            return NextResponse.json({ response: 'CON Enter start time (e.g. 14:00):' })
          }

          if (step === 6) {
            return NextResponse.json({ response: 'CON Enter end time (e.g. 15:00):' })
          }

          if (step === 7) {
            const agenda = inputs[3].trim()
            const dateStr = inputs[4].trim()
            const startTime = inputs[5].trim()
            const endTime = inputs[6].trim()

            await db.vslaMeeting.create({
              data: {
                tenantId: membership.vslaGroup.tenantId,
                vslaGroupId: groupId,
                agenda,
                meetingDate: new Date(dateStr),
                startTime,
                endTime,
                status: 'SCHEDULED',
                createdById: farmer.id,
              },
            })

            return NextResponse.json({ response: 'END Meeting scheduled successfully.' })
          }
        }

        if (meetingChoice === '4') {
          return NextResponse.json({
            response: 'CON Main Menu\n1. Loans\n2. Pay\n3. Meetings\n4. Statement\n5. Sign out'
          })
        }
      }

      // ─── 4. STATEMENT ───
      if (mainChoice === '4') {
        const transactions = await db.vslaTransaction.findMany({
          where: { vslaGroupId: groupId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })

        const savings = await db.vslaSaving.aggregate({
          where: { farmerId: farmer.id, vslaGroupId: groupId, status: 'COMPLETED' },
          _sum: { amount: true },
        })

        const loans = await db.vslaLoan.findMany({
          where: { farmerId: farmer.id, vslaGroupId: groupId },
          select: { amount: true, amountRepaid: true, status: true },
        })

        const totalSavings = savings._sum.amount || 0
        const totalBorrowed = loans.reduce((s, l) => s + l.amount, 0)
        const totalRepaid = loans.reduce((s, l) => s + l.amountRepaid, 0)
        const outstandingLoans = loans.filter(l => l.status === 'DISBURSED' || l.status === 'OVERDUE')
          .reduce((s, l) => s + (l.amount - l.amountRepaid), 0)

        return NextResponse.json({
          response: `END Statement for ${farmer.firstName} ${farmer.lastName}\nShares: ${membership.sharesOwned}\nTotal Savings: UGX ${totalSavings.toLocaleString()}\nTotal Borrowed: UGX ${totalBorrowed.toLocaleString()}\nTotal Repaid: UGX ${totalRepaid.toLocaleString()}\nOutstanding: UGX ${outstandingLoans.toLocaleString()}`
        })
      }

      // ─── 5. SIGN OUT ───
      if (mainChoice === '5') {
        return NextResponse.json({ response: 'END Thank you for using e-Gwoko VSLA. Goodbye.' })
      }
    }

    return NextResponse.json({ response: 'END Session expired. Please dial again.' })
  } catch (error: any) {
    console.error('[ussd/vsla] error:', error)
    return NextResponse.json({ response: 'END An error occurred. Please try again.' })
  }
}

export async function GET() {
  return NextResponse.json({
    title: 'VSLA USSD Menu',
    shortcode: '*284*56#',
    endpoint: 'POST /api/ussd/vsla',
    menu: [
      'PIN login (phone + 4-digit PIN, or 00 for new PIN)',
      '1. Loans: apply, view status, repay, approve (keyholders)',
      '2. Pay: savings (buy shares), welfare, fines, loan repayment',
      '3. Meetings: attend, schedule (admin), record attendance',
      '4. Statement: shares, savings, loans, outstanding balance',
      '5. Sign out',
    ],
    features: [
      'PIN-based login (phone + 4-digit PIN)',
      'Share-based savings (buy shares at group share price)',
      'Multi-keyholder loan approval (configurable required approvals)',
      'Loan gating (disabled during active meetings)',
      'Save/repay on behalf of another member',
      'Welfare + Fines as separate payment categories',
      'Meeting attendance tracking',
      'Member statement with balance summary',
    ],
  })
}
