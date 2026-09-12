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
        unit: true, unitPrice: true, stockQuantity: true,
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

    // ── Second review (K — Input Summary): summary stats for the mobile
    // Inputs screen header. Same numbers the web Input Summary shows.
    if (searchParams.get('type') === 'summary') {
      const pendingRequests = await db.inputRequest.count({
        where: { ...tf, status: 'PENDING', dealer: { ...tf } },
      })
      const inStock = products.filter(p => (p.stockQuantity || 0) > 0)
      const unitsInStock = inStock.reduce((sum, p) => sum + (p.stockQuantity || 0), 0)
      const byCategory: Record<string, { products: number; units: number }> = {}
      for (const p of products) {
        const cat = p.category || 'Other'
        byCategory[cat] ??= { products: 0, units: 0 }
        byCategory[cat].products += 1
        byCategory[cat].units += p.stockQuantity || 0
      }
      return NextResponse.json({
        result: true,
        data: {
          dealers: await db.inputDealer.count({ where: { ...tf, isActive: true } }),
          products_total: products.length,
          products_in_stock: inStock.length,
          units_in_stock: Math.round(unitsInStock * 100) / 100,
          pending_requests: pendingRequests,
          by_category: Object.entries(byCategory).map(([name, v]) => ({
            name,
            products: v.products,
            units: Math.round(v.units * 100) / 100,
          })),
        },
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
      // Second review (K — Input Summary): the REAL on-hand stock from the
      // InputProduct master (replaces the old 999999 "unlimited" placeholder
      // that made every quantity look available). Rounded to a whole number
      // because the mobile product picker and quantity validation are
      // integer-based; 0 = out of stock / not tracked yet — the distribution
      // form treats it as untracked and lets the officer record the field
      // reality.
      const stock = Math.round(Math.max(0, Number(p.stockQuantity) || 0))
      return {
        id: numericId(p.id),
        name: p.name,
        category_id: catId(catName),
        category_name: catName,
        tags: '',
        quantity: stock,
        unit_price: Number(p.unitPrice) || 0,
        available_stocks: stock,
        m_qty: 1,
        unit: p.unit || 'pcs',
        stocks: [
          {
            id: numericId(p.id),
            variant: p.variety || p.name,
            sku: '',
            price_per_unit: Number(p.unitPrice) || 0,
            available_stocks: stock,
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
