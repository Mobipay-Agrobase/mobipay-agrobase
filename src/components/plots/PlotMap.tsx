'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon paths in Next.js
// @ts-expect-error - Icon.Default.mergeOptions override
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Color Schemes ─────────────────────────────────────────────────

const VERIFICATION_COLORS: Record<string, string> = {
  UNVERIFIED: '#9ca3af',
  GPS_VERIFIED: '#3b82f6',
  SATELLITE_VERIFIED: '#a855f7',
  FIELD_AUDITED: '#f59e0b',
  VERIFIED: '#22c55e',
}

const RISK_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  UNKNOWN: '#9ca3af',
}

// ─── Types ────────────────────────────────────────────────────────

interface PlotProperties {
  id: string
  plotCode: string
  name: string
  farmerName: string
  verificationStatus: string
  eudrRiskLevel: string
  areaHectares: number | null
}

interface PlotMapProps {
  onSelectPlot?: (plotId: string) => void
  className?: string
  height?: string
  colorMode?: 'verification' | 'risk'
}

const DEFAULT_CENTER: [number, number] = [1.3733, 32.2903]
const DEFAULT_ZOOM = 8

// ─── Component ────────────────────────────────────────────────────

export default function PlotMap({
  onSelectPlot,
  className,
  height = '500px',
  colorMode: initialColorMode = 'verification',
}: PlotMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plotCount, setPlotCount] = useState(0)
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null)
  const [colorMode, setColorMode] = useState(initialColorMode)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'topright' }).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Fetch and render GeoJSON
  const loadGeoJson = useCallback(async () => {
    if (!mapRef.current) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/plots/geojson')
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`)

      const data = await res.json()
      const features: any[] = data.features ?? []
      setPlotCount(features.length)

      if (features.length === 0) {
        setError('No plots or farm lands with GPS boundaries found. Register a farm land with a polygon in the Farm Land Registry to enable map display.')
        setLoading(false)
        return
      }

      if (geoJsonLayerRef.current) {
        mapRef.current.removeLayer(geoJsonLayerRef.current)
      }

      const getColor = (props: Partial<PlotProperties> | null | undefined) => {
        if (!props) return colorMode === 'risk' ? RISK_COLORS.UNKNOWN : VERIFICATION_COLORS.UNVERIFIED
        if (colorMode === 'risk') {
          return RISK_COLORS[props.eudrRiskLevel ?? 'UNKNOWN'] ?? RISK_COLORS.UNKNOWN
        }
        return VERIFICATION_COLORS[props.verificationStatus ?? 'UNVERIFIED'] ?? VERIFICATION_COLORS.UNVERIFIED
      }

      const layer = L.geoJSON(features, {
        style: (feature) => {
          const props = ((feature as any).properties ?? {}) as Partial<PlotProperties>
          return {
            color: getColor(props),
            weight: selectedPlotId === props.id ? 3 : 2,
            opacity: selectedPlotId === props.id ? 1 : 0.8,
            fillColor: getColor(props),
            fillOpacity: selectedPlotId === props.id ? 0.4 : 0.2,
          }
        },
        onEachFeature: (feature, layer) => {
          const props = ((feature as any).properties ?? {}) as Partial<PlotProperties>
          const vStatus = props.verificationStatus || 'UNVERIFIED'
          const rLevel = props.eudrRiskLevel || 'UNKNOWN'

          const popupContent = `
            <div style="font-family: system-ui; min-width: 180px;">
              <strong style="font-size: 13px;">${props.plotCode || '—'}</strong><br/>
              <span style="color: #666; font-size: 12px;">${props.name || ''}</span><br/>
              <span style="font-size: 12px;">${props.farmerName || ''}</span><br/>
              <div style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">
                <span style="background: ${VERIFICATION_COLORS[vStatus] ?? '#999'}22; color: ${VERIFICATION_COLORS[vStatus] ?? '#999'}; padding: 1px 6px; border-radius: 4px; font-size: 11px;">
                  ${vStatus.replace(/_/g, ' ')}
                </span>
                <span style="background: ${RISK_COLORS[rLevel] ?? '#999'}22; color: ${RISK_COLORS[rLevel] ?? '#999'}; padding: 1px 6px; border-radius: 4px; font-size: 11px;">
                  Risk: ${rLevel}
                </span>
              </div>
              ${props.areaHectares ? `<div style="margin-top: 4px; font-size: 11px; color: #888;">${props.areaHectares.toFixed(2)} ha</div>` : ''}
            </div>
          `
          layer.bindPopup(popupContent)

          layer.on('mouseover', function (e: L.LeafletMouseEvent) {
            e.target.setStyle({ weight: 3, fillOpacity: 0.35 })
            e.target.bringToFront()
          })
          layer.on('mouseout', function (e: L.LeafletMouseEvent) {
            geoJsonLayerRef.current?.resetStyle(e.target)
          })
          layer.on('click', () => {
            if (!props.id) return
            setSelectedPlotId(props.id)
            onSelectPlot?.(props.id)
          })
        },
      })

      layer.addTo(mapRef.current)
      geoJsonLayerRef.current = layer

      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [20, 20] })
      }

      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load map data')
      setLoading(false)
    }
  }, [colorMode, selectedPlotId, onSelectPlot])

  useEffect(() => {
    loadGeoJson()
  }, [loadGeoJson])

  return (
    <div className={cn('relative rounded-lg border overflow-hidden bg-muted/20', className)} style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Color mode selector overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-background/95 backdrop-blur rounded-lg border shadow-sm p-2">
        <Select value={colorMode} onValueChange={(v) => setColorMode(v as 'verification' | 'risk')}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="verification">Color by: Verification</SelectItem>
            <SelectItem value="risk">Color by: EUDR Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-background/95 backdrop-blur rounded-lg border shadow-sm p-3 max-w-[220px]">
        <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          {colorMode === 'risk' ? 'EUDR Risk Level' : 'Verification Status'}
        </p>
        <div className="space-y-1">
          {colorMode === 'verification'
            ? Object.entries(VERIFICATION_COLORS).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-[11px]">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v }} />
                  <span>{k.replace(/_/g, ' ')}</span>
                </div>
              ))
            : Object.entries(RISK_COLORS).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-[11px]">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v }} />
                  <span>{k}</span>
                </div>
              ))}
        </div>
        {plotCount > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
            {plotCount} plot{plotCount !== 1 ? 's' : ''} on map
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur flex items-center justify-center z-[1100]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading map...</span>
          </div>
        </div>
      )}

      {/* Error / Empty state */}
      {error && !loading && (
        <div className="absolute inset-0 bg-background/95 flex items-center justify-center z-[1100] p-6">
          <div className="text-center max-w-md">
            <Layers className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground mb-1">No plots to display</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadGeoJson}>
              <Loader2 className="w-3.5 h-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
