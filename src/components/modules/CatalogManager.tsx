'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Settings, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = [
  'gender', 'education_level', 'marital_status', 'house_type', 'housing_ownership',
  'consumer_electronics', 'vehicle_type', 'land_ownership', 'land_topology', 'land_gradient',
  'water_source', 'power_source', 'irrigation_source', 'irrigation_type', 'soil_fertility',
  'certification_type', 'conversion_status', 'soil_criteria', 'loan_source', 'loan_purpose',
  'enrollment_place', 'national_id_type', 'account_type', 'insurance_type',
  'animal_type', 'animal_for_growth', 'fodder_type', 'animal_housing',
  'employment_type', 'income_source', 'fuel_type', 'cooperative_service',
]

export function CatalogManager() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('gender')
  const [showAdd, setShowAdd] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/catalog?category=${selectedCategory}`)
      .then(r => r.json())
      .then(d => { setItems(d.catalog || []); setLoading(false) })
      .catch(() => { toast.error('Failed to load catalog'); setLoading(false) })
  }, [selectedCategory])

  useEffect(() => { load() }, [load])

  const addItem = async () => {
    if (!newValue.trim()) { toast.error('Value is required'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory, value: newValue.trim(), label: newLabel.trim() || null }),
      })
      if (res.ok) {
        toast.success(`Added "${newValue}" to ${selectedCategory}`)
        setNewValue('')
        setNewLabel('')
        setShowAdd(false)
        load()
      } else {
        toast.error('Failed to add — may already exist')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this catalog value?')) return
    try {
      await fetch(`/api/catalog?id=${id}`, { method: 'DELETE' })
      toast.success('Deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6" /> Catalog Master
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage dropdown values for farmer enrollment forms. Changes sync automatically to all platforms.
        </p>
      </div>

      <div className="flex gap-3 items-end">
        <div className="space-y-2 flex-1 max-w-xs">
          <Label className="text-xs">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c} className="text-xs capitalize">{c.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4 mr-1" /> Add Value
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/30">
          <CardContent className="p-4 flex gap-3 items-end">
            <div className="space-y-2 flex-1">
              <Label className="text-xs">Value *</Label>
              <Input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="e.g. Diploma" className="h-8" />
            </div>
            <div className="space-y-2 flex-1">
              <Label className="text-xs">Display Label (optional)</Label>
              <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Diploma Certificate" className="h-8" />
            </div>
            <Button size="sm" onClick={addItem} disabled={submitting}>
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No values in this category yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-2 px-4 text-xs font-medium">Value</th>
                  <th className="text-left py-2 px-4 text-xs font-medium">Label</th>
                  <th className="text-center py-2 px-4 text-xs font-medium">Global</th>
                  <th className="text-right py-2 px-4 text-xs font-medium">Sort</th>
                  <th className="py-2 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 px-4 font-medium">{item.value}</td>
                    <td className="py-2 px-4 text-muted-foreground">{item.label || '—'}</td>
                    <td className="py-2 px-4 text-center">
                      <Badge variant={item.isGlobal ? 'default' : 'secondary'} className="text-[10px]">{item.isGlobal ? 'Global' : 'Tenant'}</Badge>
                    </td>
                    <td className="py-2 px-4 text-right text-muted-foreground">{item.sortOrder}</td>
                    <td className="py-2 px-4">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CatalogManager
