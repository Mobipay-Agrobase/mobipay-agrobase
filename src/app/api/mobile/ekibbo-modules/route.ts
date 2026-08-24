import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId, resolveFarmerByNumericId } from '@/lib/mobile/ekibbo-adapter'
import { isMobileStaff } from '@/lib/mobile/ekibbo-mobile-utils'

/**
 * /api/mobile/ekibbo-modules — FULL CRUD for the Ekibbo Field-Officer menu
 * modules, backed by the SAME web-platform tables the web CRUD uses:
 *
 *   type = trainings    → Training            (+ training-attendance enrollment)
 *   type = farm-visits  → FarmVisit
 *   type = surveys      → Survey (+ SurveyQuestion builder)
 *   type = loans        → LoanApplication
 *   type = loan-products→ LoanProduct dropdown for the loan form
 *
 * GET    ?type=…               list (mobile card shape)
 * GET    ?type=…&id=<numeric>  detail (full fields, for edit pre-fill)
 * POST   ?type=…               create (JSON body)
 * PUT    ?type=…&id=<numeric>  update
 * DELETE ?type=…&id=<numeric>  delete
 *
 * All reads/writes are tenant-scoped via the Bearer-token context; numeric
 * ids are the 52-bit hashes the mobile app displays.
 */

// ── helpers ────────────────────────────────────────────────────────────────

function bad(message: string, status = 400) {
  return NextResponse.json({ result: false, message }, { status })
}

async function resolveTraining(tf: Record<string, unknown>, numeric: number) {
  const rows = await db.training.findMany({ where: tf, select: { id: true }, take: 20000 })
  return rows.find(r => numericId(r.id) === numeric) ?? null
}

async function resolveFarmVisit(tf: Record<string, unknown>, numeric: number) {
  const rows = await db.farmVisit.findMany({
    where: { farmer: { ...tf } },
    select: { id: true },
    take: 20000,
  })
  return rows.find(r => numericId(r.id) === numeric) ?? null
}

async function resolveSurvey(tf: Record<string, unknown>, numeric: number) {
  const rows = await db.survey.findMany({ where: tf, select: { id: true }, take: 20000 })
  return rows.find(r => numericId(r.id) === numeric) ?? null
}

async function loanWhere(ctx: Awaited<ReturnType<typeof getTenantContext>>) {
  return ctx.isSuperAdmin || ctx.tenantScope.length === 0
    ? {}
    : { loanProduct: { tenantId: { in: ctx.tenantScope } } }
}

async function resolveLoan(ctx: Awaited<ReturnType<typeof getTenantContext>>, numeric: number) {
  const rows = await db.loanApplication.findMany({
    where: await loanWhere(ctx),
    select: { id: true },
    take: 20000,
  })
  return rows.find(r => numericId(r.id) === numeric) ?? null
}

const isoDate = (d: Date) => d.toISOString().split('T')[0]

