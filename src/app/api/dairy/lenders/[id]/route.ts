import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyLender.findFirst({
      where: { id, ...tf },
      include: {
        loanApplications: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { loanApplications: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Lender not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyLender detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch lender' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyLender.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Lender not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyLender.update({
      where: { id },
      data: {
        lenderName: body.lenderName !== undefined ? body.lenderName : undefined,
        lenderType: body.lenderType !== undefined ? body.lenderType : undefined,
        countryCode: body.countryCode !== undefined ? body.countryCode : undefined,
        contactName: body.contactName !== undefined ? body.contactName || null : undefined,
        contactPhone: body.contactPhone !== undefined ? body.contactPhone || null : undefined,
        contactEmail: body.contactEmail !== undefined ? body.contactEmail || null : undefined,
        apiUrl: body.apiUrl !== undefined ? body.apiUrl || null : undefined,
        apiKey: body.apiKey !== undefined ? body.apiKey || null : undefined,
        maxLoanAmount:
          body.maxLoanAmount !== undefined
            ? body.maxLoanAmount !== null && body.maxLoanAmount !== ''
              ? parseFloat(body.maxLoanAmount)
              : null
            : undefined,
        minCreditScore:
          body.minCreditScore !== undefined
            ? body.minCreditScore !== null && body.minCreditScore !== ''
              ? parseInt(body.minCreditScore)
              : null
            : undefined,
        interestRate:
          body.interestRate !== undefined
            ? body.interestRate !== null && body.interestRate !== ''
              ? parseFloat(body.interestRate)
              : null
            : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyLender update error:', error)
    return NextResponse.json(
      { error: 'Failed to update lender', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyLender.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Lender not found' }, { status: 404 })
    await db.dairyLender.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyLender delete error:', error)
    return NextResponse.json({ error: 'Failed to delete lender' }, { status: 500 })
  }
}
