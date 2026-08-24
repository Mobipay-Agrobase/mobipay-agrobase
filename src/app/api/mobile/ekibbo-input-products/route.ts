import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId, resolveFarmerByNumericId } from '@/lib/mobile/ekibbo-adapter'
import { isMobileStaff } from '@/lib/mobile/ekibbo-mobile-utils'

/**
 * GET /api/mobile/ekibbo-input-products
 *   ?type=categories               → [{id, name}] distinct categories
 *   ?category_id=<numeric>         → products of one category
 *   ?farmer_id=<numeric>           → adds previous_stock per product
 *
 * Mobile Input Allocation product picker, served from the WEB PLATFORM's
 * InputProduct master (same table the web /api/input-products route uses),
 * shaped for the mobile distribution screens:
 *   { result, data: [ { id, name, category_id, category_name, unit,
 *                       unit_price, available_stocks, previous_stock,
 *                       stocks: [ { id, name, available_stocks, ... } ] } ] }
 *
 * Categories come from the distinct InputProduct.category values (Seeds,
 * Fertilizer, Pesticide, Equipment) so the category → product dependency
 * works exactly like the web platform. Cooperative-scoping from the legacy
 * upstream is intentionally dropped: products are tenant-scoped on the web.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)
    const wantCategories = searchParams.get('type') === 'categories'
    const categoryNumId = searchParams.get('category_id')
    const farmerNumId = searchParams.get('farmer_id')

    const products = await db.inputProduct.findMany({
      where: { ...tf, isActive: true },
      select: {
        id: true, name: true, category: true, variety: true,
        unit: true, unitPrice: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      take: 500,
    })

    // Distinct categories with stable numeric ids (hash of the name).
    const catNames = Array.from(
      new Set(products.map(p => p.category || 'Other').values())
    ).sort() as string[]
    const catId = (name: string) => numericId(`category:${name}`)

    if (wantCategories) {
      return NextResponse.json({
        result: true,
        data: catNames.map(c => ({ id: catId(c), name: c })),
      })
    }

    // Previous distributed quantities for the farmer (optional).
    let previous: Record<string, number> = {}
    if (farmerNumId) {
      const numId = parseInt(farmerNumId, 10)
      if (!Number.isNaN(numId)) {
        const farmer = await resolveFarmerByNumericId(tf, numId)
        if (farmer) {
          const dists = await db.inputDistribution.findMany({
            where: { ...tf, farmerId: farmer.id },
            select: { inputName: true, quantity: true },
            take: 1000,
          })
          for (const d of dists) {
            if (!d.inputName) continue
            previous[d.inputName] = (previous[d.inputName] || 0) + (Number(d.quantity) || 0)
          }
        }
      }
    }

    // Legacy "previous-stocks" query: the mobile asks for ONE product's
    // previously distributed quantity → { data: { previous_stocks: N } }.
    const productNumId = searchParams.get('product_id')
    if (productNumId && searchParams.get('previous_only') === 'true') {
      const pid = parseInt(productNumId, 10)
      const match = products.find(p => numericId(p.id) === pid)
      return NextResponse.json({
        result: true,
        data: { previous_stocks: match ? (previous[match.name] || 0) : 0 },
      })
    }

    let rows = products.map(p => {
      const catName = p.category || 'Other'
      return {
        id: numericId(p.id),
        name: p.name,
        category_id: catId(catName),
        category_name: catName,
        tags: '',
        // The web InputProduct master has no stock ledger yet — expose a
        // large "unlimited" stock so the mobile quantity validation passes
        // while the platform grows a real stock model.
        quantity: 999999,
        unit_price: Number(p.unitPrice) || 0,
        available_stocks: 999999,
        m_qty: 1,
        unit: p.unit || 'pcs',
        stocks: [
          {
            id: numericId(p.id),
            variant: p.variety || p.name,
            sku: '',
            price_per_unit: Number(p.unitPrice) || 0,
            available_stocks: 999999,
          },
        ],
        previous_stock: previous[p.name] || 0,
      }
    })

    if (categoryNumId) {
      const cid = parseInt(categoryNumId, 10)
      if (!Number.isNaN(cid)) rows = rows.filter(r => r.category_id === cid)
    }

    return NextResponse.json({ result: true, data: rows })
  } catch (error) {
    console.error('[ekibbo-input-products]', error)
    return NextResponse.json({ result: false, message: 'Failed to load input products' }, { status: 500 })
  }
}
