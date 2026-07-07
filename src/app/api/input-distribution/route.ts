import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/input-distribution?farmerId=xxx
 *   List input distributions for a farmer (or all in tenant).
 *
 * POST /api/input-distribution
 *   Distribute inputs to a farmer.
 *   Auto-calculates totalCost = quantity × unitCost.
 *   Creates a FarmerLedgerEntry (debit).
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { ...tf }
    if (farmerId) where.farmerId = farmerId
    if (status) where.status = status

    const distributions = await db.inputDistribution.findMany({
      where,
      include: {
        farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true } },
      },
      orderBy: { distributionDate: 'desc' },
      take: 200,
    })

    return NextResponse.json({ data: distributions })
  } catch (error: any) {
    console.error('Input distribution list error:', error)
    return NextResponse.json({ error: 'Failed to fetch input distributions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    const body = await request.json()
    const { farmerId, inputType, inputName, quantity, unit, unitCost, distributionDate, notes } = body

    if (!farmerId || !inputType || !quantity || !unitCost) {
      return NextResponse.json(
        { error: 'farmerId, inputType, quantity, and unitCost are required' },
        { status: 400 }
      )
    }

    // Verify farmer belongs to tenant
    const farmer = await db.farmerProfile.findFirst({
      where: { id: farmerId, ...buildTenantFilter(ctx, 'tenantId') },
      select: { id: true, firstName: true, lastName: true },
    })
    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 })
    }

    const totalCost = parseFloat(quantity) * parseFloat(unitCost)

    // Create the distribution record
    const distribution = await db.inputDistribution.create({
      data: {
        tenantId: ctx.tenantId,
        farmerId,
        inputType,
        inputName: inputName || null,
        quantity: parseFloat(quantity),
        unit: unit || 'pcs',
        unitCost: parseFloat(unitCost),
        totalCost,
        balanceRemaining: totalCost,
        status: 'DISTRIBUTED',
        distributionDate: distributionDate ? new Date(distributionDate) : new Date(),
        notes: notes || null,
      },
    })

    // Create a ledger entry (debit — farmer owes this amount)
    const lastEntry = await db.farmerLedgerEntry.findFirst({
      where: { farmerId },
      orderBy: { date: 'desc' },
      select: { balanceAfter: true },
    })
    const runningBalance = (lastEntry?.balanceAfter || 0) - totalCost

    await db.farmerLedgerEntry.create({
      data: {
        tenantId: ctx.tenantId,
        farmerId,
        type: 'INPUT_DIST',
        description: `Input distribution: ${inputName || inputType} (${quantity} ${unit || 'pcs'})`,
        amount: -totalCost,
        balanceAfter: runningBalance,
        referenceType: 'InputDistribution',
        referenceId: distribution.id,
        createdBy: ctx.userId,
        approvalStatus: 'APPROVED',
        approvedBy: ctx.userId,
      },
    })

    return NextResponse.json({ data: distribution }, { status: 201 })
  } catch (error: any) {
    console.error('Input distribution create error:', error)
    return NextResponse.json(
      { error: 'Failed to create input distribution', detail: error.message },
      { status: 500 }
    )
  }
}
