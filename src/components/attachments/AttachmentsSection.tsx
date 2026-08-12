'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Paperclip, Trash2, Loader2, FileText, Image as ImageIcon, Download } from 'lucide-react'
import { toast } from 'sonner'

interface Attachment {
  id: string
  fileName: string
  fileType: string | null
  fileSize: number | null
  fileUrl: string | null
  description: string | null
  createdAt: string
}

interface Props {
  relatedId: string
  relatedType: string
  description?: string
}

export function AttachmentsSection({ relatedId, relatedType, description }: Props) {
  const [items, setItems] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [desc, setDesc] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/attachments?relatedId=${encodeURIComponent(relatedId)}&relatedType=${encodeURIComponent(relatedType)}&limit=50`)
      .then(r => r.json())
      .then(d => setItems(d.data || []))
      .catch(() => toast.error('Failed to load attachments'))
      .finally(() => setLoading(false))
  }, [relatedId, relatedType])

  useEffect(() => { load() }, [load])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('relatedId', relatedId)
      fd.append('relatedType', relatedType)
      if (desc) fd.append('description', desc)
      const res = await fetch('/api/attachments/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Upload failed')
      }
      toast.success(`${file.name} uploaded`)
      setDesc('')
      load()
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attachment?')) return
    try {
      const res = await fetch(`/api/attachments?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Attachment deleted')
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  const fmtSize = (b: number | null) => {
    if (!b) return '—'
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Paperclip className="w-4 h-4" /> Attachments
          {items.length > 0 && <Badge variant="secondary" className="text-xs">{items.length}</Badge>}
        </CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Description (optional)</Label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Attendance form, consent form" className="h-8 text-sm" />
          </div>
          <div>
            <input
              id={`attach-${relatedId}`}
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => document.getElementById(`attach-${relatedId}`)?.click()}
              className="gap-1.5"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-2">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 italic">No attachments yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map(a => {
              const isImage = a.fileType?.startsWith('image/')
              const Icon = isImage ? ImageIcon : FileText
              return (
                <li key={a.id} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{a.fileName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {fmtSize(a.fileSize)} · {new Date(a.createdAt).toLocaleDateString()}
                      {a.description && ` · ${a.description}`}
                    </p>
                  </div>
                  {a.fileUrl && (
                    <a
                      href={a.fileUrl}
                      download={a.fileName}
                      className="text-muted-foreground hover:text-foreground"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default AttachmentsSection
