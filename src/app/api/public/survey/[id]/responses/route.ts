import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * Public survey response submission endpoint — NO auth required.
 *
 * Used by the public survey page at /survey/[id] so respondents can submit
 * their answers without logging in. Validates that:
 *   - The survey exists
 *   - The survey is ACTIVE (not DRAFT or CLOSED)
 *   - All questions have answers (the schema doesn't have a per-question
 *     `required` flag, so we treat all questions as required for public
 *     submissions to ensure data quality)
 *
 * The answers payload is stored as JSON string in the SurveyResponse.answers
 * field, consistent with the authenticated POST /api/surveys/[id]/responses.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { answers, respondentId } = body

    // Verify survey exists and is ACTIVE
    const survey = await db.survey.findFirst({
      where: { id },
      select: {
        id: true,
        status: true,
        questions: { select: { id: true } },
      },
    })
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }
    if (survey.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Survey is no longer accepting responses' }, { status: 410 })
    }

    // Validate all questions have answers (no `required` field in schema —
    // treat all questions as required for public submissions).
    const answersMap: Record<string, any> = answers || {}
    const missing = survey.questions
      .filter(q => {
        const v = answersMap[q.id]
        return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
      })
      .map(q => q.id)
    if (missing.length > 0) {
      return NextResponse.json({ error: 'Please answer all questions', missing }, { status: 400 })
    }

    const response = await db.surveyResponse.create({
      data: {
        surveyId: id,
        respondentId: respondentId || null,
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers),
      },
    })

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (error) {
    console.error('Public survey response error:', error)
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
  }
}

