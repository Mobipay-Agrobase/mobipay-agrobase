import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * POST /api/trainings/[id]/enroll-group
 *
 * Bulk-enroll all ACTIVE farmers from a FarmerGroup into a training.
 *
 * Body:
 *   { groupId: string }  // required
 *
 * Behavior:
 *   - Fetches all ACTIVE farmers in the given group (tenant-scoped)
 *   - Skips farmers already enrolled in this training
 *   - Creates TrainingAttendance records with status=ENROLLED
 *   - Returns summary: { enrolled, skipped, totalInGroup }
 *
 * Phase C1 — Training attendee selection from farmer group.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: trainingId } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const body = await req.json()

    if (!body.groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    // Verify the training exists and the caller has access
    const training = await db.training.findFirst({ where: { id: trainingId, ...tf } })
    if (!training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 })
    }

    // Verify the group exists in tenant scope
    const group = await db.farmerGroup.findFirst({
      where: { id: body.groupId, ...tf },
      select: { id: true, name: true },
    })
    if (!group) {
      return NextResponse.json({ error: 'Farmer group not found' }, { status: 404 })
    }

    // Fetch all ACTIVE farmers in this group
    const farmers = await db.farmerProfile.findMany({
      where: { groupId: body.groupId, status: 'ACTIVE', ...tf },
      select: { id: true, firstName: true, lastName: true, farmerCode: true },
    })

    if (farmers.length === 0) {
      return NextResponse.json({
        data: {
          groupId: body.groupId,
          groupName: group.name,
          totalInGroup: 0,
          enrolled: 0,
          skipped: 0,
          message: 'No active farmers in this group',
        },
      })
    }

    // Fetch existing attendance to skip duplicates
    const farmerIds = farmers.map(f => f.id)
    const existing = await db.trainingAttendance.findMany({
      where: { trainingId, farmerId: { in: farmerIds } },
      select: { farmerId: true },
    })
    const existingSet = new Set(existing.map(e => e.farmerId))

    // Build createMany payload — skip duplicates
    const toCreate = farmers
      .filter(f => !existingSet.has(f.id))
      .map(f => ({
        trainingId,
        farmerId: f.id,
        enrolledAt: new Date(),
        enrollmentStatus: 'ENROLLED',
        enrolledById: ctx.userId,
      }))

    let created = 0
    if (toCreate.length > 0) {
      // Use createMany for efficiency — but it doesn't return the records.
      // For the response, we return the count.
      const result = await db.trainingAttendance.createMany({
        data: toCreate,
        skipDuplicates: true,
      })
      created = result.count
    }

    return NextResponse.json({
      data: {
        groupId: body.groupId,
        groupName: group.name,
        totalInGroup: farmers.length,
        enrolled: created,
        skipped: farmers.length - created,
        alreadyEnrolled: existingSet.size,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[enroll-group] error:', error)
    return NextResponse.json(
      { error: 'Failed to enroll group', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
