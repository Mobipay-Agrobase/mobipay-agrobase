import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyLoanApplication.findFirst({
      where: { id, ...tf },
      include: {
        lender: { select: { id: true, lenderName: true, lenderType: true, contactName: true, contactPhone: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Loan application not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyLoanApplication detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch loan application' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyLoanApplication.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Loan application not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyLoanApplication.update({
      where: { id },
      data: {
        lenderId: body.lenderId !== undefined ? body.lenderId : undefined,
        farmerId: body.farmerId !== undefined ? body.farmerId : undefined,
        farmerName: body.farmerName !== undefined ? body.farmerName : undefined,
        farmerPhone: body.farmerPhone !== undefined ? body.farmerPhone || null : undefined,
        creditScoreId: body.creditScoreId !== undefined ? body.creditScoreId || null : undefined,
        requestedAmount:
          body.requestedAmount !== undefined
            ? body.requestedAmount !== null && body.requestedAmount !== ''
              ? parseFloat(body.requestedAmount)
              : null
            : undefined,
        approvedAmount:
          body.approvedAmount !== undefined
            ? body.approvedAmount !== null && body.approvedAmount !== ''
              ? parseFloat(body.approvedAmount)
              : null
            : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        purpose: body.purpose !== undefined ? body.purpose || null : undefined,
        durationMonths:
          body.durationMonths !== undefined
            ? body.durationMonths !== null && body.durationMonths !== ''
              ? parseInt(body.durationMonths)
              : null
            : undefined,
        interestRate:
          body.interestRate !== undefined
            ? body.interestRate !== null && body.interestRate !== ''
              ? parseFloat(body.interestRate)
              : null
            : undefined,
        status: body.status !== undefined ? body.status : undefined,
        lenderRef: body.lenderRef !== undefined ? body.lenderRef || null : undefined,
        appliedAt: body.appliedAt !== undefined ? (body.appliedAt ? new Date(body.appliedAt) : new Date()) : undefined,
        submittedAt: body.submittedAt !== undefined ? (body.submittedAt ? new Date(body.submittedAt) : null) : undefined,
        approvedAt: body.approvedAt !== undefined ? (body.approvedAt ? new Date(body.approvedAt) : null) : undefined,
        disbursedAt: body.disbursedAt !== undefined ? (body.disbursedAt ? new Date(body.disbursedAt) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyLoanApplication update error:', error)
    return NextResponse.json(
      { error: 'Failed to update loan application', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyLoanApplication.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Loan application not found' }, { status: 404 })
    await db.dairyLoanApplication.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyLoanApplication delete error:', error)
    return NextResponse.json({ error: 'Failed to delete loan application' }, { status: 500 })
  }
}
