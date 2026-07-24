'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PiggyBank, TrendingUp, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'

/**
 * VSLA Credit Profile Widget
 * Embed in the Farmer Profile page to show VSLA repayment history + credit score.
 * Links the farmer to their VSLA V2 record by phone number.
 */

interface VslaCreditProfileProps {
  phone: string
}

export function VslaCreditProfile({ phone }: VslaCreditProfileProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/vsla-v2/credit-profile/${encodeURIComponent(phone)}`)
        const d = await res.json()
        setData(d)
      } catch {
        setData({ found: false })
      } finally {
        setLoading(false)
      }
    }
    if (phone) load()
  }, [phone])

  if (loading) return <Skeleton className="h-48 rounded-xl" />

  if (!data?.found) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          <PiggyBank className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Not enrolled in any VSLA group
        </CardContent>
      </Card>
    )
  }

  const m = data.member
  const c = data.creditMetrics
  const scoreColor = c.vslaCreditScore >= 75 ? 'text-emerald-600' : c.vslaCreditScore >= 50 ? 'text-amber-600' : 'text-red-600'
  const riskColor = c.riskCategory === 'LOW' ? 'bg-emerald-100 text-emerald-700' : c.riskCategory === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-emerald-600" />
          VSLA Credit Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Member Info */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="font-medium">{m.fullName}</span>
            <span className="text-muted-foreground ml-2 font-mono text-xs">{m.memberId}</span>
          </div>
          <Badge variant="outline">{m.group}</Badge>
        </div>

        {/* Credit Score */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">VSLA Credit Score</p>
            <p className={`text-2xl font-bold ${scoreColor}`}>{c.vslaCreditScore}</p>
            <p className="text-xs text-muted-foreground">/ 100</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Risk Category</p>
            <Badge className={riskColor + ' mt-1'}>{c.riskCategory}</Badge>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <CheckCircle className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
            <p className="font-bold">{c.repaymentRate}%</p>
            <p className="text-muted-foreground">Repayment</p>
          </div>
          <div className="text-center">
            <CheckCircle className="w-4 h-4 mx-auto text-blue-500 mb-1" />
            <p className="font-bold">{c.onTimeRate}%</p>
            <p className="text-muted-foreground">On-time</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-purple-500 mb-1" />
            <p className="font-bold">{c.attendanceRate}%</p>
            <p className="text-muted-foreground">Attendance</p>
          </div>
          <div className="text-center">
            <DollarSign className="w-4 h-4 mx-auto text-amber-500 mb-1" />
            <p className="font-bold">{c.totalLoans}</p>
            <p className="text-muted-foreground">Total Loans</p>
          </div>
        </div>

        {/* Savings & Shares */}
        <div className="grid grid-cols-3 gap-2 text-xs border-t pt-3">
          <div>
            <p className="text-muted-foreground">Savings</p>
            <p className="font-bold">UGX {m.totalSavings.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Shares</p>
            <p className="font-bold">{m.totalShares}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Max Loan Eligible</p>
            <p className="font-bold">UGX {m.maxLoanEligible.toLocaleString()}</p>
          </div>
        </div>

        {/* Active Loans */}
        {c.activeLoans > 0 && (
          <div className="flex items-center gap-2 text-xs p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span className="text-amber-800 dark:text-amber-200">
              {c.activeLoans} active loan(s) — UGX {c.totalOutstanding.toLocaleString()} outstanding
            </span>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="space-y-1 text-xs border-t pt-2">
            {data.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{rec}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
