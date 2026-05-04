'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Ship, FileCheck, Box, Anchor, AlertTriangle, Clock, FileX } from 'lucide-react'
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

const PIE_COLORS = ['#14b8a6', '#f59e0b', '#0ea5e9', '#22c55e', '#f97316', '#64748b', '#ef4444']

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

export function Overview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!data) return <div className="text-center text-muted-foreground">Error al cargar datos</div>

  const kpiCards = [
    { title: 'Envíos Activos', value: data.kpis.activeShipments, change: '+12%', icon: Ship, bg: 'bg-teal-500', textColor: 'text-teal-500' },
    { title: 'Perm. Pendientes', value: data.kpis.pendingPermits, change: '-5%', icon: FileCheck, bg: 'bg-amber-500', textColor: 'text-amber-500' },
    { title: 'Contenedores en Tránsito', value: data.kpis.inTransitContainers, change: '+8%', icon: Box, bg: 'bg-sky-500', textColor: 'text-sky-500' },
    { title: 'Embarcaciones Operativas', value: data.kpis.operationalVessels, change: '+2%', icon: Anchor, bg: 'bg-emerald-500', textColor: 'text-emerald-500' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
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
              <Card className="relative overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                      <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                      <p className={`text-xs mt-1 ${kpi.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                        {kpi.change} vs. mes anterior
                      </p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${kpi.bg} bg-opacity-15 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${kpi.textColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Envíos por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.chartData.months}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="envios" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Estado de Envíos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
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
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Shipments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Envíos Recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-72">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Origen → Destino</TableHead>
                    <TableHead>Tipo Carga</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>BL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentShipments.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-sm">{s.reference}</TableCell>
                      <TableCell className="text-sm">
                        <span>{s.origin}</span>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span>{s.destination}</span>
                      </TableCell>
                      <TableCell className="text-sm">{s.cargoType}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${STATUS_COLORS[s.status] || ''}`}>
                          {s.status}
                        </Badge>
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

      {/* Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.4 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-amber-400">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Permisos por vencer</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.alerts.expiringPermits}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-400">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Envíos con retraso</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.alerts.delayedShipments}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-400">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <FileX className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Documentos pendientes</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{data.alerts.pendingDocuments}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
