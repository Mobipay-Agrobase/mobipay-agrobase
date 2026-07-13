/**
 * POST /api/ussd/nssf
 * 
 * USSD endpoint for NSSF Voluntary Savings Contributions.
 * Works with Africa's Talking USSD API.
 * 
 * Joel configures Africa's Talking to send POST requests to:
 *   https://mobipay-agrobase.vercel.app/api/ussd/nssf
 * 
 * Request from Africa's Talking:
 *   sessionId: unique session ID
 *   phoneNumber: farmer's phone number
 *   serviceCode: *284*56#
 *   text: what the user has typed so far (empty on first screen)
 * 
 * Response: plain text with the menu. Prefix:
 *   CON  — continue (show next menu)
 *   END  — end session (show final message)
 * 
 * FLOW:
 *   1. Welcome → Enter NSSF Number or National ID
 *   2. Show farmer name → Confirm identity (1=Yes 2=No)
 *   3. Enter contribution amount (min UGX 10,000)
 *   4. Select payment method (1=MTN 2=Airtel)
 *   5. Confirm contribution (1=Confirm 2=Cancel)
 *   6. END — "Contribution of UGX X received. Ref: XXX"
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const sessionId = formData.get('sessionId') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const serviceCode = formData.get('serviceCode') as string
    const text = (formData.get('text') as string) || ''

    // Parse the text input — Africa's Talking sends accumulated input separated by *
    const inputs = text ? text.split('*') : []
    const step = inputs.length

    // ─── STEP 0: Welcome screen ───
    if (step === 0) {
      return NextResponse.json(
        { response: 'CON Welcome to NSSF Voluntary Savings\nEnter your National ID number:' },
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ─── STEP 1: Look up farmer by National ID ───
    if (step === 1) {
      const nationalId = inputs[0].trim()
      
      if (nationalId.length < 5) {
        return NextResponse.json(
          { response: 'END Invalid National ID. Please try again with a valid ID number.' },
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Find farmer by NSSF national ID
      const farmer = await db.farmerProfile.findFirst({
        where: { nssfNationalId: nationalId },
        select: { id: true, firstName: true, lastName: true, nssfNumber: true, nssfActivationStatus: true, phone: true },
      })

      if (!farmer) {
        return NextResponse.json(
          { response: 'END No farmer found with this National ID. Please visit a Klimotrust office to register.' },
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (farmer.nssfActivationStatus !== 'ACTIVATED') {
        return NextResponse.json(
          { response: `END Your NSSF registration is ${farmer.nssfActivationStatus || 'PENDING'}. Please wait for activation before making contributions.` },
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      return NextResponse.json(
        { response: `CON Welcome ${farmer.firstName} ${farmer.lastName}\nNSSF: ${farmer.nssfNumber || 'N/A'}\n\n1. Confirm and continue\n2. Cancel` },
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ─── STEP 2: Enter contribution amount ───
    if (step === 2) {
      const confirmation = inputs[1].trim()
      
      if (confirmation !== '1') {
        return NextResponse.json(
          { response: 'END Session cancelled. Thank you.' },
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      return NextResponse.json(
        { response: 'CON Enter contribution amount (min UGX 10,000):' },
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ─── STEP 3: Select payment method ───
    if (step === 3) {
      const amountStr = inputs[2].trim()
      const amount = parseFloat(amountStr)
      
      if (isNaN(amount) || amount < 10000) {
        return NextResponse.json(
          { response: 'END Invalid amount. Minimum contribution is UGX 10,000. Please try again.' },
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      return NextResponse.json(
        { response: `CON Contribute UGX ${amount.toLocaleString()} to NSSF?\n\nSelect payment method:\n1. MTN MoMo\n2. Airtel Money` },
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ─── STEP 4: Confirm and create contribution ───
    if (step === 4) {
      const nationalId = inputs[0].trim()
      const amount = parseFloat(inputs[2].trim())
      const methodChoice = inputs[3].trim()
      
      const paymentMethod = methodChoice === '1' ? 'MTN_MOMO' : methodChoice === '2' ? 'AIRTEL_MONEY' : null
      
      if (!paymentMethod) {
        return NextResponse.json(
          { response: 'END Invalid selection. Please try again.' },
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Find the farmer again
      const farmer = await db.farmerProfile.findFirst({
        where: { nssfNationalId: nationalId },
        select: { id: true, firstName: true, lastName: true, tenantId: true },
      })

      if (!farmer) {
        return NextResponse.json(
          { response: 'END Session expired. Please start again.' },
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Create the contribution record
      const contribution = await db.nssfContribution.create({
        data: {
          tenantId: farmer.tenantId,
          registrationId: 'ussd-session-' + sessionId, // link to session
          farmerId: farmer.id,
          amount: new Prisma.Decimal(amount),
          currency: 'UGX',
          paymentMethod,
          paymentProvider: paymentMethod === 'MTN_MOMO' ? 'MTN_DIRECT' : 'AIRTEL_DIRECT',
          status: 'PENDING',
          initiatedById: 'ussd-' + phoneNumber,
          channel: 'USSD',
        },
      })

      // TODO: Trigger MTN/Airtel payment collection here
      // When Joel provides the MTN/Airtel merchant API config, we add:
      //   const payment = await collectViaMTN({ phone: phoneNumber, amount, reference: contribution.id })
      //   if (payment.success) { update contribution status to COMPLETED }

      // For now, return success — the actual MoMo collection happens via Joel's integration
      const reference = contribution.id.slice(-8).toUpperCase()
      
      return NextResponse.json(
        { response: `END Contribution of UGX ${amount.toLocaleString()} initiated.\nReference: ${reference}\nYou will receive an SMS confirmation shortly.\nThank you for saving with NSSF.` },
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fallback
    return NextResponse.json(
      { response: 'END Session expired. Please dial *284*56# to start again.' },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[ussd/nssf] error:', error)
    return NextResponse.json(
      { response: 'END An error occurred. Please try again later.' },
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * GET /api/ussd/nssf
 * Returns the USSD flow documentation for Joel.
 */
export async function GET() {
  return NextResponse.json({
    title: 'NSSF Voluntary Savings — USSD Flow',
    shortcode: '*284*56#',
    endpoint: 'POST /api/ussd/nssf',
    callbackUrl: 'https://mobipay-agrobase.vercel.app/api/ussd/nssf',
    flow: [
      { step: 0, screen: 'Welcome → Enter National ID' },
      { step: 1, screen: 'Show farmer name → Confirm (1=Yes 2=No)' },
      { step: 2, screen: 'Enter contribution amount (min UGX 10,000)' },
      { step: 3, screen: 'Select payment method (1=MTN 2=Airtel)' },
      { step: 4, screen: 'END — Contribution confirmed + reference number' },
    ],
    requestFormat: {
      sessionId: 'string — unique session ID from Africa Talking',
      phoneNumber: 'string — farmer phone number',
      serviceCode: 'string — *284*56#',
      text: 'string — accumulated user input (separated by *)',
    },
    responseFormat: {
      response: 'string — menu text. Prefix CON=continue, END=end session',
    },
    notes: 'Joel configures Africa Talking to POST form data to this endpoint. Response is JSON with a "response" field containing the menu text.',
  })
}
