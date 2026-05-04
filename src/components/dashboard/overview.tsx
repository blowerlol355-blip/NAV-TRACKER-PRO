'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Ship, FileCheck, Box, Anchor, AlertTriangle, Clock, FileX,
  DollarSign, TrendingUp, Route, ArrowRight, ExternalLink,
  PackageCheck, Sailboat, FileUp, AlertCircle, BarChart3, PieChart as PieChartIcon, Inbox
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

// Activity timeline mock data
const ACTIVITY_DATA = [
  { id: 1, text: 'Envío ENV-2025-003 ha llegado al puerto de destino', time: 'hace 2 horas', color: 'bg-teal-500', icon: Ship },
  { id: 2, text: 'Permiso FITO-2025-00789 ha sido aprobado', time: 'hace 5 horas', color: 'bg-amber-500', icon: FileCheck },
  { id: 3, text: 'Contenedor MSCU-4457823 inspeccionado en aduana', time: 'hace 1 día', color: 'bg-sky-500', icon: PackageCheck },
  { id: 4, text: 'Embarcación MV Caribbean Star ha zarpado', time: 'hace 1 día', color: 'bg-emerald-500', icon: Sailboat },
  { id: 5, text: 'Documento Certificado de Origen subido para ENV-2025-005', time: 'hace 2 días', color: 'bg-orange-500', icon: FileUp },
  { id: 6, text: 'Envío ENV-2025-007 reportado con retraso', time: 'hace 3 días', color: 'bg-red-500', icon: AlertCircle },
]

function PortCodeBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-muted text-foreground">
      {code}
    </span>
  )
}

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

