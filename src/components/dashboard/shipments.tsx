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
import { Search, Plus, ChevronLeft, ChevronRight, Ship, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

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

  const getStatusStepIndex = (status: string) => {
    if (status === 'Con retraso') return -1
    return STATUS_STEPS.indexOf(status)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por referencia, BL, cliente..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cargoFilter} onValueChange={(v) => { setCargoFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Tipo de carga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {CARGO_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAdd(true)} className="h-9 bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-1" /> Nuevo Envío
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
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
                    <TableRow>
                      <TableHead>Referencia</TableHead>
                      <TableHead>BL</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Tipo Carga</TableHead>
                      <TableHead>Peso (ton)</TableHead>
                      <TableHead>Contenedores</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead>Embarcación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => { setSelectedShipment(s); setShowDetail(true) }}
                      >
                        <TableCell className="font-medium text-sm">{s.reference}</TableCell>
                        <TableCell className="text-sm font-mono text-xs">{s.blNumber}</TableCell>
                        <TableCell className="text-sm">{s.clientName || '—'}</TableCell>
                        <TableCell className="text-sm">{s.origin}</TableCell>
                        <TableCell className="text-sm">{s.destination}</TableCell>
                        <TableCell className="text-sm">{s.cargoType}</TableCell>
                        <TableCell className="text-sm">{s.weight.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{s.containerCount}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-xs ${STATUS_COLORS[s.status] || ''}`}>
                            {s.status}
                          </Badge>
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
              <div className="flex items-center justify-between px-4 py-3 border-t">
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedShipment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-teal-500" />
                  Envío {selectedShipment.reference}
                </DialogTitle>
              </DialogHeader>

              {/* Status Tracker */}
              <div className="py-4">
                <p className="text-sm font-medium mb-3">Seguimiento de Estado</p>
                <div className="flex items-center justify-between">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = getStatusStepIndex(selectedShipment.status)
                    const isCompleted = currentIdx >= idx
                    const isCurrent = selectedShipment.status === step
                    return (
                      <div key={step} className="flex flex-col items-center flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                          isCompleted
                            ? 'bg-teal-500 border-teal-500 text-white'
                            : 'bg-background border-muted-foreground/30 text-muted-foreground'
                        } ${isCurrent ? 'ring-2 ring-teal-500/30 ring-offset-2' : ''}`}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-[10px] mt-1 text-center leading-tight ${
                          isCompleted ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-muted-foreground'
                        }`}>
                          {step}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {selectedShipment.status === 'Con retraso' && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md text-center">
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">⚠ Envío con retraso</span>
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">BL:</span> <span className="font-mono">{selectedShipment.blNumber}</span></div>
                <div><span className="text-muted-foreground">Cliente:</span> {selectedShipment.clientName || '—'}</div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Origen:</span> {selectedShipment.origin}
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Destino:</span> {selectedShipment.destination}
                </div>
                <div><span className="text-muted-foreground">Tipo de Carga:</span> {selectedShipment.cargoType}</div>
                <div><span className="text-muted-foreground">Peso:</span> {selectedShipment.weight.toLocaleString()} ton</div>
                <div><span className="text-muted-foreground">Contenedores:</span> {selectedShipment.containerCount}</div>
                <div><span className="text-muted-foreground">Valor:</span> {selectedShipment.value ? `$${selectedShipment.value.toLocaleString()}` : '—'}</div>
                <div><span className="text-muted-foreground">Embarcación:</span> {selectedShipment.vessel?.name || 'Sin asignar'}</div>
                <div><span className="text-muted-foreground">Fecha salida:</span> {selectedShipment.departureDate ? new Date(selectedShipment.departureDate).toLocaleDateString('es-MX') : '—'}</div>
                <div><span className="text-muted-foreground">ETA:</span> {selectedShipment.eta ? new Date(selectedShipment.eta).toLocaleDateString('es-MX') : '—'}</div>
              </div>

              {/* Related Permits */}
              {selectedShipment.permits.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Permisos Relacionados</p>
                  <div className="space-y-1">
                    {selectedShipment.permits.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                        <span>{p.type} - {p.number}</span>
                        <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Containers */}
              {selectedShipment.containers.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Contenedores ({selectedShipment.containers.length})</p>
                  <ScrollArea className="max-h-32">
                    <div className="space-y-1">
                      {selectedShipment.containers.slice(0, 10).map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                          <span>{c.number} ({c.type})</span>
                          <Badge variant="secondary" className="text-[10px]">{c.status}</Badge>
                        </div>
                      ))}
                      {selectedShipment.containers.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center">...y {selectedShipment.containers.length - 10} más</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Related Documents */}
              {selectedShipment.documents.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Documentos</p>
                  <div className="space-y-1">
                    {selectedShipment.documents.map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                        <span>{d.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{d.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Shipment Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Envío</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>BL Number</Label>
                <Input name="blNumber" placeholder="PENDIENTE" />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input name="clientName" placeholder="Nombre del cliente" required />
              </div>
              <div className="space-y-2">
                <Label>Puerto de Origen</Label>
                <Input name="origin" placeholder="Puerto de origen" required />
              </div>
              <div className="space-y-2">
                <Label>Código Origen</Label>
                <Input name="originPort" placeholder="MXVER" required />
              </div>
              <div className="space-y-2">
                <Label>Puerto de Destino</Label>
                <Input name="destination" placeholder="Puerto de destino" required />
              </div>
              <div className="space-y-2">
                <Label>Código Destino</Label>
                <Input name="destinationPort" placeholder="ESVLC" required />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Carga</Label>
                <Select name="cargoType" defaultValue="Contenedorizado">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CARGO_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Peso (toneladas)</Label>
                <Input name="weight" type="number" step="0.01" placeholder="0" required />
              </div>
              <div className="space-y-2">
                <Label>Contenedores</Label>
                <Input name="containerCount" type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Valor (USD)</Label>
                <Input name="value" type="number" step="0.01" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Embarcación</Label>
                <Select name="vesselId">
                  <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {vessels.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ETA</Label>
                <Input name="eta" type="date" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">Crear Envío</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
