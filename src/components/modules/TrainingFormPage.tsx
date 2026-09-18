'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Loader2, ClipboardList, Calendar } from 'lucide-react'
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

  useEffect(() => {
    if (mode === 'edit' && trainingId) {
      setLoadingTraining(true)
      fetch(`/api/trainings/${trainingId}`)
        .then(r => r.json())
        .then(d => {
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
        })
        .catch(() => toast.error('Failed to load training'))
        .finally(() => setLoadingTraining(false))
    }
  }, [mode, trainingId])

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
              <p className="text-xs text-muted-foreground">Schedule and report training sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Scheduling + Reporting */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scheduling" className="gap-1.5"><Calendar className="w-3.5 h-3.5" /> Scheduling</TabsTrigger>
              <TabsTrigger value="reporting" className="gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Reporting</TabsTrigger>
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
                  <Label>Farmer Group</Label>
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

              {/* Attachments — placeholder for future file upload */}
              <div className="space-y-1.5">
                <Label>Attachments (photos + attendance form)</Label>
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground">File upload coming soon. For now, note attachment URLs in the Findings field.</p>
                </div>
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