// ── GET (list + detail) ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return bad('Not authorized', 403)
    }
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || ''
    const idParam = searchParams.get('id')
    const numeric = idParam ? parseInt(idParam, 10) : null

    switch (type) {
      // ── LOAN PRODUCTS (form dropdown) ──
      case 'loan-products': {
        const products = await db.loanProduct.findMany({
          where: { ...tf, isActive: true },
          select: { id: true, name: true, interestRate: true, maxAmount: true, minAmount: true, maxDuration: true, gracePeriod: true },
          orderBy: { name: 'asc' },
          take: 200,
        })
        return NextResponse.json({
          result: true,
          data: products.map(p => ({
            id: numericId(p.id),
            name: p.name,
            interest_rate: p.interestRate,
            max_amount: p.maxAmount,
            min_amount: p.minAmount,
            max_duration_months: p.maxDuration,
            grace_period: p.gracePeriod,
          })),
        })
      }

      // ── TRAININGS ──
      case 'trainings': {
        if (numeric != null) {
          const match = await resolveTraining(tf, numeric)
          if (!match) return bad('Training not found', 404)
          const t = await db.training.findFirst({
            where: { id: match.id },
            include: {
              attendance: {
                orderBy: { createdAt: 'desc' },
                include: { farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true } } },
              },
            },
          })
          if (!t) return bad('Training not found', 404)
          return NextResponse.json({
            result: true,
            data: {
              id: numericId(t.id),
              topic: t.topic,
              description: t.description ?? '',
              date: isoDate(t.date),
              location: t.location ?? '',
              trainer: t.trainerName ?? '',
              type: t.type,
              status: t.status,
              expected_attendees: t.expectedAttendees,
              notes: t.notes ?? '',
              attendees: t.attendance.length,
              attendance: t.attendance.map(a => ({
                id: numericId(a.id),
                farmer_id: numericId(a.farmerId),
                farmer_name: `${a.farmer?.firstName ?? ''} ${a.farmer?.lastName ?? ''}`.trim(),
                farmer_code: a.farmer?.farmerCode ?? '',
                enrollment_status: a.enrollmentStatus,
                attended: a.attended,
              })),
            },
          })
        }
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
            date: isoDate(t.date),
            location: t.location,
            trainer: t.trainerName,
            status: t.status,
            type: t.type,
            attendees: t._count.attendance,
          })),
        })
      }

      // ── FARM VISITS ──
      case 'farm-visits': {
        if (numeric != null) {
          const match = await resolveFarmVisit(tf, numeric)
          if (!match) return bad('Farm visit not found', 404)
          const v = await db.farmVisit.findFirst({
            where: { id: match.id },
            include: { farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true } } },
          })
          if (!v) return bad('Farm visit not found', 404)
          return NextResponse.json({
            result: true,
            data: {
              id: numericId(v.id),
              farmer_id: v.farmerId ? numericId(v.farmerId) : 0,
              farmer_name: v.farmer ? `${v.farmer.firstName ?? ''} ${v.farmer.lastName ?? ''}`.trim() : '',
              farmer_code: v.farmer?.farmerCode ?? '',
              visit_date: isoDate(v.visitDate),
              topic: v.topic,
              observations: v.observations ?? '',
              recommendations: v.recommendations ?? '',
              follow_up_date: v.followUpDate ? isoDate(v.followUpDate) : '',
              status: v.status,
            },
          })
        }
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
            visitDate: isoDate(v.visitDate),
            topic: v.topic,
            observations: v.observations,
            recommendations: v.recommendations,
            status: v.status,
          })),
        })
      }

      // ── SURVEYS ──
      case 'surveys': {
        if (numeric != null) {
          const match = await resolveSurvey(tf, numeric)
          if (!match) return bad('Survey not found', 404)
          const s = await db.survey.findFirst({
            where: { id: match.id },
            include: {
              questions: { orderBy: { sortOrder: 'asc' } },
              _count: { select: { responses: true } },
            },
          })
          if (!s) return bad('Survey not found', 404)
          return NextResponse.json({
            result: true,
            data: {
              id: numericId(s.id),
              title: s.title,
              description: s.description ?? '',
              status: s.status,
              responses: s._count.responses,
              questions: s.questions.map(q => ({
                id: numericId(q.id),
                question: q.question,
                type: q.type,
                options: q.options ? safeParseArray(q.options) : [],
                sort_order: q.sortOrder,
              })),
            },
          })
        }
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

      // ── LOANS ──
      case 'loans': {
        const where = await loanWhere(ctx)
        if (numeric != null) {
          const match = await resolveLoan(ctx, numeric)
          if (!match) return bad('Loan application not found', 404)
          const l = await db.loanApplication.findFirst({
            where: { id: match.id },
            include: { loanProduct: { select: { id: true, name: true } } },
          })
          if (!l) return bad('Loan application not found', 404)
          return NextResponse.json({
            result: true,
            data: {
              id: numericId(l.id),
              loan_product_id: numericId(l.loanProductId),
              loan_product_name: l.loanProduct?.name ?? '',
              farmer_id: l.farmerId ? numericId(l.farmerId) : 0,
              applicant_name: l.applicantName,
              applicant_phone: l.applicantPhone,
              amount: l.amount,
              purpose: l.purpose ?? '',
              status: l.status,
              date: isoDate(l.disbursedAt ?? l.createdAt),
            },
          })
        }
        const rows = await db.loanApplication.findMany({
          where,
          select: {
            id: true, applicantName: true, amount: true, status: true,
            createdAt: true, disbursedAt: true, farmerId: true,
            loanProduct: { select: { name: true } },
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
            loan_product_name: l.loanProduct?.name ?? '',
            amount: l.amount,
            status: l.status,
            date: isoDate(l.disbursedAt ?? l.createdAt),
          })),
        })
      }

      default:
        return bad('Unknown type')
    }
  } catch (error: any) {
    console.error('[ekibbo-modules GET]', error)
    return bad('Failed to load module data', 500)
  }
}

