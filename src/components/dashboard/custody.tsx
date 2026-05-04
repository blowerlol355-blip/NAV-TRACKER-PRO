'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ArrowRight, CheckCircle2, Clock, AlertTriangle, Thermometer, Shield,
  Link2, Plus, Search, Ship, Package, ArrowLeftRight, User,
  FileCheck, ChevronDown, ChevronRight, Eye, ArrowUpDown,
  ThermometerSnowflake, ThermometerSun, Lock, Unlock, Flag,
  MapPin, Calendar
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const STAGE_LABELS: Record<string, string> = {
  'Productor': 'Productor',
  'Acopio': 'Acopio/Cooperativa',
  'Cooperativa': 'Coop. / Acopio',
  'Exportador': 'Exportador',
  'Agente de carga': 'Agente de Carga',
  'Naviera': 'Naviera',
  'Agente en destino': 'Agente en Destino',
  'Agente destino': 'Agente en Destino',
  'Importador': 'Importador',
}

const STAGE_ORDER = ['Productor', 'Acopio', 'Cooperativa', 'Exportador', 'Agente de carga', 'Naviera', 'Agente en destino', 'Agente destino', 'Importador']

const STAGE_ICONS: Record<string, string> = {
  'Productor': '🌾',
  'Acopio': '🏭',
  'Cooperativa': '🏗️',
  'Exportador': '📦',
  'Agente de carga': '🚛',
  'Naviera': '🚢',
  'Agente en destino': '🏢',
  'Agente destino': '🏢',
  'Importador': '🏪',
}

const CUSTODY_STATUS_COLORS: Record<string, string> = {
  'Completado': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'En proceso': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Pendiente': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const CUSTODY_STATUS_DOT: Record<string, string> = {
  'Completado': 'bg-emerald-500',
  'En proceso': 'bg-amber-500',
  'Pendiente': 'bg-slate-400',
}

const CUSTODY_STATUS_LINE: Record<string, string> = {
  'Completado': 'bg-emerald-500',
  'En proceso': 'bg-amber-400',
  'Pendiente': 'bg-slate-300 dark:bg-slate-600',
}

const ALL_STAGES = ['Productor', 'Acopio', 'Exportador', 'Agente de carga', 'Naviera', 'Agente en destino', 'Importador']
const ALL_CUSTODY_STATUSES = ['Completado', 'En proceso', 'Pendiente']

interface Condition {
  condition: string
  verified: boolean
}

interface CustodyRecord {
  id: string
  shipmentId: string
  stage: string
  fromParty: string
  toParty: string
  transferDate: string
  responsiblePerson: string | null
  conditionsVerified: string | null
  digitalSignature: string | null
  photoEvidence: string | null
  temperature: number | null
  sealsIntact: boolean | null
  notes: string | null
  status: string
  createdAt: string
  updatedAt: string
  shipment: {
    reference: string
    status: string
    origin: string
    destination: string
    cargoType: string
  }
}

interface ShipmentOption {
  id: string
  reference: string
  origin: string
  destination: string
  cargoType: string
  status: string
}

