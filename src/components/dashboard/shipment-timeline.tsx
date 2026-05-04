'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Ship, Calendar, ArrowRight, Eye, Filter, GanttChart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Workflow Stages for Gantt ──────────────────────────────────────────────
const GANTT_STAGES = [
  { name: 'Registrado', color: 'bg-slate-400' },
  { name: 'En documentación', color: 'bg-amber-400' },
  { name: 'Listo para embarque', color: 'bg-violet-400' },
  { name: 'En tránsito', color: 'bg-teal-400' },
  { name: 'En puerto de destino', color: 'bg-sky-400' },
  { name: 'En aduana', color: 'bg-orange-400' },
  { name: 'Entregado', color: 'bg-emerald-400' },
]

const STATUS_COLORS: Record<string, string> = {
  'Registrado': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'En documentación': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Listo para embarque': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  'En tránsito': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'En puerto de destino': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'En aduana': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Entregado': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Con retraso': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_STEP_INDEX: Record<string, number> = {
  'Registrado': 0,
  'En documentación': 1,
  'Listo para embarque': 2,
  'En tránsito': 3,
  'En puerto de destino': 4,
  'En aduana': 5,
  'Entregado': 6,
  'Con retraso': 3,
}

// ── Interface ──────────────────────────────────────────────────────────────
interface Shipment {
  id: string
  reference: string
  origin: string
  destination: string
  originPort: string
  destinationPort: string
  status: string
  cargoType: string
  eta: string | null
  departureDate: string | null
  arrivalDate: string | null
  vessel: { name: string } | null
}

export function ShipmentTimeline() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [hoveredShipment, setHoveredShipment] = useState<string | null>(null)

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shipments?pageSize=50')
      const data = await res.json()
      setShipments(data.shipments || [])
    } catch {
      console.error('Error fetching shipments for timeline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  const filteredShipments = useMemo(() => {
    if (statusFilter === 'all') return shipments
    return shipments.filter(s => s.status === statusFilter)
  }, [shipments, statusFilter])

  const activeShipments = filteredShipments.filter(s => s.status !== 'Entregado' || statusFilter === 'Entregado')
  const displayShipments = activeShipments.slice(0, 12)

  const totalStages = GANTT_STAGES.length

  // Get the stage index for a shipment
  const getStageIndex = (status: string) => STATUS_STEP_INDEX[status] ?? 0

  // Calculate progress percentage for a shipment
  const getProgress = (status: string) => {
    const idx = getStageIndex(status)
    return ((idx + 1) / totalStages) * 100
  }

  // Generate mock timeline dates for visual
  const getTimelineBar = (shipment: Shipment) => {
    const startIdx = 0
    const currentIdx = getStageIndex(shipment.status)
    const isDelayed = shipment.status === 'Con retraso'

    return { startIdx, currentIdx, isDelayed }
  }

  const CARGO_ICONS: Record<string, string> = {
    'Contenedorizado': '📦',
    'Granel Líquido': '⛽',
    'Carga General': '📋',
    'Granel Sólido': '🌾',
    'Perecederos': '❄️',
    'Maquinaria': '⚙️',
    'Granel': '🌾',
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <GanttChart className="w-4 h-4 text-teal-500" />
            Línea de Tiempo de Envíos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GanttChart className="w-4 h-4 text-teal-500" />
              Línea de Tiempo de Envíos
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Progreso de envíos activos a través del flujo de trabajo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Filtrar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="En tránsito">En tránsito</SelectItem>
                <SelectItem value="En aduana">En aduana</SelectItem>
                <SelectItem value="Con retraso">Con retraso</SelectItem>
                <SelectItem value="Entregado">Entregado</SelectItem>
                <SelectItem value="Registrado">Registrado</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="text-[10px]">
              {displayShipments.length} envíos
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Stage Headers */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-[180px_1fr] gap-2">
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Envío
            </div>
            <div className="grid grid-cols-7 gap-0">
              {GANTT_STAGES.map((stage) => (
                <div key={stage.name} className="text-center">
                  <span className="text-[9px] text-muted-foreground font-medium leading-tight block truncate px-0.5">
                    {stage.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Rows */}
        <div className="border-t">
          <AnimatePresence>
            {displayShipments.map((shipment, idx) => {
              const { startIdx, currentIdx, isDelayed } = getTimelineBar(shipment)
              const isHovered = hoveredShipment === shipment.id

              return (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  className={`grid grid-cols-[180px_1fr] gap-2 px-4 py-2.5 border-b hover:bg-muted/30 transition-colors cursor-pointer ${
                    idx % 2 === 1 ? 'bg-muted/10' : ''
                  }`}
                  onMouseEnter={() => setHoveredShipment(shipment.id)}
                  onMouseLeave={() => setHoveredShipment(null)}
                >
                  {/* Shipment Info */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">{CARGO_ICONS[shipment.cargoType] || '📦'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{shipment.reference}</p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="truncate">{shipment.originPort}</span>
                        <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{shipment.destinationPort}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gantt Bar */}
                  <div className="grid grid-cols-7 gap-0 items-center">
                    {GANTT_STAGES.map((stage, stageIdx) => {
                      const isCompleted = stageIdx <= currentIdx && stageIdx >= startIdx
                      const isCurrent = stageIdx === currentIdx
                      const barColor = isDelayed && isCompleted && stageIdx >= 3
                        ? 'bg-red-400'
                        : isCompleted
                          ? stage.color
                          : 'bg-muted-foreground/10'

                      return (
                        <Tooltip key={stage.name}>
                          <TooltipTrigger asChild>
                            <div className="h-8 flex items-center justify-center px-0.5">
                              <motion.div
                                className={`w-full h-5 rounded-sm ${barColor} relative transition-all ${
                                  isCurrent ? 'ring-2 ring-teal-400/50 ring-offset-1' : ''
                                } ${isHovered && isCompleted ? 'opacity-100' : isCompleted ? 'opacity-80' : 'opacity-40'}`}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: idx * 0.03 + stageIdx * 0.02, duration: 0.2 }}
                                style={{ transformOrigin: 'left' }}
                              >
                                {isCurrent && (
                                  <motion.div
                                    className="absolute inset-0 rounded-sm bg-white/20"
                                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                  />
                                )}
                              </motion.div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            {stage.name} {isCompleted ? '✓' : '—'}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {displayShipments.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay envíos para mostrar</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 bg-muted/20 flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Leyenda:</span>
          {GANTT_STAGES.map((stage) => (
            <div key={stage.name} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm ${stage.color}`} />
              <span className="text-[10px] text-muted-foreground">{stage.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
            <span className="text-[10px] text-muted-foreground">Con retraso</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
