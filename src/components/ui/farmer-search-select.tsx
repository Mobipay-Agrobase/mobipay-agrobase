'use client'

/**
 * FarmerSearchSelect — searchable farmer picker (combobox).
 *
 * Ekibbo feedback: "Search Button to search for a farmer's name is not included"
 * in the Purchase + Input Distribution forms. A plain <Select> forces officers
 * to scroll through hundreds of farmers. This component renders a Popover +
 * Command (cmdk) combobox that filters by name, farmer code, or phone as you
 * type, and shows the farmer code under each name.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronsUpDown, Loader2, Search, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { safeFetch, extractArray } from '@/lib/safe-fetch'

export interface FarmerOption {
  id: string
  firstName?: string | null
  lastName?: string | null
  name?: string
  farmerCode?: string | null
  phone?: string | null
  district?: string | null
}

export function farmerDisplayName(f: FarmerOption): string {
  if (f.name) return f.name
  return `${f.firstName || ''} ${f.lastName || ''}`.trim() || f.farmerCode || 'Unknown'
}

export function FarmerSearchSelect({
  value,
  onChange,
  placeholder = 'Search farmer by name, code or phone…',
  limit = 500,
  disabled = false,
  allowClear = true,
}: {
  value: string
  onChange: (farmerId: string, farmer?: FarmerOption) => void
  placeholder?: string
  limit?: number
  disabled?: boolean
  allowClear?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [farmers, setFarmers] = useState<FarmerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    safeFetch(`/api/farmers?limit=${limit}`)
      .then(data => {
        const arr = extractArray(data, 'farmers', 'data') as FarmerOption[]
        setFarmers(arr || [])
      })
      .catch(() => setFarmers([]))
      .finally(() => setLoading(false))
  }, [limit])

  const selected = useMemo(() => farmers.find(f => f.id === value), [farmers, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return farmers.slice(0, 100) // cap initial render for performance
    return farmers.filter(f => {
      const name = farmerDisplayName(f).toLowerCase()
      const code = (f.farmerCode || '').toLowerCase()
      const phone = (f.phone || '').toLowerCase()
      return name.includes(q) || code.includes(q) || phone.includes(q)
    }).slice(0, 100)
  }, [farmers, query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-9"
        >
          {selected ? (
            <span className="flex items-center gap-2 min-w-0">
              <UserRound className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{farmerDisplayName(selected)}</span>
              {selected.farmerCode && (
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">({selected.farmerCode})</span>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Search className="w-3.5 h-3.5" />
              {loading ? 'Loading farmers…' : placeholder}
            </span>
          )}
          <span className="flex items-center gap-1 shrink-0">
            {allowClear && selected && (
              <X
                className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground"
                onClick={e => { e.stopPropagation(); onChange('') }}
              />
            )}
            <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Type name, code or phone…"
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading farmers…
              </div>
            ) : filtered.length === 0 ? (
              <CommandEmpty>No farmer matches “{query}”.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map(f => (
                  <CommandItem
                    key={f.id}
                    value={f.id}
                    onSelect={() => {
                      onChange(f.id, f)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{farmerDisplayName(f)}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {f.farmerCode || '—'}{f.phone ? ` · ${f.phone}` : ''}
                      </span>
                    </div>
                    {f.id === value && <span className="ml-auto text-primary">✓</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
