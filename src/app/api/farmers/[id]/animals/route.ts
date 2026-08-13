import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const items = await db.farmerAnimalHusbandry.findMany({ where: { farmerId: id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ animals: items })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const item = await db.farmerAnimalHusbandry.create({
      data: {
        farmerId: id,
        animalType: body.animalType,
        count: body.count || 1,
        breedName: body.breedName || null,
        fodder: body.fodder || null,
        animalHousing: body.animalHousing || null,
        revenue: body.revenue || null,
        animalForGrowth: body.animalForGrowth || null,
      },
    })
    return NextResponse.json({ animal: item }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { itemId, ...updateData } = body
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })
    const item = await db.farmerAnimalHusbandry.update({
      where: { id: itemId },
      data: {
        ...(updateData.animalType !== undefined && { animalType: updateData.animalType }),
        ...(updateData.count !== undefined && { count: updateData.count }),
        ...(updateData.breedName !== undefined && { breedName: updateData.breedName }),
        ...(updateData.fodder !== undefined && { fodder: updateData.fodder }),
        ...(updateData.animalHousing !== undefined && { animalHousing: updateData.animalHousing }),
        ...(updateData.revenue !== undefined && { revenue: updateData.revenue }),
        ...(updateData.animalForGrowth !== undefined && { animalForGrowth: updateData.animalForGrowth }),
      },
    })
    return NextResponse.json({ animal: item })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update animal' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })
    await db.farmerAnimalHusbandry.delete({ where: { id: itemId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
