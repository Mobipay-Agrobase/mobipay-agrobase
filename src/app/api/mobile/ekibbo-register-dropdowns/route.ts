import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/mobile/ekibbo-register-dropdowns
 *
 * Static registration-form dropdowns in the upstream envelope:
 *   { result, data: { data_gender: [{ID, NAME}], data_enrollment_place: [...],
 *                     data_identity_proof: [...] } }
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json({
    result: true,
    data: {
      data_gender: [
        { ID: 1, NAME: 'Male' },
        { ID: 2, NAME: 'Female' },
        { ID: 3, NAME: 'Other' },
      ],
      data_enrollment_place: [
        { ID: 1, NAME: 'At Farmer Place' },
        { ID: 2, NAME: 'At Cooperative' },
        { ID: 3, NAME: 'At Farmer Organization' },
        { ID: 4, NAME: 'At Warehouse' },
      ],
      data_identity_proof: [
        { ID: 1, NAME: 'National ID' },
        { ID: 2, NAME: 'Driving License' },
        { ID: 3, NAME: 'Passport' },
      ],
    },
  })
}
