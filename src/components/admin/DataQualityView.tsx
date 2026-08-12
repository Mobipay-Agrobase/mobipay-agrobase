'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Database, AlertCircle, RefreshCw, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Issue {
  key: string
  label: string
  severity: 'high' | 'medium' | 'low'
  count: number
  totalFarmers: number
  data: any[]
}

interface DataQualityResponse {
  totalFarmers: number
  totalIssues: number
  healthScore: number
  issues: Issue[]
}

const SEVERITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}

export default function DataQualityView() {
  const [data, setData] = useState<DataQualityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/data-quality')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => { console.error(e); toast.error('Failed to load data quality report') })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground">Failed to load data quality report.</CardContent></Card>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Database className="w-5 h-5" /> Data Quality &amp; Cleaning</h3>
          <p className="text-sm text-muted-foreground">Detect duplicate records, missing fields, and invalid data</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
      </div>

      {/* Health Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Data Health Score</p>
              <p className={cn('text-4xl font-bold mt-1', data.healthScore >= 80 ? 'text-emerald-600' : data.healthScore >= 50 ? 'text-amber-600' : 'text-red-600')}>
                {data.healthScore}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">{data.totalFarmers} farmers · {data.totalIssues} issues found</p>
            </div>
            <ShieldCheck className={cn('w-16 h-16', data.healthScore >= 80 ? 'text-emerald-500' : data.healthScore >= 50 ? 'text-amber-500' : 'text-red-500')} />
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      <div className="space-y-3">
        {data.issues.map(issue => {
          const isExpanded = expandedKey === issue.key
          if (issue.count === 0) {
            return (
              <Card key={issue.key} className="opacity-60">
                <CardContent className="p-4 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.label}</p>
                    <p className="text-xs text-muted-foreground">No issues — all good</p>
                  </div>
                  <Badge variant="outline" className="text-emerald-600">0</Badge>
                </CardContent>
              </Card>
            )
          }
          return (
            <Card key={issue.key}>
              <CardHeader className="pb-2">
                <button
                  type="button"
                  onClick={() => setExpandedKey(isExpanded ? null : issue.key)}
                  className="flex items-center gap-3 text-left w-full"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <AlertCircle className={cn('w-5 h-5', issue.severity === 'high' ? 'text-red-500' : issue.severity === 'medium' ? 'text-amber-500' : 'text-blue-500')} />
                  <div className="flex-1">
                    <CardTitle className="text-sm">{issue.label}</CardTitle>
                    <CardDescription className="text-xs">{issue.totalFarmers} farmer(s) affected</CardDescription>
                  </div>
                  <Badge className={cn('text-xs', SEVERITY_COLOR[issue.severity])}>{issue.severity}</Badge>
                  <Badge variant="outline">{issue.count}</Badge>
                </button>
              </CardHeader>
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="overflow-x-auto rounded-lg border mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Farmer Code</TableHead>
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs">Phone</TableHead>
                          <TableHead className="text-xs">District</TableHead>
                          <TableHead className="text-xs">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issue.key === 'duplicatePhones' ? (
                          issue.data.map((d: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell colSpan={5} className="bg-muted/30 p-3">
                                <p className="text-xs font-medium">Phone: {d.phone} — {d.count} farmers</p>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {d.farmers.map((f: any) => (
                                    <div key={f.id} className="text-xs border rounded p-2">
                                      <span className="font-mono">{f.farmerCode || '—'}</span> · {f.firstName} {f.lastName} · {f.district || 'NA'}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          issue.data.map((f: any) => (
                            <TableRow key={f.id}>
                              <TableCell className="text-xs font-mono">{f.farmerCode || '—'}</TableCell>
                              <TableCell className="text-xs">{f.firstName} {f.lastName}</TableCell>
                              <TableCell className="text-xs">{f.phone?.startsWith('enc:v1:') ? '(encrypted)' : (f.phone || '—')}</TableCell>
                              <TableCell className="text-xs">{f.district || '—'}</TableCell>
                              <TableCell className="text-xs">{new Date(f.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {issue.count > 50 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">Showing first 50 of {issue.count} issues.</p>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
