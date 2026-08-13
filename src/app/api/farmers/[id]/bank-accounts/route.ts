import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'

/**
 * GET /api/farmers/[id]/bank-accounts — list all bank accounts for a farmer
 * POST /api/farmers/[id]/bank-accounts — add a bank account
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext(request)
    const { id } = await params
    const accounts = await db.farmerBankAccount.findMany({ where: { farmerId: id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ accounts })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext(request)
    const { id } = await params
    const body = await request.json()
    const account = await db.farmerBankAccount.create({
      data: {
        farmerId: id,
        accountType: body.accountType || null,
        accountNo: body.accountNo,
        bankName: body.bankName,
        branchDetails: body.branchDetails || null,
        sortCode: body.sortCode || null,
        isPrimary: body.isPrimary || false,
      },
    })
    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { accountId, ...updateData } = body
    if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })
    const account = await db.farmerBankAccount.update({
      where: { id: accountId },
      data: {
        ...(updateData.accountType !== undefined && { accountType: updateData.accountType }),
        ...(updateData.accountNo !== undefined && { accountNo: updateData.accountNo }),
        ...(updateData.bankName !== undefined && { bankName: updateData.bankName }),
        ...(updateData.branchDetails !== undefined && { branchDetails: updateData.branchDetails }),
        ...(updateData.sortCode !== undefined && { sortCode: updateData.sortCode }),
        ...(updateData.isPrimary !== undefined && { isPrimary: updateData.isPrimary }),
      },
    })
    return NextResponse.json({ account })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update bank account' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })
    await db.farmerBankAccount.delete({ where: { id: accountId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete bank account' }, { status: 500 })
  }
}
