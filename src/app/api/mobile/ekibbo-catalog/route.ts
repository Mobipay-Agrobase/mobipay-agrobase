import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'

/**
 * GET /api/mobile/ekibbo-catalog
 *
 * ALL dropdown catalog categories in one payload, grouped by category:
 *   { result, data: { gender: [{value,label}], education_level: [...], ... } }
 *
 * Serves every category the WEB farmer/farm-land/cultivation forms use
 * (CatalogMaster — the single source of truth both platforms share), so the
 * mobile dropdowns always match the web dropdowns. The app caches this in
 * Hive and refreshes it on app start / connectivity regain (OTA).
 */
const MOBILE_CATEGORIES = [
  'gender', 'education_level', 'marital_status', 'national_id_type',
  'enrollment_place', 'certification_type', 'farmer_registration_under',
  'housing_ownership', 'house_type', 'asset_type', 'consumer_electronics',
  'vehicle_type', 'bank_uganda', 'loan_source', 'loan_purpose',
  'farm_equipment', 'animal_type', 'animal_housing', 'fodder',
  'animal_for_growth', 'insurance_company_uganda', 'insurance_type',
  'land_ownership', 'land_topology', 'land_gradient', 'water_source',
  'power_source', 'irrigation_source', 'soil_fertility', 'soil_criteria',
  'conversion_status', 'employment_type', 'income_source', 'fuel_type',
]

export async function GET(req: NextRequest) {
  try {
    await getTenantContext(req)

    const items = await db.catalogMaster.findMany({
      where: { isActive: true, category: { in: MOBILE_CATEGORIES } },
      select: { category: true, value: true, label: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { value: 'asc' }],
      take: 2000,
    })

    const grouped: Record<string, Array<{ value: string; label: string }>> = {}
    const seen = new Set<string>()
    for (const it of items) {
      // CatalogMaster can hold global + tenant-specific copies of the same
      // value — deduplicate so mobile dropdowns show each option once.
      const key = `${it.category}::${it.value}`
      if (seen.has(key)) continue
      seen.add(key)
      if (!grouped[it.category]) grouped[it.category] = []
      grouped[it.category].push({ value: it.value, label: it.label || it.value })
    }

    return NextResponse.json({
      result: true,
      data: grouped,
      meta: {
        categories: Object.keys(grouped).length,
        items: items.length,
        syncedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[ekibbo-catalog]', error)
    return NextResponse.json({ result: false, message: 'Failed to load catalog' }, { status: 500 })
  }
}
