'use client'

/**
 * EkbStepper — horizontal step-by-step timeline used on detail pages
 * (payment / order / repayment lifecycles). Ekibbo requirement: "payment,
 * timeline (step by step design) should be implemented in the detail pages".
 */

import React from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepDef {
  key: string
  label: string
  /** date/actor sub-caption shown under the label */
  caption?: string
  state: 'done' | 'current' | 'pending' | 'rejected'
}

export function EkbStepper({ steps }: { steps: StepDef[] }) {
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-start min-w-[640px]">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            {/* Node + label column */}
            <div className="flex flex-col items-center w-32 shrink-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold shrink-0',
                  s.state === 'done' && 'bg-emerald-600 border-emerald-600 text-white',
                  s.state === 'current' && 'bg-primary/10 border-primary text-primary',
                  s.state === 'rejected' && 'bg-red-600 border-red-600 text-white',
                  s.state === 'pending' && 'bg-muted border-border text-muted-foreground',
                )}
              >
                {s.state === 'done' ? (
                  <Check className="w-4 h-4" />
                ) : s.state === 'rejected' ? (
                  <X className="w-4 h-4" />
                ) : s.state === 'current' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <p
                className={cn(
                  'text-xs font-medium mt-1.5 text-center',
                  s.state === 'pending' ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {s.label}
              </p>
              {s.caption && (
                <p className="text-[10px] text-muted-foreground text-center leading-tight mt-0.5">{s.caption}</p>
              )}
            </div>
            {/* Connector */}
            {i < steps.length - 1 && (
              <div className="flex-1 pt-4 px-0.5">
                <div
                  className={cn(
                    'h-0.5 rounded-full',
                    s.state === 'done' ? 'bg-emerald-600' : 'bg-border',
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

/** Vertical timeline row for event history (ledger, trace events). */
export function EkbTimelineRow({
  icon, title, subtitle, right, last,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
  right?: React.ReactNode
  last?: boolean
}) {
  const Icon = icon
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        {!last && <div className="w-0.5 flex-1 bg-border" />}
      </div>
      <div className="flex-1 pb-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 break-words">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0 text-xs text-muted-foreground">{right}</div>}
        </div>
      </div>
    </div>
  )
}
