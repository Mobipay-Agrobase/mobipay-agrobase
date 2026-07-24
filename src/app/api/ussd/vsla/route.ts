/**
 * VSLA V2 — USSD Callback Endpoint
 * ─────────────────────────────────
 * This is the endpoint Africa's Talking calls when a member dials the USSD code.
 * 
 * Africa's Talking sends:
 *   sessionId: unique session ID
 *   phoneNumber: member's phone number
 *   serviceCode: the USSD code dialed (e.g. *284*97#)
 *   text: accumulated user input (empty on first call, then "1", "1*2", "1*2*3", etc.)
 * 
 * We respond with:
 *   "CON <menu text>" — continue session (show menu, wait for input)
 *   "END <message>" — end session (show final message)
 * 
 * Menu Flow:
 *   1. Enter Member ID + PIN (login)
 *   2. Check my savings balance
 *   3. Check my loan status
 *   4. Apply for loan
 *   5. View next meeting
 *   6. Repay loan
 *   0. Exit
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { sendSms } from '@/lib/vsla-v2/sms'

export async function POST(req: NextRequest) {
  try {
    // Africa's Talking sends form-encoded data
    const formData = await req.formData()
    const sessionId = formData.get('sessionId') as string
    const phoneNumber = (formData.get('phoneNumber') as string) || ''
    const serviceCode = (formData.get('serviceCode') as string) || ''
    const text = (formData.get('text') as string) || ''

    // Normalize phone number (AT sends with +, we store with +)
    const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber

    // Parse the user's input sequence
    const inputs = text ? text.split('*') : []
    const currentInput = inputs[inputs.length - 1] || ''

    // ─── Session management ───
    // Find or create a USSD session
    let session = await db.ussdSession.findUnique({
      where: { sessionId },
    })

    if (!session) {
      // New session — find tenant by phone number match with VSLA members
      const member = await db.vslaMemberV2.findFirst({
        where: { phone: normalizedPhone },
        include: { group: { select: { tenantId: true, name: true } } },
      })

      const tenantId = member?.group?.tenantId || ''

      session = await db.ussdSession.create({
        data: {
          tenantId,
          sessionId,
          phoneNumber: normalizedPhone,
          currentStep: 'ROOT',
          status: 'ACTIVE',
        },
      })
    }

    // ─── Handle the menu flow ───
    const response = await handleMenuFlow(inputs, session, normalizedPhone)

    // Update session
    await db.ussdSession.update({
      where: { id: session.id },
      data: {
        currentStep: response.nextStep,
        inputData: JSON.stringify({ inputs }),
        status: response.end ? 'COMPLETED' : 'ACTIVE',
        completedAt: response.end ? new Date() : null,
      },
    })

    // Return plain text (Africa's Talking format)
    return new NextResponse(response.text, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    console.error('[ussd/vsla] error:', error)
    return new NextResponse('END An error occurred. Please try again later.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

// ─── Menu Flow Handler ───
async function handleMenuFlow(
  inputs: string[],
  session: any,
  phoneNumber: string
): Promise<{ text: string; nextStep: string; end: boolean }> {
  const step = inputs.length

  // ─── STEP 0: Welcome / Login ───
  if (step === 0 || inputs[0] === '') {
    // Check if member is already authenticated in this session
    const sessionData = session.inputData ? JSON.parse(session.inputData) : {}
    if (sessionData.authenticated && sessionData.memberId) {
      return showMainMenu(sessionData)
    }
    return {
      text: 'CON Welcome to MobiPay VSLA\nEnter your Member ID:',
      nextStep: 'MEMBER_ID',
      end: false,
    }
  }

  // ─── STEP 1: Member ID entered ───
  if (step === 1 && session.currentStep === 'MEMBER_ID') {
    return {
      text: 'CON Enter your 4-digit PIN:',
      nextStep: 'PIN',
      end: false,
    }
  }

  // ─── STEP 2: PIN entered — authenticate ───
  if (step === 2 && session.currentStep === 'PIN') {
    const memberId = inputs[0]
    const pin = inputs[1]

    const member = await db.vslaMemberV2.findUnique({
      where: { memberId },
      include: {
        group: { select: { name: true, sharePrice: true, loanMultiplier: true, tenantId: true } },
      },
    })

    if (!member || member.status !== 'ACTIVE' || !member.pinHash) {
      return {
        text: 'END Invalid Member ID or PIN. Please check and try again.',
        nextStep: 'AUTH_FAILED',
        end: true,
      }
    }

    const pinValid = await bcrypt.compare(pin, member.pinHash)
    if (!pinValid) {
      return {
        text: 'END Invalid PIN. Please try again.',
        nextStep: 'AUTH_FAILED',
        end: true,
      }
    }

    // Authenticated — store in session
    await db.ussdSession.update({
      where: { id: session.id },
      data: {
        inputData: JSON.stringify({
          authenticated: true,
          memberId: member.memberId,
          memberDbId: member.id,
          memberName: member.fullName,
          groupId: member.groupId,
          groupName: member.group.name,
          sharePrice: member.group.sharePrice,
          loanMultiplier: member.group.loanMultiplier,
        }),
      },
    })

    return showMainMenu({
      memberName: member.fullName,
      groupName: member.group.name,
    })
  }

  // ─── STEP 3+: Main menu options ───
  if (step >= 2 || (session.currentStep === 'ROOT' && session.inputData)) {
    const sessionData = session.inputData ? JSON.parse(session.inputData) : {}
    
    // Re-read session to get latest data
    const freshSession = await db.ussdSession.findUnique({ where: { id: session.id } })
    const freshData = freshSession?.inputData ? JSON.parse(freshSession.inputData) : {}

    if (!freshData.authenticated) {
      return {
        text: 'END Session expired. Please dial again.',
        nextStep: 'EXPIRED',
        end: true,
      }
    }

    const menuChoice = inputs[2] // After member ID + PIN, the 3rd input is the menu choice

    // ─── Handle main menu selections ───
    if (!menuChoice) {
      return showMainMenu(freshData)
    }

    switch (menuChoice) {
      case '1': // Check Balance
        return await checkBalance(freshData)
      case '2': // My Loans
        return await checkLoans(freshData)
      case '3': // Apply for Loan
        return await applyForLoan(inputs, freshData, step)
      case '4': // Next Meeting
        return await nextMeeting(freshData)
      case '5': // Repay Loan
        return await repayLoan(inputs, freshData, step)
      case '0': // Exit
        return {
          text: `END Thank you for using MobiPay VSLA. Goodbye, ${freshData.memberName}!`,
          nextStep: 'EXIT',
          end: true,
        }
      default:
        return showMainMenu(freshData)
    }
  }

  return {
    text: 'CON Invalid input. Please try again.\n0. Back to menu',
    nextStep: 'INVALID',
    end: false,
  }
}

// ─── Main Menu ───
function showMainMenu(data: any): { text: string; nextStep: string; end: boolean } {
  return {
    text: `CON Welcome, ${data.memberName || 'Member'}!\n${data.groupName || ''}\n\n1. Check Balance\n2. My Loans\n3. Apply for Loan\n4. Next Meeting\n5. Repay Loan\n0. Exit`,
    nextStep: 'MAIN_MENU',
    end: false,
  }
}

// ─── 1. Check Balance ───
async function checkBalance(data: any): Promise<{ text: string; nextStep: string; end: boolean }> {
  const member = await db.vslaMemberV2.findUnique({
    where: { id: data.memberDbId },
    select: { totalSavings: true, totalShares: true },
  })

  if (!member) {
    return { text: 'END Member not found.', nextStep: 'ERROR', end: true }
  }

  return {
    text: `END Your Balance:\nSavings: UGX ${member.totalSavings.toLocaleString()}\nShares: ${member.totalShares}\nShare Value: UGX ${(member.totalShares * data.sharePrice).toLocaleString()}\n\nGroup: ${data.groupName}`,
    nextStep: 'BALANCE_SHOWN',
    end: true,
  }
}

// ─── 2. Check Loans ───
async function checkLoans(data: any): Promise<{ text: string; nextStep: string; end: boolean }> {
  const loans = await db.vslaLoanV2.findMany({
    where: { memberId: data.memberDbId, status: { in: ['SYSTEM_APPROVED', 'KEYHOLDER_APPROVED', 'DISBURSED', 'OVERDUE'] } },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  if (loans.length === 0) {
    return {
      text: 'END You have no active loans. Apply for a loan from the main menu.',
      nextStep: 'NO_LOANS',
      end: true,
    }
  }

  let loanText = 'END Your Active Loans:\n'
  loans.forEach((loan, i) => {
    loanText += `\n${i + 1}. UGX ${loan.amount.toLocaleString()}\n`
    loanText += `   Status: ${loan.status.replace(/_/g, ' ')}\n`
    loanText += `   Outstanding: UGX ${loan.outstanding.toLocaleString()}\n`
    if (loan.expectedRepaymentDate) {
      loanText += `   Due: ${new Date(loan.expectedRepaymentDate).toLocaleDateString('en-GB')}\n`
    }
  })

  return {
    text: loanText,
    nextStep: 'LOANS_SHOWN',
    end: true,
  }
}

// ─── 3. Apply for Loan ───
async function applyForLoan(inputs: string[], data: any, step: number): Promise<{ text: string; nextStep: string; end: boolean }> {
  const loanStep = step - 2 // Adjust for member ID + PIN

  if (loanStep === 1) {
    // User selected "3. Apply for Loan" — ask for amount
    return {
      text: 'CON Enter loan amount (UGX):',
      nextStep: 'LOAN_AMOUNT',
      end: false,
    }
  }

  if (loanStep === 2) {
    // Amount entered — ask for purpose
    const amount = parseInt(inputs[3])
    if (!amount || amount <= 0) {
      return { text: 'END Invalid amount. Please try again.', nextStep: 'INVALID_AMOUNT', end: true }
    }
    return {
      text: `CON You requested UGX ${amount.toLocaleString()}.\nEnter purpose (e.g. 1=School fees, 2=Farm inputs, 3=Medical, 4=Business, 5=Other):`,
      nextStep: 'LOAN_PURPOSE',
      end: false,
    }
  }

  if (loanStep === 3) {
    // Purpose selected — run eligibility check + apply
    const amount = parseInt(inputs[3])
    const purposeMap: Record<string, string> = {
      '1': 'School fees for children',
      '2': 'Farm inputs (seeds, fertilizer)',
      '3': 'Medical bills',
      '4': 'Business capital',
      '5': 'Other personal needs',
    }
    const purpose = purposeMap[inputs[4]] || 'Personal needs'

    // Check eligibility
    const eligRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/vsla-v2/loan/eligibility-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: data.groupId, memberId: data.memberDbId, amount }),
    })
    const elig = await eligRes.json()

    if (!elig.eligible) {
      const reasons = elig.failReasons?.join('; ') || 'You are not eligible for this loan.'
      return {
        text: `END Loan application failed.\n${reasons}\n\nContact your group admin for help.`,
        nextStep: 'NOT_ELIGIBLE',
        end: true,
      }
    }

    // Apply for loan
    const applyRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/vsla-v2/loan/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId: data.groupId,
        memberId: data.memberDbId,
        amount,
        purpose,
        termDays: 90,
      }),
    })
    const applyData = await applyRes.json()

    if (applyRes.ok) {
      // Send SMS confirmation
      await sendSms(data.phone || '', `Your loan application for UGX ${amount.toLocaleString()} has been submitted. ${applyData.keyHolderCount} key holders will be notified for approval. — MobiPay VSLA`).catch(() => {})
      
      return {
        text: `END Loan application submitted!\nAmount: UGX ${amount.toLocaleString()}\nPurpose: ${purpose}\n\n${applyData.keyHolderCount} key holders have been notified. You will receive an SMS when your loan is approved.`,
        nextStep: 'LOAN_APPLIED',
        end: true,
      }
    } else {
      return {
        text: `END ${applyData.error || 'Failed to apply for loan.'}`,
        nextStep: 'LOAN_FAILED',
        end: true,
      }
    }
  }

  return { text: 'END Session error. Please try again.', nextStep: 'ERROR', end: true }
}

// ─── 4. Next Meeting ───
async function nextMeeting(data: any): Promise<{ text: string; nextStep: string; end: boolean }> {
  const meeting = await db.vslaMeetingV2.findFirst({
    where: { groupId: data.groupId, status: 'SCHEDULED' },
    orderBy: { meetingDate: 'asc' },
  })

  if (!meeting) {
    return {
      text: 'END No upcoming meetings scheduled. You will receive an SMS when the next meeting is announced.',
      nextStep: 'NO_MEETING',
      end: true,
    }
  }

  const dateStr = new Date(meeting.meetingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  
  return {
    text: `END Next Meeting:\n${meeting.title}\nDate: ${dateStr}\nTime: ${meeting.startTime || 'TBD'} - ${meeting.endTime || ''}\nLocation: ${meeting.location || 'TBD'}`,
    nextStep: 'MEETING_SHOWN',
    end: true,
  }
}

// ─── 5. Repay Loan ───
async function repayLoan(inputs: string[], data: any, step: number): Promise<{ text: string; nextStep: string; end: boolean }> {
  const repayStep = step - 2

  if (repayStep === 1) {
    // Show active loans for repayment
    const loans = await db.vslaLoanV2.findMany({
      where: { memberId: data.memberDbId, status: { in: ['DISBURSED', 'OVERDUE'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    if (loans.length === 0) {
      return { text: 'END You have no loans to repay.', nextStep: 'NO_REPAY_LOAN', end: true }
    }

    let text = 'CON Select loan to repay:\n'
    loans.forEach((loan, i) => {
      text += `${i + 1}. UGX ${loan.outstanding.toLocaleString()} outstanding\n`
    })
    text += '0. Cancel'
    
    return { text, nextStep: 'REPAY_SELECT', end: false }
  }

  if (repayStep === 2) {
    // Loan selected — ask for amount
    return {
      text: 'CON Enter repayment amount (UGX):',
      nextStep: 'REPAY_AMOUNT',
      end: false,
    }
  }

  if (repayStep === 3) {
    // Amount entered — process repayment
    const loanChoice = parseInt(inputs[3])
    const amount = parseInt(inputs[4])

    const loans = await db.vslaLoanV2.findMany({
      where: { memberId: data.memberDbId, status: { in: ['DISBURSED', 'OVERDUE'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    if (!loans[loanChoice - 1] || !amount || amount <= 0) {
      return { text: 'END Invalid selection. Please try again.', nextStep: 'INVALID_REPAY', end: true }
    }

    const loan = loans[loanChoice - 1]

    // Record the repayment as a cashbox entry
    await db.vslaTransactionV2.create({
      data: {
        groupId: data.groupId,
        memberId: data.memberDbId,
        loanId: loan.id,
        type: 'LOAN_REPAYMENT',
        amount,
        direction: 'IN',
        description: `Loan repayment via USSD by ${data.memberName}`,
        transactionRef: `USSD-REPAY-${Date.now()}`,
        status: 'COMPLETED',
        recordedByName: data.memberName,
      },
    })

    // Update loan
    const newRepaid = loan.amountRepaid + amount
    const newOutstanding = Math.max(0, loan.totalRepayable - newRepaid)
    const isFullyRepaid = newRepaid >= loan.totalRepayable

    await db.vslaLoanV2.update({
      where: { id: loan.id },
      data: {
        amountRepaid: newRepaid,
        outstanding: newOutstanding,
        status: isFullyRepaid ? 'REPAID' : loan.status,
        repaidAt: isFullyRepaid ? new Date() : null,
        closedAt: isFullyRepaid ? new Date() : null,
      },
    })

    // Update group cashbox
    const group = await db.vslaGroupV2.findUnique({ where: { id: data.groupId } })
    if (group) {
      await db.vslaGroupV2.update({
        where: { id: data.groupId },
        data: { cashboxBalance: group.cashboxBalance + amount },
      })
    }

    // Send SMS confirmation
    await sendSms(data.phone || '', `Repayment of UGX ${amount.toLocaleString()} received. Outstanding: UGX ${newOutstanding.toLocaleString()}. ${isFullyRepaid ? 'Loan fully repaid!' : ''} — MobiPay VSLA`).catch(() => {})

    return {
      text: `END Repayment successful!\nAmount: UGX ${amount.toLocaleString()}\nOutstanding: UGX ${newOutstanding.toLocaleString()}\n${isFullyRepaid ? '✓ Loan fully repaid!' : ''}\n\nReceipt sent via SMS.`,
      nextStep: 'REPAID',
      end: true,
    }
  }

  return { text: 'END Session error. Please try again.', nextStep: 'ERROR', end: true }
}
