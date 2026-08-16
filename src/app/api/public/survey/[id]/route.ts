import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * Public survey fetch endpoint — NO auth required.
 *
 * Used by the public survey page at /survey/[id] so respondents can fill
 * in a survey without logging in. Only returns ACTIVE surveys; DRAFT and
 * CLOSED surveys are 404 to prevent sharing of unpublished/closed forms.
 *
 * Security: this endpoint does NOT expose any tenant-identifying info
 * (tenantId, userIds, etc.). It only returns: title, description, status,
 * and the questions array (id, text, type, options, required).
 *
 * NOTE: SurveyQuestion in the Prisma schema uses `question` (not `text`),
 * has no `required` field, stores options as a JSON string, and orders
 * by `sortOrder` (not `createdAt`). We normalise to the front-end's
 * expected shape here.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const survey = await db.survey.findFirst({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        questions: {
          select: { id: true, question: true, type: true, options: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { responses: true } },
      },
    })

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }
    if (survey.status !== 'ACTIVE') {
      // Hide DRAFT and CLOSED surveys from public view
      return NextResponse.json({ error: 'Survey is not available' }, { status: 404 })
    }

    // Normalise to the front-end's expected shape:
    //   - rename `question` -> `text`
    //   - parse `options` from JSON string to string[]
    //   - default `required` to true (schema doesn't track per-question required-ness,
    //     and the public form expects a `required` flag — default true so all questions
    //     must be answered)
    const questions = survey.questions.map(q => ({
      id: q.id,
      text: q.question,
      type: q.type as 'TEXT' | 'RADIO' | 'CHECKBOX' | 'NUMBER',
      options: q.options ? safeParseOptions(q.options) : [],
      required: true,
    }))

    return NextResponse.json({
      data: {
        id: survey.id,
        title: survey.title,
        description: survey.description || '',
        status: survey.status,
        questions,
        _count: survey._count,
      },
    })
  } catch (error) {
    console.error('Public survey fetch error:', error)
    return NextResponse.json({ error: 'Failed to load survey' }, { status: 500 })
  }
}

function safeParseOptions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String)
    return []
  } catch {
    return []
  }
}

