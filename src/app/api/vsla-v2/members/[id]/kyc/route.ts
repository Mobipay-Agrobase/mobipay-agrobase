/**
 * VSLA V2 — Member KYC Upload
 * SRS 3.4: "Capture photo and ID through the app"
 * 
 * Accepts multipart form data with:
 * - photo: member selfie image
 * - idPhoto: national ID image
 * 
 * Stores images and updates member record with photoUrl + idPhotoUrl.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: memberId } = await params

    // Verify member exists
    const member = await db.vslaMemberV2.findUnique({ where: { id: memberId } })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // Parse multipart form data
    const formData = await req.formData()
    const photo = formData.get('photo') as File | null
    const idPhoto = formData.get('idPhoto') as File | null

    if (!photo || !idPhoto) {
      return NextResponse.json({ error: 'Both photo and idPhoto are required' }, { status: 400 })
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(photo.type) || !allowedTypes.includes(idPhoto.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP allowed.' }, { status: 400 })
    }

    // Validate file sizes (max 5MB each)
    const maxSize = 5 * 1024 * 1024
    if (photo.size > maxSize || idPhoto.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Max 5MB per image.' }, { status: 400 })
    }

    // Save images to /public/uploads/kyc/
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'kyc')
    mkdirSync(uploadDir, { recursive: true })

    const photoExt = photo.name.split('.').pop() || 'jpg'
    const idPhotoExt = idPhoto.name.split('.').pop() || 'jpg'
    const photoFileName = `${member.memberId}-photo-${crypto.randomUUID()}.${photoExt}`
    const idPhotoFileName = `${member.memberId}-id-${crypto.randomUUID()}.${idPhotoExt}`

    const photoPath = join(uploadDir, photoFileName)
    const idPhotoPath = join(uploadDir, idPhotoFileName)

    // Write files
    const photoBuffer = Buffer.from(await photo.arrayBuffer())
    const idPhotoBuffer = Buffer.from(await idPhoto.arrayBuffer())
    writeFileSync(photoPath, photoBuffer)
    writeFileSync(idPhotoPath, idPhotoBuffer)

    // Update member record with photo URLs
    const updatedMember = await db.vslaMemberV2.update({
      where: { id: memberId },
      data: {
        photoUrl: `/uploads/kyc/${photoFileName}`,
        idPhotoUrl: `/uploads/kyc/${idPhotoFileName}`,
      },
    })

    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorRole: ctx.role,
      action: 'VSLA_V2_KYC_UPLOADED',
      entityType: 'VslaMemberV2',
      entityId: memberId,
      description: `KYC photos uploaded for member ${member.fullName} (${member.memberId})`,
      metadata: {
        memberId: member.memberId,
        photoSize: photo.size,
        idPhotoSize: idPhoto.size,
      },
      httpMethod: 'POST',
      path: `/api/vsla-v2/members/${memberId}/kyc`,
    })

    return NextResponse.json({
      member: updatedMember,
      photoUrl: `/uploads/kyc/${photoFileName}`,
      idPhotoUrl: `/uploads/kyc/${idPhotoFileName}`,
      message: 'KYC photos uploaded successfully',
    })
  } catch (error) {
    console.error('[vsla-v2/kyc POST] error:', error)
    return NextResponse.json({ error: 'Failed to upload KYC photos' }, { status: 500 })
  }
}
