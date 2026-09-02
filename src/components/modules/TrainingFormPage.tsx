'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2, Users, Building2 } from 'lucide-react'
import { toast } from 'sonner'

// ─── Ekibbo Training Scheduling (Ekibbo team feedback) ───────────────────────
// Type of training: Group Training | Farmer Visit
const TRAINING_TYPES = [
  { value: 'GROUP_TRAINING', label: 'Group Training' },
  { value: 'FARM_VISIT', label: 'Farmer Visit' },
]
// Main topics: Bamboo | Regenerative Agriculture | Financial Literacy
const MAIN_TOPICS = [
  { value: 'BAMBOO', label: 'Bamboo' },
  { value: 'REGENERATIVE_AGRICULTURE', label: 'Regenerative Agriculture' },
  { value: 'FINANCIAL_LITERACY', label: 'Financial Literacy' },
]
// Training funders: EKiBBO | ETG | Enabel | Doen
const TRAINING_FUNDERS = [
  { value: 'EKIBBO', label: 'EKiBBO' },
  { value: 'ETG', label: 'ETG' },
  { value: 'ENABEL', label: 'Enabel' },
  { value: 'DOEN', label: 'Doen' },
]
const TRAINING_STATUS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

interface FarmerGroup {
  id: string
  name: string
  groupCode?: string | null
  location?: string | null
  _count?: { farmers: number }
}

interface Props {
  mode: 'create' | 'edit'
  trainingId?: string
}

