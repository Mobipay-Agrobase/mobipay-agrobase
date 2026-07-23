/**
 * Validation Error Handler
 * ───────────────────────
 * Drop-in wrapper for API routes that validates the body with a Zod schema
 * and returns a 400 with structured error info if validation fails.
 *
 * Usage:
 *   import { withValidation } from '@/lib/security/validation-handler'
 *   import { z } from 'zod'
 *
 *   const schema = z.object({
 *     amount: z.number().positive(),
 *     memberId: z.string().min(1),
 *   })
 *
 *   export const POST = withValidation(schema, async (data, request) => {
 *     // data is typed + validated
 *     return NextResponse.json({ ok: true })
 *   })
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'
import { validateBody, ValidationError } from './validate'

export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (data: T, request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    let data: T
    try {
      data = await validateBody(request, schema)
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            fields: err.fields,
          },
          { status: 400 }
        )
      }
      console.error('[validation] Unexpected error:', err)
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }
    return handler(data, request)
  }
}

/**
 * Validates a single value against a schema and returns the parsed data
 * or throws a ValidationError. Useful inside routes that need partial validation.
 */
export async function validateOrThrow<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  return validateBody(request, schema)
}

/**
 * Catches ValidationError and returns a 400 response.
 * Use this to wrap handlers that call validateOrThrow internally.
 */
export function handleValidationError(err: unknown): NextResponse | null {
  if (err instanceof ValidationError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        fields: err.fields,
      },
      { status: 400 }
    )
  }
  return null
}
