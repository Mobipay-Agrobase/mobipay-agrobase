'use client'

/**
 * Public Farmer Profile Page — /farmer/[id]
 *
 * Reached when someone scans the QR code on the farmer detail hero card.
 * Shows ONLY non-sensitive fields (name, code, district, certification,
 * crops, registered-by org). Sensitive data (phone, email, national ID,
 * bank details, GPS, financial info) is NEVER shown.
 *
 * No login required — anyone with the QR code can verify the farmer's
 * registration with the issuing organization.
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, MapPin, Sprout, Award, Calendar, Building2, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PublicFarmer {
  id: string
  firstName: string
  lastName: string
  farmerCode: string
  district: string | null
  villageName: string | null
  farmSize: number | null
  isCertified: boolean
  certificationType: string | null
  mainCrops: string[]
  enrollmentDate: string | null
  registeredBy: string | null
  tenantType: string | null
  verifiedAt: string
}

export default function PublicFarmerPage() {
  const params = useParams<{ id: string }>()
  const farmerId = params?.id || ''

  const [farmer, setFarmer] = useState<PublicFarmer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!farmerId) return
    fetch(`/api/public/farmer/${farmerId}`)
      .then(r => {
        if (!r.ok) throw new Error('Farmer not found')
        return r.json()
      })
      .then(d => setFarmer(d.data))
      .catch(e => setError(e.message || 'Failed to load farmer profile'))
      .finally(() => setLoading(false))
  }, [farmerId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Verifying farmer profile…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !farmer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-amber-500" />
            <h1 className="text-lg font-semibold">Profile not available</h1>
            <p className="text-sm text-muted-foreground mt-2">
              This farmer profile may not exist, is not active, or the link is incorrect.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-4"
            >
              <ArrowLeft className="w-3 h-3" /> Back to home
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-slate-950 py-8 px-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Farmer Profile
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Farmer Verification</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified by {farmer.registeredBy || 'Agrobase'} · {new Date(farmer.verifiedAt).toLocaleString()}
          </p>
        </div>

        {/* Farmer Card */}
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                {farmer.firstName?.[0]}{farmer.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold truncate">{farmer.firstName} {farmer.lastName}</h2>
                {farmer.farmerCode && (
                  <p className="text-sm text-muted-foreground font-mono">{farmer.farmerCode}</p>
                )}
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              {farmer.isCertified && (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                  <Award className="w-3 h-3 mr-1" /> {farmer.certificationType || 'Certified'}
                </Badge>
              )}
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle className="w-3 h-3 mr-1" /> Active
              </Badge>
            </div>

            {/* Details grid */}
            <div className="space-y-3">
              {farmer.district && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium ml-auto">
                    {farmer.district}
                    {farmer.villageName ? `, ${farmer.villageName}` : ''}
                  </span>
                </div>
              )}
              {farmer.farmSize != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Sprout className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Farm Size:</span>
                  <span className="font-medium ml-auto">{farmer.farmSize} hectares</span>
                </div>
              )}
              {farmer.enrollmentDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Registered:</span>
                  <span className="font-medium ml-auto">{new Date(farmer.enrollmentDate).toLocaleDateString()}</span>
                </div>
              )}
              {farmer.registeredBy && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Organization:</span>
                  <span className="font-medium ml-auto">{farmer.registeredBy}</span>
                </div>
              )}
            </div>

            {/* Crops */}
            {farmer.mainCrops.length > 0 && (
              <div className="mt-5 pt-4 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Main Crops</p>
                <div className="flex flex-wrap gap-1.5">
                  {farmer.mainCrops.map((crop, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      <Sprout className="w-3 h-3 mr-1" /> {crop}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy note */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <p>
                This public profile shows only verification information. Sensitive data
                (phone, email, national ID, bank details, financial info) is masked and
                accessible only to authorized users within the issuing organization.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Agrobase
          </Link>
        </div>
      </div>
    </div>
  )
}
