'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Landmark, Plus, Users, DollarSign, TrendingUp, Download, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { SaccoDetail } from './SaccoDetail'

interface Sacco {
  id: string
  name: string
  district: string | null
  county: string | null
  registrationNo: string | null
  shareValue: number
  minShares: number
  interestRate: number
  maxLoanMultiplier: number
  isActive: boolean
  memberCount: number
  loanCount: number
  meetingCount: number
}

export default function SaccoView() {
  const [saccos, setSaccos] = useState<Sacco[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSacco, setSelectedSacco] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/sacco')
      .then(r => r.json())
      .then(d => setSaccos(d.saccos || []))
      .catch(() => toast.error('Failed to load SACCOs'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Show detail view when a SACCO is selected
  if (selectedSacco) {
    return <SaccoDetail saccoId={selectedSacco} onBack={() => { setSelectedSacco(null); load() }} />
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    )
  }

  const totalMembers = saccos.reduce((s, x) => s + x.memberCount, 0)
  const totalLoans = saccos.reduce((s, x) => s + x.loanCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" />
            SACCO Management
          </h1>
          <p className="text-sm text-muted-foreground">
            {saccos.length} SACCOs · {totalMembers} members · {totalLoans} loans
          </p>
        </div>
        <CreateSaccoDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Landmark className="w-4 h-4" /> Total SACCOs
            </div>
            <div className="text-2xl font-bold mt-1">{saccos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Users className="w-4 h-4" /> Total Members
            </div>
            <div className="text-2xl font-bold mt-1">{totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <DollarSign className="w-4 h-4" /> Active Loans
            </div>
            <div className="text-2xl font-bold mt-1">{totalLoans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <MapPin className="w-4 h-4" /> Districts
            </div>
            <div className="text-2xl font-bold mt-1">{new Set(saccos.map(s => s.district).filter(Boolean)).size}</div>
          </CardContent>
        </Card>
      </div>

      {/* SACCO Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {saccos.map(sacco => (
          <Card key={sacco.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{sacco.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sacco.district || 'No district'} · {sacco.registrationNo || 'No reg. no.'}
                  </p>
                </div>
                <Badge variant={sacco.isActive ? 'default' : 'secondary'} className="text-[10px]">
                  {sacco.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold">{sacco.memberCount}</div>
                  <div className="text-[10px] text-muted-foreground">Members</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{sacco.loanCount}</div>
                  <div className="text-[10px] text-muted-foreground">Loans</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{sacco.meetingCount}</div>
                  <div className="text-[10px] text-muted-foreground">Meetings</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>Share: UGX {sacco.shareValue.toLocaleString()}</span>
                <span>Rate: {sacco.interestRate}%</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`/api/sacco/reports?saccoId=${sacco.id}&type=summary&format=csv`, '_blank')}
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Report
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedSacco(sacco.id)}
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {saccos.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No SACCOs found. Create one to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CreateSaccoDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [district, setDistrict] = useState('Abim')
  const [shareValue, setShareValue] = useState(10000)
  const [interestRate, setInterestRate] = useState(12)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!name) { toast.error('Name is required'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/sacco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, district, shareValue, interestRate }),
      })
      if (res.ok) {
        toast.success(`SACCO "${name}" created`)
        setName('')
        setShareValue(10000)
        setInterestRate(12)
        onOpenChange(false)
        onCreated()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to create SACCO')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> New SACCO</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New SACCO</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>SACCO Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Abim Farmers SACCO" />
          </div>
          <div className="space-y-2">
            <Label>District</Label>
            <select value={district} onChange={e => setDistrict(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              <option value="Abim">Abim</option>
              <option value="Kotido">Kotido</option>
              <option value="Karenga">Karenga</option>
              <option value="Kaabong">Kaabong</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Share Value (UGX)</Label>
              <Input type="number" value={shareValue} onChange={e => setShareValue(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Interest Rate (% p.a.)</Label>
              <Input type="number" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !name}>
            {submitting ? 'Creating...' : 'Create SACCO'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
