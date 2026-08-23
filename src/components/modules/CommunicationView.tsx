'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  MessageSquare, Send, Inbox, Radio, Mail, Phone, Smartphone,
  Plus, Search, Users, Megaphone, FileText, Loader2, Clock, AlertCircle, Trash2
} from 'lucide-react'
import { safeFetch, extractArray } from '@/lib/safe-fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, EyeOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

const msgStatusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const msgTypeColor: Record<string, string> = {
  SMS: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  EMAIL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  IVR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

// (Mock messages removed — UI now shows a real empty state when the API has no messages.)

export default function CommunicationView() {
  const { activeSubTab, setActiveSubTab } = useAppStore()
  const [activeTab, setActiveTab] = useState(activeSubTab || 'compose')
  const [showCompose, setShowCompose] = useState(true)
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [channel, setChannel] = useState('SMS')
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const handleTabChange = (t: string) => { setActiveTab(t); setActiveSubTab(t) }

  const fetchMessages = useCallback(async () => {
    const data = await safeFetch('/api/messages')
    const arr = extractArray(data, 'data', 'messages')
    setMessages(arr.map((m: any) => ({
      id: m.id,
      type: m.type || 'SMS',
      recipient: m.recipient || '',
      content: m.content || '',
      status: m.status || 'PENDING',
      sentAt: m.sentAt || m.createdAt || new Date().toISOString(),
    })))
  }, [])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipient.trim() || !body.trim()) {
      toast.error('Recipient and message are required')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, recipient, subject, body, type: channel, content: body }),
      })
      if (!res.ok) throw new Error('Failed to send')
      toast.success('Message sent successfully')
      setRecipient(''); setSubject(''); setBody('')
      fetchMessages()
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Message deleted')
      fetchMessages()
    } catch {
      toast.error('Failed to delete message')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center"><Send className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground">Total Sent</p><p className="text-xl font-bold">{messages.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center"><Inbox className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-xs text-muted-foreground">Delivered</p><p className="text-xl font-bold">{messages.filter(m => m.status === 'DELIVERED').length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold">{messages.filter(m => m.status === 'PENDING').length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div>
          <div><p className="text-xs text-muted-foreground">Failed</p><p className="text-xl font-bold">{messages.filter(m => m.status === 'FAILED').length}</p></div>
        </CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose" className="gap-1.5"><Send className="w-3.5 h-3.5" /> Compose</TabsTrigger>
          <TabsTrigger value="outbox" className="gap-1.5"><Inbox className="w-3.5 h-3.5" /> Outbox</TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-1.5"><Megaphone className="w-3.5 h-3.5" /> Price Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Compose Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Channel</Label>
                    <Select value={channel} onValueChange={setChannel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="IVR">IVR Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Recipient</Label>
                    <Input placeholder="Phone number or email..." value={recipient} onChange={e => setRecipient(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input placeholder="Subject (optional)..." value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea rows={4} placeholder="Type your message here..." value={body} onChange={e => setBody(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={sending} className="gap-2">
                    {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Send className="w-4 h-4" /> Send Message
                  </Button>
                  <Button type="button" variant="outline" onClick={() => toast.info('Template selector — Coming soon')}>
                    <FileText className="w-4 h-4 mr-1" /> Use Template
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outbox" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead className="hidden md:table-cell">Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12">
                        <div className="text-center">
                          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40 text-muted-foreground" />
                          <p className="font-medium">No messages sent yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Use the form above to send your first message.</p>
                          <Button variant="outline" className="mt-4 gap-2" onClick={() => handleTabChange('compose')}>
                            <Send className="w-4 h-4" /> Go to Compose
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : messages.map(m => (
                    <TableRow key={m.id}>
                      <TableCell><Badge className={cn('text-[10px]', msgTypeColor[m.type] || '')}>{m.type}</Badge></TableCell>
                      <TableCell className="font-medium text-sm">{m.recipient}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[250px] truncate">{m.content}</TableCell>
                      <TableCell><Badge className={cn('text-[10px]', msgStatusColor[m.status] || '')}>{m.status}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{new Date(m.sentAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(m.id)} title="Delete message">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="mt-4">
          <PriceAlertBroadcast />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Price Alert Broadcast (Ekibbo: send farmers SMS about prices) ─────

const PRICE_COMMODITIES = ['Coffee', 'Cocoa', 'Vanilla', 'Cassava', 'Avocado', 'Jackfruit']
const PRICE_FORMS = ['Fresh Cherry', 'Wet Parchment', 'Dry Parchment', 'Green Beans', 'Wet Beans', 'Dry Beans', 'Fresh Fruit', 'Fresh Tubers']

function PriceAlertBroadcast() {
  const [commodity, setCommodity] = useState('Coffee')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('kg')
  const [form, setForm] = useState('')
  const [audience, setAudience] = useState('ALL')
  const [district, setDistrict] = useState('')
  const [groupId, setGroupId] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [preview, setPreview] = useState<any>(null)
  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    safeFetch('/api/farmer-groups?limit=200').then(d => {
      const arr = extractArray(d, 'data', 'groups')
      setGroups(arr.map((g: any) => ({ id: g.id, name: g.name })))
    }).catch(() => {})
  }, [])

  const buildPayload = (dryRun: boolean) => ({
    commodity,
    price: Number(price),
    unit,
    form: form || undefined,
    customMessage: customMessage || undefined,
    district: audience === 'DISTRICT' ? district : undefined,
    groupId: audience === 'GROUP' ? groupId : undefined,
    dryRun,
  })

  const handlePreview = async () => {
    if (!price || Number(price) <= 0) { toast.error('Enter a valid price'); return }
    if (audience === 'DISTRICT' && !district) { toast.error('Enter a district to filter by'); return }
    if (audience === 'GROUP' && !groupId) { toast.error('Select a farmer group'); return }
    setPreviewing(true)
    setResult(null)
    try {
      const res = await fetch('/api/communication/price-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(true)),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Preview failed')
      setPreview(data)
    } catch (e: any) {
      toast.error(e.message || 'Preview failed')
    } finally {
      setPreviewing(false)
    }
  }

  const handleSend = async () => {
    if (!price || Number(price) <= 0) { toast.error('Enter a valid price'); return }
    if (!confirm(`Send this price alert SMS to ${preview?.total ?? 'all'} farmers? Standard SMS rates apply.`)) return
    setSending(true)
    try {
      const res = await fetch('/api/communication/price-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(false)),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setResult(data)
      setPreview(null)
      toast.success(`Price alert sent to ${data.sent} farmer${data.sent === 1 ? '' : 's'}`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to send price alerts')
    } finally {
      setSending(false)
    }
  }

  const defaultMessage = `PRICE ALERT: ${commodity}${form ? ` (${form})` : ''} is now UGX ${Number(price || 0).toLocaleString()} per ${unit}. Bring your produce to the nearest collection point. — Ekibbo`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" /> SMS Price Alert</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Commodity *</Label>
              <Select value={commodity} onValueChange={setCommodity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRICE_COMMODITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Price (UGX) *</Label>
              <Input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 1500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['kg', 'bag', 'bunch'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Form</Label>
              <Select value={form} onValueChange={setForm}>
                <SelectTrigger><SelectValue placeholder="Any form" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any form</SelectItem>
                  {PRICE_FORMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
 <Label>Audience</Label>
            <Select value={audience} onValueChange={v => { setAudience(v); setPreview(null) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All active farmers</SelectItem>
                <SelectItem value="DISTRICT">By district</SelectItem>
                <SelectItem value="GROUP">By farmer group</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {audience === 'DISTRICT' && (
            <div className="space-y-1.5">
              <Label>District</Label>
              <Input value={district} onChange={e => { setDistrict(e.target.value); setPreview(null) }} placeholder="e.g. Mukono" />
            </div>
          )}
          {audience === 'GROUP' && (
            <div className="space-y-1.5">
              <Label>Farmer Group</Label>
              <Select value={groupId} onValueChange={v => { setGroupId(v); setPreview(null) }}>
                <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Custom message <span className="text-muted-foreground font-normal">(optional — tokens: {'{commodity}'} {'{price}'} {'{form}'})</span></Label>
            <Textarea
              rows={3}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder={`Leave empty to use the default: ${defaultMessage.slice(0, 60)}…`}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border">
            <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Preview</p>
            <p className="text-sm">{customMessage || defaultMessage}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{120}–160 chars per SMS · sent via Africa's Talking / Twilio</p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="gap-2" onClick={handlePreview} disabled={previewing || sending}>
              {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />} Check Recipients
            </Button>
            <Button type="button" className="gap-2" onClick={handleSend} disabled={sending || previewing}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Price Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {preview && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Recipients Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm"><span className="font-bold text-xl">{preview.total}</span> active farmer{preview.total === 1 ? '' : 's'} will receive this SMS</p>
              {preview.sample?.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Sample:</p>
                  {preview.sample.map((s: any, i: number) => (
                    <p key={i}>{s.name} · {s.phone}</p>
                  ))}
                  {preview.total > 5 && <p>… and {preview.total - 5} more</p>}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {result && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><EyeOff className="w-4 h-4 text-primary" /> Send Result</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Sent: <span className="font-bold text-emerald-600">{result.sent}</span></p>
              <p>Failed: <span className="font-bold text-red-600">{result.failed}</span></p>
              <p className="text-xs text-muted-foreground">Message: {result.message}</p>
            </CardContent>
          </Card>
        )}
        {!preview && !result && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Price Alerts via SMS</p>
              <p className="text-sm mt-1 max-w-sm mx-auto">Set today's price and broadcast it to farmers by SMS — all farmers, one district, or a farmer group. Use “Check Recipients” to preview the audience before sending.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

