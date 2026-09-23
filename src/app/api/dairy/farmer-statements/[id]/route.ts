import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyFarmerStatement.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Farmer statement not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyFarmerStatement detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch farmer statement' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFarmerStatement.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Farmer statement not found' }, { status: 404 })
    const body = await req.json()

    const updated = await db.dairyFarmerStatement.update({
      where: { id },
      data: {
        farmerId: body.farmerId !== undefined ? body.farmerId : undefined,
        farmerName: body.farmerName !== undefined ? body.farmerName : undefined,
        statementNo: body.statementNo !== undefined ? body.statementNo : undefined,
        periodStart: body.periodStart !== undefined ? (body.periodStart ? new Date(body.periodStart) : undefined) : undefined,
        periodEnd: body.periodEnd !== undefined ? (body.periodEnd ? new Date(body.periodEnd) : undefined) : undefined,
        totalMilkLitres: body.totalMilkLitres !== undefined ? (body.totalMilkLitres ? parseFloat(body.totalMilkLitres) : 0) : undefined,
        totalEarnings: body.totalEarnings !== undefined ? (body.totalEarnings ? parseFloat(body.totalEarnings) : 0) : undefined,
        totalDeductions: body.totalDeductions !== undefined ? (body.totalDeductions ? parseFloat(body.totalDeductions) : 0) : undefined,
        totalPayments: body.totalPayments !== undefined ? (body.totalPayments ? parseFloat(body.totalPayments) : 0) : undefined,
        closingBalance: body.closingBalance !== undefined ? (body.closingBalance ? parseFloat(body.closingBalance) : 0) : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        pdfUrl: body.pdfUrl !== undefined ? body.pdfUrl || null : undefined,
        status: body.status !== undefined ? body.status : undefined,
        sentAt: body.sentAt !== undefined ? (body.sentAt ? new Date(body.sentAt) : null) : undefined,
        acknowledgedAt: body.acknowledgedAt !== undefined ? (body.acknowledgedAt ? new Date(body.acknowledgedAt) : null) : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyFarmerStatement update error:', error)
    return NextResponse.json(
      { error: 'Failed to update farmer statement', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFarmerStatement.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Farmer statement not found' }, { status: 404 })
    await db.dairyFarmerStatement.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyFarmerStatement delete error:', error)
    return NextResponse.json({ error: 'Failed to delete farmer statement' }, { status: 500 })
  }
}
