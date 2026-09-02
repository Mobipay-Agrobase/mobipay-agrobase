import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { NextResponse } from 'next/server'

/**
 * POST /api/attachments/upload
 *   Multipart file upload for FileAttachment records (photos, attendance
 *   forms, etc.). Follows the codebase-wide storage pattern: files are
 *   stored as base64 data URIs in the `fileUrl` column (no external object
 *   storage is configured for this deployment).
 *
 * Form fields: file (required), relatedId, relatedType, description
 */
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB safety cap

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    if (!ctx?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 })
    }

    const relatedId = (form.get('relatedId') || '').toString()
    const relatedType = (form.get('relatedType') || '').toString()
    const description = (form.get('description') || '').toString() || null

    // Allow only image/PDF attachments — training photos & attendance forms
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
    const mime = file.type || 'application/octet-stream'
    if (!allowedTypes.includes(mime)) {
      return NextResponse.json({ error: `Unsupported file type: ${mime}. Images and PDF only.` }, { status: 415 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const dataUri = `data:${mime};base64,${buf.toString('base64')}`

    const attachment = await db.fileAttachment.create({
      data: {
        tenantId: ctx.tenantId,
        relatedId: relatedId || null,
        relatedType: relatedType || null,
        fileName: file.name,
        fileType: mime,
        fileSize: file.size,
        fileUrl: dataUri,
        uploadedBy: ctx.userId || null,
        description,
      },
    })

    return NextResponse.json({ data: attachment }, { status: 201 })
  } catch (error: any) {
    console.error('[attachments/upload] error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
