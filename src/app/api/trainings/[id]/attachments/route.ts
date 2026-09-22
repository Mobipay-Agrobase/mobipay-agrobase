import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { writeFileSync, mkdirSync, unlinkSync, statSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'

/**
 * POST /api/trainings/[id]/attachments
 *
 * Phase C2 — Training file upload (photos + attendance form).
 *
 * Accepts multipart/form-data:
 *   - files: File[]  (1-10 files, max 10MB each)
 *     Allowed types: image/jpeg, image/png, image/webp, application/pdf
 *
 * Stores files to /public/uploads/trainings/{trainingId}/ and appends their
 * public URLs to the training's `attachmentUrls` JSON array column.
 *
 * Returns: { data: { trainingId, attachments: [{url, name, size, type}] } }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: trainingId } = await params
    const ctx = await getTenantContext(req)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Anyone who can edit a training can upload attachments. The check is
    // implicit: we verify the training exists in the caller's tenant scope.
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const training = await db.training.findFirst({ where: { id: trainingId, ...tf } })
    if (!training) return NextResponse.json({ error: 'Training not found' }, { status: 404 })

    const formData = await req.formData()
    const files = formData.getAll('files')
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded. Use field name "files"' }, { status: 400 })
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 files per upload' }, { status: 400 })
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      // Allow common attendance form types (Excel/Word for the attendance form)
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    const maxSize = 10 * 1024 * 1024 // 10 MB per file

    // Validate files first (fail before writing any)
    const validated: File[] = []
    for (const f of files) {
      if (!(f instanceof File)) {
        return NextResponse.json({ error: 'Invalid file payload' }, { status: 400 })
      }
      if (!allowedTypes.includes(f.type)) {
        return NextResponse.json(
          { error: `File "${f.name}" has unsupported type: ${f.type || 'unknown'}. Allowed: images (JPEG, PNG, WebP, GIF), PDF, Excel, Word.` },
          { status: 400 },
        )
      }
      if (f.size > maxSize) {
        return NextResponse.json(
          { error: `File "${f.name}" is too large. Max 10MB per file.` },
          { status: 400 },
        )
      }
      validated.push(f)
    }

    // Ensure upload dir exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'trainings', trainingId)
    mkdirSync(uploadDir, { recursive: true })

    // Save each file
    const savedAttachments: Array<{ url: string; name: string; size: number; type: string; uploadedAt: string }> = []
    for (const f of validated) {
      const uuid = crypto.randomUUID()
      const ext = (f.name.split('.').pop() || '').toLowerCase()
      const safeExt = ext && ext.length <= 5 ? ext : ''
      const fileName = `${uuid}${safeExt ? '.' + safeExt : ''}`
      const filePath = join(uploadDir, fileName)
      const bytes = Buffer.from(await f.arrayBuffer())
      writeFileSync(filePath, bytes)

      // Public URL (relative path — works on Vercel since /public is served at root)
      const url = `/uploads/trainings/${trainingId}/${fileName}`
      savedAttachments.push({
        url,
        name: f.name,
        size: f.size,
        type: f.type,
        uploadedAt: new Date().toISOString(),
      })
    }

    // Append to training.attachmentUrls (JSON array)
    let existingAttachments: any[] = []
    if (training.attachmentUrls) {
      try {
        const parsed = JSON.parse(training.attachmentUrls)
        if (Array.isArray(parsed)) existingAttachments = parsed
      } catch {
        existingAttachments = []
      }
    }
    const updatedAttachments = [...existingAttachments, ...savedAttachments]
    await db.training.update({
      where: { id: trainingId },
      data: { attachmentUrls: JSON.stringify(updatedAttachments) },
    })

    return NextResponse.json({
      data: {
        trainingId,
        attachments: updatedAttachments,
        newlyAdded: savedAttachments,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[training-attachments] upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload attachments', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/trainings/[id]/attachments?url=...
 *   Remove a single attachment by URL. Also deletes the file from disk.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: trainingId } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const training = await db.training.findFirst({ where: { id: trainingId, ...tf } })
    if (!training) return NextResponse.json({ error: 'Training not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const urlToDelete = searchParams.get('url')
    if (!urlToDelete) {
      return NextResponse.json({ error: 'url query param is required' }, { status: 400 })
    }

    // Parse existing attachments
    let existingAttachments: any[] = []
    if (training.attachmentUrls) {
      try {
        const parsed = JSON.parse(training.attachmentUrls)
        if (Array.isArray(parsed)) existingAttachments = parsed
      } catch {
        existingAttachments = []
      }
    }

    const attachment = existingAttachments.find(a => a.url === urlToDelete)
    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Delete file from disk (best-effort — don't fail if file is missing)
    try {
      const filePath = join(process.cwd(), 'public', attachment.url)
      const stats = statSync(filePath)
      if (stats.isFile()) unlinkSync(filePath)
    } catch {
      // File may have been deleted already — that's OK
    }

    // Remove from DB JSON array
    const updatedAttachments = existingAttachments.filter(a => a.url !== urlToDelete)
    await db.training.update({
      where: { id: trainingId },
      data: { attachmentUrls: JSON.stringify(updatedAttachments) },
    })

    return NextResponse.json({ data: { trainingId, attachments: updatedAttachments } })
  } catch (error) {
    console.error('[training-attachments] delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete attachment', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