export function Overview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let retries = 0
    const maxRetries = 5
    const fetchData = () => {
      fetch('/api/dashboard')
        .then((res) => {
          if (!res.ok) throw new Error('API error')
          return res.json()
        })
        .then((d) => {
          if (d && d.kpis) {
            setData(d)
            setLoading(false)
          } else {
            throw new Error('Invalid data')
          }
        })
        .catch(() => {
          retries++
          if (retries < maxRetries) {
            setTimeout(fetchData, 2000)
          } else {
            setLoading(false)
          }
        })
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!data) return <div className="text-center text-muted-foreground">Error al cargar datos</div>

  const kpiCards = [
    { title: 'Envíos Activos', value: data.kpis.activeShipments, change: '+12%', icon: Ship, gradientFrom: 'from-teal-500', bgOpacity: 'bg-teal-500/15', textColor: 'text-teal-500', accentColor: 'bg-teal-500' },
    { title: 'Permisos Pendientes', value: data.kpis.pendingPermits, change: '-5%', icon: FileCheck, gradientFrom: 'from-amber-500', bgOpacity: 'bg-amber-500/15', textColor: 'text-amber-500', accentColor: 'bg-amber-500' },
    { title: 'Contenedores en Tránsito', value: data.kpis.inTransitContainers, change: '+8%', icon: Box, gradientFrom: 'from-sky-500', bgOpacity: 'bg-sky-500/15', textColor: 'text-sky-500', accentColor: 'bg-sky-500' },
    { title: 'Embarcaciones Operativas', value: data.kpis.operationalVessels, change: '+2%', icon: Anchor, gradientFrom: 'from-emerald-500', bgOpacity: 'bg-emerald-500/15', textColor: 'text-emerald-500', accentColor: 'bg-emerald-500' },
  ]

  // Determine the most active route from recent shipments
  const routeCounts: Record<string, number> = {}
  data.recentShipments.forEach((s) => {
    const route = `${s.originPort} → ${s.destinationPort}`
    routeCounts[route] = (routeCounts[route] || 0) + 1
  })
  const mostActiveRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'VELGU → USMIA'

  const hasBarData = data.chartData.months && data.chartData.months.length > 0
  const hasPieData = data.chartData.statusDistribution && data.chartData.statusDistribution.length > 0

  return (
    <div className="space-y-6">
      {/* KPI Cards - Enhanced with gradient accent, hover effects, watermark icons */}
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
              <Card className="relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                {/* Left gradient accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${kpi.accentColor}`} />

                {/* Watermark icon in background */}
                <div className="absolute -bottom-3 -right-3 opacity-[0.06] group-hover:opacity-[0.09] transition-opacity duration-300">
                  <Icon className="w-24 h-24" />
                </div>

                <CardContent className="p-5 pl-5">
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                      <p className="text-4xl font-bold mt-1 tracking-tight">{kpi.value}</p>
                      <p className={`text-xs mt-1.5 font-medium ${kpi.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                        {kpi.change} vs. mes anterior
                      </p>
                    </div>
                    <div className={`w-11 h-11 rounded-xl ${kpi.bgOpacity} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${kpi.textColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <Card className="bg-muted/40">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Valor total en tránsito:</span>
                <span className="text-sm font-bold">$12,450,000</span>
              </div>

              <Separator orientation="vertical" className="hidden sm:block h-6" />

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Tiempo promedio de tránsito:</span>
                <span className="text-sm font-bold">18 días</span>
              </div>

              <Separator orientation="vertical" className="hidden md:block h-6" />

              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-500" />
                <span className="text-sm text-muted-foreground">Tasa de entrega a tiempo:</span>
                <span className="text-sm font-bold">87%</span>
              </div>

              <Separator orientation="vertical" className="hidden lg:block h-6" />

              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-sky-500" />
                <span className="text-sm text-muted-foreground">Ruta más activa:</span>
                <span className="text-sm font-bold">{mostActiveRoute}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-500" />
                Envíos por Mes
              </CardTitle>
              <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div style={{ width: '100%', height: 280, minHeight: 280 }}>
                {hasBarData ? (
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
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="envios" fill="url(#barGradient)" radius={[6, 6, 0, 0]} filter="url(#barShadow)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState icon={BarChart3} title="Envíos por Mes" />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-teal-500" />
                Estado de Envíos
              </CardTitle>
              <p className="text-xs text-muted-foreground">Distribución actual</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div style={{ width: '100%', height: 280, minHeight: 280 }}>
                {hasPieData ? (
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
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px' }}
                        formatter={(value: string) => <span className="text-foreground">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState icon={PieChartIcon} title="Estado de Envíos" />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Shipments Table - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Envíos Recientes</CardTitle>
            <button className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium flex items-center gap-1 transition-colors">
              Ver todos
              <ExternalLink className="w-3 h-3" />
            </button>
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
                  {data.recentShipments.map((s, idx) => (
                    <TableRow key={s.id} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                      <TableCell className="font-medium text-sm">{s.reference}</TableCell>
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
                        {s.eta ? new Date(s.eta).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—'}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-xs">{s.blNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts - Enhanced with pulse, shadow, and link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-amber-400 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center relative">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  {data.alerts.expiringPermits > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Permisos por vencer</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.alerts.expiringPermits}</p>
                </div>
              </div>
              <button className="mt-2 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium transition-colors">
                Ver detalles →
              </button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-400 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center relative">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  {data.alerts.delayedShipments > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Envíos con retraso</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.alerts.delayedShipments}</p>
                </div>
              </div>
              <button className="mt-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors">
                Ver detalles →
              </button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-400 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center relative">
                  <FileX className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  {data.alerts.pendingDocuments > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Documentos pendientes</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{data.alerts.pendingDocuments}</p>
                </div>
              </div>
              <button className="mt-2 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors">
                Ver detalles →
              </button>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {ACTIVITY_DATA.map((activity, idx) => {
                const ActivityIcon = activity.icon
                const isLast = idx === ACTIVITY_DATA.length - 1
                return (
                  <div key={activity.id} className="flex gap-3 pb-6 last:pb-0">
                    {/* Timeline line and dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full ${activity.color}/15 flex items-center justify-center flex-shrink-0 ring-2 ring-background z-10`}>
                        <ActivityIcon className={`w-4 h-4 ${activity.color.replace('bg-', 'text-')}`} />
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pt-1 min-w-0">
                      <p className="text-sm leading-snug">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
