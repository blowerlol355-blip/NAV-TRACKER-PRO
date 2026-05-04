'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip as TooltipRadix, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Ship, FileCheck, Box, Anchor, AlertTriangle, Clock, FileX,
  DollarSign, TrendingUp, Route, ArrowRight, ExternalLink,
  PackageCheck, Sailboat, FileUp, AlertCircle, BarChart3, PieChart as PieChartIcon,
  Inbox, RefreshCw, FileText, CheckCircle, Eye, ChevronRight,
  Gauge, Timer, Navigation, Container, Activity
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'

// ==================== TYPES ====================

interface DashboardData {
  kpis: {
    activeShipments: number
    pendingPermits: number
    inTransitContainers: number
    operationalVessels: number
  }
  chartData: {
    months: { name: string; envios: number }[]
    statusDistribution: { name: string; value: number }[]
  }
  alerts: {
    expiringPermits: number
    delayedShipments: number
    pendingDocuments: number
  }
  recentShipments: {
    id: string
    reference: string
    origin: string
    destination: string
    originPort: string
    destinationPort: string
    cargoType: string
    status: string
    eta: string | null
    blNumber: string
    vessel: { name: string } | null
  }[]
}

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  time: string
  icon: string
  color: string
}

// ==================== CONSTANTS ====================

const STATUS_COLORS: Record<string, string> = {
  'Registrado': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'En documentación': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'En tránsito': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'En puerto de destino': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'En aduana': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Entregado': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Con retraso': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Carga General': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Granel Sólido': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Granel Líquido': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Contenedorizado': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'Pendiente de despacho': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const STATUS_PROGRESS: Record<string, number> = {
  'Registrado': 10,
  'En documentación': 25,
  'En tránsito': 60,
  'En puerto de destino': 80,
  'En aduana': 90,
  'Entregado': 100,
  'Con retraso': 45,
  'Pendiente de despacho': 70,
}

const PIE_COLORS = ['#14b8a6', '#f59e0b', '#0ea5e9', '#22c55e', '#f97316', '#64748b', '#ef4444']

const CARGO_EMOJIS: Record<string, string> = {
  'Contenedorizado': '📦',
  'Granel Sólido': '⛰️',
  'Granel Líquido': '🛢️',
  'Carga General': '📋',
  'Perecederos': '❄️',
  'Maquinaria': '⚙️',
}

// Icon map for activity items
const ACTIVITY_ICON_MAP: Record<string, React.ElementType> = {
  'ship': Ship,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  'file-check': FileCheck,
  'file-text': FileText,
  'package-check': PackageCheck,
}

const ACTIVITY_COLOR_MAP: Record<string, string> = {
  'teal': 'bg-teal-500',
  'emerald': 'bg-emerald-500',
  'red': 'bg-red-500',
  'orange': 'bg-orange-500',
  'sky': 'bg-sky-500',
  'amber': 'bg-amber-500',
  'slate': 'bg-slate-500',
}

// Activity type to tab mapping
const ACTIVITY_TAB_MAP: Record<string, string> = {
  'shipment': 'shipments',
  'permit': 'permits',
  'document': 'documents',
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

// ==================== UTILITY: Deduplicate status distribution ====================
function deduplicateStatusDistribution(data: { name: string; value: number }[]): { name: string; value: number }[] {
  const merged: Record<string, number> = {}
  data.forEach((item) => {
    merged[item.name] = (merged[item.name] || 0) + item.value
  })
  return Object.entries(merged).map(([name, value]) => ({ name, value }))
}

// ==================== UTILITY: Days remaining until ETA ====================
function getDaysRemaining(etaStr: string | null): string | null {
  if (!etaStr) return null
  const eta = new Date(etaStr)
  const now = new Date()
  const diffMs = eta.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return `${Math.abs(diffDays)}d retraso`
  if (diffDays === 0) return 'Hoy'
  return `${diffDays}d`
}

// ==================== Animated Number Component ====================
function AnimatedNumber({ value, duration = 1.2, format }: { value: number; duration?: number; format?: 'number' | 'currency' | 'decimal' | 'percent' }) {
  const motionVal = useMotionValue(0)
  const [display, setDisplay] = useState('0')

  const formatValue = useCallback((v: number) => {
    switch (format) {
      case 'currency':
        if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`
        if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`
        return `$${Math.round(v).toLocaleString()}`
      case 'decimal':
        return v.toFixed(1)
      case 'percent':
        return `${Math.round(v)}%`
      default:
        return Math.round(v).toLocaleString()
    }
  }, [format])

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration,
      ease: 'easeOut',
    })
    const unsub = motionVal.on('change', (v) => setDisplay(formatValue(v)))
    return () => {
      controls.stop()
      unsub()
    }
  }, [value, duration, motionVal, formatValue])

  return <span>{display}</span>
}

