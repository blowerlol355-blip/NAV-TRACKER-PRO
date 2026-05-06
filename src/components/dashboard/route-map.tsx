"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from 'lucide-react'
import { motion } from 'framer-motion'

// Lightweight, self-contained copy of the route map visualization extracted from overview
export default function RouteMapVisualization({ shipments }: { shipments: any[] }) {
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null)
  const [tooltipInfo, setTooltipInfo] = useState<any | null>(null)
  const router = useRouter()

  const PORT_COORDS: Record<string, { x: number; y: number; label: string }> = {
    'VELGU': { x: 245, y: 215, label: 'La Guaira' },
    'USMIA': { x: 215, y: 170, label: 'Miami' },
    'NLRDM': { x: 400, y: 130, label: 'Rotterdam' },
    'CNSHA': { x: 680, y: 170, label: 'Shanghái' },
    'PAPTY': { x: 225, y: 210, label: 'Panamá' },
    'DEHAM': { x: 415, y: 125, label: 'Hamburgo' },
    'ESBCN': { x: 375, y: 155, label: 'Barcelona' },
    'COCTG': { x: 235, y: 210, label: 'Cartagena' },
    'BRSSZ': { x: 280, y: 260, label: 'Santos' },
    'JPYOK': { x: 700, y: 165, label: 'Yokohama' },
    'GUAYAQUIL': { x: 235, y: 210, label: 'Guayaquil' },
    'VALENCIA': { x: 375, y: 155, label: 'Valencia' },
    'CALLAO': { x: 215, y: 220, label: 'Callao' },
    'CARTAGENA': { x: 235, y: 210, label: 'Cartagena' },
    'MANZANILLO': { x: 225, y: 210, label: 'Manzanillo' },
    'ROTTERDAM': { x: 400, y: 130, label: 'Rotterdam' },
  }

  const ROUTE_STATUS_COLORS: Record<string, string> = {
    'En tránsito': '#14b8a6',
    'Con retraso': '#ef4444',
    'Entregado': '#22c55e',
  }

  const DEFAULT_ROUTE_COLOR = '#f59e0b'

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const uniqueRoutes = useMemo(() => {
    const seen = new Set<string>()
    return (shipments || []).filter((s: any) => {
      const key = `${s.originPort}-${s.destinationPort}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [shipments])

  const getCurvedPath = (x1: number, y1: number, x2: number, y2: number) => {
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    const curvature = Math.min(dist * 0.3, 60)
    const cx = midX - dy * 0.3
    const cy = midY - curvature * 0.5
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex items-center gap-2">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Navigation className="w-4 h-4 text-teal-500" />
            Mapa de Rutas Marítimas
          </CardTitle>
          <p className="text-xs text-muted-foreground">Rutas activas de envíos</p>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <div className="relative w-full" style={{ paddingBottom: '50%' }}>
          <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <rect width="800" height="400" fill="currentColor" className="text-slate-50 dark:text-slate-900" rx="8" />
            {uniqueRoutes.map((shipment: any) => {
              const origin = PORT_COORDS[shipment.originPort]
              const dest = PORT_COORDS[shipment.destinationPort]
              if (!origin || !dest) return null
              const routeKey = `${shipment.originPort}-${shipment.destinationPort}`
              const routeColor = ROUTE_STATUS_COLORS[shipment.status] || DEFAULT_ROUTE_COLOR
              const isHovered = hoveredRoute === routeKey
              const pathD = getCurvedPath(origin.x, origin.y, dest.x, dest.y)
              const now = Date.now()
              const depMs = shipment.departureDate ? new Date(shipment.departureDate).getTime() : null
              const etaMs = shipment.eta ? new Date(shipment.eta).getTime() : null
              let progress = 0.5
              if (depMs && etaMs && etaMs > depMs) progress = Math.min(1, Math.max(0, (now - depMs) / (etaMs - depMs)))
              const shipX = origin.x + (dest.x - origin.x) * progress
              const shipY = origin.y + (dest.y - origin.y) * progress

              return (
                <g key={routeKey}>
                  {isHovered && <path d={pathD} fill="none" stroke={routeColor} strokeWidth="6" opacity="0.2" filter="url(#glow)" />}
                  <path d={pathD} fill="none" stroke={routeColor} strokeWidth={isHovered ? 2.5 : 1.8} strokeDasharray="8 4" style={{ cursor: 'pointer' }} onMouseEnter={() => { setHoveredRoute(routeKey); const midX = (origin.x + dest.x) / 2; const midY = Math.min(origin.y, dest.y) - 20; setTooltipInfo({ x: midX, y: midY, shipment }) }} onMouseLeave={() => { setHoveredRoute(null); setTooltipInfo(null) }} />
                  <g transform={`translate(${shipX}, ${shipY})`} onClick={() => { try { if (shipment.vesselId) router.push(`/vessels/${shipment.vesselId}`) } catch (e) { if (typeof window !== 'undefined' && shipment.vesselId) window.location.href = `/vessels/${shipment.vesselId}` } }} style={{ cursor: 'pointer' }}>
                    <circle r={isHovered ? 5 : 4} fill={routeColor} stroke="white" strokeWidth="1" />
                  </g>
                  <circle cx={origin.x} cy={origin.y} r={isHovered ? 5 : 4} fill={routeColor} stroke="white" strokeWidth="1.5" />
                  <circle cx={dest.x} cy={dest.y} r={isHovered ? 5 : 4} fill={routeColor} stroke="white" strokeWidth="1.5" />
                </g>
              )
            })}
          </svg>
          {tooltipInfo && tooltipInfo.shipment && (
            <div className="absolute" style={{ left: tooltipInfo.x - 120, top: Math.max(8, tooltipInfo.y - 70) }}>
              <div className="bg-white/95 dark:bg-slate-900/95 text-xs rounded-md shadow-lg border border-border p-2 text-foreground">
                <div className="leading-tight">{tooltipInfo.shipment.reference}</div>
                <div className="text-xs text-muted-foreground">{tooltipInfo.shipment.originPort} → {tooltipInfo.shipment.destinationPort} • {tooltipInfo.shipment.status}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
