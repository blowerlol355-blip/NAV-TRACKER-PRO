'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import {
  Search, Plus, ChevronLeft, ChevronRight, Ship, ArrowRight, CheckCircle2,
  FileCheck, Box, FileText, Anchor, Calendar, Weight, DollarSign, Navigation,
  RefreshCw, MapPin, ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  'Registrado': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'En documentación': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'En tránsito': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'En puerto de destino': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'En aduana': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Entregado': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Con retraso': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Pendiente de despacho': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const STATUS_PROGRESS: Record<string, number> = {
  'Registrado': 0,
  'En documentación': 20,
  'En tránsito': 40,
  'En puerto de destino': 60,
  'En aduana': 80,
  'Entregado': 100,
  'Con retraso': 40,
  'Pendiente de despacho': 10,
}

const CARGO_ICONS: Record<string, string> = {
  'Contenedorizado': '🚢',
  'Granel Líquido': '⛽',
  'Carga General': '📦',
  'Granel Sólido': '🌾',
  'Perecederos': '❄️',
  'Maquinaria': '⚙️',
  'Peligrosa': '⚠️',
  'Granel': '🌾',
  'Proyecto': '🏗️',
}

const STATUS_STEPS = ['Registrado', 'En documentación', 'En tránsito', 'En puerto de destino', 'En aduana', 'Entregado']

const CARGO_TYPES = ['Contenedorizado', 'Granel', 'Granel Sólido', 'Granel Líquido', 'Carga General', 'Perecederos', 'Peligrosa', 'Proyecto', 'Maquinaria']
const ALL_STATUSES = ['Registrado', 'En documentación', 'En tránsito', 'En puerto de destino', 'En aduana', 'Entregado', 'Con retraso', 'Pendiente de despacho']

interface Shipment {
  id: string
  reference: string
  blNumber: string
  origin: string
  destination: string
  originPort: string
  destinationPort: string
  status: string
  cargoType: string
  weight: number
  containerCount: number
  value: number | null
  eta: string | null
  departureDate: string | null
  arrivalDate: string | null
  vesselId: string | null
  clientName: string | null
  vessel: { id: string; name: string; imo: string } | null
  permits: { id: string; type: string; number: string; status: string }[]
  containers: { id: string; number: string; type: string; status: string; weight: number }[]
  documents: { id: string; name: string; type: string; status: string }[]
}

