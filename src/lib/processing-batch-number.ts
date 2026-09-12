/**
 * Generates a unique processing batch number of the form `PCH-YYYY-NNNNNN`
 * where NNNNNN is a random base-36 suffix (collision-resistant for practical
 * purposes; uniqueness is enforced at the DB layer via `@unique`).
 *
 * Shared by the web route (/api/processing) and the mobile route
 * (/api/mobile/ekibbo-processing) so both sides issue the same format.
 */
export function generateBatchNumber(): string {
  const year = new Date().getFullYear()
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `PCH-${year}-${suffix}`
}
