'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { AttachmentsSection } from '@/components/attachments/AttachmentsSection'
import { ArrowLeft, Save, Loader2, Users, Clock, Search, FileCheck } from 'lucide-react'
import { toast } from 'sonner'

// ─── Ekibbo Training Reporting (Ekibbo team feedback) ────────────────────────
const TRAINING_TYPES = [
  { value: 'GROUP_TRAINING', label: 'Group Training' },
  { value: 'FARM_VISIT', label: 'Farmer Visit' },
]
const MAIN_TOPICS = [
  { value: 'BAMBOO', label: 'Bamboo' },
  { value: 'REGENERATIVE_AGRICULTURE', label: 'Regenerative Agriculture' },
  { value: 'FINANCIAL_LITERACY', label: 'Financial Literacy' },
]
const TRAINING_FUNDERS = [
  { value: 'EKIBBO', label: 'EKiBBO' },
  { value: 'ETG', label: 'ETG' },
  { value: 'ENABEL', label: 'Enabel' },
  { value: 'DOEN', label: 'Doen' },
]

interface GroupFarmer {
  id: string
  firstName: string
  lastName: string
  farmerCode?: string | null
  phone?: string | null
}

interface Props {
  trainingId: string
}

export default function TrainingReportPage({ trainingId }: Props) {
  const { setActiveModule } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [training, setTraining] = useState<Record<string, any> | null>(null)
  const [group, setGroup] = useState<Record<string, any> | null>(null)
  const [groupFarmers, setGroupFarmers] = useState<GroupFarmer[]>([])
  const [enrolled, setEnrolled] = useState<Record<string, any>[]>([])
  const [search, setSearch] = useState('')
  // attendee selection state: farmerId -> checked (attended)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const [form, setForm] = useState<Record<string, any>>({
    type: 'GROUP_TRAINING', mainTopic: '', topic: '', funder: '',
    date: '', trainerName: '', durationMinutes: '', groupId: '',
    findings: '', challenges: '', recommendations: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trainings/${trainingId}`)
      const d = await res.json()
      const t = d.data || d
      setTraining(t)
      setGroup(t.group || null)
      setForm({
        type: t.type || 'GROUP_TRAINING',
        mainTopic: t.mainTopic || '',
        topic: t.topic || '',
        funder: t.funder || '',
        date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
        trainerName: t.trainerName || '',
        durationMinutes: t.durationMinutes ?? '',
        groupId: t.groupId || '',
        findings: t.findings || '',
        challenges: t.challenges || '',
        recommendations: t.recommendations || '',
      })
      setEnrolled(t.attendance || [])
      const initial: Record<string, boolean> = {}
      for (const a of t.attendance || []) {
        initial[a.farmerId] = !!a.attended
      }
      setChecked(initial)

      // Load the farmer group's members for attendee selection
      if (t.groupId) {
        const fRes = await fetch(`/api/farmers?groupId=${t.groupId}&limit=500`)
        const fd = await fRes.json()
        const farmers = fd.farmers || fd.data || []
        setGroupFarmers(farmers)
        // Ensure group members not yet enrolled appear unchecked (not attended)
        setChecked(prev => {
          const next = { ...prev }
          for (const f of farmers) if (next[f.id] === undefined) next[f.id] = false
          return next
        })
      }
    } catch {
      toast.error('Failed to load training')
    } finally {
      setLoading(false)
    }
  }, [trainingId])

  useEffect(() => { load() }, [load])

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const isReported = !!(training?.findings || training?.challenges || training?.recommendations || training?.status === 'COMPLETED')

  const filteredFarmers = groupFarmers.filter(f => !search || `${f.firstName} ${f.lastName}`.toLowerCase().includes(search.toLowerCase()) || (f.farmerCode || '').toLowerCase().includes(search.toLowerCase()))

  const toggleFarmer = (farmerId: string, v: boolean) => setChecked(p => ({ ...p, [farmerId]: v }))

  const selectedCount = Object.values(checked).filter(Boolean).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date) { toast.error('Date of the training is required'); return }
    if (!form.durationMinutes) { toast.error('Please enter the time spent on training (minutes)'); return }
    setSaving(true)
    try {
      // 1. Update the training record with reporting fields
      const payload = {
        type: form.type,
        mainTopic: form.mainTopic || null,
        topic: form.topic,
        funder: form.funder || null,
        date: form.date,
        trainerName: form.trainerName || null,
        durationMinutes: parseInt(form.durationMinutes) || null,
        findings: form.findings || null,
        challenges: form.challenges || null,
        recommendations: form.recommendations || null,
        status: 'COMPLETED',
      }
      const res = await fetch(`/api/trainings/${trainingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to save report') }

      // 2. Sync attendance: enroll checked farmers not yet enrolled, then mark
      //    all checked as ATTENDED and unchecked as ABSENT.
      const enrolledIds = new Set(enrolled.map(a => a.farmerId))
      for (const farmerId of Object.keys(checked)) {
        if (!enrolledIds.has(farmerId)) {
          if (checked[farmerId]) {
            await fetch(`/api/trainings/${trainingId}/attendance`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ farmerId, enrollmentStatus: 'ATTENDED' }),
            })
          }
          continue // never-enrolled + unchecked → leave as-is
        }
      }
      for (const a of enrolled) {
        const shouldBeAttended = !!checked[a.farmerId]
        if (a.attended !== shouldBeAttended || (shouldBeAttended && a.enrollmentStatus !== 'ATTENDED')) {
          await fetch(`/api/trainings/${trainingId}/attendance/${a.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attended: shouldBeAttended,
              enrollmentStatus: shouldBeAttended ? 'ATTENDED' : 'ABSENT',
            }),
          })
        }
      }

      toast.success('Training report submitted')
      setActiveModule('training')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save report')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-3"><Skeleton className="h-8 w-8" /><Skeleton className="h-6 w-48" /></div>
        </div>
        <div className="flex-1 p-6 space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      </div>
    )
  }

  if (!training) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center gap-3">
        <p className="text-muted-foreground">Training not found</p>
        <Button variant="outline" onClick={() => setActiveModule('training')}>Back to Trainings</Button>
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
              <h2 className="text-lg font-semibold">{isReported ? 'Training Report' : 'Submit Training Report'}</h2>
              <p className="text-xs text-muted-foreground">{form.topic}{group ? ` · ${group.name}` : ''}{isReported ? ' · reported' : ''}</p>
            </div>
          </div>
          {isReported && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px]">COMPLETED</Badge>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto animate-form-fade-in">
          {/* ─── Training details (reporting) ─── */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><FileCheck className="w-4 h-4 text-primary" /> Training Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="form-label-base">Type of Training</Label>
                  <Select value={form.type} onValueChange={v => update('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TRAINING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="form-label-base">Main Topic</Label>
                  <Select value={form.mainTopic} onValueChange={v => update('mainTopic', v)}>
                    <SelectTrigger><SelectValue placeholder="Select main topic" /></SelectTrigger>
                    <SelectContent>{MAIN_TOPICS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="form-label-base">Specific Topic</Label>
                <Input value={form.topic} onChange={e => update('topic', e.target.value)} className="form-input-base" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="form-label-base">Training Funder</Label>
                  <Select value={form.funder} onValueChange={v => update('funder', v)}>
                    <SelectTrigger><SelectValue placeholder="Select funder" /></SelectTrigger>
                    <SelectContent>{TRAINING_FUNDERS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="form-label-base">Date of Training</Label>
                  <Input type="date" value={form.date} onChange={e => update('date', e.target.value)} required className="form-input-base" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="form-label-base">Name of Trainer</Label>
                  <Input value={form.trainerName} onChange={e => update('trainerName', e.target.value)} className="form-input-base" />
                </div>
                <div className="space-y-1.5">
                  <Label className="form-label-base flex items-center gap-1"><Clock className="w-3 h-3" /> Time Spent (minutes) *</Label>
                  <Input type="number" min="0" value={form.durationMinutes} onChange={e => update('durationMinutes', e.target.value)} placeholder="e.g. 120" required className="form-input-base" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="form-label-base">Farmer Group Trained</Label>
                <div className="text-sm border rounded-md p-2.5 bg-muted/30">
                  {group ? (
                    <span className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      {group.name}{group.groupCode ? <> · Group code <Badge variant="outline" className="text-[10px]">{group.groupCode}</Badge></> : null}
                      <span className="text-xs text-muted-foreground">({groupFarmers.length || enrolled.length} members)</span>
                    </span>
                  ) : 'No farmer group was linked when this training was scheduled'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Attendees from the group ─── */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Attendees</h3>
                <Badge variant="secondary" className="text-xs">{selectedCount} of {groupFarmers.length || enrolled.length} attended</Badge>
              </div>
              {groupFarmers.length === 0 && enrolled.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No farmer group members found. {group ? 'Add farmers to this group first, or enroll them from the Training list.' : 'Schedule the training with a farmer group to select attendees.'}
                </p>
              ) : (
                <>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members by name or code..." className="pl-8 h-9" />
                  </div>
                  <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
                    {(filteredFarmers.length > 0 ? filteredFarmers : enrolled.map((a: any) => ({
                      id: a.farmerId, firstName: a.farmer?.firstName, lastName: a.farmer?.lastName, farmerCode: a.farmer?.farmerCode, phone: a.farmer?.phone,
                    }))).map(f => (
                      <label key={f.id} className="flex items-center gap-3 p-2.5 hover:bg-muted/50 cursor-pointer">
                        <Checkbox checked={!!checked[f.id]} onCheckedChange={v => toggleFarmer(f.id, !!v)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.firstName} {f.lastName}</p>
                          <p className="text-[11px] text-muted-foreground">{f.farmerCode || '—'}{f.phone ? ` · ${f.phone}` : ''}</p>
                        </div>
                        {checked[f.id] && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px]">ATTENDED</Badge>}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => { const next: Record<string, boolean> = {}; for (const f of groupFarmers) next[f.id] = true; for (const a of enrolled) next[a.farmerId] = true; setChecked(next) }}>Select all</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => { const next: Record<string, boolean> = {}; for (const f of groupFarmers) next[f.id] = false; for (const a of enrolled) next[a.farmerId] = false; setChecked(next) }}>Clear all</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ─── Findings / Challenges / Recommendations ─── */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="text-sm font-semibold">Training Outcomes</h3>
              <div className="space-y-1.5">
                <Label className="form-label-base">Findings</Label>
                <Textarea value={form.findings} onChange={e => update('findings', e.target.value)} rows={3} placeholder="What was observed or learned during the training?" />
              </div>
              <div className="space-y-1.5">
                <Label className="form-label-base">Challenges</Label>
                <Textarea value={form.challenges} onChange={e => update('challenges', e.target.value)} rows={3} placeholder="What challenges were encountered?" />
              </div>
              <div className="space-y-1.5">
                <Label className="form-label-base">Recommendations</Label>
                <Textarea value={form.recommendations} onChange={e => update('recommendations', e.target.value)} rows={3} placeholder="What should be done next or improved?" />
              </div>
            </CardContent>
          </Card>

          {/* ─── Attachments: photos + attendance form ─── */}
          <AttachmentsSection
            relatedId={trainingId}
            relatedType="training"
            description="Attach training photos and the signed attendance form"
          />

          <div className="flex items-center justify-end gap-3 pt-2 pb-6">
            <Button type="button" variant="outline" onClick={() => setActiveModule('training')} className="btn-hover-lift">Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-2 btn-hover-lift min-w-[180px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Submitting...' : isReported ? 'Update Report' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
