import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const items = await db.farmerInsurance.findMany({ where: { farmerId: id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ insurances: items })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const item = await db.farmerInsurance.create({
      data: {
        farmerId: id,
        insuranceType: body.insuranceType,
        provider: body.provider || null,
        amount: body.amount || null,
        enrolledDate: body.enrolledDate ? new Date(body.enrolledDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        cropInsured: body.cropInsured || null,
        areaInsured: body.areaInsured || null,
        notes: body.notes || null,
      },
    })
    return NextResponse.json({ insurance: item }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { itemId, ...updateData } = body
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })
    const item = await db.farmerInsurance.update({
      where: { id: itemId },
      data: {
        ...(updateData.insuranceType !== undefined && { insuranceType: updateData.insuranceType }),
        ...(updateData.provider !== undefined && { provider: updateData.provider }),
        ...(updateData.amount !== undefined && { amount: updateData.amount }),
        ...(updateData.enrolledDate !== undefined && { enrolledDate: updateData.enrolledDate ? new Date(updateData.enrolledDate) : null }),
        ...(updateData.endDate !== undefined && { endDate: updateData.endDate ? new Date(updateData.endDate) : null }),
        ...(updateData.cropInsured !== undefined && { cropInsured: updateData.cropInsured }),
        ...(updateData.areaInsured !== undefined && { areaInsured: updateData.areaInsured }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
      },
    })
    return NextResponse.json({ insurance: item })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update insurance' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })
    await db.farmerInsurance.delete({ where: { id: itemId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
