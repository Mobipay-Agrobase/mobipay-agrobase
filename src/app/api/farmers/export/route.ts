import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { safeDecryptField } from '@/lib/security/field-crypto'

/**
 * GET /api/farmers/export — Export enrolled farmers as CSV.
 *
 * Query params:
 *   - enrolledByOfficerId: optional — filter by officer (EXTENSION_OFFICER auto-scoped)
 *   - format: 'csv' (default) — only CSV supported for now
 *
 * Returns CSV file download with columns:
 *   Farmer Code, First Name, Last Name, Phone, NIN, Value Chains,
 *   Country, Region, District, County, Sub-County, Parish, Village,
 *   Enrolled By Officer, Enrolled At, Status
 *
 * Used by the NSSF Admin web dashboard to download all enrolled farmers.
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const enrolledByOfficerId = searchParams.get('enrolledByOfficerId') || ''

    const where: Record<string, unknown> = {
      ...buildTenantFilter(ctx, 'tenantId'),
    }
    // EXTENSION_OFFICER scope: see only their own farmers (unless they pass 'all')
    if (enrolledByOfficerId && enrolledByOfficerId !== 'all') {
      where.enrolledByOfficerId = enrolledByOfficerId
    } else if (ctx.role === 'EXTENSION_OFFICER') {
      where.enrolledByOfficerId = ctx.userId
    }

    const farmers = await db.farmerProfile.findMany({
      where,
      include: {
        enrolledByOfficer: { select: { firstName: true, lastName: true, email: true } },
        village: {
          select: {
            name: true,
            parish: {
              select: {
                name: true,
                subCounty: {
                  select: {
                    name: true,
                    county: {
                      select: {
                        name: true,
                        district: {
                          select: {
                            name: true,
                            subRegion: {
                              select: {
                                name: true,
                                region: {
                                  select: {
                                    name: true,
                                    country: { select: { name: true } },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Build CSV
    const headers = [
      'Farmer Code', 'First Name', 'Last Name', 'Phone', 'NIN',
      'Value Chains', 'Country', 'Region', 'District', 'County', 'Sub-County',
      'Parish', 'Village',
      'Enrolled By Officer', 'Enrolled At', 'Status',
    ]
    const rows: string[] = [headers.join(',')]
    for (const f of farmers) {
      const valueChains = f.nssfValueChains ? JSON.parse(f.nssfValueChains).join('; ') : (f.nssfValueChain || '')
      const village = f.village
      const region = village?.parish?.subCounty?.county?.district?.subRegion?.region
      const officerName = f.enrolledByOfficer
        ? `${f.enrolledByOfficer.firstName} ${f.enrolledByOfficer.lastName}`
        : ''
      const cols = [
        f.farmerCode || '',
        f.firstName,
        f.lastName,
        safeDecryptField(f.phone) || '',
        f.nssfNationalId || safeDecryptField(f.nationalIdNo) || '',
        valueChains,
        region?.country?.name || f.country || '',
        region?.name || f.province || '',
        village?.parish?.subCounty?.county?.district?.name || f.district || '',
        village?.parish?.subCounty?.county?.name || f.commune || '',
        village?.parish?.subCounty?.name || '',
        village?.parish?.name || '',
        village?.name || f.villageName || '',
        officerName,
        f.createdAt.toISOString(),
        f.status,
      ]
      // Escape CSV cells (wrap in quotes, escape quotes)
      const escaped = cols.map(c => `"${String(c).replace(/"/g, '""')}"`)
      rows.push(escaped.join(','))
    }

    const csv = rows.join('\n')
    const filename = `nssf-farmers-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Farmer export error:', error)
    return NextResponse.json({ error: 'Failed to export farmers' }, { status: 500 })
  }
}