function parseConditions(condStr: string | null): Condition[] {
  if (!condStr) return []
  try {
    const parsed = JSON.parse(condStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getTempColor(temp: number | null): string {
  if (temp === null) return 'text-muted-foreground'
  if (temp < -10) return 'text-blue-600 dark:text-blue-400'
  if (temp < 5) return 'text-cyan-600 dark:text-cyan-400'
  if (temp < 15) return 'text-teal-600 dark:text-teal-400'
  if (temp < 25) return 'text-emerald-600 dark:text-emerald-400'
  if (temp < 35) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getTempBg(temp: number | null): string {
  if (temp === null) return 'bg-muted/50'
  if (temp < -10) return 'bg-blue-50 dark:bg-blue-950/30'
  if (temp < 5) return 'bg-cyan-50 dark:bg-cyan-950/30'
  if (temp < 15) return 'bg-teal-50 dark:bg-teal-950/30'
  if (temp < 25) return 'bg-emerald-50 dark:bg-emerald-950/30'
  if (temp < 35) return 'bg-amber-50 dark:bg-amber-950/30'
  return 'bg-red-50 dark:bg-red-950/30'
}

export function Custody() {
  const [records, setRecords] = useState<CustodyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchShipment, setSearchShipment] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addingRecord, setAddingRecord] = useState(false)
  const [shipments, setShipments] = useState<ShipmentOption[]>([])

  useEffect(() => {
    fetch('/api/custody')
      .then((r) => r.json())
      .then((d) => { setRecords(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/shipments?pageSize=100')
      .then((r) => r.json())
      .then((d) => {
        const shipmentList = (d.shipments || []).map((s: { id: string; reference: string; origin: string; destination: string; cargoType: string; status: string }) => ({
          id: s.id,
          reference: s.reference,
          origin: s.origin,
          destination: s.destination,
          cargoType: s.cargoType,
          status: s.status,
        }))
        setShipments(shipmentList)
      })
      .catch(() => {})
  }, [])

  // Group records by shipment
  const shipmentGroups = useMemo(() => {
    const groups: Record<string, CustodyRecord[]> = {}
    records.forEach(r => {
      if (!groups[r.shipmentId]) groups[r.shipmentId] = []
      groups[r.shipmentId].push(r)
    })
    // Sort each group by stage order
    Object.values(groups).forEach(group => {
      group.sort((a, b) => {
        const idxA = STAGE_ORDER.indexOf(a.stage)
        const idxB = STAGE_ORDER.indexOf(b.stage)
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB)
      })
    })
    return groups
  }, [records])

  // Filtered shipment IDs
  const filteredShipmentIds = useMemo(() => {
    let ids = Object.keys(shipmentGroups)
    if (selectedShipmentId !== 'all') {
      ids = ids.filter(id => id === selectedShipmentId)
    }
    if (statusFilter !== 'all') {
      ids = ids.filter(id => shipmentGroups[id].some(r => r.status === statusFilter))
    }
    if (searchShipment) {
      ids = ids.filter(id => {
        const group = shipmentGroups[id]
        const firstRecord = group[0]
        return firstRecord?.shipment?.reference?.toLowerCase().includes(searchShipment.toLowerCase()) ||
          firstRecord?.shipment?.origin?.toLowerCase().includes(searchShipment.toLowerCase()) ||
          firstRecord?.shipment?.destination?.toLowerCase().includes(searchShipment.toLowerCase())
      })
    }
    return ids
  }, [shipmentGroups, selectedShipmentId, statusFilter, searchShipment])

  // Stats
  const totalTransfers = records.length
  const completedTransfers = records.filter(r => r.status === 'Completado').length
  const inProgressTransfers = records.filter(r => r.status === 'En proceso').length
  const withIncidents = records.filter(r => {
    const conds = parseConditions(r.conditionsVerified)
    return conds.some(c => !c.verified) || r.sealsIntact === false
  }).length

  const handleAddRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAddingRecord(true)
    const form = new FormData(e.currentTarget)
    const conditions = [
      { condition: 'Temperatura verificada', verified: form.get('condTemp') === 'on' },
      { condition: 'Sellos intactos', verified: form.get('condSeals') === 'on' },
      { condition: 'Documentación completa', verified: form.get('condDocs') === 'on' },
    ]

    const body = {
      shipmentId: form.get('shipmentId') as string,
      stage: form.get('stage') as string,
      fromParty: form.get('fromParty') as string,
      toParty: form.get('toParty') as string,
      responsiblePerson: form.get('responsiblePerson') as string || null,
      temperature: form.get('temperature') ? parseFloat(form.get('temperature') as string) : null,
      sealsIntact: form.get('sealsIntact') === 'on' ? true : form.get('sealsIntact') === 'off' ? false : null,
      conditionsVerified: JSON.stringify(conditions),
      notes: form.get('notes') as string || null,
      status: form.get('recordStatus') as string || 'Pendiente',
    }
    try {
      await fetch('/api/custody', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      toast.success('Registro de custodia creado exitosamente')
      setShowAdd(false)
      const res = await fetch('/api/custody')
      setRecords(await res.json())
    } catch {
      toast.error('Error al crear registro de custodia')
    } finally {
      setAddingRecord(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-32 rounded-full" />)}
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3"><Skeleton className="h-96 w-full rounded-xl" /></div>
          <div className="col-span-9"><Skeleton className="h-96 w-full rounded-xl" /></div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
        {/* Summary Stats Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
            <ArrowLeftRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{totalTransfers} Transferencias</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{completedTransfers} Completadas</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{inProgressTransfers} En proceso</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">{withIncidents} Con incidencias</span>
          </div>
          <div className="ml-auto">
            <Button onClick={() => setShowAdd(true)} className="h-9 bg-teal-600 hover:bg-teal-700 gap-1.5 group">
              <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
              Nuevo Registro
            </Button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Sidebar - Shipment List */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Ship className="w-4 h-4 text-teal-500" />
                  Envíos ({filteredShipmentIds.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Search & Filter */}
                <div className="px-3 pb-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar envío..."
                      value={searchShipment}
                      onChange={(e) => setSearchShipment(e.target.value)}
                      className="pl-8 h-8 text-xs bg-muted/50 border-0"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs bg-muted/50 border-0">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {ALL_CUSTODY_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="max-h-[calc(100vh-440px)]">
                  <div className="space-y-1 px-2 pb-2">
                    {filteredShipmentIds.map((shipmentId) => {
                      const group = shipmentGroups[shipmentId]
                      const firstRecord = group[0]
                      const shipment = firstRecord?.shipment
                      const isSelected = selectedShipmentId === shipmentId
                      const completedCount = group.filter(r => r.status === 'Completado').length
                      const progressPct = group.length > 0 ? Math.round((completedCount / group.length) * 100) : 0
                      const hasIncident = group.some(r => {
                        const conds = parseConditions(r.conditionsVerified)
                        return conds.some(c => !c.verified) || r.sealsIntact === false
                      })

                      return (
                        <motion.button
                          key={shipmentId}
                          whileHover={{ x: 2 }}
                          onClick={() => setSelectedShipmentId(isSelected ? 'all' : shipmentId)}
                          className={`w-full text-left p-2.5 rounded-lg transition-all text-xs group ${
                            isSelected
                              ? 'bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 shadow-sm'
                              : 'hover:bg-muted/50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">
                              {shipment?.reference || shipmentId.slice(0, 8)}
                            </span>
                            {hasIncident && (
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {shipment?.origin} → {shipment?.destination}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-muted-foreground">{completedCount}/{group.length} etapas</span>
                            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  progressPct === 100 ? 'bg-emerald-500' : progressPct > 50 ? 'bg-teal-500' : progressPct > 0 ? 'bg-amber-500' : 'bg-muted'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                    {filteredShipmentIds.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No se encontraron envíos</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Timeline */}
          <div className="col-span-12 lg:col-span-9">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-teal-500" />
                    Cadena de Custodia
                  </CardTitle>
                  {selectedShipmentId !== 'all' && shipmentGroups[selectedShipmentId]?.[0]?.shipment && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {shipmentGroups[selectedShipmentId][0].shipment.reference}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredShipmentIds.length === 0 ? (
                  <div className="text-center py-12">
                    <Link2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No hay registros de custodia</p>
                    <p className="text-xs text-muted-foreground mt-1">Seleccione un envío o agregue un nuevo registro</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[calc(100vh-400px)]">
                    <div className="space-y-4">
                      {filteredShipmentIds.map((shipmentId) => {
                        const group = shipmentGroups[shipmentId]
                        const shipment = group[0]?.shipment

                        return (
                          <div key={shipmentId} className="space-y-0">
                            {/* Shipment Header */}
                            <div className="flex items-center gap-3 mb-3 p-3 bg-gradient-to-r from-teal-50/80 via-transparent to-cyan-50/80 dark:from-teal-950/20 dark:to-cyan-950/20 rounded-lg">
                              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                <Ship className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold font-mono text-teal-600 dark:text-teal-400">
                                  {shipment?.reference || shipmentId.slice(0, 8)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {shipment?.origin} → {shipment?.destination} • {shipment?.cargoType}
                                </p>
                              </div>
                            </div>

                            {/* Timeline */}
                            <div className="relative ml-4">
                              {group.map((record, idx) => {
                                const conditions = parseConditions(record.conditionsVerified)
                                const hasFailedConditions = conditions.some(c => !c.verified)
                                const isLast = idx === group.length - 1
                                const stageIcon = STAGE_ICONS[record.stage] || '📋'
                                const stageLabel = STAGE_LABELS[record.stage] || record.stage

                                return (
                                  <motion.div
                                    key={record.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="relative pl-8 pb-6"
                                  >
                                    {/* Connecting Line */}
                                    {!isLast && (
                                      <div className={`absolute left-[11px] top-6 bottom-0 w-[2px] ${CUSTODY_STATUS_LINE[record.status] || 'bg-slate-300'}`} />
                                    )}

                                    {/* Timeline Dot */}
                                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      record.status === 'Completado'
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                        : record.status === 'En proceso'
                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 animate-pulse'
                                        : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                                    }`}>
                                      {record.status === 'Completado' ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      ) : record.status === 'En proceso' ? (
                                        <Clock className="w-3.5 h-3.5" />
                                      ) : (
                                        <span className="text-[10px]">{idx + 1}</span>
                                      )}
                                    </div>

                                    {/* Content Card */}
                                    <Card className={`overflow-hidden transition-all hover:shadow-md ${
                                      record.status === 'Completado' ? 'border-l-2 border-l-emerald-500' :
                                      record.status === 'En proceso' ? 'border-l-2 border-l-amber-500' :
                                      'border-l-2 border-l-slate-300 dark:border-l-slate-600'
                                    }`}>
                                      <CardContent className="p-3">
                                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-base">{stageIcon}</span>
                                            <div>
                                              <p className="text-sm font-semibold">{stageLabel}</p>
                                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(record.transferDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                              </p>
                                            </div>
                                          </div>
                                          <Badge variant="secondary" className={`text-[10px] ${CUSTODY_STATUS_COLORS[record.status] || ''}`}>
                                            {record.status}
                                          </Badge>
                                        </div>

                                        {/* From → To */}
                                        <div className="flex items-center gap-2 mb-2 p-2 bg-muted/30 rounded-md">
                                          <span className="text-xs font-medium">{record.fromParty}</span>
                                          <ArrowRight className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                          <span className="text-xs font-medium">{record.toParty}</span>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                          {/* Responsible */}
                                          {record.responsiblePerson && (
                                            <div className="p-1.5 bg-muted/20 rounded text-center">
                                              <p className="text-[9px] text-muted-foreground">Responsable</p>
                                              <p className="text-[11px] font-medium flex items-center justify-center gap-1">
                                                <User className="w-3 h-3 text-muted-foreground" />
                                                {record.responsiblePerson}
                                              </p>
                                            </div>
                                          )}

                                          {/* Temperature */}
                                          <div className={`p-1.5 rounded text-center ${getTempBg(record.temperature)}`}>
                                            <p className="text-[9px] text-muted-foreground">Temperatura</p>
                                            <p className={`text-[11px] font-semibold flex items-center justify-center gap-1 ${getTempColor(record.temperature)}`}>
                                              {record.temperature !== null ? (
                                                <>
                                                  {record.temperature < 10 ? <ThermometerSnowflake className="w-3 h-3" /> : <ThermometerSun className="w-3 h-3" />}
                                                  {record.temperature}°C
                                                </>
                                              ) : (
                                                <span className="text-muted-foreground">—</span>
                                              )}
                                            </p>
                                          </div>

                                          {/* Seals */}
                                          <div className="p-1.5 bg-muted/20 rounded text-center">
                                            <p className="text-[9px] text-muted-foreground">Sellos</p>
                                            <p className="text-[11px] font-semibold flex items-center justify-center gap-1">
                                              {record.sealsIntact === true ? (
                                                <>
                                                  <Lock className="w-3 h-3 text-emerald-500" />
                                                  <span className="text-emerald-600 dark:text-emerald-400">Intactos</span>
                                                </>
                                              ) : record.sealsIntact === false ? (
                                                <>
                                                  <Unlock className="w-3 h-3 text-red-500" />
                                                  <span className="text-red-600 dark:text-red-400">Rotos</span>
                                                </>
                                              ) : (
                                                <span className="text-muted-foreground">—</span>
                                              )}
                                            </p>
                                          </div>

                                          {/* Conditions */}
                                          {conditions.length > 0 && (
                                            <div className="p-1.5 bg-muted/20 rounded text-center">
                                              <p className="text-[9px] text-muted-foreground">Condiciones</p>
                                              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                                {conditions.map((cond, ci) => (
                                                  <Tooltip key={ci}>
                                                    <TooltipTrigger asChild>
                                                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                                                        cond.verified
                                                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                      }`}>
                                                        {cond.verified ? '✓' : '✗'}
                                                      </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-[200px] text-xs">
                                                      <p>{cond.condition}: {cond.verified ? 'Verificado' : 'No verificado'}</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Conditions Detail (if any failed) */}
                                        {hasFailedConditions && (
                                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                                            <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                                              <AlertTriangle className="w-3 h-3" />
                                              Condiciones no verificadas
                                            </p>
                                            <ul className="mt-1 space-y-0.5">
                                              {conditions.filter(c => !c.verified).map((cond, ci) => (
                                                <li key={ci} className="text-[10px] text-red-500 dark:text-red-300">• {cond.condition}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {/* Notes */}
                                        {record.notes && (
                                          <p className="mt-2 text-[10px] text-muted-foreground italic">📝 {record.notes}</p>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                )
                              })}

                              {/* End marker */}
                              <div className="relative pl-8">
                                <div className="absolute left-[9px] top-0 w-2.5 h-2.5 rounded-full border-2 border-muted-foreground/30 bg-background" />
                                <p className="text-[10px] text-muted-foreground pt-0.5">Fin de la cadena</p>
                              </div>
                            </div>

                            {/* Separator between shipments */}
                            <Separator className="my-4" />
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Custody Record Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 rounded-t-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
              <DialogTitle className="text-white text-lg font-bold flex items-center gap-2 relative z-10">
                <Plus className="w-5 h-5" />
                Nuevo Registro de Custodia
              </DialogTitle>
              <p className="text-teal-100 text-xs mt-1 relative z-10">Registre una nueva transferencia en la cadena de custodia</p>
            </div>

            <form onSubmit={handleAddRecord} className="p-5 space-y-5">
              {/* Envío y Etapa */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Ship className="w-3.5 h-3.5 text-teal-500" />
                  Envío y Etapa
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Envío</Label>
                    <Select name="shipmentId" required>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar envío" /></SelectTrigger>
                      <SelectContent>
                        {shipments.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="font-mono">{s.reference}</span> — {s.origin} → {s.destination}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Etapa</Label>
                    <Select name="stage" defaultValue="Productor">
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_STAGES.map(s => <SelectItem key={s} value={s}>{STAGE_ICONS[s] || ''} {s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Transferencia */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-teal-500" />
                  Transferencia
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">De (Parte origen)</Label>
                    <Input name="fromParty" placeholder="Nombre de la parte" required className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">A (Parte destino)</Label>
                    <Input name="toParty" placeholder="Nombre de la parte" required className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Persona responsable</Label>
                    <Input name="responsiblePerson" placeholder="Nombre del responsable" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Estado</Label>
                    <Select name="recordStatus" defaultValue="Pendiente">
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_CUSTODY_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Condiciones */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-teal-500" />
                  Condiciones de Transporte
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Temperatura (°C)</Label>
                    <Input name="temperature" type="number" step="0.1" placeholder="Ej: 4.5" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sellos intactos</Label>
                    <Select name="sealsIntact" defaultValue="null">
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Sin verificar</SelectItem>
                        <SelectItem value="on">Sí - Intactos</SelectItem>
                        <SelectItem value="off">No - Rotos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Condition Checkboxes (as toggles) */}
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Verificación de condiciones</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'condTemp', label: '🌡️ Temperatura verificada' },
                      { name: 'condSeals', label: '🔒 Sellos verificados' },
                      { name: 'condDocs', label: '📄 Documentación completa' },
                    ].map(cond => (
                      <label key={cond.name} className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs cursor-pointer hover:bg-muted/50 transition-colors">
                        <input type="checkbox" name={cond.name} className="rounded border-muted-foreground/30 text-teal-600 focus:ring-teal-500" />
                        {cond.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notas */}
              <div className="space-y-1.5">
                <Label className="text-xs">Notas</Label>
                <Input name="notes" placeholder="Observaciones adicionales" className="h-8 text-sm" />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={addingRecord}>
                  {addingRecord ? 'Registrando...' : 'Registrar Transferencia'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  )
}
