'use client'

/**
 * Support Tickets View
 * ────────────────────
 * - Tenants: see their own tickets, can create new
 * - MOBIPAY_FINANCE / SUPER_ADMIN: see all tickets, can assign + reply
 */

import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import {
  MessageSquare, Plus, RefreshCw, Loader2, Send, Clock,
  CheckCircle, AlertCircle, User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { toast } from 'sonner'

const CATEGORY_COLORS: Record<string, string> = {
  BILLING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PAYMENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  TECHNICAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  GENERAL: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  RESOLVED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  CLOSED: 'bg-gray-100 text-gray-500',
}

export default function SupportTicketsView() {
  const { user } = useAppStore()
  const isInternalStaff = user?.role === 'SUPER_ADMIN' || user?.role === 'MOBIPAY_FINANCE'

  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [reply, setReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  // Create form
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('BILLING')
  const [priority, setPriority] = useState('NORMAL')
  const [creating, setCreating] = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/support/tickets')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch {
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const handleCreate = async () => {
    if (!subject || !message) {
      toast.error('Subject and message are required')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, category, priority }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Ticket created')
      setShowCreate(false)
      setSubject(''); setMessage('')
      fetchTickets()
    } catch {
      toast.error('Failed to create ticket')
    } finally {
      setCreating(false)
    }
  }

  const handleReply = async () => {
    if (!reply || !selectedTicket) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      })
      if (!res.ok) throw new Error('Failed')
      setReply('')
      // Refresh ticket detail
      const detailRes = await fetch(`/api/support/tickets/${selectedTicket.id}`)
      if (detailRes.ok) {
        const data = await detailRes.json()
        setSelectedTicket(data.ticket)
      }
      fetchTickets()
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      toast.success(`Ticket marked as ${status}`)
      fetchTickets()
    } catch {
      toast.error('Failed to update status')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Support Tickets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isInternalStaff ? 'All tenant support tickets — respond and resolve' : 'Your support tickets — billing, payments, technical issues'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTickets}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          {!isInternalStaff && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> New Ticket
            </Button>
          )}
        </div>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{isInternalStaff ? 'No support tickets from tenants' : 'No support tickets'}</p>
            <p className="text-sm mt-1">{isInternalStaff ? 'Tenant tickets will appear here.' : 'Create a ticket if you have a billing or technical issue.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTicket(t)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn('text-[10px]', CATEGORY_COLORS[t.category] || CATEGORY_COLORS.GENERAL)}>
                        {t.category}
                      </Badge>
                      <Badge className={cn('text-[10px]', STATUS_COLORS[t.status] || STATUS_COLORS.OPEN)}>
                        {t.status.replace(/_/g, ' ')}
                      </Badge>
                      {t.priority === 'HIGH' || t.priority === 'URGENT' ? (
                        <Badge variant="destructive" className="text-[10px]">{t.priority}</Badge>
                      ) : null}
                    </div>
                    <p className="font-medium text-sm truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{t.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{t.tenant?.name}</span>
                      <span>·</span>
                      <span>{t._count?.replies || 0} replies</span>
                      <span>·</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of the issue" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BILLING">Billing</SelectItem>
                    <SelectItem value="PAYMENT">Payment</SelectItem>
                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
                placeholder="Describe the issue in detail..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(o) => !o && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn('text-[10px]', CATEGORY_COLORS[selectedTicket.category])}>{selectedTicket.category}</Badge>
                  <Badge className={cn('text-[10px]', STATUS_COLORS[selectedTicket.status])}>{selectedTicket.status.replace(/_/g, ' ')}</Badge>
                  {isInternalStaff && (
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}
                    >
                      <SelectTrigger className="h-7 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Original message */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    {selectedTicket.createdBy?.firstName} {selectedTicket.createdBy?.lastName} · {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm">{selectedTicket.message}</p>
                </div>

                {/* Replies */}
                {(selectedTicket.replies || []).map((r: any) => (
                  <div key={r.id} className={cn(
                    'p-3 rounded-lg',
                    r.fromRole === 'MOBIPAY_FINANCE' || r.fromRole === 'SUPER_ADMIN'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 ml-8'
                      : 'bg-muted/50 mr-8'
                  )}>
                    <p className="text-xs text-muted-foreground mb-1">
                      {r.fromUser?.firstName} {r.fromUser?.lastName} ({r.fromRole}) · {new Date(r.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm">{r.message}</p>
                  </div>
                ))}

                {/* Reply input */}
                <div className="space-y-2 pt-2 border-t">
                  <Label>Reply</Label>
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3}
                    placeholder="Type your reply..." />
                  <Button size="sm" onClick={handleReply} disabled={sendingReply || !reply}>
                    {sendingReply ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                    Send Reply
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
