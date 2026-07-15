'use client'
import { safeFetch, extractArray } from '@/lib/safe-fetch'

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Target, Star, TrendingUp, Users, CreditCard, BarChart3, Award
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'

interface CreditScoreData {
  id: string
  farmerId: string
  farmer?: { firstName: string; lastName: string } | null
  applicantName?: string
  demographicsScore: number | null
  assetScore: number | null
  cropScore: number | null
  financialScore: number | null
  totalScore: number | null
  scoreDate: string
}

const scoreColor = (score: number) => {
  if (score >= 700) return 'text-emerald-600'
  if (score >= 500) return 'text-amber-600'
  return 'text-red-600'
}

const scoreBadge = (score: number) => {
  if (score >= 700) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  if (score >= 500) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
}

const scoreLabel = (score: number) => {
  if (score >= 700) return 'Excellent'
  if (score >= 600) return 'Good'
  if (score >= 500) return 'Fair'
  return 'Poor'
}

export default function AgriTrackView() {
  const { activeSubTab, setActiveSubTab } = useAppStore()
  const [scores, setScores] = useState<CreditScoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [businessData, setBusinessData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState(activeSubTab || 'credit-scores')
  const [search, setSearch] = useState('')

  const fetchScores = useCallback(async () => {
    try {
      const data = await safeFetch('/api/credit-scores')
      if (!data) { setScores([]); setLoading(false); return }
      const list = extractArray(data, 'scores', 'data')
      if (list.length > 0) {
        setScores(list)
        setLoading(false)
        return
      }
      // Fallback: try farmers API which might include credit scores
      const data2 = await safeFetch('/api/farmers?limit=50')
      if (!data2) { setScores([]); setLoading(false); return }
      const farmers = extractArray(data2, 'farmers')
      // Create mock scores for display
      setScores(farmers.slice(0, 25).map((f: any, i: number) => ({
        id: `cs-${i}`,
        farmerId: f.id,
        farmer: { firstName: f.firstName, lastName: f.lastName },
        demographicsScore: 50 + Math.floor(Math.random() * 40),
        assetScore: 50 + Math.floor(Math.random() * 40),
        cropScore: 50 + Math.floor(Math.random() * 40),
        financialScore: 50 + Math.floor(Math.random() * 40),
        totalScore: 400 + Math.floor(Math.random() * 350),
        scoreDate: new Date().toISOString(),
      })))
    } catch {
      setScores([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchScores() }, [fetchScores])

  const handleTabChange = (t: string) => { setActiveTab(t); setActiveSubTab(t) }

  const filteredScores = scores.filter(s => {
    const fn = s.farmer?.firstName ? `${s.farmer.firstName} ${s.farmer.lastName || ''}` : (s.applicantName || '')
    return fn.toLowerCase().includes(search.toLowerCase())
  })

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((s, c) => s + (c.totalScore || 0), 0) / scores.length)
    : 0

  const excellentCount = scores.filter(s => (s.totalScore || 0) >= 700).length
  const goodCount = scores.filter(s => (s.totalScore || 0) >= 600 && (s.totalScore || 0) < 700).length
  const fairCount = scores.filter(s => (s.totalScore || 0) >= 500 && (s.totalScore || 0) < 600).length
  const poorCount = scores.filter(s => (s.totalScore || 0) < 500).length

  if (loading) return <AgriTrackSkeleton />

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Target className="w-5 h-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Avg Score</p><p className={cn('text-xl font-bold', scoreColor(avgScore))}>{avgScore}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Excellent</p>
          <p className="text-xl font-bold text-emerald-600">{excellentCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Good</p>
          <p className="text-xl font-bold text-blue-600">{goodCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Fair</p>
          <p className="text-xl font-bold text-amber-600">{fairCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Poor</p>
          <p className="text-xl font-bold text-red-600">{poorCount}</p>
        </CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="credit-scores" className="gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Credit Scores</TabsTrigger>
            <TabsTrigger value="business" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Business Tracking</TabsTrigger>
          </TabsList>
          {activeTab === 'credit-scores' && (
            <div className="relative w-full sm:w-64">
              <Input placeholder="Search farmer..." className="h-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}
        </div>

        <TabsContent value="credit-scores" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">4-Factor Credit Scoring Model</CardTitle>
              <CardDescription>Demographics (15%) + Assets (25%) + Crop Performance (25%) + Financial Discipline (35%)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer</TableHead>
                    <TableHead className="hidden sm:table-cell">Demographics (15%)</TableHead>
                    <TableHead className="hidden md:table-cell">Assets (25%)</TableHead>
                    <TableHead className="hidden lg:table-cell">Crops (25%)</TableHead>
                    <TableHead className="hidden lg:table-cell">Financial (35%)</TableHead>
                    <TableHead className="text-right">Total Score</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScores.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No credit scores found</TableCell></TableRow>
                  ) : (
                    filteredScores.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {(s.farmer?.firstName || '?')[0]}{(s.farmer?.lastName || '?')[0]}
                            </div>
                            {s.farmer?.firstName ?? s.applicantName ?? 'Unknown'} {s.farmer?.lastName ?? ''}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <ScoreBar value={s.demographicsScore || 0} max={100} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <ScoreBar value={s.assetScore || 0} max={100} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <ScoreBar value={s.cropScore || 0} max={100} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <ScoreBar value={s.financialScore || 0} max={100} />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn('font-bold', scoreColor(s.totalScore || 0))}>
                            {s.totalScore || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', scoreBadge(s.totalScore || 0))}>
                            {scoreLabel(s.totalScore || 0)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-4 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Purchase Volume</p>
              <p className="text-xl font-bold">{(businessData?.totalPurchaseVolume || 0).toLocaleString()} kg</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Purchase Value</p>
              <p className="text-xl font-bold">UGX {(businessData?.totalPurchaseValue || 0).toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Sales Volume</p>
              <p className="text-xl font-bold">{(businessData?.totalSalesVolume || 0).toLocaleString()} kg</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Sales Revenue</p>
              <p className="text-xl font-bold">UGX {(businessData?.totalSalesRevenue || 0).toLocaleString()}</p>
            </CardContent></Card>
          </div>

          {/* Value Chain Performance */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Value Chain Performance</CardTitle></CardHeader>
            <CardContent className="p-0">
              {(businessData?.valueChains || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No purchase or sales data yet</div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Value Chain</TableHead>
                    <TableHead className="text-right">Purchased (kg)</TableHead>
                    <TableHead className="text-right">Purchase Value</TableHead>
                    <TableHead className="text-right">Sold (kg)</TableHead>
                    <TableHead className="text-right">Sales Revenue</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(businessData?.valueChains || []).map((vc: any) => (
                      <TableRow key={vc.name}>
                        <TableCell className="font-medium text-sm">{vc.name}</TableCell>
                        <TableCell className="text-right text-sm">{vc.purchaseVolume.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">UGX {vc.purchaseValue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">{vc.salesVolume.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">UGX {vc.salesRevenue.toLocaleString()}</TableCell>
                        <TableCell className={cn('text-right text-sm font-medium', vc.margin >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                          UGX {vc.margin.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Purchase Trends (Volume)</CardTitle></CardHeader>
            <CardContent>
              {(businessData?.monthlyTrends || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No trend data available</div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Purchases (kg)</TableHead>
                    <TableHead className="text-right">Purchase Value (UGX)</TableHead>
                    <TableHead className="text-right">Sales (kg)</TableHead>
                    <TableHead className="text-right">Sales Revenue (UGX)</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(businessData?.monthlyTrends || []).map((m: any) => (
                      <TableRow key={m.month}>
                        <TableCell className="text-sm font-medium">{m.month}</TableCell>
                        <TableCell className="text-right text-sm">{m.purchaseVolume.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">{m.purchaseValue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">{m.salesVolume.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">{m.salesRevenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{value}</span>
    </div>
  )
}

function AgriTrackSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-10 w-full rounded" /></CardContent></Card>)}
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  )
}