/**
 * Input Validation Utility
 * ───────────────────────
 * Uses Zod schemas to validate API request bodies.
 * Returns parsed data or throws a structured error.
 *
 * Usage in API routes:
 *   import { validateBody } from '@/lib/security/validate'
 *   import { z } from 'zod'
 *
 *   const schema = z.object({
 *     farmerId: z.string().min(1),
 *     amount: z.number().positive(),
 *   })
 *
 *   const data = await validateBody(request, schema)
 *   // data is typed and validated
 */

import { NextRequest } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

export class ValidationError extends Error {
  constructor(public fields: Array<{ field: string; message: string }>) {
    super('Validation failed')
    this.name = 'ValidationError'
  }
}

/**
 * Validates a request body against a Zod schema.
 * Throws ValidationError if validation fails.
 */
export async function validateBody<T>(
  request: NextRequest | Request,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ValidationError([{ field: 'body', message: 'Invalid JSON body' }])
  }

  try {
    return schema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      const fields = err.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      throw new ValidationError(fields)
    }
    throw err
  }
}

/**
 * Validates a search params string against a Zod schema.
 */
export async function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): Promise<T> {
  const obj: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    obj[key] = value
  })

  try {
    return schema.parse(obj)
  } catch (err) {
    if (err instanceof ZodError) {
      const fields = err.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      throw new ValidationError(fields)
    }
    throw err
  }
}

/**
 * Formats a ValidationError for API response.
 */
export function formatValidationError(err: ValidationError) {
  return {
    error: 'Validation failed',
    fields: err.fields,
  }
}
