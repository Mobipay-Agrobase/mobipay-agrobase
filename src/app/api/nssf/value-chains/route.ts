import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * GET /api/nssf/value-chains
 *
 * Returns the canonical list of NSSF value chains for the mobile app's
 * multi-select dropdown. The list is DYNAMIC — read from the CatalogMaster
 * DB table (category='nssf_value_chains') so the NSSF admin can add new
 * value chains (e.g. "Honey", "Vanilla") via the web Dashboard →
 * Master Data → Dropdown Catalog screen WITHOUT requiring a code change
 * or mobile app redeploy.
 *
 * The mobile app's ValueChainMultiSelect component fetches this endpoint
 * on every enrollment, so newly-added value chains appear automatically.
 *
 * Response shape:
 *   {
 *     "valueChains": [
 *       { "id": "cmxxx", "value": "Maize", "label": "Maize", "sortOrder": 1 },
 *       ...
 *     ],
 *     "count": 12
 *   }
 */
export async function GET() {
  try {
    const items = await db.catalogMaster.findMany({
      where: {
        category: 'nssf_value_chains',
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
      select: {
        id: true,
        value: true,
        label: true,
        sortOrder: true,
      },
    })

    // Map to the shape the mobile app expects (label falls back to value
    // if the catalog entry has no explicit label).
    const valueChains = items.map(item => ({
      id: item.id,
      value: item.value,
      label: item.label || item.value,
      sortOrder: item.sortOrder,
    }))

    return NextResponse.json({
      valueChains,
      count: valueChains.length,
    })
  } catch (error) {
    console.error('NSSF value-chains fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch value chains', valueChains: [], count: 0 },
      { status: 500 },
    )
  }
}