// ── POST (create) ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) return bad('Not authorized', 403)
    if (!ctx.tenantId) return bad('No tenant context')
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || ''
    const body = await req.json().catch(() => ({}))

    switch (type) {
      case 'trainings': {
        const topic = String(body.topic ?? '').trim()
        if (!topic) return bad('Topic is required')
        const t = await db.training.create({
          data: {
            tenantId: ctx.tenantId,
            topic,
            description: body.description || null,
            date: body.date ? new Date(body.date) : new Date(),
            location: body.location || null,
            trainerName: body.trainerName || body.trainer || null,
            type: body.type || 'GROUP_TRAINING',
            status: body.status || 'SCHEDULED',
            startTime: body.startTime ? new Date(body.startTime) : null,
            endTime: body.endTime ? new Date(body.endTime) : null,
            expectedAttendees: body.expectedAttendees != null ? Number(body.expectedAttendees) : null,
            materialsUsed: body.materialsUsed || null,
            notes: body.notes || null,
            conductedById: ctx.userId,
          },
        })
        return NextResponse.json({
          result: true,
          message: 'Training created',
          data: { id: numericId(t.id) },
        })
      }

      case 'farm-visits': {
        const topic = String(body.topic ?? '').trim()
        if (!topic) return bad('Topic is required')
        let farmerRealId: string | null = null
        const farmerNum = parseInt(String(body.farmer_id ?? body.farmerId ?? ''), 10)
        if (!Number.isNaN(farmerNum) && farmerNum > 0) {
          const farmer = await resolveFarmerByNumericId(tf, farmerNum)
          if (!farmer) return bad('Farmer not found', 404)
          farmerRealId = farmer.id
        }
        const v = await db.farmVisit.create({
          data: {
            farmerId: farmerRealId,
            extensionOfficerId: ctx.userId,
            visitDate: body.visit_date ? new Date(body.visit_date) : new Date(),
            topic,
            observations: body.observations || null,
            recommendations: body.recommendations || null,
            followUpDate: body.follow_up_date ? new Date(body.follow_up_date) : null,
            status: body.status || 'COMPLETED',
          },
        })
        return NextResponse.json({
          result: true,
          message: 'Farm visit created',
          data: { id: numericId(v.id) },
        })
      }

      case 'surveys': {
        const title = String(body.title ?? '').trim()
        if (!title) return bad('Title is required')
        const questions: any[] = Array.isArray(body.questions) ? body.questions : []
        const s = await db.$transaction(async tx => {
          const created = await tx.survey.create({
            data: {
              tenantId: ctx.tenantId,
              title,
              description: body.description || null,
              status: body.status || 'ACTIVE',
              questions: {
                create: questions.map((q, i) => ({
                  question: String(q.question ?? '').trim(),
                  type: String(q.type ?? 'TEXT'),
                  options: Array.isArray(q.options) && q.options.length
                    ? JSON.stringify(q.options)
                    : (typeof q.options === 'string' && q.options ? q.options : null),
                  sortOrder: q.sort_order ?? i,
                })),
              },
            },
          })
          return created
        })
        return NextResponse.json({
          result: true,
          message: 'Survey created',
          data: { id: numericId(s.id) },
        })
      }

      case 'loans': {
        const amount = Number(body.amount)
        const applicantName = String(body.applicant_name ?? '').trim()
        const productNum = parseInt(String(body.loan_product_id ?? body.loanProductId ?? ''), 10)
        if (!applicantName) return bad('Applicant name is required')
        if (Number.isNaN(amount) || amount <= 0) return bad('A valid amount is required')
        if (Number.isNaN(productNum)) return bad('Loan product is required')

        // Resolve the loan product inside the tenant scope.
        const products = await db.loanProduct.findMany({
          where: { ...tf, isActive: true },
          select: { id: true },
          take: 1000,
        })
        const product = products.find(p => numericId(p.id) === productNum)
        if (!product) return bad('Loan product not found in your tenant', 404)

        // Optional farmer linkage (numeric → real).
        let farmerRealId: string | null = null
        const farmerNum = parseInt(String(body.farmer_id ?? body.farmerId ?? ''), 10)
        if (!Number.isNaN(farmerNum) && farmerNum > 0) {
          const farmer = await resolveFarmerByNumericId(tf, farmerNum)
          if (farmer) farmerRealId = farmer.id
        }

        const l = await db.loanApplication.create({
          data: {
            loanProductId: product.id,
            farmerId: farmerRealId,
            applicantName,
            applicantPhone: String(body.applicant_phone ?? ''),
            amount,
            purpose: body.purpose || null,
            status: body.status || 'PENDING',
          },
        })
        return NextResponse.json({
          result: true,
          message: 'Loan application created',
          data: { id: numericId(l.id) },
        })
      }

      case 'training-attendance': {
        // Enroll a farmer in a training: {training_id, farmer_id}
        const trainingNum = parseInt(String(body.training_id ?? body.trainingId ?? ''), 10)
        const farmerNum = parseInt(String(body.farmer_id ?? body.farmerId ?? ''), 10)
        if (Number.isNaN(trainingNum) || Number.isNaN(farmerNum)) {
          return bad('training_id and farmer_id are required')
        }
        const training = await resolveTraining(tf, trainingNum)
        if (!training) return bad('Training not found', 404)
        const farmer = await resolveFarmerByNumericId(tf, farmerNum)
        if (!farmer) return bad('Farmer not found', 404)

        // Avoid duplicate enrollment.
        const dup = await db.trainingAttendance.findFirst({
          where: { trainingId: training.id, farmerId: farmer.id },
        })
        if (dup) {
          return NextResponse.json({
            result: true,
            message: 'Farmer already enrolled',
            data: { id: numericId(dup.id) },
          })
        }
        const a = await db.trainingAttendance.create({
          data: {
            trainingId: training.id,
            farmerId: farmer.id,
            attended: false,
            enrollmentStatus: 'ENROLLED',
            enrolledAt: new Date(),
            enrolledById: ctx.userId,
          },
        })
        return NextResponse.json({
          result: true,
          message: 'Farmer enrolled',
          data: { id: numericId(a.id) },
        })
      }

      default:
        return bad('Unknown type')
    }
  } catch (error: any) {
    console.error('[ekibbo-modules POST]', error)
    return bad('Failed to create record', 500)
  }
}

