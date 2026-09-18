'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Loader2, ClipboardList, Calendar, Users, Upload, X, FileText, Image as ImageIcon, Check } from 'lucide-react'
import { toast } from 'sonner'

const TRAINING_TYPES = [
  { value: 'GROUP_TRAINING', label: 'Group Training' },
  { value: 'FARM_VISIT', label: 'Farm Visit' },
]

const MAIN_TOPICS = [
  { value: 'Bamboo', label: 'Bamboo' },
  { value: 'Regenerative Agriculture', label: 'Regenerative Agriculture' },
  { value: 'Financial Literacy', label: 'Financial Literacy' },
]

const TRAINING_FUNDERS = [
  { value: 'EKiBBO', label: 'EKiBBO' },
  { value: 'ETG', label: 'ETG' },
  { value: 'Enabel', label: 'Enabel' },
  { value: 'Doen', label: 'Doen' },
]

const TRAINING_STATUS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

interface Attachment {
  url: string
  name: string
  size: number
  type: string
  uploadedAt: string
}

interface Attendee {
  id: string
  farmerId: string
  attended: boolean
  enrollmentStatus: string
  farmer: { id: string; firstName: string; lastName: string; farmerCode: string | null; phone: string | null }
}

interface Props {
  mode: 'create' | 'edit'
  trainingId?: string
}

