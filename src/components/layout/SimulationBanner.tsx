'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Eye, AlertTriangle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import type { SimulationStatus } from '@/hooks/use-simulation-status'

interface Props {
  status: SimulationStatus
  onExited: () => void
}

/**
 * SimulationBanner — yellow warning banner shown at the top of the page when
 * a SUPER_ADMIN is simulating a tenant. Includes:
 *   - Tenant name + type
 *   - "Read-only simulation" tag
 *   - Remaining time
 *   - Exit Simulation button
 *
 * The banner is rendered inside AuthenticatedApp (above TopBar) so it is
 * always visible while simulating.
 */
export function SimulationBanner({ status, onExited }: Props) {
  const [exiting, setExiting] = useState(false)

  if (!status.simulating) return null

  const exit = async () => {
    setExiting(true)
    try {
      const res = await fetch('/api/admin/simulate/stop', {
        method: 'POST',
        credentials: 'same-origin',
      })
      if (res.ok) {
        toast.success('Exited tenant simulation')
        onExited()
      } else {
        toast.error('Failed to exit simulation')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setExiting(false)
    }
  }

  const remainingMin = status.remainingSeconds
    ? Math.floor(status.remainingSeconds / 60)
    : 0

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 px-4 py-2 flex items-center gap-3 text-amber-900 dark:text-amber-100">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <Eye className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap text-sm">
        <span className="font-semibold">Tenant Simulation Active</span>
        <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100">
          {status.tenantName}
        </Badge>
        <span className="text-amber-700 dark:text-amber-300 text-xs">· {status.tenantType}</span>
        {remainingMin > 0 && (
          <span className="text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1 ml-2">
            <Clock className="w-3 h-3" /> {remainingMin}m remaining
          </span>
        )}
        <span className="text-amber-700 dark:text-amber-300 text-xs ml-2 hidden sm:inline">
          All actions are scoped to this tenant and audit-logged.
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-8 bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 dark:bg-amber-900/60 dark:hover:bg-amber-900 dark:border-amber-800 dark:text-amber-100 gap-1.5"
        onClick={exit}
        disabled={exiting}
      >
        <LogOut className="w-3.5 h-3.5" />
        {exiting ? 'Exiting...' : 'Exit Simulation'}
      </Button>
    </div>
  )
}
