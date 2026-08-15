'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Pencil, Database, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'

type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'multiselect-api'
interface Field {
  name: string
  label: string
  type: FieldType
  options?: string[]
  apiUrl?: string
  apiValueField?: string
  apiLabelField?: string
}

export interface MasterKind {
  key: string
  label: string
  description: string
  fields: Field[]
  columns: string[] // columns shown in the table (field names)
}

const MASTER_KINDS: MasterKind[] = [
  {
    key: 'crop', label: 'Crop Master', description: 'Crops grown by farmers — used across enrollment, cultivation and traceability forms.',
    fields: [
      { name: 'name', label: 'Crop Name', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['Field Crop', 'Oil Seed', 'Spices', 'Fruits', 'Vegetables', 'Fiber'] },
      { name: 'durationValue', label: 'Duration Value', type: 'number' },
      { name: 'durationUnit', label: 'Duration Unit', type: 'select', options: ['Day', 'Week', 'Month'] },
      { name: 'expectedExpense', label: 'Expected Expense', type: 'number' },
      { name: 'expectedIncome', label: 'Expected Income', type: 'number' },
      { name: 'expectedYield', label: 'Expected Yield', type: 'number' },
      { name: 'yieldUnit', label: 'Yield Unit', type: 'select', options: ['Hectare', 'Acre'] },
    ],
    columns: ['name', 'category'],
  },
  {
    key: 'season', label: 'Season Master', description: 'Agricultural seasons (planting/harvest windows) used by cultivation and cost-of-cultivation.',
    fields: [
      { name: 'name', label: 'Season Name', type: 'text' },
      { name: 'fromDate', label: 'Start Date', type: 'date' },
      { name: 'toDate', label: 'End Date', type: 'date' },
    ],
    columns: ['name', 'fromDate', 'toDate'],
  },
  {
    key: 'seed', label: 'Seed Master', description: 'Seed varieties and growing inputs distributed to farmers.',
    fields: [
      { name: 'name', label: 'Seed Name', type: 'text' },
      { name: 'uom', label: 'Unit (UoM)', type: 'select', options: ['Kg', 'Tonnes', 'Quintal', 'Gram', 'Seedlings'] },
      { name: 'description', label: 'Description', type: 'text' },
    ],
    columns: ['name', 'uom'],
  },
  {
    key: 'fertilizer', label: 'Fertilizer Master', description: 'Fertilizer products and nutrients applied on farms.',
    fields: [
      { name: 'name', label: 'Fertilizer Name', type: 'text' },
      { name: 'uom', label: 'Unit (UoM)', type: 'select', options: ['Kg', 'Tonnes', 'Quintal', 'Gram', 'ml'] },
      { name: 'chemicalName', label: 'Chemical Name', type: 'text' },
      { name: 'nutrition', label: 'Nutrition', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
    ],
    columns: ['name', 'uom', 'nutrition'],
  },
  {
    key: 'equipment', label: 'Equipment Master', description: 'Farm equipment and machinery catalogued for farmers.',
    fields: [
      { name: 'name', label: 'Equipment Name', type: 'text' },
      { name: 'uom', label: 'Unit (UoM)', type: 'select', options: ['Piece', 'Unit', 'Set', 'Nos'] },
      { name: 'description', label: 'Description', type: 'text' },
    ],
    columns: ['name', 'uom'],
  },
  {
    key: 'pesticide', label: 'Pesticide Master', description: 'Pesticides applied on farms with chemical/biological names.',
    fields: [
      { name: 'name', label: 'Pesticide Name', type: 'text' },
      { name: 'uom', label: 'Unit (UoM)', type: 'select', options: ['Kg', 'Gram', 'ml', 'Litre'] },
      { name: 'chemicalName', label: 'Chemical Name', type: 'text' },
      { name: 'biologicalName', label: 'Biological Name', type: 'text' },
      { name: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
    ],
    columns: ['name', 'chemicalName', 'manufacturer'],
  },
  {
    key: 'weed', label: 'Weed Master', description: 'Weed species requiring control on cultivation plots.',
    fields: [
      { name: 'name', label: 'Weed Name', type: 'text' },
      { name: 'uom', label: 'Unit (UoM)', type: 'select', options: ['Area', 'Bed', 'Tree', 'Nos'] },
      { name: 'description', label: 'Description', type: 'text' },
    ],
    columns: ['name', 'uom'],
  },
  {
    key: 'disease', label: 'Disease Master', description: 'Plant diseases by affected plant part/unit.',
    fields: [
      { name: 'name', label: 'Disease Name', type: 'text' },
      { name: 'affectedTypes', label: 'Affected Plant Part', type: 'select', options: ['Flower', 'Fruit', 'Leaf', 'Soil', 'Grain', 'Tree', 'Other'] },
      { name: 'affectedUom', label: 'Affected Unit', type: 'select', options: ['Tree', 'Area', 'Bed'] },
      { name: 'description', label: 'Description', type: 'text' },
    ],
    columns: ['name', 'affectedTypes'],
  },
  {
    key: 'pest', label: 'Pest Master', description: 'Pests affecting crops by growth stage and affected part.',
    fields: [
      { name: 'name', label: 'Pest Name', type: 'text' },
      { name: 'affectedTypes', label: 'Affected Plant Part', type: 'select', options: ['Flower', 'Fruit', 'Leaf', 'Soil', 'Grain', 'Tree', 'Other'] },
      { name: 'affectedUom', label: 'Affected Unit', type: 'select', options: ['Tree', 'Area', 'Bed'] },
      { name: 'affectedStage', label: 'Affected Crop Stage', type: 'select', options: ['Sowing', 'Young Tree', 'Flowering', 'Graining'] },
      { name: 'description', label: 'Description', type: 'text' },
    ],
    columns: ['name', 'affectedTypes', 'affectedStage'],
  },
  {
    key: 'soiltype', label: 'Soil Type Master', description: 'Soil types with key regions, fertility and main crops — used in soil analysis criteria.',
    fields: [
      { name: 'name', label: 'Soil Type', type: 'text' },
      { name: 'keyRegions', label: 'Key Regions', type: 'multiselect-api', apiUrl: '/api/settings/geo/regions', apiValueField: 'name', apiLabelField: 'name' },
      { name: 'fertility', label: 'Fertility', type: 'textarea' },
      { name: 'mainCrops', label: 'Main Crops', type: 'multiselect-api', apiUrl: '/api/master?type=crop&limit=500', apiValueField: 'name', apiLabelField: 'name' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    columns: ['name', 'keyRegions', 'fertility', 'mainCrops'],
  },
]

export function MasterDataView({ kind }: { kind: string }) {
  const [activeKind, setActiveKind] = useState(kind)
  const selected = MASTER_KINDS.find(m => m.key === activeKind) ?? MASTER_KINDS[0]
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(50)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ type: selected.key, page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    fetch(`/api/master?${params}`)
      .then(r => r.json())
      .then(d => { setRows(d.data || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => { toast.error('Failed to load master data'); setLoading(false) })
  }, [selected.key, search, page, limit])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [selected.key])
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 350)
    return () => clearTimeout(t)
  }, [search])

  const up = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const resetForm = (editRow?: any) => {
    const init: Record<string, any> = {}
    const source = editRow || editing
    if (source) {
      selected.fields.forEach(f => { init[f.name] = source[f.name] ?? '' })
    }
    setForm(init)
  }

  const openAdd = () => { setEditing(null); resetForm(null); setShowForm(true) }
  const openEdit = (row: any) => { setEditing(row); resetForm(row); setShowForm(true) }

  const submit = async () => {
    if (!form.name?.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const payload: Record<string, any> = {}
      selected.fields.forEach(f => {
        const v = form[f.name]
        payload[f.name] = f.type === 'number' ? (v === '' || v == null ? null : Number(v)) : (v ?? null)
      })
      if (selected.key === 'season') {
        if (!payload.name || !payload.fromDate || !payload.toDate) { toast.error('Season needs name, start and end dates'); setSaving(false); return }
        payload.fromDate = new Date(payload.fromDate)
        payload.toDate = new Date(payload.toDate)
      }
      const path = editing
        ? `/api/master?type=${selected.key}&id=${editing.id}`
        : `/api/master?type=${selected.key}`
      const res = await fetch(path, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(editing ? 'Updated' : 'Created')
        setShowForm(false)
        load()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: any) => {
    if (!confirm(`Delete "${row.name}"? This might affect existing records.`)) return
    try {
      const res = await fetch(`/api/master?type=${selected.key}&id=${row.id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Deleted'); load() }
      else { toast.error('Failed to delete — may be in use') }
    } catch { toast.error('Network error') }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6" /> {selected.label}
        </h1>
        <p className="text-sm text-muted-foreground">{selected.description}</p>
      </div>

      {/* Kind tabs */}
      <div className="flex flex-wrap gap-2">
        {MASTER_KINDS.map(k => (
          <Button key={k.key} variant={k.key === selected.key ? 'default' : 'outline'} size="sm"
            onClick={() => { setActiveKind(k.key); setEditing(null); setShowForm(false); setSearch(''); setPage(1) }}>
            {k.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-end">
        <div className="relative flex-1">
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add {selected.label.replace(' Master', '')}</Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{editing ? 'Edit' : 'Add'} {selected.label.replace(' Master', '')}</p>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {selected.fields.map(f => (
                <div key={f.name} className={`space-y-1.5 ${f.type === 'textarea' || f.type === 'multiselect-api' ? 'sm:col-span-2' : ''}`}>
                  <Label className="text-xs">{f.label}{f.name === 'name' ? ' *' : ''}</Label>
                  {f.type === 'select' ? (
                    <Select value={form[f.name] || ''} onValueChange={v => up(f.name, v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{f.options!.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      value={form[f.name] || ''}
                      onChange={e => up(f.name, e.target.value)}
                      className="w-full min-h-[60px] px-3 py-2 text-sm border rounded-md bg-background"
                      placeholder={f.label}
                    />
                  ) : f.type === 'multiselect-api' ? (
                    <MultiSelectApi field={f} value={form[f.name] || ''} onChange={v => up(f.name, v)} />
                  ) : (
                    <Input type={f.type} value={form[f.name] || ''} onChange={e => up(f.name, e.target.value)} className="h-8"
                      placeholder={f.label} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No {selected.label.toLowerCase()} yet. Click "Add" to create one.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {selected.columns.map((cn,i) => <th key={cn} className="text-left py-2 px-4 text-xs font-medium">{selected.fields.find(f=>f.name===cn)?.label || cn}</th>)}
                  <th className="text-right py-2 px-4 text-xs font-medium">Status</th>
                  <th className="py-2 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    {selected.columns.map(c => {
                      const val = r[c]
                      const isLong = typeof val === 'string' && val.length > 40
                      return (
                        <td key={c} className="py-2 px-4 max-w-xs">
                          {c === 'fromDate' || c === 'toDate'
                            ? (val ? String(val).slice(0, 10) : '—')
                            : isLong
                              ? <span className="text-xs" title={String(val)}>{String(val).slice(0, 40)}...</span>
                              : String(val ?? '—')}
                        </td>
                      )
                    })}
                    <td className="text-right px-4">
                      <Badge variant={r.status === 'INACTIVE' ? 'secondary' : 'default'} className="text-[10px]">{r.status || 'ACTIVE'}</Badge>
                    </td>
                    <td className="pr-4">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(r)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {total > limit && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} records</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" />Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next<ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── MultiSelectApi: fetches options from an API, toggle badges, stores as comma-separated string ──
function MultiSelectApi({ field, value, onChange }: {
  field: Field
  value: string
  onChange: (v: string) => void
}) {
  const [options, setOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [customInput, setCustomInput] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(field.apiUrl!)
      .then(r => r.json())
      .then(d => {
        if (!mounted) return
        const rows = d.data || d.catalog || []
        const valField = field.apiValueField || 'name'
        const names = rows.map((r: any) => String(r[valField])).filter(Boolean)
        setOptions(names)
        setLoading(false)
      })
      .catch(() => { if (mounted) { setOptions([]); setLoading(false) } })
    return () => { mounted = false }
  }, [field.apiUrl, field.apiValueField])

  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

  const toggle = (item: string) => {
    if (selected.includes(item)) onChange(selected.filter(s => s !== item).join(', '))
    else onChange([...selected, item].join(', '))
  }

  const addCustom = () => {
    const v = customInput.trim()
    if (!v || selected.includes(v)) { setCustomInput(''); return }
    onChange([...selected, v].join(', '))
    setCustomInput('')
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map(s => (
            <Badge key={s} variant="default" className="text-[10px] gap-1 pr-1">
              {s}
              <button type="button" onClick={() => toggle(s)} className="hover:bg-primary-foreground/20 rounded">
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading options...</p>
      ) : (
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1 border rounded-md bg-muted/20">
          {options.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-1">No options found. Type below to add manually.</p>
          ) : (
            options.map(item => {
              const isSelected = selected.includes(item)
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {item}
                </button>
              )
            })
          )}
        </div>
      )}
      <div className="flex gap-1">
        <Input
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
          placeholder="Add custom..."
          className="h-7 text-xs flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={addCustom} disabled={!customInput.trim()} className="h-7 px-2 text-xs">Add</Button>
      </div>
    </div>
  )
}

export default MasterDataView