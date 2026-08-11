'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Loader2, Leaf, Eye, EyeOff, Sprout, Globe, Coins, ChevronDown, Shield, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useLanguage, LANGUAGES } from '@/lib/i18n'
import { useCurrency } from '@/lib/currency'

const CURRENCIES = [
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
]

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null)
  const { language, setLanguage } = useLanguage()
  const { currency, setCurrency } = useCurrency()

  // ─── 2FA State ───
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    if (lockoutUntil && new Date() < lockoutUntil) {
      const secondsLeft = Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000)
      toast.error(`Too many attempts. Please wait ${secondsLeft}s before trying again.`)
      return
    }

    setLoading(true)
    try {
      // ─── Step 1: Check credentials + 2FA status ───
      const checkRes = await fetch('/api/auth/2fa/login-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!checkRes.ok) {
        const newAttempts = loginAttempts + 1
        setLoginAttempts(newAttempts)
        if (newAttempts >= 5) {
          const lockUntil = new Date(Date.now() + 60 * 1000)
          setLockoutUntil(lockUntil)
          setLoginAttempts(0)
          toast.error('Too many failed attempts. Account locked for 60 seconds.')
        } else {
          toast.error(`Invalid credentials. ${5 - newAttempts} attempt(s) remaining.`)
        }
        setLoading(false)
        return
      }

      const checkData = await checkRes.json()

      // ─── If 2FA required, show 2FA step ───
      if (checkData.twoFactorRequired) {
        setChallengeToken(checkData.challengeToken)
        setTwoFactorRequired(true)
        toast.info('Enter your 2FA verification code')
        setLoading(false)
        return
      }

      // ─── No 2FA — proceed with NextAuth signin ───
      await completeNextAuthSignIn()
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 2: Verify 2FA code ───
  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challengeToken) {
      toast.error('Session expired. Please log in again.')
      setTwoFactorRequired(false)
      setChallengeToken(null)
      return
    }
    if (!useBackupCode && totpCode.length !== 6) {
      toast.error('Enter the 6-digit code from your authenticator app')
      return
    }
    if (useBackupCode && !backupCode.trim()) {
      toast.error('Enter a backup code')
      return
    }

    setLoading(true)
    try {
      const verifyRes = await fetch('/api/auth/2fa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken,
          ...(useBackupCode ? { backupCode: backupCode.trim() } : { code: totpCode }),
        }),
      })

      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}))
        toast.error(data.error || 'Invalid verification code')
        return
      }

      // 2FA passed — complete NextAuth signin
      setTwoFactorRequired(false)
      setChallengeToken(null)
      setTotpCode('')
      setBackupCode('')
      await completeNextAuthSignIn()
    } catch {
      toast.error('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const completeNextAuthSignIn = async () => {
    const result = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
    })
    if (result?.error) {
      toast.error('Login failed after 2FA. Please try again.')
    } else if (result?.ok) {
      setLoginAttempts(0)
      setLockoutUntil(null)
      toast.success('Welcome back!')
    }
  }

  const cancel2FA = () => {
    setTwoFactorRequired(false)
    setChallengeToken(null)
    setTotpCode('')
    setBackupCode('')
    setUseBackupCode(false)
  }

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    const identifier = email.trim()
    if (!identifier) {
      toast.error('Enter your email address above to request a reset')
      return
    }
    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'If the account exists, a reset code has been sent.')
      } else {
        toast.error(data.error || 'Failed to send reset code')
      }
    } catch {
      toast.error('Connection error. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-60 h-60 rounded-full bg-primary/3 blur-2xl" />
      </div>

      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-background/80 backdrop-blur-sm">
              <Coins className="w-3.5 h-3.5" />
              <span className="font-mono text-xs">{CURRENCIES.find(c => c.code === currency)?.symbol}</span>
              <span className="text-xs">{currency}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Currency</DropdownMenuLabel>
            {CURRENCIES.map(c => (
              <DropdownMenuItem key={c.code} onClick={() => setCurrency(c.code)} className="gap-2">
                <span>{c.flag}</span>
                <span className="text-sm font-medium">{c.code}</span>
                <span className="text-xs text-muted-foreground ml-auto">{c.name} ({c.symbol})</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-background/80 backdrop-blur-sm">
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs">{LANGUAGES.find(l => l.code === language)?.name}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Language</DropdownMenuLabel>
            {LANGUAGES.map(l => (
              <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code)} className="gap-2">
                <span>{l.flag}</span>
                <span className="text-sm font-medium">{l.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{l.code.toUpperCase()}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 mb-4">
            <Leaf className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Agrobase V3</h1>
          <p className="text-sm text-muted-foreground mt-1">
            MobiPay AgroSys — Agricultural Management Platform
          </p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-6 px-6">
            <div className="flex items-center gap-2 mb-1">
              <Sprout className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold">Sign in to your account</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your email or phone number and password
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {twoFactorRequired ? (
              /* ─── 2FA Verification Step ─── */
              <form onSubmit={handle2FAVerify} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold">Two-Factor Authentication</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {useBackupCode
                    ? 'Enter one of your backup codes:'
                    : 'Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.):'}
                </p>

                {!useBackupCode ? (
                  <div className="space-y-2">
                    <Label htmlFor="totp">Verification Code</Label>
                    <Input
                      id="totp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      className="h-12 text-center text-xl tracking-[0.5em] font-mono"
                      autoFocus
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="backup">Backup Code</Label>
                    <Input
                      id="backup"
                      type="text"
                      placeholder="XXXXXXXX"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      disabled={loading}
                      className="h-10 font-mono"
                      autoFocus
                      required
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>
                  ) : 'Verify & Sign In'}
                </Button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(!useBackupCode)}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
                  </button>
                  <button
                    type="button"
                    onClick={cancel2FA}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to login
                  </button>
                </div>
              </form>
            ) : (
              /* ─── Standard Login Form ─── */
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email or Phone</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    className="h-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={loading}
                />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  Remember me for 30 days
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/20 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                ) : 'Sign In'}
              </Button>
            </form>
            )}

            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to the{' '}
                <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
                {' '}and{' '}
                <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                &copy; {new Date().getFullYear()} MobiPay AgroSys Limited
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60 mt-4">
          Agrobase V3.0 — Secure Agricultural Management Platform
        </p>
      </div>
    </div>
  )
}