export function Shipments() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cargoFilter, setCargoFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [vessels, setVessels] = useState<{ id: string; name: string }[]>([])
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        cargoType: cargoFilter,
        page: page.toString(),
        pageSize: '10',
      })
      const res = await fetch(`/api/shipments?${params}`)
      const data = await res.json()
      setShipments(data.shipments || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch {
      console.error('Error fetching shipments')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, cargoFilter, page])

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  useEffect(() => {
    fetch('/api/vessels')
      .then((r) => r.json())
      .then((v) => setVessels(v))
      .catch(() => {})
  }, [])

  const activeFilterCount = [statusFilter !== 'all', cargoFilter !== 'all', search !== ''].filter(Boolean).length

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = {
      reference: `SHP-2026-${String(Date.now()).slice(-3)}`,
      blNumber: form.get('blNumber') as string || 'PENDIENTE',
      origin: form.get('origin') as string,
      destination: form.get('destination') as string,
      originPort: form.get('originPort') as string,
      destinationPort: form.get('destinationPort') as string,
      cargoType: form.get('cargoType') as string,
      weight: parseFloat(form.get('weight') as string) || 0,
      containerCount: parseInt(form.get('containerCount') as string) || 0,
      value: parseFloat(form.get('value') as string) || null,
      clientName: form.get('clientName') as string,
      vesselId: form.get('vesselId') as string || null,
      status: 'Registrado',
      eta: form.get('eta') as string || null,
      departureDate: null,
    }
    await fetch('/api/shipments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowAdd(false)
    fetchShipments()
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedShipment) return
    setUpdatingStatus(true)
    try {
      const res = await fetch('/api/shipments/' + selectedShipment.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSelectedShipment(updated)
        fetchShipments()
        toast.success('Estado actualizado exitosamente')
      } else {
        toast.error('Error al actualizar el estado')
      }
    } catch {
      toast.error('Error al actualizar el estado')
    } finally {
      setUpdatingStatus(false)
      setShowStatusUpdate(false)
    }
  }

  const getStatusStepIndex = (status: string) => {
    if (status === 'Con retraso') return -1
    return STATUS_STEPS.indexOf(status)
  }

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(1)} ton`
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Filter Bar */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-teal-50/80 via-white to-cyan-50/80 dark:from-teal-950/30 dark:via-background dark:to-cyan-950/30 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por referencia, BL, cliente..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-9 h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm"
                />
              </div>
              <div className="relative">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-[180px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Select value={cargoFilter} onValueChange={(v) => { setCargoFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-[180px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                    <SelectValue placeholder="Tipo de carga" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {CARGO_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-6 px-2 text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                  {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
                </Badge>
              )}
              <div className="ml-auto">
                <Button
                  onClick={() => setShowAdd(true)}
                  className="h-9 bg-teal-600 hover:bg-teal-700 gap-1.5 group"
                >
                  <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                  Nuevo Envío
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Envíos ({total})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[calc(100vh-320px)]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-xs font-semibold">Referencia</TableHead>
                      <TableHead className="text-xs font-semibold">Ruta</TableHead>
                      <TableHead className="text-xs font-semibold">Tipo Carga</TableHead>
                      <TableHead className="text-xs font-semibold">Peso</TableHead>
                      <TableHead className="text-xs font-semibold">Estado</TableHead>
                      <TableHead className="text-xs font-semibold">ETA</TableHead>
                      <TableHead className="text-xs font-semibold">Embarcación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((s, rowIndex) => (
                      <TableRow
                        key={s.id}
                        className={`cursor-pointer border-l-4 border-l-transparent hover:border-l-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all ${rowIndex % 2 === 1 ? 'bg-muted/20 hover:bg-teal-50/50 dark:hover:bg-teal-950/20' : ''}`}
                        onClick={() => { setSelectedShipment(s); setShowDetail(true) }}
                      >
                        <TableCell>
                          <div>
                            <span className="font-medium text-sm">{s.reference}</span>
                            <p className="text-[10px] text-muted-foreground font-mono">{s.blNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-5 bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800">
                              {s.originPort}
                            </Badge>
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-5 bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800">
                              {s.destinationPort}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[180px]">{s.clientName || '—'}</p>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="mr-1">{CARGO_ICONS[s.cargoType] || '📦'}</span>
                          <span className="text-xs">{s.cargoType}</span>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-xs">{formatWeight(s.weight)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-xs ${STATUS_COLORS[s.status] || ''}`}>
                            {s.status}
                          </Badge>
                          <div className="mt-1 w-full max-w-[100px]">
                            <Progress
                              value={STATUS_PROGRESS[s.status] ?? 0}
                              className={`h-1 ${s.status === 'Con retraso' ? '[&>div]:bg-red-500' : '[&>div]:bg-teal-500'}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.eta ? new Date(s.eta).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—'}
                        </TableCell>
                        <TableCell className="text-sm">{s.vessel?.name || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                <span className="text-xs text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Shipment Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0">
          {selectedShipment && (
            <>
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 rounded-t-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <Ship className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-white text-lg font-bold">
                        Envío {selectedShipment.reference}
                      </DialogTitle>
                      <p className="text-teal-100 text-xs font-mono mt-0.5">BL: {selectedShipment.blNumber}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${STATUS_COLORS[selectedShipment.status]} border-0`}>
                    {selectedShipment.status}
                  </Badge>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Tracker */}
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="py-2"
                  >
                    <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-teal-500" />
                      Seguimiento de Estado
                    </p>
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        {STATUS_STEPS.map((step, idx) => {
                          const currentIdx = getStatusStepIndex(selectedShipment.status)
                          const isCompleted = currentIdx >= idx
                          const isCurrent = selectedShipment.status === step
                          return (
                            <div key={step} className="flex flex-col items-center flex-1 relative">
                              {/* Connecting line */}
                              {idx > 0 && (
                                <div className="absolute top-[13px] -left-1/2 w-full h-[2px] z-0">
                                  <div className={`h-full w-full ${currentIdx >= idx ? 'bg-teal-500' : 'bg-muted-foreground/20'}`} />
                                </div>
                              )}
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 relative z-10 ${
                                isCompleted
                                  ? 'bg-teal-500 border-teal-500 text-white'
                                  : 'bg-background border-muted-foreground/30 text-muted-foreground'
                              } ${isCurrent ? 'ring-2 ring-teal-500/30 ring-offset-2' : ''}`}>
                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span className={`text-[10px] mt-1.5 text-center leading-tight max-w-[70px] ${
                                isCompleted ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-muted-foreground'
                              }`}>
                                {step}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      {selectedShipment.status === 'Con retraso' && (
                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-md text-center">
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">⚠ Envío con retraso</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <Separator />

                {/* Ruta Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-500" />
                    Ruta
                  </p>
                  <div className="flex items-center gap-4 bg-muted/30 rounded-lg p-4">
                    <div className="text-center flex-1">
                      <Badge variant="outline" className="text-xs font-mono px-2 py-1 bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800">
                        {selectedShipment.originPort}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1.5">{selectedShipment.origin}</p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <div className="w-12 border-t-2 border-dashed border-muted-foreground/30" />
                      <Ship className="w-4 h-4 text-teal-500 shrink-0" />
                      <div className="w-12 border-t-2 border-dashed border-muted-foreground/30" />
                    </div>
                    <div className="text-center flex-1">
                      <Badge variant="outline" className="text-xs font-mono px-2 py-1 bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800">
                        {selectedShipment.destinationPort}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1.5">{selectedShipment.destination}</p>
                    </div>
                  </div>
                </motion.div>

                <Separator />

                {/* Status Update Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="flex items-center gap-2"
                >
                  <Button
                    onClick={() => setShowStatusUpdate(!showStatusUpdate)}
                    variant="outline"
                    className="gap-2 text-sm border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/30"
                    disabled={updatingStatus}
                  >
                    <RefreshCw className={`w-4 h-4 ${updatingStatus ? 'animate-spin' : ''}`} />
                    Actualizar Estado
                    <ChevronDown className={`w-3 h-3 transition-transform ${showStatusUpdate ? 'rotate-180' : ''}`} />
                  </Button>
                </motion.div>

                <AnimatePresence>
                  {showStatusUpdate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
                        {ALL_STATUSES.map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={selectedShipment.status === status ? 'default' : 'outline'}
                            className={`text-xs h-7 ${selectedShipment.status === status ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
                            onClick={() => handleStatusUpdate(status)}
                            disabled={updatingStatus}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Separator />

                {/* Información General */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-500" />
                    Información General
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/20 rounded-md p-2.5">
                      <span className="text-muted-foreground text-xs">BL</span>
                      <p className="font-mono font-medium">{selectedShipment.blNumber}</p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-2.5">
                      <span className="text-muted-foreground text-xs">Cliente</span>
                      <p className="font-medium">{selectedShipment.clientName || '—'}</p>
                    </div>
                  </div>
                </motion.div>

                <Separator />

                {/* Ruta y Transporte */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                >
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Anchor className="w-4 h-4 text-teal-500" />
                    Ruta y Transporte
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/20 rounded-md p-2.5">
                      <span className="text-muted-foreground text-xs">Embarcación</span>
                      <p className="font-medium">{selectedShipment.vessel?.name || 'Sin asignar'}</p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-2.5">
                      <span className="text-muted-foreground text-xs">ETA</span>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {selectedShipment.eta ? new Date(selectedShipment.eta).toLocaleDateString('es-MX') : '—'}
                      </p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-2.5">
                      <span className="text-muted-foreground text-xs">Fecha de salida</span>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {selectedShipment.departureDate ? new Date(selectedShipment.departureDate).toLocaleDateString('es-MX') : '—'}
                      </p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-2.5">
                      <span className="text-muted-foreground text-xs">Fecha de llegada</span>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {selectedShipment.arrivalDate ? new Date(selectedShipment.arrivalDate).toLocaleDateString('es-MX') : '—'}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <Separator />

                {/* Carga y Valor */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Weight className="w-4 h-4 text-teal-500" />
                    Carga y Valor
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/20 rounded-md p-2.5">
                      <span className="text-muted-foreground text-xs">Tipo de Carga</span>
                      <p className="font-medium">{CARGO_ICONS[selectedShipment.cargoType] || '📦'} {selectedShipment.cargoType}</p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-2.5">
                      <span className="text-muted-foreground text-xs">Peso</span>
                      <p className="font-medium">{formatWeight(selectedShipment.weight)}</p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-2.5">
                      <span className="text-muted-foreground text-xs">Contenedores</span>
                      <p className="font-medium flex items-center gap-1">
                        <Box className="w-3 h-3 text-muted-foreground" />
                        {selectedShipment.containerCount}
                      </p>
                    </div>
                    <div className="bg-muted/20 rounded-md p-2.5">
                      <span className="text-muted-foreground text-xs">Valor</span>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        {selectedShipment.value ? `$${selectedShipment.value.toLocaleString()}` : '—'}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <Separator />

                {/* Collapsible Sections */}
                <Accordion type="multiple" defaultValue={['permits', 'containers', 'documents']} className="w-full">
                  {/* Related Permits */}
                  <AccordionItem value="permits">
                    <AccordionTrigger className="text-sm font-semibold py-3">
                      <span className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-teal-500" />
                        Permisos Relacionados
                        {selectedShipment.permits.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-5 ml-1">{selectedShipment.permits.length}</Badge>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {selectedShipment.permits.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedShipment.permits.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-xs p-2.5 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                              <span className="flex items-center gap-2">
                                <FileCheck className="w-3 h-3 text-teal-500" />
                                {p.type} - {p.number}
                              </span>
                              <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground py-2">No hay permisos asociados</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Related Containers */}
                  <AccordionItem value="containers">
                    <AccordionTrigger className="text-sm font-semibold py-3">
                      <span className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-teal-500" />
                        Contenedores
                        {selectedShipment.containers.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-5 ml-1">{selectedShipment.containers.length}</Badge>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {selectedShipment.containers.length > 0 ? (
                        <ScrollArea className="max-h-40">
                          <div className="space-y-1.5">
                            {selectedShipment.containers.slice(0, 10).map((c) => (
                              <div key={c.id} className="flex items-center justify-between text-xs p-2.5 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                                <span className="flex items-center gap-2">
                                  <Box className="w-3 h-3 text-cyan-500" />
                                  {c.number} ({c.type})
                                </span>
                                <Badge variant="secondary" className="text-[10px]">{c.status}</Badge>
                              </div>
                            ))}
                            {selectedShipment.containers.length > 10 && (
                              <p className="text-xs text-muted-foreground text-center py-1">...y {selectedShipment.containers.length - 10} más</p>
                            )}
                          </div>
                        </ScrollArea>
                      ) : (
                        <p className="text-xs text-muted-foreground py-2">No hay contenedores asociados</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Related Documents */}
                  <AccordionItem value="documents">
                    <AccordionTrigger className="text-sm font-semibold py-3">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-500" />
                        Documentos
                        {selectedShipment.documents.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-5 ml-1">{selectedShipment.documents.length}</Badge>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {selectedShipment.documents.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedShipment.documents.map((d) => (
                            <div key={d.id} className="flex items-center justify-between text-xs p-2.5 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                              <span className="flex items-center gap-2">
                                <FileText className="w-3 h-3 text-orange-500" />
                                {d.name}
                              </span>
                              <Badge variant="secondary" className="text-[10px]">{d.status}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground py-2">No hay documentos asociados</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Shipment Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 rounded-t-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
            <DialogTitle className="text-white text-lg font-bold flex items-center gap-2 relative z-10">
              <Plus className="w-5 h-5" />
              Nuevo Envío
            </DialogTitle>
            <p className="text-teal-100 text-xs mt-1 relative z-10">Complete los datos para registrar un nuevo envío marítimo</p>
          </div>

          <form onSubmit={handleAdd} className="p-5 space-y-5">
            {/* Información del Envío */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-teal-500" />
                Información del Envío
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">BL Number</Label>
                  <Input name="blNumber" placeholder="Ej: MAEU123456789" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cliente</Label>
                  <Input name="clientName" placeholder="Ej: Importadora del Pacífico S.A." required className="h-8 text-sm" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Ruta */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-500" />
                Ruta
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Puerto de Origen</Label>
                  <Input name="origin" placeholder="Ej: Puerto de Veracruz" required className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Código Origen</Label>
                  <Input name="originPort" placeholder="Ej: MXVER" required className="h-8 text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Puerto de Destino</Label>
                  <Input name="destination" placeholder="Ej: Puerto de Valencia" required className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Código Destino</Label>
                  <Input name="destinationPort" placeholder="Ej: ESVLC" required className="h-8 text-sm font-mono" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Carga */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Weight className="w-3.5 h-3.5 text-teal-500" />
                Carga
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Carga</Label>
                  <Select name="cargoType" defaultValue="Contenedorizado">
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CARGO_TYPES.map((t) => <SelectItem key={t} value={t}>{CARGO_ICONS[t] || '📦'} {t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Peso (toneladas)</Label>
                  <Input name="weight" type="number" step="0.01" placeholder="Ej: 25.5" required className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Contenedores</Label>
                  <Input name="containerCount" type="number" placeholder="Ej: 3" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor (USD)</Label>
                  <Input name="value" type="number" step="0.01" placeholder="Ej: 50000" className="h-8 text-sm" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Asignación */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Anchor className="w-3.5 h-3.5 text-teal-500" />
                Asignación
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Embarcación</Label>
                  <Select name="vesselId">
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {vessels.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ETA</Label>
                  <Input name="eta" type="date" className="h-8 text-sm" />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)} className="h-9">Cancelar</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 h-9">Crear Envío</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
