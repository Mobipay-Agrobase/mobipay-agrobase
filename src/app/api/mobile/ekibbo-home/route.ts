import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { mapFarmer, farmerSelect } from '@/lib/mobile/ekibbo-adapter'
import { isMobileStaff } from '@/lib/mobile/ekibbo-mobile-utils'

/**
 * GET /api/mobile/ekibbo-home
 *
 * Field Officer (staff) dashboard in the upstream JSON shape:
 *   { result, data: { total_farmmer, total_hectares, total_plot,
 *                     totalExpectedYield, farmer_list, my_farmers } }
 *
 * Data filtration (Ekibbo feedback): when the logged-in Field Officer has
 * farmers assigned (FarmerProfile.extensionOfficer = officer's name — the
 * same linkage the web farmer form uses), the dashboard scopes to THEIR
 * farmers. Officers without assignments see the tenant-wide registry.
 *
 * lat/lng/nearby_km query params from the app are accepted and ignored.
 * Tenant-scoped via Bearer-token context.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      // Field-officer dashboard — farmer accounts use /ekibbo-home-farmer.
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }
    if (!ctx.tenantId) {
      return NextResponse.json({ result: false, message: 'No tenant context' }, { status: 400 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId')

    // ── Officer scope: farmers whose extensionOfficer matches this user ──
    let officerName: string | null = null
    let officerWhere: Record<string, unknown> = { ...tf, status: 'ACTIVE' }

    if (ctx.userId) {
      const me = await db.user.findFirst({
        where: { id: ctx.userId },
        select: { firstName: true, lastName: true },
      })
      if (me) {
        const name = `${me.firstName ?? ''} ${me.lastName ?? ''}`.trim()
        if (name) {
          const assigned = await db.farmerProfile.count({
            where: { ...tf, status: 'ACTIVE', extensionOfficer: name },
          })
          if (assigned > 0) {
            officerName = name
            officerWhere = { ...tf, status: 'ACTIVE', extensionOfficer: name }
          }
        }
      }
    }

    // Officer's farmer ids (for scoped hectares / plots / yield)
    const scopedFarmers = await db.farmerProfile.findMany({
      where: officerWhere,
      select: { id: true },
      take: 5000,
    })
    const scopedIds = scopedFarmers.map(f => f.id)

    // Second review (H): plants aggregation (CropProduction treeCount +
    // farmer shadeTreeVarieties) for the Farm Land Registry KPI.
    const plantScope = scopedIds.length ? { farmerId: { in: scopedIds } } : { farmer: { ...tf } }
    const [farmerCount, tenantFarmerCount, lands, cultivations, farmers, cropProductions, shadeFarmers] = await Promise.all([
      db.farmerProfile.count({ where: officerWhere }),
      // Tenant-wide count so the dashboard KPI always matches the
      // "View All Farmers" list (which is tenant-scoped, not officer-scoped).
      db.farmerProfile.count({ where: { ...tf, status: 'ACTIVE' } }),
      db.farmLand.findMany({
        where: scopedIds.length ? { farmerId: { in: scopedIds } } : { farmer: { ...tf } },
        select: { sizeHectares: true },
      }),
      db.cultivation.findMany({
        where: scopedIds.length
          ? { farm: { farmerId: { in: scopedIds } } }
          : { farm: { farmer: { ...tf } } },
        select: { estimatedYield: true },
      }),
      db.farmerProfile.findMany({
        where: officerWhere,
        select: farmerSelect,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.cropProduction.groupBy({
        by: ['cropName'],
        where: plantScope as any,
        _sum: { treeCount: true },
      }),
      db.farmerProfile.findMany({
        where: { ...officerWhere, shadeTreeVarieties: { not: null } },
        select: { shadeTreeVarieties: true },
        take: 5000,
      }),
    ])

    const totalHectares = lands.reduce((s, l) => s + (Number(l.sizeHectares) || 0), 0)
    const totalExpectedYield = cultivations.reduce((s, c) => s + (Number(c.estimatedYield) || 0), 0)

    // Second review (H): total plants with per-crop breakdown
    const plantsByCrop = new Map<string, number>()
    for (const row of cropProductions) {
      const crop = (row.cropName || '').trim()
      plantsByCrop.set(crop, (plantsByCrop.get(crop) || 0) + (row._sum.treeCount || 0))
    }
    for (const fp of shadeFarmers) {
      try {
        const arr = JSON.parse(fp.shadeTreeVarieties || '[]')
        for (const v of arr) {
          if (!v?.variety) continue
          plantsByCrop.set('Shade Trees', (plantsByCrop.get('Shade Trees') || 0) + (parseInt(String(v.count)) || 0))
        }
      } catch { /* ignore */ }
    }
    const plantsList = Array.from(plantsByCrop.entries())
      .map(([crop, count]) => ({ crop, count }))
      .sort((a, b) => b.count - a.count)
    const totalPlants = plantsList.reduce((s2, p) => s2 + p.count, 0)

    return NextResponse.json({
      result: true,
      data: {
        total_farmmer: farmerCount,
        total_farmers_tenant: tenantFarmerCount,
        total_hectares: Math.round(totalHectares * 100) / 100,
        total_plot: lands.length,
        // Second review (H): plants KPI + per-crop breakdown
        total_plants: totalPlants,
        plants_breakdown: plantsList,
        totalExpectedYield: Math.round(totalExpectedYield * 10) / 10,
        farmer_list: farmers.map(f => mapFarmer(f as any)),
        my_farmers: officerName != null,
      },
    })
  } catch (error) {
    console.error('[ekibbo-home]', error)
    return NextResponse.json({ result: false, message: 'Failed to load dashboard' }, { status: 500 })
  }
}
