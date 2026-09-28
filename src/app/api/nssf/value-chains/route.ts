import { NextResponse } from 'next/server'

/**
 * GET /api/nssf/value-chains
 *
 * Returns the canonical list of 12 NSSF value chains for the mobile app's
 * multi-select dropdown. The same list is also stored in the ModuleEntitlement
 * config when seeding NSSF officers, but exposing it as an endpoint lets the
 * mobile app fetch the latest list without code changes.
 *
 * Order matters — this is the official NSSF display order.
 */
const NSSF_VALUE_CHAINS = [
  { id: 'maize',         label: 'Maize' },
  { id: 'rice',          label: 'Rice' },
  { id: 'banana',        label: 'Banana (matooke)' },
  { id: 'cassava',       label: 'Cassava' },
  { id: 'irish-potato',  label: 'Irish potato' },
  { id: 'beans',         label: 'Beans' },
  { id: 'fruits-veg',    label: 'Fruits and vegetables' },
  { id: 'coffee',        label: 'Coffee' },
  { id: 'tea',           label: 'Tea' },
  { id: 'dairy',         label: 'Dairy cattle' },
  { id: 'beef',          label: 'Beef cattle / meat' },
  { id: 'fish',          label: 'Fish / Aquaculture' },
]

export async function GET() {
  return NextResponse.json({
    valueChains: NSSF_VALUE_CHAINS,
    count: NSSF_VALUE_CHAINS.length,
  })
}