// ==================== Shimmer Effect Component ====================
function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

// ==================== Gradient Border Wrapper ====================
function GradientBorderCard({ children, className = '', fromColor = 'from-teal-500', toColor = 'to-sky-500' }: {
  children: React.ReactNode
  className?: string
  fromColor?: string
  toColor?: string
}) {
  return (
    <div className={`group relative rounded-xl p-[1px] transition-all duration-500 hover:p-[2px] ${className}`}>
      {/* Animated gradient border */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${fromColor} ${toColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} style={{ backgroundSize: '200% 200%' }} />
      {/* Inner content */}
      <div className="relative rounded-[11px] bg-card">
        {children}
      </div>
    </div>
  )
}

// ==================== Mini Sparkline SVG ====================
function MiniSparkline({ trend, color = 'text-teal-500' }: { trend: string; color?: string }) {
  const isPositive = trend.startsWith('+')
  const points = isPositive
    ? '0,8 4,6 8,7 12,3 16,5 20,1 24,0'
    : '0,0 4,2 8,1 12,5 16,3 20,7 24,8'

  return (
    <svg width="28" height="10" className={`inline-block ${color}`}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ==================== Port Code Badge ====================
function PortCodeBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-muted text-foreground">
      {code}
    </span>
  )
}

// ==================== Empty Chart State ====================
function EmptyChartState({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 opacity-50" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs mt-1 opacity-70">No hay datos disponibles</p>
    </div>
  )
}

// ==================== Custom Tooltip Components ====================
function MaritimeBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-teal-600 dark:text-teal-400">
        {payload[0].value} envíos
      </p>
    </div>
  )
}

function MaritimePieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { name: string; value: number } }> }) {
  if (!active || !payload?.length) return null
  const data = payload[0]
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-bold">{data.payload?.name || data.name}</p>
      <p className="text-xs text-muted-foreground">{data.value} envío{data.value !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ==================== Port Coordinates for Route Map ====================
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
}

const ROUTE_STATUS_COLORS: Record<string, string> = {
  'En tránsito': '#14b8a6',
  'Con retraso': '#ef4444',
  'Entregado': '#22c55e',
}

const DEFAULT_ROUTE_COLOR = '#f59e0b'

// ==================== Route Map Visualization Component ====================
function RouteMapVisualization({ shipments }: { shipments: DashboardData['recentShipments'] }) {
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null)
  const [tooltipInfo, setTooltipInfo] = useState<{ x: number; y: number; shipment: typeof shipments[0] } | null>(null)

  const uniqueRoutes = useMemo(() => {
    const seen = new Set<string>()
    return shipments.filter((s) => {
      const key = `${s.originPort}-${s.destinationPort}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [shipments])

  // Calculate curved path between two points
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
    <>
      <style>{`
        @keyframes shipMove {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        @keyframes dashMove {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
        .route-path {
          animation: dashMove 1.5s linear infinite;
        }
        .ship-icon {
          offset-path: path(var(--route-path));
          animation: shipMove 6s linear infinite;
        }
      `}</style>
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
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
            <svg
              viewBox="0 0 800 400"
              className="absolute inset-0 w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Ocean background */}
              <defs>
                <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="currentColor" className="text-slate-50 dark:text-slate-900" />
                  <stop offset="100%" stopColor="currentColor" className="text-slate-100 dark:text-slate-950" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Ocean */}
              <rect width="800" height="400" fill="url(#oceanGrad)" rx="8" />

              {/* Simplified continents */}
              {/* North America */}
              <path d="M 80 80 L 130 65 L 180 70 L 230 65 L 260 90 L 270 110 L 260 130 L 240 140 L 230 170 L 210 175 L 195 170 L 180 180 L 165 185 L 155 195 L 145 190 L 130 180 L 110 185 L 95 180 L 80 170 L 70 150 L 65 130 L 70 110 Z"
                fill="currentColor" className="text-slate-200 dark:text-slate-800" stroke="currentColor" strokeWidth="0.5" />
              {/* Central America */}
              <path d="M 195 185 L 210 190 L 225 195 L 240 200 L 245 210 L 240 215 L 225 220 L 215 215 L 205 210 L 195 205 L 190 195 Z"
                fill="currentColor" className="text-slate-200 dark:text-slate-800" stroke="currentColor" strokeWidth="0.5" />
              {/* South America */}
              <path d="M 215 220 L 230 218 L 255 225 L 275 240 L 290 260 L 285 290 L 275 310 L 260 325 L 245 335 L 235 330 L 230 315 L 225 300 L 220 275 L 215 250 L 210 235 Z"
                fill="currentColor" className="text-slate-200 dark:text-slate-800" stroke="currentColor" strokeWidth="0.5" />
              {/* Europe */}
              <path d="M 370 85 L 395 80 L 420 85 L 435 95 L 440 110 L 435 125 L 420 135 L 400 140 L 385 150 L 375 155 L 365 150 L 355 140 L 350 125 L 355 110 L 360 100 Z"
                fill="currentColor" className="text-slate-200 dark:text-slate-800" stroke="currentColor" strokeWidth="0.5" />
              {/* Africa */}
              <path d="M 375 165 L 400 160 L 420 170 L 430 185 L 435 205 L 430 230 L 420 255 L 405 270 L 390 275 L 380 265 L 370 245 L 365 220 L 360 200 L 365 180 Z"
                fill="currentColor" className="text-slate-200 dark:text-slate-800" stroke="currentColor" strokeWidth="0.5" />
              {/* Asia */}
              <path d="M 445 80 L 500 70 L 560 75 L 620 80 L 670 90 L 700 100 L 720 120 L 715 140 L 700 155 L 680 165 L 660 170 L 640 165 L 610 160 L 580 155 L 550 150 L 520 140 L 490 130 L 465 120 L 450 105 L 445 90 Z"
                fill="currentColor" className="text-slate-200 dark:text-slate-800" stroke="currentColor" strokeWidth="0.5" />
              {/* Australia */}
              <path d="M 630 260 L 660 255 L 690 260 L 710 275 L 715 295 L 705 310 L 685 320 L 660 325 L 640 315 L 630 295 L 625 275 Z"
                fill="currentColor" className="text-slate-200 dark:text-slate-800" stroke="currentColor" strokeWidth="0.5" />

              {/* Grid lines (subtle) */}
              {[100, 200, 300, 400, 500, 600, 700].map((x) => (
                <line key={`vline-${x}`} x1={x} y1="0" x2={x} y2="400" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.3" strokeDasharray="4 8" />
              ))}
              {[80, 160, 240, 320].map((y) => (
                <line key={`hline-${y}`} x1="0" y1={y} x2="800" y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.3" strokeDasharray="4 8" />
              ))}

              {/* Shipping Routes */}
              {uniqueRoutes.map((shipment) => {
                const origin = PORT_COORDS[shipment.originPort]
                const dest = PORT_COORDS[shipment.destinationPort]
                if (!origin || !dest) return null

                const routeKey = `${shipment.originPort}-${shipment.destinationPort}`
                const routeColor = ROUTE_STATUS_COLORS[shipment.status] || DEFAULT_ROUTE_COLOR
                const isHovered = hoveredRoute === routeKey
                const pathD = getCurvedPath(origin.x, origin.y, dest.x, dest.y)

                return (
                  <g key={routeKey}>
                    {/* Route path - glow effect on hover */}
                    {isHovered && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={routeColor}
                        strokeWidth="6"
                        opacity="0.2"
                        filter="url(#glow)"
                      />
                    )}
                    {/* Route path - dashed animated */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={routeColor}
                      strokeWidth={isHovered ? 2.5 : 1.8}
                      strokeDasharray="8 4"
                      className="route-path"
                      opacity={isHovered ? 1 : 0.7}
                      style={{ '--route-path': `'${pathD}'`, cursor: 'pointer' } as React.CSSProperties}
                      onMouseEnter={() => {
                        setHoveredRoute(routeKey)
                        const midX = (origin.x + dest.x) / 2
                        const midY = Math.min(origin.y, dest.y) - 20
                        setTooltipInfo({ x: midX, y: midY, shipment })
                      }}
                      onMouseLeave={() => {
                        setHoveredRoute(null)
                        setTooltipInfo(null)
                      }}
                    />
                    {/* Animated ship dot */}
                    <circle r="3" fill={routeColor} className="ship-icon" style={{ '--route-path': `'${pathD}'` } as React.CSSProperties} opacity={isHovered ? 1 : 0.8} />
                    {/* Origin dot */}
                    <circle
                      cx={origin.x} cy={origin.y} r={isHovered ? 5 : 4}
                      fill={routeColor} stroke="white" strokeWidth="1.5"
                      className="transition-all duration-200"
                    />
                    {/* Destination dot */}
                    <circle
                      cx={dest.x} cy={dest.y} r={isHovered ? 5 : 4}
                      fill={routeColor} stroke="white" strokeWidth="1.5"
                      className="transition-all duration-200"
                    />
                    {/* Port labels */}
                    <text
                      x={origin.x} y={origin.y - 8}
                      textAnchor="middle" fontSize="8"
                      fill="currentColor" className="text-slate-600 dark:text-slate-400"
                      fontWeight="600"
                    >
                      {shipment.originPort}
                    </text>
                    <text
                      x={dest.x} y={dest.y - 8}
                      textAnchor="middle" fontSize="8"
                      fill="currentColor" className="text-slate-600 dark:text-slate-400"
                      fontWeight="600"
                    >
                      {shipment.destinationPort}
                    </text>
                  </g>
                )
              })}

              {/* Tooltip on hover */}
              {tooltipInfo && (
                <g>
                  <rect
                    x={tooltipInfo.x - 80} y={tooltipInfo.y - 38}
                    width="160" height="32" rx="6"
                    fill="currentColor" className="text-slate-900 dark:text-slate-100"
                    opacity="0.92"
                  />
                  <text
                    x={tooltipInfo.x} y={tooltipInfo.y - 22}
                    textAnchor="middle" fontSize="8" fill="white"
                    fontWeight="600"
                  >
                    {tooltipInfo.shipment.reference}
                  </text>
                  <text
                    x={tooltipInfo.x} y={tooltipInfo.y - 12}
                    textAnchor="middle" fontSize="7" fill="white"
                    opacity="0.85"
                  >
                    {tooltipInfo.shipment.originPort} → {tooltipInfo.shipment.destinationPort} • {tooltipInfo.shipment.status}
                  </text>
                </g>
              )}
            </svg>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-3 px-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Leyenda:</span>
            {[
              { label: 'En tránsito', color: '#14b8a6' },
              { label: 'Con retraso', color: '#ef4444' },
              { label: 'Entregado', color: '#22c55e' },
              { label: 'Otros', color: '#f59e0b' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ==================== Circular Progress Component ====================
function CircularProgress({ value, size = 60, strokeWidth = 5, color = '#14b8a6' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" className="text-muted/30"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  )
}

// ==================== Performance Metrics Card ====================
function PerformanceMetricsCard({ kpis, activeShipments }: { kpis: DashboardData['kpis']; activeShipments: number }) {
  const transitMonths = [
    { name: 'Jul', dias: 20 },
    { name: 'Ago', dias: 17 },
    { name: 'Sep', dias: 19 },
    { name: 'Oct', dias: 16 },
    { name: 'Nov', dias: 18 },
    { name: 'Dic', dias: 18.5 },
  ]
  const maxDays = 25

  const metrics = [
    {
      icon: Timer,
      label: 'Tiempo promedio de tránsito',
      value: '18.5',
      unit: 'días',
      color: 'text-amber-500',
      bg: 'bg-amber-500/15',
      ring: 'ring-amber-500/30',
    },
    {
      icon: Gauge,
      label: 'Tasa de cumplimiento',
      value: '87',
      unit: '%',
      color: 'text-teal-500',
      bg: 'bg-teal-500/15',
      ring: 'ring-teal-500/30',
    },
    {
      icon: DollarSign,
      label: 'Valor en tránsito',
      value: '12.4',
      unit: 'M',
      prefix: '$',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/15',
      ring: 'ring-emerald-500/30',
    },
    {
      icon: Activity,
      label: 'Envíos este mes',
      value: String(activeShipments),
      unit: '',
      color: 'text-sky-500',
      bg: 'bg-sky-500/15',
      ring: 'ring-sky-500/30',
    },
    {
      icon: Container,
      label: 'Contenedores despachados',
      value: String(kpis.inTransitContainers),
      unit: '',
      color: 'text-violet-500',
      bg: 'bg-violet-500/15',
      ring: 'ring-violet-500/30',
    },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Gauge className="w-4 h-4 text-teal-500" />
          Métricas de Rendimiento
        </CardTitle>
        <p className="text-xs text-muted-foreground">Indicadores clave de desempeño</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Transit time with mini bar chart */}
        <motion.div
          className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
        >
          <div className={`w-9 h-9 rounded-lg ${metrics[0].bg} flex items-center justify-center ring-1 ${metrics[0].ring}`}>
            <Timer className={`w-4 h-4 ${metrics[0].color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">{metrics[0].label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">{metrics[0].value}</span>
              <span className="text-xs text-muted-foreground">{metrics[0].unit}</span>
            </div>
          </div>
          {/* Mini bar chart */}
          <div className="flex items-end gap-[3px] h-7">
            {transitMonths.map((m, i) => (
              <motion.div
                key={m.name}
                className="w-[7px] rounded-t-sm bg-amber-400/70 group-hover:bg-amber-500 transition-colors"
                initial={{ height: 0 }}
                animate={{ height: `${(m.dias / maxDays) * 28}px` }}
                transition={{ duration: 0.5, delay: 0.1 * i, ease: 'easeOut' }}
              />
            ))}
          </div>
        </motion.div>

        {/* Compliance rate with circular progress */}
        <motion.div
          className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
        >
          <div className={`w-9 h-9 rounded-lg ${metrics[1].bg} flex items-center justify-center ring-1 ${metrics[1].ring}`}>
            <Gauge className={`w-4 h-4 ${metrics[1].color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">{metrics[1].label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">{metrics[1].value}</span>
              <span className="text-xs text-muted-foreground">{metrics[1].unit}</span>
            </div>
          </div>
          <CircularProgress value={87} size={44} strokeWidth={4} color="#14b8a6" />
        </motion.div>

        {/* Value in transit */}
        <motion.div
          className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
        >
          <div className={`w-9 h-9 rounded-lg ${metrics[2].bg} flex items-center justify-center ring-1 ${metrics[2].ring}`}>
            <DollarSign className={`w-4 h-4 ${metrics[2].color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">{metrics[2].label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">$12.4M</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            +5.2%
          </div>
        </motion.div>

        {/* Shipments this month */}
        <motion.div
          className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
        >
          <div className={`w-9 h-9 rounded-lg ${metrics[3].bg} flex items-center justify-center ring-1 ${metrics[3].ring}`}>
            <Activity className={`w-4 h-4 ${metrics[3].color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">{metrics[3].label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">
                <AnimatedNumber value={activeShipments} format="number" />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sky-500 text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            +12%
          </div>
        </motion.div>

        {/* Containers dispatched */}
        <motion.div
          className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
        >
          <div className={`w-9 h-9 rounded-lg ${metrics[4].bg} flex items-center justify-center ring-1 ${metrics[4].ring}`}>
            <Container className={`w-4 h-4 ${metrics[4].color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">{metrics[4].label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">
                <AnimatedNumber value={kpis.inTransitContainers} format="number" />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-violet-500 text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            +8%
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

// ==================== MAIN COMPONENT ====================
export function Overview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const { setActiveTab } = useAppStore()
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch dashboard data with retry
  const fetchDashboard = useCallback(() => {
    let retries = 0
    const maxRetries = 5
    setError(false)
    setLoading(true)

    const fetchData = () => {
      fetch('/api/dashboard')
        .then((res) => {
          if (!res.ok) throw new Error('API error')
          return res.json()
        })
        .then((d) => {
          if (d && d.kpis) {
            // BUG FIX: Deduplicate status distribution to prevent "En tránsito" showing twice
            if (d.chartData?.statusDistribution) {
              d.chartData.statusDistribution = deduplicateStatusDistribution(d.chartData.statusDistribution)
            }
            setData(d)
            setLoading(false)
            setError(false)
          } else {
            throw new Error('Invalid data')
          }
        })
        .catch(() => {
          retries++
          if (retries < maxRetries) {
            retryTimerRef.current = setTimeout(fetchData, 2000)
          } else {
            setLoading(false)
            setError(true)
          }
        })
    }
    fetchData()
  }, [])

  // Fetch activity data from API
  const fetchActivities = useCallback(() => {
    setActivitiesLoading(true)
    fetch('/api/activity')
      .then((res) => {
        if (!res.ok) throw new Error('Activity API error')
        return res.json()
      })
      .then((d) => {
        if (Array.isArray(d)) {
          setActivities(d)
        }
        setActivitiesLoading(false)
      })
      .catch(() => {
        setActivitiesLoading(false)
        // Fall back to empty - don't crash
      })
  }, [])

  useEffect(() => {
    fetchDashboard()
    fetchActivities()

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [fetchDashboard, fetchActivities, retryCount])

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Skeleton className="lg:col-span-3 h-80 rounded-xl" />
          <Skeleton className="lg:col-span-2 h-80 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  // ==================== ERROR STATE WITH RETRY ====================
  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Error al cargar datos</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          No se pudieron obtener los datos del dashboard. Esto puede deberse a que el servidor está iniciándose. Por favor, intente de nuevo.
        </p>
        <Button
          onClick={() => {
            setRetryCount((c) => c + 1)
          }}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </Button>
      </motion.div>
    )
  }

  // ==================== DATA SETUP ====================
  const kpiCards = [
    { title: 'Envíos Activos', value: data.kpis.activeShipments, change: '+12%', icon: Ship, gradientFrom: 'from-teal-500', gradientTo: 'to-cyan-400', bgOpacity: 'bg-teal-500/15', textColor: 'text-teal-500', accentColor: 'bg-teal-500', ringColor: 'ring-teal-500/30' },
    { title: 'Permisos Pendientes', value: data.kpis.pendingPermits, change: '-5%', icon: FileCheck, gradientFrom: 'from-amber-500', gradientTo: 'to-yellow-400', bgOpacity: 'bg-amber-500/15', textColor: 'text-amber-500', accentColor: 'bg-amber-500', ringColor: 'ring-amber-500/30' },
    { title: 'Contenedores en Tránsito', value: data.kpis.inTransitContainers, change: '+8%', icon: Box, gradientFrom: 'from-sky-500', gradientTo: 'to-blue-400', bgOpacity: 'bg-sky-500/15', textColor: 'text-sky-500', accentColor: 'bg-sky-500', ringColor: 'ring-sky-500/30' },
    { title: 'Embarcaciones Operativas', value: data.kpis.operationalVessels, change: '+2%', icon: Anchor, gradientFrom: 'from-emerald-500', gradientTo: 'to-green-400', bgOpacity: 'bg-emerald-500/15', textColor: 'text-emerald-500', accentColor: 'bg-emerald-500', ringColor: 'ring-emerald-500/30' },
  ]

  // Determine the most active route
  const routeCounts: Record<string, number> = {}
  data.recentShipments.forEach((s) => {
    const route = `${s.originPort} → ${s.destinationPort}`
    routeCounts[route] = (routeCounts[route] || 0) + 1
  })
  const mostActiveRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'VELGU → USMIA'

  const hasBarData = data.chartData.months && data.chartData.months.length > 0
  const hasPieData = data.chartData.statusDistribution && data.chartData.statusDistribution.length > 0

  // Total shipment count for donut center
  const totalShipments = data.chartData.statusDistribution?.reduce((sum, item) => sum + item.value, 0) || 0

  // Quick stats
  const quickStats = [
    { icon: DollarSign, label: 'Valor total en tránsito', value: '$12,450,000', color: 'text-emerald-500', glowColor: 'shadow-emerald-500/20', iconBg: 'bg-emerald-500/15' },
    { icon: Clock, label: 'Tiempo promedio de tránsito', value: '18 días', color: 'text-amber-500', glowColor: 'shadow-amber-500/20', iconBg: 'bg-amber-500/15' },
    { icon: TrendingUp, label: 'Tasa de entrega a tiempo', value: '87%', color: 'text-teal-500', glowColor: 'shadow-teal-500/20', iconBg: 'bg-teal-500/15' },
    { icon: Route, label: 'Ruta más activa', value: mostActiveRoute, color: 'text-sky-500', glowColor: 'shadow-sky-500/20', iconBg: 'bg-sky-500/15' },
  ]

  // Alert cards data
  const alertCards = [
    {
      title: 'Permisos por vencer',
      value: data.alerts.expiringPermits,
      total: data.kpis.pendingPermits + data.alerts.expiringPermits,
      icon: Clock,
      borderColor: 'border-l-amber-400',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-600 dark:text-amber-400',
      textColor: 'text-amber-600 dark:text-amber-400',
      progressColor: 'bg-amber-500',
      tab: 'permits' as const,
      isCritical: false,
    },
    {
      title: 'Envíos con retraso',
      value: data.alerts.delayedShipments,
      total: data.kpis.activeShipments,
      icon: AlertTriangle,
      borderColor: 'border-l-red-400',
      iconBg: 'bg-red-500/15',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-600 dark:text-red-400',
      progressColor: 'bg-red-500',
      tab: 'shipments' as const,
      isCritical: data.alerts.delayedShipments > 0,
    },
    {
      title: 'Documentos pendientes',
      value: data.alerts.pendingDocuments,
      total: data.alerts.pendingDocuments + 20,
      icon: FileX,
      borderColor: 'border-l-orange-400',
      iconBg: 'bg-orange-500/15',
      iconColor: 'text-orange-600 dark:text-orange-400',
      textColor: 'text-orange-600 dark:text-orange-400',
      progressColor: 'bg-orange-500',
      tab: 'documents' as const,
      isCritical: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* ==================== KPI CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <motion.div
              key={kpi.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <GradientBorderCard fromColor={kpi.gradientFrom} toColor={kpi.gradientTo}>
                <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  {/* Glassmorphism bg */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-900/40 backdrop-blur-sm" />

                  {/* Left gradient accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${kpi.accentColor}`} />

                  {/* Watermark icon in background */}
                  <div className="absolute -bottom-3 -right-3 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-300">
                    <Icon className="w-24 h-24" />
                  </div>

                  <CardContent className="p-5 pl-5 relative z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                        <p className="text-4xl font-bold mt-1 tracking-tight">
                          <AnimatedNumber value={kpi.value} />
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`text-xs font-medium ${kpi.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                            {kpi.change}
                          </span>
                          <MiniSparkline
                            trend={kpi.change}
                            color={kpi.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}
                          />
                          <span className="text-xs text-muted-foreground">vs. mes anterior</span>
                        </div>
                      </div>
                      {/* Icon with pulse animation */}
                      <motion.div
                        className={`w-11 h-11 rounded-xl ${kpi.bgOpacity} flex items-center justify-center ring-2 ${kpi.ringColor}`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Icon className={`w-5 h-5 ${kpi.textColor}`} />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </GradientBorderCard>
            </motion.div>
          )
        })}
      </div>

      {/* ==================== QUICK STATS ROW ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <Card className="relative overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-sky-500/5 to-emerald-500/5" />
          <ShimmerOverlay />

          <CardContent className="p-4 relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {quickStats.map((stat, idx) => {
                const StatIcon = stat.icon
                return (
                  <div key={stat.label} className="flex items-center gap-2">
                    {idx > 0 && <Separator orientation="vertical" className={`hidden sm:block h-6 mr-2`} />}
                    <div className={`w-7 h-7 rounded-lg ${stat.iconBg} flex items-center justify-center shadow-sm ${stat.glowColor}`}>
                      <StatIcon className={`w-3.5 h-3.5 ${stat.color}`} />
                    </div>
                    <span className="text-sm text-muted-foreground">{stat.label}:</span>
                    <span className="text-sm font-bold">{stat.value}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ==================== CHARTS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-1 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-500" />
                  Envíos por Mes
                </CardTitle>
                <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 gap-1"
                onClick={() => setActiveTab('shipments')}
              >
                <Eye className="w-3 h-3" />
                Ver detalles
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div style={{ width: '100%', height: 280, minHeight: 280 }}>
                {hasBarData ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.chartData.months} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.4} />
                          </linearGradient>
                          <filter id="barShadow" x="-10%" y="-10%" width="120%" height="130%">
                            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#14b8a6" floodOpacity="0.2" />
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                        <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis className="text-xs" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<MaritimeBarTooltip />} />
                        <Bar dataKey="envios" fill="url(#barGradient)" radius={[6, 6, 0, 0]} filter="url(#barShadow)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                ) : (
                  <EmptyChartState icon={BarChart3} title="Envíos por Mes" />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-1 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-teal-500" />
                  Estado de Envíos
                </CardTitle>
                <p className="text-xs text-muted-foreground">Distribución actual</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 gap-1"
                onClick={() => setActiveTab('shipments')}
              >
                <Eye className="w-3 h-3" />
                Ver detalles
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div style={{ width: '100%', height: 280, minHeight: 280 }}>
                {hasPieData ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    style={{ width: '100%', height: '100%', position: 'relative' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie
                          data={data.chartData.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.chartData.statusDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<MaritimePieTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: '11px' }}
                          formatter={(value: string) => <span className="text-foreground">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center text showing total */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-12px' }}>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{totalShipments}</p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <EmptyChartState icon={PieChartIcon} title="Estado de Envíos" />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ==================== ROUTE MAP & PERFORMANCE METRICS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Route Map - takes 3 columns */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          <RouteMapVisualization shipments={data.recentShipments} />
        </motion.div>

        {/* Performance Metrics - takes 2 columns */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <PerformanceMetricsCard kpis={data.kpis} activeShipments={data.kpis.activeShipments} />
        </motion.div>
      </div>

      {/* ==================== RECENT SHIPMENTS TABLE ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Envíos Recientes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium gap-1"
              onClick={() => setActiveTab('shipments')}
            >
              Ver todos los envíos
              <ChevronRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Origen → Destino</TableHead>
                    <TableHead>Embarcación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>BL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentShipments.map((s, idx) => {
                    const daysRemaining = getDaysRemaining(s.eta)
                    const isDelayed = daysRemaining?.includes('retraso')
                    const cargoEmoji = CARGO_EMOJIS[s.cargoType] || '📋'

                    return (
                      <TableRow
                        key={s.id}
                        className={`group relative transition-all duration-200 hover:bg-muted/50 ${
                          idx % 2 === 1 ? 'bg-muted/20' : ''
                        }`}
                        style={{
                          borderLeft: '3px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          const color = isDelayed ? '#ef4444' : s.status === 'En tránsito' ? '#14b8a6' : '#f59e0b'
                          ;(e.currentTarget as HTMLElement).style.borderLeftColor = color
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'
                        }}
                      >
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded text-xs bg-muted">
                              {cargoEmoji}
                            </span>
                            {s.reference}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <PortCodeBadge code={s.originPort} />
                            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <PortCodeBadge code={s.destinationPort} />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Sailboat className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span>{s.vessel?.name || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`text-xs ${STATUS_COLORS[s.status] || ''}`}>
                              {s.status}
                            </Badge>
                            <Progress
                              value={STATUS_PROGRESS[s.status] || 0}
                              className="w-12 h-1.5"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.eta ? (
                            <div className="flex flex-col">
                              <span className={`text-xs font-medium ${isDelayed ? 'text-red-500' : 'text-foreground'}`}>
                                {daysRemaining}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(s.eta).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-xs">{s.blNumber}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ==================== ALERT CARDS ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {alertCards.map((alert) => {
            const AlertIcon = alert.icon
            const progressPercent = alert.total > 0 ? Math.round((alert.value / alert.total) * 100) : 0

            return (
              <motion.div
                key={alert.title}
                className={alert.isCritical ? '' : ''}
                animate={alert.isCritical ? { x: [0, -2, 2, -1, 1, 0] } : {}}
                transition={alert.isCritical ? { duration: 0.5, repeat: Infinity, repeatDelay: 3 } : {}}
              >
                <Card className={`border-l-4 ${alert.borderColor} shadow-md hover:shadow-lg transition-shadow overflow-hidden`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${alert.iconBg} flex items-center justify-center relative`}>
                        <AlertIcon className={`w-5 h-5 ${alert.iconColor}`} />
                        {alert.value > 0 && (
                          <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${alert.progressColor} animate-pulse`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className={`text-2xl font-bold ${alert.textColor}`}>{alert.value}</p>
                      </div>
                    </div>
                    {/* Animated progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">{progressPercent}% del total</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${alert.progressColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                    <button
                      className="mt-2 text-xs font-medium transition-colors hover:opacity-80"
                      style={{ color: 'inherit' }}
                      onClick={() => setActiveTab(alert.tab)}
                    >
                      Ver detalles →
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ==================== ACTIVITY TIMELINE ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Actividad Reciente</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 gap-1"
              onClick={() => {
                fetchActivities()
              }}
            >
              <RefreshCw className="w-3 h-3" />
              Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="relative">
                {activities.map((activity, idx) => {
                  const ActivityIcon = ACTIVITY_ICON_MAP[activity.icon] || Ship
                  const isLast = idx === activities.length - 1
                  const colorClass = ACTIVITY_COLOR_MAP[activity.color] || 'bg-slate-500'
                  const targetTab = ACTIVITY_TAB_MAP[activity.type]

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className={`flex gap-3 pb-6 last:pb-0 ${targetTab ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (targetTab) setActiveTab(targetTab as 'shipments' | 'permits' | 'documents')
                      }}
                    >
                      {/* Timeline line and dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full ${colorClass}/15 flex items-center justify-center flex-shrink-0 ring-2 ring-background z-10`}>
                          <ActivityIcon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
                        </div>
                        {!isLast && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pt-1 min-w-0 flex-1 group">
                        <p className="text-sm leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Inbox className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">No hay actividad reciente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