export default function TrainingFormPage({ mode, trainingId }: Props) {
  const { setActiveModule } = useAppStore()
  const [saving, setSaving] = useState(false)
  const [loadingTraining, setLoadingTraining] = useState(mode === 'edit')
  const [groups, setGroups] = useState<FarmerGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [form, setForm] = useState<Record<string, any>>({
    topic: '', mainTopic: '', description: '', date: '', location: '', trainerName: '',
    funder: '', type: 'GROUP_TRAINING', status: 'SCHEDULED', startTime: '', endTime: '',
    expectedAttendees: '', materialsUsed: '', notes: '', groupId: '',
  })

  // Load farmer groups for the group selector (Ekibbo: groups of 25-35 farmers,
  // each group has a group code and farmers are assigned per EKiBBO's sharing)
  useEffect(() => {
    setLoadingGroups(true)
    fetch('/api/farmer-groups')
      .then(r => r.json())
      .then(d => setGroups((d.data || []).filter((g: FarmerGroup) => g._count === undefined || true)))
      .catch(() => toast.error('Failed to load farmer groups'))
      .finally(() => setLoadingGroups(false))
  }, [])

  useEffect(() => {
    if (mode === 'edit' && trainingId) {
      setLoadingTraining(true)
      fetch(`/api/trainings/${trainingId}`)
        .then(r => r.json())
        .then(d => {
          const t = d.data || d
          setForm({
            topic: t.topic || '',
            mainTopic: t.mainTopic || '',
            description: t.description || '',
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
            location: t.location || '',
            trainerName: t.trainerName || '',
            funder: t.funder || '',
            type: t.type || 'GROUP_TRAINING',
            status: t.status || 'SCHEDULED',
            startTime: t.startTime ? new Date(t.startTime).toISOString().split('T')[1].substring(0, 5) : '',
            endTime: t.endTime ? new Date(t.endTime).toISOString().split('T')[1].substring(0, 5) : '',
            expectedAttendees: t.expectedAttendees ?? '',
            materialsUsed: t.materialsUsed || '',
            notes: t.notes || '',
            groupId: t.groupId || (t.group?.id ?? ''),
          })
        })
        .catch(() => toast.error('Failed to load training'))
        .finally(() => setLoadingTraining(false))
    }
  }, [mode, trainingId])

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const selectedGroup = groups.find(g => g.id === form.groupId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.topic) { toast.error('Specific topic is required'); return }
    if (!form.date) { toast.error('Date of the training is required'); return }
    if (!form.mainTopic) { toast.error('Please select a main topic'); return }
    setSaving(true)
    try {
      const payload = {
        topic: form.topic,
        description: form.description || null,
        mainTopic: form.mainTopic || null,
        funder: form.funder || null,
        groupId: form.groupId || null,
        date: form.date,
        location: form.location || null,
        trainerName: form.trainerName || null,
        type: form.type,
        status: form.status,
        startTime: form.startTime ? new Date(`${form.date}T${form.startTime}`).toISOString() : null,
        endTime: form.endTime ? new Date(`${form.date}T${form.endTime}`).toISOString() : null,
        expectedAttendees: form.expectedAttendees ? parseInt(form.expectedAttendees) : null,
        materialsUsed: form.materialsUsed || null,
        notes: form.notes || null,
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
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveModule('training')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">{mode === 'edit' ? 'Edit Scheduled Training' : 'Schedule New Training'}</h2>
              <p className="text-xs text-muted-foreground">{mode === 'edit' ? 'Update the training plan' : 'Plan a training for a farmer group — report on it after it takes place'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto animate-form-fade-in">
          {/* ─── Training identification (Ekibbo scheduling fields) ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="form-label-base">Type of Training *</Label>
              <Select value={form.type} onValueChange={v => update('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRAINING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="form-label-base">Main Topic *</Label>
              <Select value={form.mainTopic} onValueChange={v => update('mainTopic', v)}>
                <SelectTrigger><SelectValue placeholder="Select main topic" /></SelectTrigger>
                <SelectContent>
                  {MAIN_TOPICS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="form-label-base">Specific Topic <span className="form-required">*</span></Label>
            <Input value={form.topic} onChange={e => update('topic', e.target.value)} placeholder="e.g. Coffee Pruning Best Practices" required className="form-input-base" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="form-label-base">Training Funder</Label>
              <Select value={form.funder} onValueChange={v => update('funder', v)}>
                <SelectTrigger><SelectValue placeholder="Select funder" /></SelectTrigger>
                <SelectContent>
                  {TRAINING_FUNDERS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="form-label-base">Date of Training <span className="form-required">*</span></Label>
              <Input type="date" value={form.date} onChange={e => update('date', e.target.value)} required className="form-input-base" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="form-label-base">Name of Trainer</Label>
              <Input value={form.trainerName} onChange={e => update('trainerName', e.target.value)} placeholder="Who will conduct this training?" className="form-input-base" />
            </div>
            <div className="space-y-1.5">
              <Label className="form-label-base">Farmer Group to be Trained</Label>
              {loadingGroups ? (
                <Skeleton className="h-10 w-full" />
              ) : groups.length === 0 ? (
                <div className="text-xs text-muted-foreground border rounded-md p-2.5">No farmer groups yet — create groups first (Master Data → Farmer Groups)</div>
              ) : (
                <Select value={form.groupId} onValueChange={v => update('groupId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select farmer group" /></SelectTrigger>
                  <SelectContent>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}{g.groupCode ? ` (${g.groupCode})` : ''}{g._count?.farmers != null ? ` — ${g._count.farmers} farmers` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          {selectedGroup && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>Selected group: <span className="font-medium text-foreground">{selectedGroup.name}</span>{selectedGroup.groupCode ? <> · Group code <Badge variant="outline" className="text-[10px] ml-1">{selectedGroup.groupCode}</Badge></> : null}{selectedGroup._count?.farmers != null ? <> · {selectedGroup._count.farmers} farmers assigned</> : null}</span>
            </div>
          )}

          {/* ─── Additional planning details (optional) ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="form-label-base">Location</Label>
              <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Kibale Community Hall" className="form-input-base" />
            </div>
            <div className="space-y-1.5">
              <Label className="form-label-base">Expected Attendees</Label>
              <Input type="number" value={form.expectedAttendees} onChange={e => update('expectedAttendees', e.target.value)} placeholder="e.g. 25" className="form-input-base" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="form-label-base">Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRAINING_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="form-label-base">Start Time</Label>
              <Input type="time" value={form.startTime} onChange={e => update('startTime', e.target.value)} className="form-input-base" />
            </div>
            <div className="space-y-1.5">
              <Label className="form-label-base">End Time</Label>
              <Input type="time" value={form.endTime} onChange={e => update('endTime', e.target.value)} className="form-input-base" />
            </div>
            <div className="space-y-1.5">
              <Label className="form-label-base flex items-center gap-1"><Building2 className="w-3 h-3" /> Materials Used</Label>
              <Input value={form.materialsUsed} onChange={e => update('materialsUsed', e.target.value)} placeholder="e.g. Booklets, seed samples" className="form-input-base" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="form-label-base">Description</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="What will be covered..." rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label className="form-label-base">Notes</Label>
            <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} placeholder="Internal notes for the trainer..." />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setActiveModule('training')} className="btn-hover-lift">Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-2 btn-hover-lift min-w-[140px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : mode === 'edit' ? 'Update Training' : 'Schedule Training'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
