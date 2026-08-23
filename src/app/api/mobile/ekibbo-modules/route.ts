import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/mobile/ekibbo-modules?type=trainings|farm-visits|surveys|loans
 *
 * Ekibbo Field-Officer module lists (per the team's menu spec), tenant-scoped:
 *   trainings  → { data: [{id, topic, date, location, trainer, status, type}] }
 *   farm-visits→ { data: [{id, farmerName, farmerCode, visitDate, topic, status}] }
 *   surveys    → { data: [{id, title, description, status, questions}] }
 *   loans      → { data: [{id, farmerName, applicant, amount, status, date}] }
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const type = new URL(req.url).searchParams.get('type') || ''

    switch (type) {
      case 'trainings': {
        const rows = await db.training.findMany({
          where: tf,
          select: {
            id: true, topic: true, date: true, location: true,
            trainerName: true, status: true, type: true,
            _count: { select: { attendance: true } },
          },
          orderBy: { date: 'desc' },
          take: 100,
        })
        return NextResponse.json({
          result: true,
          data: rows.map(t => ({
            id: numericId(t.id),
            topic: t.topic,
            date: t.date.toISOString().split('T')[0],
            location: t.location,
            trainer: t.trainerName,
            status: t.status,
            type: t.type,
            attendees: t._count.attendance,
          })),
        })
      }

      case 'farm-visits': {
        const rows = await db.farmVisit.findMany({
          where: { farmer: { ...tf } },
          select: {
            id: true, visitDate: true, topic: true, observations: true,
            recommendations: true, status: true,
            farmer: { select: { firstName: true, lastName: true, farmerCode: true } },
          },
          orderBy: { visitDate: 'desc' },
          take: 100,
        })
        return NextResponse.json({
          result: true,
          data: rows.map(v => ({
            id: numericId(v.id),
            farmerName: v.farmer ? `${v.farmer.firstName} ${v.farmer.lastName}`.trim() : '—',
            farmerCode: v.farmer?.farmerCode,
            visitDate: v.visitDate.toISOString().split('T')[0],
            topic: v.topic,
            observations: v.observations,
            recommendations: v.recommendations,
            status: v.status,
          })),
        })
      }

      case 'surveys': {
        const rows = await db.survey.findMany({
          where: tf,
          select: {
            id: true, title: true, description: true, status: true,
            _count: { select: { questions: true, responses: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
        return NextResponse.json({
          result: true,
          data: rows.map(s => ({
            id: numericId(s.id),
            title: s.title,
            description: s.description,
            status: s.status,
            questions: s._count.questions,
            responses: s._count.responses,
          })),
        })
      }

      case 'loans': {
        const rows = await db.loanApplication.findMany({
          where: ctx.isSuperAdmin || ctx.tenantScope.length === 0
            ? {}
            : { loanProduct: { tenantId: { in: ctx.tenantScope } } },
          select: {
            id: true, applicantName: true, amount: true, status: true,
            createdAt: true, disbursedAt: true, farmerId: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }).catch(() => [] as any[])
        return NextResponse.json({
          result: true,
          data: rows.map((l: any) => ({
            id: numericId(l.id),
            farmerName: l.applicantName,
            farmerCode: null,
            amount: l.amount,
            status: l.status,
            date: (l.disbursedAt ?? l.createdAt).toISOString().split('T')[0],
          })),
        })
      }

      default:
        return NextResponse.json({ result: false, message: 'Unknown type' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[ekibbo-modules]', error)
    return NextResponse.json({ result: false, message: 'Failed to load module data' }, { status: 500 })
  }
}
