'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const TRAINING_TYPES = [
  { value: 'GROUP_TRAINING', label: 'Group Training' },
  { value: 'FARM_VISIT', label: 'Farm Visit' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'FIELD_DEMO', label: 'Field Demonstration' },
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
  const [form, setForm] = useState<Record<string, any>>({
    topic: '', description: '', date: '', location: '', trainerName: '',
    type: 'GROUP_TRAINING', status: 'SCHEDULED', startTime: '', endTime: '',
    expectedAttendees: '', materialsUsed: '', notes: '',
  })

  useEffect(() => {
    if (mode === 'edit' && trainingId) {
      setLoadingTraining(true)
      fetch(`/api/trainings/${trainingId}`)
        .then(r => r.json())
        .then(d => {
          const t = d.data || d
          setForm({
            topic: t.topic || '', description: t.description || '',
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
            location: t.location || '', trainerName: t.trainerName || '',
            type: t.type || 'GROUP_TRAINING', status: t.status || 'SCHEDULED',
            startTime: t.startTime ? new Date(t.startTime).toISOString().split('T')[1].substring(0, 5) : '',
            endTime: t.endTime ? new Date(t.endTime).toISOString().split('T')[1].substring(0, 5) : '',
            expectedAttendees: t.expectedAttendees ?? '', materialsUsed: t.materialsUsed || '',
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
    if (!form.topic || !form.date) { toast.error('Topic and date are required'); return }
    setSaving(true)
    try {
      const payload = {
        topic: form.topic, description: form.description || null, date: form.date,
        location: form.location || null, trainerName: form.trainerName || null,
        type: form.type, status: form.status,
        startTime: form.startTime ? new Date(`${form.date}T${form.startTime}`).toISOString() : null,
        endTime: form.endTime ? new Date(`${form.date}T${form.endTime}`).toISOString() : null,
        expectedAttendees: form.expectedAttendees ? parseInt(form.expectedAttendees) : null,
        materialsUsed: form.materialsUsed || null, notes: form.notes || null,
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
              <h2 className="text-lg font-semibold">{mode === 'edit' ? 'Edit Training' : 'Schedule New Training'}</h2>
              <p className="text-xs text-muted-foreground">{mode === 'edit' ? 'Update training information' : 'Fill in the details to schedule a new training session'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto animate-form-fade-in">
          <div className="space-y-1.5">
            <Label className="form-label-base">Topic / Title <span className="form-required">*</span></Label>
            <Input value={form.topic} onChange={e => update('topic', e.target.value)} placeholder="e.g. Coffee Pruning Best Practices" required className="form-input-base" />
          </div>
          <div className="space-y-1.5">
            <Label className="form-label-base">Description</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="What will be covered..." rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="form-label-base">Date <span className="form-required">*</span></Label>
              <Input type="date" value={form.date} onChange={e => update('date', e.target.value)} required className="form-input-base" />
            </div>
            <div className="space-y-1.5">
              <Label className="form-label-base">Location</Label>
              <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Kibale Community Hall" className="form-input-base" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="form-label-base">Trainer / Conductor Name</Label>
              <Input value={form.trainerName} onChange={e => update('trainerName', e.target.value)} placeholder="Who will conduct this training?" className="form-input-base" />
            </div>
            <div className="space-y-1.5">
              <Label className="form-label-base">Expected Attendees</Label>
              <Input type="number" value={form.expectedAttendees} onChange={e => update('expectedAttendees', e.target.value)} placeholder="e.g. 25" className="form-input-base" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="form-label-base">Type</Label>
              <Select value={form.type} onValueChange={v => update('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRAINING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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
          </div>
          <div className="space-y-1.5">
            <Label className="form-label-base">Materials Used</Label>
            <Input value={form.materialsUsed} onChange={e => update('materialsUsed', e.target.value)} placeholder="e.g. Booklets, seed samples, demo tools" className="form-input-base" />
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
