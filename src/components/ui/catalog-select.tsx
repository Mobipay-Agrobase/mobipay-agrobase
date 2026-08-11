'use client'

import { useEffect, useState, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

// Cache catalog values across the session — multiple selects for the same
// category will reuse the cached promise instead of refetching.
const catalogCache = new Map<string, Promise<Array<{ id: string; value: string; label: string | null }>>>()

async function fetchCatalog(category: string) {
  if (catalogCache.has(category)) return catalogCache.get(category)!
  const p = fetch(`/api/catalog?category=${encodeURIComponent(category)}`)
    .then(r => r.json())
    .then(d => (d.catalog || []) as Array<{ id: string; value: string; label: string | null }>)
    .catch(() => [] as Array<{ id: string; value: string; label: string | null }>)
  catalogCache.set(category, p)
  return p
}

interface CatalogSelectProps {
  category: string
  value: string
  onValueChange: (v: string) => void
  placeholder?: string
  className?: string
  /** Optional hardcoded fallback options used if the catalog API fails */
  fallbackOptions?: string[]
  allowCustom?: boolean  // when true, includes a "Custom..." option that triggers free-text input
  disabled?: boolean
}

/** Remove options that share a value, keeping the first occurrence. Catalog
 * values are effectively unique dropdown entries; duplicates cause React
 * "two children with the same key" warnings and broken option selection. */
function dedupe(items: Array<{ value: string; label: string | null }>): Array<{ value: string; label: string | null }> {
  const seen = new Set<string>()
  return items.filter(i => {
    const v = (i.value || '').trim()
    if (!v || seen.has(v)) return false
    seen.add(v)
    return true
  })
}

export function CatalogSelect({
  category,
  value,
  onValueChange,
  placeholder = 'Select...',
  className,
  fallbackOptions = [],
  disabled = false,
}: CatalogSelectProps) {
  const [items, setItems] = useState<Array<{ value: string; label: string | null }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchCatalog(category).then(opts => {
      if (!mounted) return
      if (opts.length === 0 && fallbackOptions.length > 0) {
        setItems(dedupe(fallbackOptions.map(v => ({ value: v, label: null }))))
      } else {
        setItems(dedupe(opts))
      }
      setLoading(false)
    })
    return () => { mounted = false }
  }, [category])

  // If the current value isn't in the catalog, still show it as the selected label
  const displayLabel = useMemo(() => {
    if (!value) return ''
    const match = items.find(i => i.value === value)
    return match ? (match.label || match.value) : value
  }, [value, items])

  if (loading) {
    return (
      <Select disabled value="" onValueChange={() => {}}>
        <SelectTrigger className={className} disabled>
          <SelectValue>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading...
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
    )
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {displayLabel || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {items.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No options configured. Add values in Catalog Master.
          </div>
        ) : (
          items.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label || opt.value}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

/**
 * Convenience hook for components that need raw catalog values (e.g. for
 * checkboxes / chips) instead of a Select dropdown.
 */
export function useCatalogValues(category: string) {
  const [values, setValues] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetchCatalog(category).then(opts => {
      if (!mounted) return
      setValues(opts.map(o => o.value))
      setLoading(false)
    })
    return () => { mounted = false }
  }, [category])

  return { values, loading }
}
