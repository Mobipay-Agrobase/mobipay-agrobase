'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Send, RotateCcw, Phone } from 'lucide-react'

/**
 * USSD Simulator — simulates a feature phone dialing the VSLA USSD code.
 * Lets you test the full USSD flow from the web without a real phone.
 * 
 * Flow: Member dials *284*97# → enters Member ID → PIN → menu → actions
 */

interface UssdScreen {
  text: string
  type: 'CON' | 'END'
}

export function UssdSimulatorView() {
  const [active, setActive] = useState(false)
  const [sessionId] = useState(() => `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
  const [phone, setPhone] = useState('+256700100001')
  const [screens, setScreens] = useState<UssdScreen[]>([])
  const [input, setInput] = useState('')
  const [allInputs, setAllInputs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const screenEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    screenEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [screens])

  const startSession = async () => {
    setActive(true)
    setScreens([])
    setAllInputs([])
    setInput('')
    await sendUssd('')
  }

  const sendUssd = async (currentInput: string) => {
    setLoading(true)
    try {
      const newInputs = currentInput ? [...allInputs, currentInput] : allInputs
      const text = newInputs.join('*')

      const formData = new FormData()
      formData.append('sessionId', sessionId)
      formData.append('phoneNumber', phone)
      formData.append('serviceCode', '*284*97#')
      formData.append('text', text)

      const res = await fetch('/api/ussd/vsla', {
        method: 'POST',
        body: formData,
      })

      const responseText = await res.text()
      const type: 'CON' | 'END' = responseText.startsWith('CON') ? 'CON' : 'END'
      const screenText = responseText.replace(/^(CON|END)\s*/, '')

      setScreens(prev => [...prev, { text: screenText, type }])
      setAllInputs(newInputs)
      setInput('')

      if (type === 'END') {
        setActive(false)
      }
    } catch (e) {
      setScreens(prev => [...prev, { text: 'Error: Could not connect to USSD service', type: 'END' }])
      setActive(false)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setActive(false)
    setScreens([])
    setAllInputs([])
    setInput('')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phone Simulator */}
        <Card className="max-w-sm mx-auto">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              USSD Phone Simulator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Phone number input */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+256..."
                disabled={active}
                className="text-sm"
              />
            </div>

            {/* Dial button */}
            {!active && screens.length === 0 && (
              <Button
                onClick={startSession}
                className="w-full gap-2"
                disabled={loading}
              >
                <Phone className="w-4 h-4" /> Dial *284*97#
              </Button>
            )}

            {/* USSD Screen */}
            {screens.length > 0 && (
              <div className="space-y-2">
                {/* Show conversation history */}
                {screens.map((screen, i) => (
                  <div key={i} className="space-y-1">
                    {/* User input (if any) */}
                    {i > 0 && allInputs[i - 1] && (
                      <div className="flex justify-end">
                        <div className="bg-emerald-100 dark:bg-emerald-950/40 rounded-lg px-3 py-1.5 text-xs max-w-[80%]">
                          {allInputs[i - 1]}
                        </div>
                      </div>
                    )}
                    {/* USSD response */}
                    <div className={`rounded-lg p-3 text-sm font-mono whitespace-pre-wrap ${
                      screen.type === 'END'
                        ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                        : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                    }`}>
                      <Badge variant="outline" className="mb-1 text-[10px]">
                        {screen.type === 'END' ? 'SESSION END' : 'USSD'}
                      </Badge>
                      <pre className="whitespace-pre-wrap font-sans text-sm">{screen.text}</pre>
                    </div>
                  </div>
                ))}
                <div ref={screenEndRef} />

                {/* Input field */}
                {active && screens[screens.length - 1]?.type === 'CON' && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && input && !loading) {
                          sendUssd(input)
                        }
                      }}
                      placeholder="Enter your choice..."
                      disabled={loading}
                      className="text-sm"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      onClick={() => input && sendUssd(input)}
                      disabled={loading || !input}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Reset button */}
            {screens.length > 0 && !active && (
              <Button onClick={reset} variant="outline" className="w-full gap-2 text-sm">
                <RotateCcw className="w-3 h-3" /> New Session
              </Button>
            )}

            {loading && (
              <div className="text-center text-xs text-muted-foreground">Processing...</div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How to Test USSD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Test Members</h4>
              <p>Use these seeded VSLA members to test:</p>
              <div className="mt-2 space-y-1 text-xs font-mono bg-muted/50 rounded p-2">
                <div>Phone: +256700100001 | ID: VSLA-MBR-0001 | PIN: 1000</div>
                <div>Phone: +256700100002 | ID: VSLA-MBR-0002 | PIN: 1001</div>
                <div>Phone: +256700100003 | ID: VSLA-MBR-0003 | PIN: 1002</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-1">Menu Flow</h4>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Dial *284*97# (click "Dial" button)</li>
                <li>Enter your Member ID (e.g. VSLA-MBR-0001)</li>
                <li>Enter your 4-digit PIN (e.g. 1000)</li>
                <li>Choose from the main menu:
                  <ul className="list-none ml-4 mt-1 space-y-0.5">
                    <li>1 — Check savings balance</li>
                    <li>2 — View active loans</li>
                    <li>3 — Apply for a new loan</li>
                    <li>4 — View next meeting</li>
                    <li>5 — Repay a loan</li>
                    <li>0 — Exit</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-1">Africa's Talking Setup</h4>
              <p className="text-xs">
                To go live, configure your Africa's Talking USSD:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs mt-1">
                <li>Go to AT Dashboard → USSD → Create Channel</li>
                <li>Set callback URL: <code className="bg-muted px-1 rounded">https://your-domain.vercel.app/api/ussd/vsla</code></li>
                <li>Set USSD code: *284*97# (or your assigned code)</li>
                <li>Test by dialing from a real phone</li>
              </ol>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> The USSD endpoint is public (no auth required) — it authenticates 
                members via Member ID + PIN, not NextAuth. This is intentional — feature phone users 
                can't use web sessions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
