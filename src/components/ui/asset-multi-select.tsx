'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Cache catalog fetches across all AssetMultiSelect instances in the session
const catalogCache = new Map<string, Promise<string[]>>()

async function fetchCatalogValues(category: string): Promise<string[]> {
  if (catalogCache.has(category)) return catalogCache.get(category)!
  const p = fetch(`/api/catalog?category=${encodeURIComponent(category)}`)
    .then(r => r.json())
    .then(d => (d.catalog || []).map((c: any) => c.value))
    .catch(() => [] as string[])
  catalogCache.set(category, p)
  return p
}

interface Props {
  value: string[]
  onChange: (v: string[]) => void
  category: string
  placeholder?: string
}

/**
 * Multi-select with catalog-driven suggestions + free-text input.
 *
 * - Shows the catalog values as clickable badges (toggle on/off)
 * - Plus an input field + Add button for custom values not in the catalog
 * - Selected values appear at the top with an X to remove
 *
 * Used for the farmer "Assets Owned" field where different farmers have
 * different assets and we can't enumerate them all in advance.
 */
export function AssetMultiSelect({ value, onChange, category, placeholder = 'Add custom asset...' }: Props) {
  const [options, setOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [customInput, setCustomInput] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchCatalogValues(category).then(opts => {
      if (!mounted) return
      setOptions(opts)
      setLoading(false)
    })
    return () => { mounted = false }
  }, [category])

  const toggle = (item: string) => {
    if (value.includes(item)) onChange(value.filter(v => v !== item))
    else onChange([...value, item])
  }

  const addCustom = () => {
    const v = customInput.trim()
    if (!v) return
    if (value.includes(v)) { setCustomInput(''); return }
    onChange([...value, v])
    setCustomInput('')
  }

  const remove = (item: string) => onChange(value.filter(v => v !== item))

  return (
    <div className="space-y-2">
      {/* Selected values */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(v => (
            <Badge key={v} variant="default" className="text-xs gap-1 pr-1">
              {v}
              <button type="button" onClick={() => remove(v)} className="hover:bg-primary-foreground/20 rounded">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Catalog badges */}
      {loading ? (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading options...
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {options.map(item => {
            const selected = value.includes(item)
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  selected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                )}
              >
                {item}
              </button>
            )
          })}
        </div>
      )}

      {/* Free-text input for custom values */}
      <div className="flex gap-1.5">
        <Input
          type="text"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
          placeholder={placeholder}
          className="h-8 text-sm flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={addCustom} disabled={!customInput.trim()} className="h-8 gap-1">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
    </div>
  )
}

export default AssetMultiSelect