// ── PUT (update) ───────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) return bad('Not authorized', 403)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || ''
    const numeric = parseInt(searchParams.get('id') || '', 10)
    if (Number.isNaN(numeric)) return bad('id is required')
    const body = await req.json().catch(() => ({}))

    switch (type) {
      case 'trainings': {
        const match = await resolveTraining(tf, numeric)
        if (!match) return bad('Training not found', 404)
        await db.training.update({
          where: { id: match.id },
          data: {
            ...(body.topic !== undefined && { topic: String(body.topic) }),
            ...(body.description !== undefined && { description: body.description || null }),
            ...(body.date !== undefined && { date: body.date ? new Date(body.date) : undefined }),
            ...(body.location !== undefined && { location: body.location || null }),
            ...(body.trainerName !== undefined && { trainerName: body.trainerName || null }),
            ...(body.type !== undefined && { type: body.type }),
            ...(body.status !== undefined && { status: body.status }),
            ...(body.expectedAttendees !== undefined && {
              expectedAttendees: body.expectedAttendees != null && body.expectedAttendees !== ''
                ? Number(body.expectedAttendees) : null,
            }),
            ...(body.notes !== undefined && { notes: body.notes || null }),
          },
        })
        return NextResponse.json({ result: true, message: 'Training updated' })
      }

      case 'farm-visits': {
        const match = await resolveFarmVisit(tf, numeric)
        if (!match) return bad('Farm visit not found', 404)
        let farmerRealId: string | null | undefined
        const farmerNum = parseInt(String(body.farmer_id ?? body.farmerId ?? ''), 10)
        if (!Number.isNaN(farmerNum) && farmerNum > 0) {
          const farmer = await resolveFarmerByNumericId(tf, farmerNum)
          if (!farmer) return bad('Farmer not found', 404)
          farmerRealId = farmer.id
        }
        await db.farmVisit.update({
          where: { id: match.id },
          data: {
            ...(farmerRealId !== undefined && { farmerId: farmerRealId }),
            ...(body.visit_date !== undefined && {
              visitDate: body.visit_date ? new Date(body.visit_date) : undefined,
            }),
            ...(body.topic !== undefined && { topic: String(body.topic) }),
            ...(body.observations !== undefined && { observations: body.observations || null }),
            ...(body.recommendations !== undefined && { recommendations: body.recommendations || null }),
            ...(body.follow_up_date !== undefined && {
              followUpDate: body.follow_up_date ? new Date(body.follow_up_date) : null,
            }),
            ...(body.status !== undefined && { status: body.status }),
          },
        })
        return NextResponse.json({ result: true, message: 'Farm visit updated' })
      }

      case 'surveys': {
        const match = await resolveSurvey(tf, numeric)
        if (!match) return bad('Survey not found', 404)
        await db.$transaction(async tx => {
          await tx.survey.update({
            where: { id: match.id },
            data: {
              ...(body.title !== undefined && { title: String(body.title) }),
              ...(body.description !== undefined && { description: body.description || null }),
              ...(body.status !== undefined && { status: body.status }),
            },
          })
          // Question builder parity: when the payload carries `questions`,
          // replace the set (same semantics as the web builder).
          if (Array.isArray(body.questions)) {
            await tx.surveyQuestion.deleteMany({ where: { surveyId: match.id } })
            if (body.questions.length) {
              await tx.surveyQuestion.createMany({
                data: (body.questions as any[]).map((q, i) => ({
                  surveyId: match.id,
                  question: String(q.question ?? '').trim(),
                  type: String(q.type ?? 'TEXT'),
                  options: Array.isArray(q.options) && q.options.length
                    ? JSON.stringify(q.options)
                    : null,
                  sortOrder: q.sort_order ?? i,
                })),
              })
            }
          }
        })
        return NextResponse.json({ result: true, message: 'Survey updated' })
      }

      case 'loans': {
        const match = await resolveLoan(ctx, numeric)
        if (!match) return bad('Loan application not found', 404)
        let loanProductRealId: string | undefined
        const productNum = parseInt(String(body.loan_product_id ?? ''), 10)
        if (!Number.isNaN(productNum) && productNum > 0) {
          const products = await db.loanProduct.findMany({
            where: { ...tf, isActive: true },
            select: { id: true },
            take: 1000,
          })
          const product = products.find(p => numericId(p.id) === productNum)
          if (!product) return bad('Loan product not found in your tenant', 404)
          loanProductRealId = product.id
        }
        await db.loanApplication.update({
          where: { id: match.id },
          data: {
            ...(loanProductRealId !== undefined && { loanProductId: loanProductRealId }),
            ...(body.applicant_name !== undefined && { applicantName: String(body.applicant_name) }),
            ...(body.applicant_phone !== undefined && { applicantPhone: String(body.applicant_phone) }),
            ...(body.amount !== undefined && { amount: Number(body.amount) }),
            ...(body.purpose !== undefined && { purpose: body.purpose || null }),
            ...(body.status !== undefined && { status: body.status }),
          },
        })
        return NextResponse.json({ result: true, message: 'Loan application updated' })
      }

      default:
        return bad('Unknown type')
    }
  } catch (error: any) {
    console.error('[ekibbo-modules PUT]', error)
    return bad('Failed to update record', 500)
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) return bad('Not authorized', 403)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || ''
    const numeric = parseInt(searchParams.get('id') || '', 10)
    if (Number.isNaN(numeric)) return bad('id is required')

    switch (type) {
      case 'trainings': {
        const match = await resolveTraining(tf, numeric)
        if (!match) return bad('Training not found', 404)
        await db.training.deleteMany({ where: { id: match.id, ...tf } })
        return NextResponse.json({ result: true, message: 'Training deleted' })
      }
      case 'farm-visits': {
        const match = await resolveFarmVisit(tf, numeric)
        if (!match) return bad('Farm visit not found', 404)
        await db.farmVisit.deleteMany({ where: { id: match.id } })
        return NextResponse.json({ result: true, message: 'Farm visit deleted' })
      }
      case 'surveys': {
        const match = await resolveSurvey(tf, numeric)
        if (!match) return bad('Survey not found', 404)
        await db.survey.delete({ where: { id: match.id } })
        return NextResponse.json({ result: true, message: 'Survey deleted' })
      }
      case 'loans': {
        const match = await resolveLoan(ctx, numeric)
        if (!match) return bad('Loan application not found', 404)
        await db.loanApplication.deleteMany({ where: { id: match.id } })
        return NextResponse.json({ result: true, message: 'Loan application deleted' })
      }
      case 'training-attendance': {
        // Remove one enrollment row.
        const rows = await db.trainingAttendance.findMany({
          where: { training: { ...tf } },
          select: { id: true },
          take: 20000,
        })
        const match = rows.find(r => numericId(r.id) === numeric)
        if (!match) return bad('Enrollment not found', 404)
        await db.trainingAttendance.deleteMany({ where: { id: match.id } })
        return NextResponse.json({ result: true, message: 'Enrollment removed' })
      }
      default:
        return bad('Unknown type')
    }
  } catch (error: any) {
    console.error('[ekibbo-modules DELETE]', error)
    return bad('Failed to delete record', 500)
  }
}

function safeParseArray(s: string): string[] {
  try {
    const v = JSON.parse(s)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}
