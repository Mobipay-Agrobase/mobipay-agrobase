import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyCountryConfig.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Country config not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyCountryConfig detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch country config' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyCountryConfig.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Country config not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyCountryConfig.update({
      where: { id },
      data: {
        countryCode: body.countryCode !== undefined ? body.countryCode : undefined,
        countryName: body.countryName !== undefined ? body.countryName : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        defaultLanguage: body.defaultLanguage !== undefined ? body.defaultLanguage : undefined,
        supportedLanguages: body.supportedLanguages !== undefined ? body.supportedLanguages || null : undefined,
        vetAuthority: body.vetAuthority !== undefined ? body.vetAuthority || null : undefined,
        ussdShortcode: body.ussdShortcode !== undefined ? body.ussdShortcode || null : undefined,
        ussdGateway: body.ussdGateway !== undefined ? body.ussdGateway || null : undefined,
        minFarmgatePrice:
          body.minFarmgatePrice !== undefined
            ? body.minFarmgatePrice
              ? parseFloat(body.minFarmgatePrice)
              : null
            : undefined,
        maxFarmgatePrice:
          body.maxFarmgatePrice !== undefined
            ? body.maxFarmgatePrice
              ? parseFloat(body.maxFarmgatePrice)
              : null
            : undefined,
        nationalLivestockIdApi:
          body.nationalLivestockIdApi !== undefined ? body.nationalLivestockIdApi || null : undefined,
        eVetApiUrl: body.eVetApiUrl !== undefined ? body.eVetApiUrl || null : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyCountryConfig update error:', error)
    return NextResponse.json(
      { error: 'Failed to update country config', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyCountryConfig.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Country config not found' }, { status: 404 })
    await db.dairyCountryConfig.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyCountryConfig delete error:', error)
    return NextResponse.json({ error: 'Failed to delete country config' }, { status: 500 })
  }
}
