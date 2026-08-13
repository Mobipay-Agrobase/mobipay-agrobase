import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Tone = 'emerald' | 'blue' | 'amber' | 'purple' | 'red' | 'cyan' | 'green' | 'orange' | 'slate' | 'rose'

const TONES: Record<Tone, { square: string; icon: string }> = {
  emerald: { square: 'bg-emerald-50 dark:bg-emerald-950/40', icon: 'text-emerald-600' },
  blue: { square: 'bg-blue-50 dark:bg-blue-950/40', icon: 'text-blue-600' },
  amber: { square: 'bg-amber-50 dark:bg-amber-950/40', icon: 'text-amber-600' },
  purple: { square: 'bg-purple-50 dark:bg-purple-950/40', icon: 'text-purple-600' },
  red: { square: 'bg-red-50 dark:bg-red-950/40', icon: 'text-red-600' },
  green: { square: 'bg-green-50 dark:bg-green-950/40', icon: 'text-green-600' },
  cyan: { square: 'bg-cyan-50 dark:bg-cyan-950/40', icon: 'text-cyan-600' },
  orange: { square: 'bg-orange-50 dark:bg-orange-950/40', icon: 'text-orange-600' },
  slate: { square: 'bg-slate-50 dark:bg-slate-950/40', icon: 'text-slate-600' },
  rose: { square: 'bg-rose-50 dark:bg-rose-950/40', icon: 'text-rose-600' },
}

interface StatCardProps {
  icon: ReactNode
  label: string
  value: ReactNode
  tone?: Tone
  hint?: string
}

export function StatCard({ icon, label, value, tone = 'emerald', hint }: StatCardProps) {
  const t = TONES[tone]
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', t.square)}>
          <span className={cn('w-5 h-5', t.icon)}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold truncate">{value}</p>
          {hint && <p className="text-[10px] text-muted-foreground truncate">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export function StatCardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>{children}</div>
}