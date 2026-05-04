'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Box, Scale } from 'lucide-react'
import { motion } from 'framer-motion'

const CONTAINER_STATUS_COLORS: Record<string, string> = {
  'Vacío': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Cargado': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'Lleno': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'En tránsito': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'En espera': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Descargado': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'En inspección': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'En aduana': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

const CONTAINER_STATUS_BORDER: Record<string, string> = {
  'Vacío': 'border-l-slate-400',
  'Cargado': 'border-l-teal-500',
  'Lleno': 'border-l-teal-500',
  'En tránsito': 'border-l-sky-500',
  'En espera': 'border-l-amber-500',
  'Descargado': 'border-l-emerald-500',
  'En inspección': 'border-l-amber-500',
  'En aduana': 'border-l-orange-500',
}

const CONTAINER_TYPE_ICONS: Record<string, string> = {
  "20' Estándar": '📦',
  "40' Estándar": '📦',
  "40' High Cube": '📦⬆️',
  '20ft Dry': '📦',
  '40ft Dry': '📦',
  '40ft HC': '📦⬆️',
  'Refrigerado': '❄️',
  '20ft Refrigerado': '❄️',
  '40ft Refrigerado': '❄️',
  'Tanque': '🛢️',
  'Open Top': '📦⬆️',
  '20ft Open Top': '📦⬆️',
}

// Max weight by container type in tons (approximate)
const CONTAINER_MAX_WEIGHT: Record<string, number> = {
  "20' Estándar": 24,
  "40' Estándar": 30,
  "40' High Cube": 30,
  '20ft Dry': 24,
  '40ft Dry': 30,
  '40ft HC': 30,
  'Refrigerado': 27,
  '20ft Refrigerado': 24,
  '40ft Refrigerado': 30,
  'Tanque': 26,
  'Open Top': 28,
  '20ft Open Top': 24,
}

const CONTAINER_TYPES = ['20ft Dry', '40ft Dry', '40ft HC', '20ft Refrigerado', '40ft Refrigerado', '20ft Open Top']

interface Container {
  id: string
  number: string
  type: string
  sealNumber: string | null
  weight: number
  status: string
  shipment: { reference: string }
}

function getWeightPercent(weight: number, type: string): number {
  const maxWeight = CONTAINER_MAX_WEIGHT[type] || 28
  return Math.min(100, Math.round((weight / maxWeight) * 100))
}

function getWeightColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 70) return 'bg-amber-500'
  return 'bg-teal-500'
}

export function Containers() {
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const fetchContainers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, type: typeFilter })
      const res = await fetch(`/api/containers?${params}`)
      const data = await res.json()
      setContainers(data)
    } catch {
      console.error('Error fetching containers')
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter])

  useEffect(() => {
    fetchContainers()
  }, [fetchContainers])

  // Stats
  const totalContainers = containers.length
  const statusCounts: Record<string, number> = {}
  containers.forEach(c => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Summary Stats Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
          <Box className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{totalContainers} Total</span>
        </div>
        {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
          <div key={status} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
            <Badge variant="secondary" className={`text-[9px] h-4 px-1.5 ${CONTAINER_STATUS_COLORS[status] || ''}`}>
              {count}
            </Badge>
            <span className="text-xs font-medium text-muted-foreground">{status}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por número o sello..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {CONTAINER_TYPES.map((t) => <SelectItem key={t} value={t}>{CONTAINER_TYPE_ICONS[t] || '📦'} {t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Box className="w-4 h-4 text-teal-500" /> Contenedores ({containers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-340px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sello</TableHead>
                    <TableHead>Peso (ton)</TableHead>
                    <TableHead>Carga</TableHead>
                    <TableHead>Envío</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {containers.map((c) => {
                    const weightPercent = getWeightPercent(c.weight, c.type)
                    const typeIcon = CONTAINER_TYPE_ICONS[c.type] || '📦'

                    return (
                      <TableRow key={c.id} className={`border-l-4 ${CONTAINER_STATUS_BORDER[c.status] || ''}`}>
                        <TableCell className="font-medium text-sm font-mono">{c.number}</TableCell>
                        <TableCell className="text-sm">
                          <span className="mr-1">{typeIcon}</span>{c.type}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.sealNumber ? (
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted/70">{c.sealNumber}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{c.weight.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${getWeightColor(weightPercent)}`}
                                style={{ width: `${weightPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium w-8 text-right">{weightPercent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{c.shipment?.reference || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-xs ${CONTAINER_STATUS_COLORS[c.status] || ''}`}>{c.status}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
