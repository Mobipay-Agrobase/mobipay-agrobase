'use client'

/**
 * Public Survey Page — /survey/[id]
 *
 * Renders a survey for any respondent (no login required). Loads the survey
 * via the public API endpoint at /api/public/survey/[id] and submits
 * responses to /api/public/survey/[id]/responses.
 *
 * Only ACTIVE surveys are visible. DRAFT and CLOSED surveys return a
 * "Survey is not available" message.
 *
 * After successful submission, a thank-you screen is shown with an option
 * to submit another response.
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Loader2, FileText, Send, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'

interface SurveyQuestion {
  id: string
  text: string
  type: 'TEXT' | 'RADIO' | 'CHECKBOX' | 'NUMBER'
  options?: string[]
  required: boolean
}

interface Survey {
  id: string
  title: string
  description: string
  status: 'ACTIVE' | 'DRAFT' | 'CLOSED'
  questions: SurveyQuestion[]
  _count?: { responses?: number }
}

type Stage = 'loading' | 'notfound' | 'ready' | 'submitting' | 'submitted' | 'error'

export default function PublicSurveyPage() {
  const params = useParams<{ id: string }>()
  const surveyId = params?.id || ''

  const [stage, setStage] = useState<Stage>('loading')
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [errorMessage, setErrorMessage] = useState('')
  const [missingIds, setMissingIds] = useState<string[]>([])

  const fetchSurvey = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/survey/${surveyId}`)
      if (!res.ok) {
        setStage('notfound')
        return
      }
      const data = await res.json()
      setSurvey(data.data)
      setStage('ready')
    } catch {
      setStage('notfound')
    }
  }, [surveyId])

  useEffect(() => { fetchSurvey() }, [fetchSurvey])

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    // Clear the missing-error for this question when the user starts answering it
    if (missingIds.includes(questionId)) {
      setMissingIds(prev => prev.filter(id => id !== questionId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!survey) return

    // Validate required questions client-side too
    const missing = survey.questions
      .filter(q => q.required && (answers[q.id] === undefined || answers[q.id] === '' || (Array.isArray(answers[q.id]) && answers[q.id].length === 0)))
      .map(q => q.id)
    if (missing.length > 0) {
      setMissingIds(missing)
      setErrorMessage('Please answer all required questions.')
      return
    }

    setStage('submitting')
    setErrorMessage('')
    try {
      const res = await fetch(`/api/public/survey/${surveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.missing && Array.isArray(data.missing)) setMissingIds(data.missing)
        throw new Error(data.error || 'Failed to submit response')
      }
      setStage('submitted')
    } catch (err: any) {
      setStage('error')
      setErrorMessage(err.message || 'Failed to submit response')
    }
  }

  // ─── Loading ───
  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Loading survey…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Not found / unavailable ───
  if (stage === 'notfound' || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
            <h1 className="text-lg font-semibold">Survey not available</h1>
            <p className="text-sm text-muted-foreground mt-2">
              This survey may have been closed, deleted, or the link is incorrect.
              Please contact the person who shared this link with you.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Submitted ───
  if (stage === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
            <h1 className="text-lg font-semibold">Thank you!</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Your response has been recorded.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => {
                setAnswers({})
                setStage('ready')
              }}
            >
              Submit another response
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Ready / submitting / error ───
  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="w-3 h-3" /> Back to home
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Survey</span>
            {survey._count?.responses !== undefined && (
              <Badge variant="outline" className="text-[10px] font-normal ml-2">
                {survey._count.responses} {survey._count.responses === 1 ? 'response' : 'responses'} so far
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{survey.title}</h1>
          {survey.description && (
            <p className="text-sm text-muted-foreground mt-2">{survey.description}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {survey.questions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                This survey has no questions yet.
              </CardContent>
            </Card>
          ) : (
            survey.questions.map((q, idx) => {
              const isMissing = missingIds.includes(q.id)
              return (
                <Card key={q.id} className={isMissing ? 'border-red-500' : ''}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">Q{idx + 1}.</span>
                      <span className="flex-1">{q.text}</span>
                      {q.required && (
                        <Badge variant="outline" className="text-[10px] text-red-600 border-red-300 shrink-0">
                          Required
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuestionInput
                      question={q}
                      value={answers[q.id]}
                      onChange={(v) => setAnswer(q.id, v)}
                    />
                    {isMissing && (
                      <p className="text-xs text-red-600 mt-2">This question is required.</p>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}

          {/* Error message */}
          {stage === 'error' && errorMessage && (
            <Card className="border-red-500">
              <CardContent className="p-4 flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-700 dark:text-red-400">Submission failed</p>
                  <p className="text-muted-foreground mt-1">{errorMessage}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          {survey.questions.length > 0 && (
            <Button
              type="submit"
              className="w-full"
              disabled={stage === 'submitting'}
            >
              {stage === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit response
                </>
              )}
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}

/**
 * QuestionInput — renders the appropriate input control based on the
 * question type. Supports TEXT (textarea), RADIO (radio group),
 * CHECKBOX (multi-select), and NUMBER (number input).
 */
function QuestionInput({
  question, value, onChange,
}: {
  question: SurveyQuestion
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
}) {
  switch (question.type) {
    case 'TEXT':
      return (
        <Textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here…"
          rows={3}
        />
      )

    case 'NUMBER':
      return (
        <Input
          type="number"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter a number"
        />
      )

    case 'RADIO':
      return (
        <RadioGroup
          value={(value as string) || ''}
          onValueChange={(v) => onChange(v)}
          className="space-y-2"
        >
          {(question.options || []).map((opt, i) => (
            <div key={i} className="flex items-center space-x-2">
              <RadioGroupItem value={opt} id={`${question.id}-${i}`} />
              <Label htmlFor={`${question.id}-${i}`} className="text-sm font-normal cursor-pointer">
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )

    case 'CHECKBOX': {
      const selected = Array.isArray(value) ? value : []
      const toggle = (opt: string) => {
        if (selected.includes(opt)) {
          onChange(selected.filter(v => v !== opt))
        } else {
          onChange([...selected, opt])
        }
      }
      return (
        <div className="space-y-2">
          {(question.options || []).map((opt, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-${i}`}
                checked={selected.includes(opt)}
                onCheckedChange={() => toggle(opt)}
              />
              <Label htmlFor={`${question.id}-${i}`} className="text-sm font-normal cursor-pointer">
                {opt}
              </Label>
            </div>
          ))}
        </div>
      )
    }

    default:
      return <p className="text-xs text-muted-foreground">Unsupported question type: {question.type}</p>
  }
}