export default function TrainingFormPage({ mode, trainingId }: Props) {
  const { setActiveModule } = useAppStore()
  const [saving, setSaving] = useState(false)
  const [loadingTraining, setLoadingTraining] = useState(mode === 'edit')
  const [activeTab, setActiveTab] = useState('scheduling')
  const [farmerGroups, setFarmerGroups] = useState<any[]>([])

  // Phase C1 — Attendees from farmer group
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loadingAttendees, setLoadingAttendees] = useState(false)
  const [enrollingGroup, setEnrollingGroup] = useState(false)

  // Phase C2 — File attachments
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<Record<string, any>>({
    // Scheduling fields
    type: 'GROUP_TRAINING',
    status: 'SCHEDULED',
    mainTopic: '',
    specificTopic: '',
    funder: '',
    date: '',
    trainerName: '',
    groupId: '',
    location: '',
    expectedAttendees: '',
    startTime: '',
    endTime: '',
    durationMinutes: '',
    // Reporting fields
    findings: '',
    challenges: '',
    recommendations: '',
    materialsUsed: '',
    notes: '',
  })

  useEffect(() => {
    // Load farmer groups for the group selector
    fetch('/api/farmer-groups?limit=200')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.data) setFarmerGroups(d.data)
        else if (d?.groups) setFarmerGroups(d.groups)
      })
      .catch(() => {})
  }, [])

  const loadTraining = useCallback(async () => {
    if (mode !== 'edit' || !trainingId) return
    setLoadingTraining(true)
    try {
      const r = await fetch(`/api/trainings/${trainingId}`)
      if (!r.ok) { toast.error('Failed to load training'); return }
      const d = await r.json()
      const t = d.data || d
      setForm({
        type: t.type || 'GROUP_TRAINING',
        status: t.status || 'SCHEDULED',
        mainTopic: t.mainTopic || '',
        specificTopic: t.specificTopic || '',
        funder: t.funder || '',
        date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
        trainerName: t.trainerName || '',
        groupId: t.groupId || '',
        location: t.location || '',
        expectedAttendees: t.expectedAttendees ?? '',
        startTime: t.startTime ? new Date(t.startTime).toISOString().split('T')[1].substring(0, 5) : '',
        endTime: t.endTime ? new Date(t.endTime).toISOString().split('T')[1].substring(0, 5) : '',
        durationMinutes: t.durationMinutes ?? '',
        findings: t.findings || '',
        challenges: t.challenges || '',
        recommendations: t.recommendations || '',
        materialsUsed: t.materialsUsed || '',
        notes: t.notes || '',
      })
      // Load attachments
      if (t.attachmentUrls) {
        try {
          const parsed = typeof t.attachmentUrls === 'string' ? JSON.parse(t.attachmentUrls) : t.attachmentUrls
          if (Array.isArray(parsed)) setAttachments(parsed)
        } catch {}
      }
      // Load attendees
      const ar = await fetch(`/api/trainings/${trainingId}/attendance`)
      if (ar.ok) {
        const ad = await ar.json()
        setAttendees(ad.data || [])
      }
    } catch (e) {
      toast.error('Failed to load training')
    } finally {
      setLoadingTraining(false)
    }
  }, [mode, trainingId])

  useEffect(() => { loadTraining() }, [loadTraining])

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date) { toast.error('Date is required'); return }
    if (!form.mainTopic) { toast.error('Main topic is required'); return }
    setSaving(true)
    try {
      const topic = form.specificTopic || form.mainTopic
      const payload = {
        topic,
        description: form.specificTopic || null,
        date: form.date,
        location: form.location || null,
        trainerName: form.trainerName || null,
        type: form.type,
        status: form.status,
        startTime: form.startTime ? new Date(`${form.date}T${form.startTime}`).toISOString() : null,
        endTime: form.endTime ? new Date(`${form.date}T${form.endTime}`).toISOString() : null,
        durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : null,
        expectedAttendees: form.expectedAttendees ? parseInt(form.expectedAttendees) : null,
        materialsUsed: form.materialsUsed || null,
        notes: form.notes || null,
        groupId: form.groupId || null,
        mainTopic: form.mainTopic || null,
        specificTopic: form.specificTopic || null,
        funder: form.funder || null,
        findings: form.findings || null,
        challenges: form.challenges || null,
        recommendations: form.recommendations || null,
      }
      const url = mode === 'edit' && trainingId ? `/api/trainings/${trainingId}` : '/api/trainings'
      const method = mode === 'edit' ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      toast.success(mode === 'edit' ? 'Training updated' : 'Training scheduled')
      setActiveModule('training')
    } catch (e: any) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ─── Phase C1 — Enroll all farmers from a group ────────────────────────
  const handleEnrollGroup = async () => {
    if (!trainingId) {
      toast.error('Save the training first before enrolling attendees')
      return
    }
    if (!form.groupId) {
      toast.error('Select a farmer group first')
      return
    }
    setEnrollingGroup(true)
    try {
      const r = await fetch(`/api/trainings/${trainingId}/enroll-group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: form.groupId }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to enroll group')
      toast.success(`Enrolled ${d.data.enrolled} farmers from "${d.data.groupName}" (${d.data.skipped} already enrolled)`)
      // Reload attendees
      const ar = await fetch(`/api/trainings/${trainingId}/attendance`)
      if (ar.ok) {
        const ad = await ar.json()
        setAttendees(ad.data || [])
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to enroll group')
    } finally {
      setEnrollingGroup(false)
    }
  }

  // ─── Phase C1 — Toggle attended flag ───────────────────────────────────
  const handleToggleAttended = async (att: Attendee) => {
    const newAttended = !att.attended
    // Optimistic update
    setAttendees(prev => prev.map(a => a.id === att.id ? { ...a, attended: newAttended, enrollmentStatus: newAttended ? 'ATTENDED' : 'ENROLLED' } : a))
    try {
      const r = await fetch(`/api/trainings/${trainingId}/attendance/${att.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended: newAttended, enrollmentStatus: newAttended ? 'ATTENDED' : 'ENROLLED' }),
      })
      if (!r.ok) {
        // Revert on failure
        setAttendees(prev => prev.map(a => a.id === att.id ? { ...a, attended: !newAttended, enrollmentStatus: !newAttended ? 'ATTENDED' : 'ENROLLED' } : a))
        throw new Error('Failed to update')
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update attendance')
    }
  }

  // ─── Phase C2 — File upload ─────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (!trainingId) {
      toast.error('Save the training first before uploading attachments')
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }
      const r = await fetch(`/api/trainings/${trainingId}/attachments`, {
        method: 'POST',
        body: formData,
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to upload')
      setAttachments(d.data.attachments || [])
      toast.success(`Uploaded ${d.data.newlyAdded?.length || 0} file(s)`)
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAttachment = async (url: string) => {
    if (!confirm('Delete this attachment?')) return
    try {
      const r = await fetch(`/api/trainings/${trainingId}/attachments?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.error || 'Failed to delete')
      }
      setAttachments(prev => prev.filter(a => a.url !== url))
      toast.success('Attachment deleted')
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  if (loadingTraining) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-3"><Skeleton className="h-8 w-8" /><Skeleton className="h-6 w-40" /></div>
        </div>
        <div className="flex-1 p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      </div>
    )
  }

  const attendedCount = attendees.filter(a => a.attended).length

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveModule('training')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">{mode === 'edit' ? 'Edit Training' : 'New Training'}</h2>
              <p className="text-xs text-muted-foreground">Schedule, enroll attendees, upload photos + attendance form</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Scheduling + Reporting + Attendees + Attachments */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="scheduling" className="gap-1.5"><Calendar className="w-3.5 h-3.5" /> Scheduling</TabsTrigger>
              <TabsTrigger value="reporting" className="gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Reporting</TabsTrigger>
              <TabsTrigger value="attendees" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Attendees {attendees.length > 0 && <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{attendedCount}/{attendees.length}</span>}</TabsTrigger>
              <TabsTrigger value="attachments" className="gap-1.5"><Upload className="w-3.5 h-3.5" /> Files {attachments.length > 0 && <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{attachments.length}</span>}</TabsTrigger>
            </TabsList>

            {/* ─── SCHEDULING TAB ─── */}
            <TabsContent value="scheduling" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Type of Training <span className="text-red-500">*</span></Label>
                  <Select value={form.type} onValueChange={v => update('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRAINING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Main Topic <span className="text-red-500">*</span></Label>
                  <Select value={form.mainTopic} onValueChange={v => update('mainTopic', v)}>
                    <SelectTrigger><SelectValue placeholder="Select main topic" /></SelectTrigger>
                    <SelectContent>
                      {MAIN_TOPICS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Specific Topic</Label>
                <Input value={form.specificTopic} onChange={e => update('specificTopic', e.target.value)} placeholder="e.g. Coffee pruning under bamboo shade" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Training Funder</Label>
                  <Select value={form.funder} onValueChange={v => update('funder', v)}>
                    <SelectTrigger><SelectValue placeholder="Select funder" /></SelectTrigger>
                    <SelectContent>
                      {TRAINING_FUNDERS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={form.date} onChange={e => update('date', e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Trainer Name</Label>
                  <Input value={form.trainerName} onChange={e => update('trainerName', e.target.value)} placeholder="Who will conduct this training?" />
                </div>
                <div className="space-y-1.5">
                  <Label>Farmer Group (for bulk enrollment)</Label>
                  <Select value={form.groupId} onValueChange={v => update('groupId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select farmer group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All groups</SelectItem>
                      {farmerGroups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name} {g.groupCode ? `(${g.groupCode})` : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => update('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRAINING_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input type="time" value={form.startTime} onChange={e => update('startTime', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <Input type="time" value={form.endTime} onChange={e => update('endTime', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration (min)</Label>
                  <Input type="number" value={form.durationMinutes} onChange={e => update('durationMinutes', e.target.value)} placeholder="e.g. 120" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Kibale Community Hall" />
                </div>
                <div className="space-y-1.5">
                  <Label>Expected Attendees</Label>
                  <Input type="number" value={form.expectedAttendees} onChange={e => update('expectedAttendees', e.target.value)} placeholder="e.g. 30" />
                </div>
              </div>
            </TabsContent>

            {/* ─── REPORTING TAB ─── */}
            <TabsContent value="reporting" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                Fill in the reporting fields after the training has been conducted. Scheduling fields are also editable here.
              </p>

              <div className="space-y-1.5">
                <Label>Findings</Label>
                <Textarea value={form.findings} onChange={e => update('findings', e.target.value)} placeholder="What was observed during the training? Key takeaways, participant engagement, etc." rows={3} />
              </div>

              <div className="space-y-1.5">
                <Label>Challenges</Label>
                <Textarea value={form.challenges} onChange={e => update('challenges', e.target.value)} placeholder="Any challenges encountered during the training (attendance, weather, materials, etc.)" rows={2} />
              </div>

              <div className="space-y-1.5">
                <Label>Recommendations</Label>
                <Textarea value={form.recommendations} onChange={e => update('recommendations', e.target.value)} placeholder="Recommendations for future trainings or follow-up actions" rows={2} />
              </div>

              <div className="space-y-1.5">
                <Label>Materials Used</Label>
                <Input value={form.materialsUsed} onChange={e => update('materialsUsed', e.target.value)} placeholder="e.g. Booklets, seed samples, demo tools" />
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} placeholder="Internal notes for the trainer..." />
              </div>
            </TabsContent>

            {/* ─── ATTENDEES TAB (Phase C1) ─── */}
            <TabsContent value="attendees" className="space-y-4 mt-4">
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Phase C1 — Attendee selection from farmer group</p>
                <p className="text-xs text-muted-foreground">
                  Select a farmer group in the Scheduling tab, then click the button below to bulk-enroll all active members of that group.
                  You can then mark each farmer as Attended / Absent after the training.
                </p>
                {form.groupId ? (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Selected group: <strong>{farmerGroups.find(g => g.id === form.groupId)?.name || '—'}</strong>
                  </p>
                ) : (
                  <p className="text-xs text-amber-700 dark:text-amber-400">No group selected — go to Scheduling tab to pick one.</p>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleEnrollGroup}
                  disabled={!form.groupId || enrollingGroup || mode !== 'edit'}
                  className="gap-1.5"
                >
                  {enrollingGroup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                  {enrollingGroup ? 'Enrolling...' : 'Enroll All Group Members'}
                </Button>
                {mode !== 'edit' && (
                  <p className="text-xs text-muted-foreground italic">Save the training first to enable attendee enrollment.</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Enrolled Attendees ({attendees.length})</h3>
                {attendees.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-emerald-600 font-medium">{attendedCount}</span> attended ·{' '}
                    <span className="text-amber-600 font-medium">{attendees.length - attendedCount}</span> absent
                  </p>
                )}
              </div>

              {loadingAttendees ? (
                <Skeleton className="h-32 w-full" />
              ) : attendees.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">No attendees enrolled yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Select a farmer group above and click "Enroll All Group Members".</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                        <tr className="border-b">
                          <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">Farmer</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">Code</th>
                          <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground">Attended</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendees.map(att => (
                          <tr key={att.id} className="border-b border-border/30 hover:bg-muted/30">
                            <td className="py-2 px-3">{att.farmer?.firstName} {att.farmer?.lastName}</td>
                            <td className="py-2 px-3 text-muted-foreground">{att.farmer?.farmerCode || '—'}</td>
                            <td className="py-2 px-3 text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant={att.attended ? 'default' : 'outline'}
                                className="h-7 px-3 gap-1"
                                onClick={() => handleToggleAttended(att)}
                              >
                                {att.attended ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                {att.attended ? 'Attended' : 'Absent'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ─── ATTACHMENTS TAB (Phase C2) ─── */}
            <TabsContent value="attachments" className="space-y-4 mt-4">
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Phase C2 — File upload (photos + attendance form)</p>
                <p className="text-xs text-muted-foreground">
                  Upload training photos (JPEG/PNG/WebP/GIF), scanned attendance forms (PDF/Excel/Word).
                  Max 10 files per upload, 10MB each.
                </p>
                {mode !== 'edit' && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">Save the training first before uploading attachments.</p>
                )}
              </div>

              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.xlsx,.xls,.docx,.doc"
                  onChange={handleFileUpload}
                  disabled={uploading || mode !== 'edit'}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || mode !== 'edit'}
                  className="w-full h-20 border-2 border-dashed flex-col gap-1"
                >
                  {uploading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Uploading...</span></>
                  ) : (
                    <><Upload className="w-5 h-5" /><span className="text-sm">Click to upload photos + attendance form</span></>
                  )}
                </Button>

                {attachments.length === 0 ? (
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">No attachments uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {attachments.map((att, i) => (
                      <div key={i} className="border rounded-lg p-3 space-y-2 relative group">
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.url)}
                          className="absolute top-1.5 right-1.5 p-1 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                          {att.type.startsWith('image/') ? (
                            <div className="aspect-square rounded-md overflow-hidden bg-muted/30">
                              <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="aspect-square rounded-md bg-muted/30 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </a>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate" title={att.name}>{att.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {(att.size / 1024).toFixed(0)} KB · {att.type.startsWith('image/') ? 'Image' : 'Document'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setActiveModule('training')}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-2 min-w-[140px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : mode === 'edit' ? 'Update Training' : 'Schedule Training'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
