'use client'

/**
 * StagedAttachments — real file uploads for CREATE flows.
 *
 * The pattern used by `AttachmentsSection` (list/upload/delete against an
 * existing record) cannot be used inside a "new record" form because the
 * related id does not exist until the record is saved. This module stages
 * File objects locally, then uploads them to /api/attachments/upload right
 * after the parent record is created.
 *
 * Constraints mirror the backend upload route: images + PDF, 5 MB max each.
 */

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Paperclip, Trash2, Loader2, FileText, Image as ImageIcon, Upload } from 'lucide-react'
import { toast } from 'sonner'

export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf',
]

export interface StagedFile {
  key: string
  file: File
  description: string
}

export interface UploadResult {
  total: number
  uploaded: number
  failures: string[]
}

export function useStagedAttachments() {
  const [staged, setStaged] = useState<StagedFile[]>([])
  const uid = useRef(0)

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const accepted: StagedFile[] = []
    let skipped = 0
    Array.from(fileList).forEach(file => {
      if (!ALLOWED_MIME.includes(file.type) || file.size > MAX_FILE_BYTES) {
        skipped++
        return
      }
      accepted.push({ key: `staged-${Date.now()}-${++uid.current}`, file, description: '' })
    })
    if (skipped > 0) {
      toast.error(`${skipped} file${skipped > 1 ? 's' : ''} skipped — images/PDF only, max 5 MB each`)
    }
    if (accepted.length > 0) setStaged(prev => [...prev, ...accepted])
  }, [])

  const remove = useCallback((key: string) => {
    setStaged(prev => prev.filter(s => s.key !== key))
  }, [])

  const describe = useCallback((key: string, description: string) => {
    setStaged(prev => prev.map(s => (s.key === key ? { ...s, description } : s)))
  }, [])

  const clear = useCallback(() => setStaged([]), [])

  /** Upload every staged file against the freshly-created record. */
  const uploadAll = useCallback(async (relatedId: string, relatedType: string): Promise<UploadResult> => {
    const failures: string[] = []
    for (const s of staged) {
      const fd = new FormData()
      fd.append('file', s.file)
      fd.append('relatedId', relatedId)
      fd.append('relatedType', relatedType)
      if (s.description.trim()) fd.append('description', s.description.trim())
      try {
        const res = await fetch('/api/attachments/upload', { method: 'POST', body: fd })
        if (!res.ok) failures.push(s.file.name)
      } catch {
        failures.push(s.file.name)
      }
    }
    return { total: staged.length, uploaded: staged.length - failures.length, failures }
  }, [staged])

  return { staged, addFiles, remove, describe, clear, uploadAll }
}

const fmtSize = (b: number) => {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  staged: StagedFile[]
  onAdd: (files: FileList | null) => void
  onRemove: (key: string) => void
  onDescribe: (key: string, description: string) => void
  uploading?: boolean
  label?: string
  hint?: string
}

/**
 * UI block for create forms: multi-file picker + staged list with per-file
 * optional description and remove. Files are uploaded when the form saves.
 */
export function StagedAttachmentsInput({
  staged, onAdd, onRemove, onDescribe, uploading = false, label = 'Evidence attachments', hint,
}: Props) {
  const uid = useRef(`f${Math.random().toString(36).slice(2, 8)}`)
  const inputId = `staged-files-${uid.current}`
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" />
          {label}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <input
          id={inputId}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          className="hidden"
          disabled={uploading}
          onChange={e => { onAdd(e.target.files); e.target.value = '' }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={uploading}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Add files
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {hint || 'Moisture meter photos, weighing slips, signed receipts — images/PDF, max 5 MB each. Uploaded automatically when the purchase is saved.'}
      </p>
      {staged.length > 0 && (
        <ul className="space-y-1.5">
          {staged.map(s => {
            const isImage = s.file.type.startsWith('image/')
            const Icon = isImage ? ImageIcon : FileText
            return (
              <li key={s.key} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-medium truncate">{s.file.name} <span className="font-normal text-muted-foreground">· {fmtSize(s.file.size)}</span></p>
                  <Input
                    value={s.description}
                    onChange={e => onDescribe(s.key, e.target.value)}
                    placeholder="Description (e.g. Moisture meter reading)"
                    className="h-7 text-xs"
                    disabled={uploading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(s.key)}
                  className="text-red-500 hover:text-red-700 shrink-0"
                  title="Remove"
                  disabled={uploading}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
