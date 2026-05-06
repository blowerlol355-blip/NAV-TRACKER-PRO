'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, Box, Scale, Package, ThermometerSnowflake, Container, ArrowUpRight,
  Truck, Warehouse, CheckCircle2, AlertCircle, FileWarning, Download, Printer
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { exportToCSV, printTable } from '@/lib/export-utils'

const CONTAINER_STATUS_COLORS: Record<string, string> = {
  'Vacío': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Cargado': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Lleno': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'En tránsito': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'En espera': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Descargado': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'En inspección': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'En aduana': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

const CONTAINER_STATUS_BORDER: Record<string, string> = {
  'Vacío': 'border-l-slate-400',
  'Cargado': 'border-l-orange-500',
  'Lleno': 'border-l-orange-500',
  'En tránsito': 'border-l-sky-500',
  'En espera': 'border-l-amber-500',
  'Descargado': 'border-l-emerald-500',
  'En inspección': 'border-l-amber-500',
  'En aduana': 'border-l-orange-500',
}

// Lucide icons for container types
const CONTAINER_TYPE_ICONS_LUCIDE: Record<string, React.ElementType> = {
  "20' Estándar": Package,
  "40' Estándar": Package,
  "40' High Cube": Container,
  '20ft Dry': Package,
  '40ft Dry': Package,
  '40ft HC': Container,
  'Refrigerado': ThermometerSnowflake,
  '20ft Refrigerado': ThermometerSnowflake,
  '40ft Refrigerado': ThermometerSnowflake,
  'Tanque': Container,
  'Open Top': Container,
  '20ft Open Top': Container,
}

const CONTAINER_TYPE_COLORS: Record<string, string> = {
  "20' Estándar": 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  "40' Estándar": 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  "40' High Cube": 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
  '20ft Dry': 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  '40ft Dry': 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  '40ft HC': 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
  'Refrigerado': 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
  '20ft Refrigerado': 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
  '40ft Refrigerado': 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
  'Tanque': 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  'Open Top': 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
  '20ft Open Top': 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
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

interface ContainerData {
  id: string
  number: string
  type: string
  sealNumber: string | null
  weight: number
  status: string
  shipmentId: string
  shipment: { reference: string }
}

function getWeightPercent(weight: number, type: string): number {
  const maxWeight = CONTAINER_MAX_WEIGHT[type] || 28
  return Math.min(100, Math.round((weight / maxWeight) * 100))
}

function getWeightColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 70) return 'bg-amber-500'
  return 'bg-orange-500'
}

function getWeightBgColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500/15'
  if (percent >= 70) return 'bg-amber-500/15'
  return 'bg-orange-500/15'
}

export function Containers() {
  const [containers, setContainers] = useState<ContainerData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [shipments, setShipments] = useState<{ id: string; reference: string }[]>([])
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  
  // Edit state
  const [selectedContainer, setSelectedContainer] = useState<ContainerData | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const attachmentsRef = useRef<HTMLInputElement | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

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

  useEffect(() => {
    fetch('/api/shipments?pageSize=200')
      .then((r) => r.json())
      .then((d) => setShipments((d.shipments || []).map((s: { id: string; reference: string }) => ({ id: s.id, reference: s.reference }))))
      .catch(() => {})
  }, [])

  // Stats
  const totalContainers = containers.length
  const statusCounts: Record<string, number> = {}
  containers.forEach(c => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1
  })

  // Compute total weight
  const totalWeight = containers.reduce((sum, c) => sum + c.weight, 0)

  const getContainerTypeIcon = (type: string): React.ElementType => {
    return CONTAINER_TYPE_ICONS_LUCIDE[type] || Package
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Summary Stats Bar - properly aligned */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
          <Box className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">{totalContainers} Total</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20">
          <Scale className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{totalWeight.toLocaleString()} ton total</span>
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
                {CONTAINER_TYPES.map((t) => {
                  const Icon = getContainerTypeIcon(t)
                  return <SelectItem key={t} value={t}><span className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {t}</span></SelectItem>
                })}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <Button
                onClick={() => {
                  if (containers.length === 0) { toast.error('No hay datos para exportar'); return }
                  exportToCSV(`contenedores_${new Date().toISOString().slice(0, 10)}`, containers.map((c) => ({
                    Número: c.number, Tipo: c.type, Sello: c.sealNumber || '',
                    'Peso (ton)': c.weight.toLocaleString(), Estado: c.status,
                    'Envío': c.shipment?.reference || '',
                  })))
                  toast.success('Datos exportados exitosamente')
                }}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/30"
                disabled={loading}
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
              <Button
                onClick={() => {
                  if (containers.length === 0) { toast.error('No hay datos para imprimir'); return }
                  printTable('Contenedores', [
                    { key: 'Número', label: 'Número' },
                    { key: 'Tipo', label: 'Tipo' },
                    { key: 'Sello', label: 'Sello' },
                    { key: 'Peso (ton)', label: 'Peso (ton)' },
                    { key: 'Estado', label: 'Estado' },
                    { key: 'Envío', label: 'Envío' },
                  ], containers.map((c) => ({
                    Número: c.number, Tipo: c.type, Sello: c.sealNumber || '',
                    'Peso (ton)': c.weight.toLocaleString(), Estado: c.status,
                    'Envío': c.shipment?.reference || '',
                  })))
                }}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/30"
                disabled={loading}
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
              <Button onClick={() => setShowAdd(true)} className="h-9 bg-teal-600 hover:bg-teal-700 text-white">
                <Package className="w-4 h-4 mr-2" /> Nuevo Contenedor
              </Button>
            </div>
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
                    const TypeIcon = getContainerTypeIcon(c.type)
                    const typeColor = CONTAINER_TYPE_COLORS[c.type] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'

                    return (
                      <TableRow 
                        key={c.id} 
                        className={`border-l-4 cursor-pointer hover:bg-muted/50 transition-colors ${CONTAINER_STATUS_BORDER[c.status] || ''}`}
                        onClick={() => {
                          setSelectedContainer(c)
                          setShowEdit(true)
                        }}
                      >
                        <TableCell>
                          <span className="font-mono text-sm font-semibold px-2 py-1 rounded bg-muted/70 inline-block">
                            {c.number}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                              <TypeIcon className="w-3.5 h-3.5" />
                            </div>
                            <span>{c.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.sealNumber ? (
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted/70">{c.sealNumber}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">{c.weight.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className={`flex-1 h-3 rounded-full overflow-hidden ${getWeightBgColor(weightPercent)}`}>
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${getWeightColor(weightPercent)}`}
                                style={{ width: `${weightPercent}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-semibold w-9 text-right ${weightPercent >= 90 ? 'text-red-600 dark:text-red-400' : weightPercent >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'}`}>
                              {weightPercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.shipment?.reference ? (
                            <button className="flex items-center gap-1 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium transition-colors">
                              {c.shipment.reference}
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
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

      {/* Add Container Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Contenedor</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault()
            setAdding(true)
            setAddError(null)
            const form = new FormData(e.currentTarget as HTMLFormElement)
            const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result as string
                const parts = result.split(',')
                resolve(parts[1] || '')
              }
              reader.onerror = (err) => reject(err)
              reader.readAsDataURL(file)
            })
            const body = {
              number: form.get('number') as string,
              type: form.get('type') as string,
              sealNumber: form.get('sealNumber') as string || null,
              weight: form.get('weight') as string,
              shipmentId: form.get('shipmentId') as string,
              status: form.get('status') as string || 'Vacío',
            }
            const inputEl = (e.currentTarget.querySelector('input[name="attachments"]') as HTMLInputElement | null)
            const files = inputEl?.files
            if (files && files.length > 0) {
              const arr = Array.from(files)
              const attachments = await Promise.all(arr.map(async (file) => ({
                filename: file.name,
                contentBase64: await fileToBase64(file),
                name: file.name,
                type: file.type || 'application/octet-stream',
              })))
              ;(body as any).attachments = attachments
            }
            try {
              const res = await fetch('/api/containers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
              const data = await res.json()
              if (!res.ok) {
                setAddError(data?.error || 'Error al crear contenedor')
                return
              }
              setShowAdd(false)
              fetchContainers()
            } catch (err) {
              console.error('Create container failed', err)
              setAddError('Error de red al crear contenedor')
            } finally {
              setAdding(false)
            }
          }}>
            <div className="space-y-2">
              <Label>Número de contenedor</Label>
              <Input name="number" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select name="type" defaultValue={CONTAINER_TYPES[0]}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTAINER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Peso (ton)</Label>
                <Input name="weight" type="number" step="0.1" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sello (opcional)</Label>
              <Input name="sealNumber" />
            </div>
            <div className="space-y-2">
              <Label>Envío relacionado</Label>
              <Select name="shipmentId" required>
                <SelectTrigger><SelectValue placeholder="Seleccionar envío" /></SelectTrigger>
                <SelectContent>
                  {shipments.map(s => <SelectItem key={s.id} value={s.id}>{s.reference}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <input ref={attachmentsRef} type="file" name="attachments" multiple className="hidden" onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : []
                setSelectedFiles(files)
              }} />
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => attachmentsRef.current?.click()}>Adjuntar documentos</Button>
                {selectedFiles.length > 0 && <span className="text-sm text-muted-foreground">{selectedFiles.length} archivos seleccionados</span>}
              </div>
            </div>
            {addError && <div className="text-sm text-red-600">{addError}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={adding}>{adding ? 'Creando...' : 'Crear Contenedor'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Container Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Contenedor</DialogTitle>
          </DialogHeader>
          {selectedContainer && (
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault()
              setEditing(true)
              setEditError(null)
              const form = new FormData(e.currentTarget as HTMLFormElement)
              const body = {
                number: form.get('number') as string,
                type: form.get('type') as string,
                sealNumber: form.get('sealNumber') as string || null,
                weight: form.get('weight') as string,
                shipmentId: form.get('shipmentId') as string,
                status: form.get('status') as string,
              }
              try {
                const res = await fetch(`/api/containers/${selectedContainer.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                const data = await res.json()
                if (!res.ok) {
                  setEditError(data?.error || 'Error al actualizar contenedor')
                  return
                }
                setShowEdit(false)
                toast.success('Contenedor actualizado exitosamente')
                fetchContainers()
              } catch (err) {
                console.error('Update container failed', err)
                setEditError('Error de red al actualizar contenedor')
              } finally {
                setEditing(false)
              }
            }}>
              <div className="space-y-2">
                <Label>Número de contenedor</Label>
                <Input name="number" defaultValue={selectedContainer.number} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select name="type" defaultValue={selectedContainer.type}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTAINER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Peso (ton)</Label>
                  <Input name="weight" type="number" step="0.1" defaultValue={selectedContainer.weight} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sello (opcional)</Label>
                <Input name="sealNumber" defaultValue={selectedContainer.sealNumber || ''} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Envío relacionado</Label>
                  <Select name="shipmentId" defaultValue={selectedContainer.shipmentId} required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar envío" /></SelectTrigger>
                    <SelectContent>
                      {shipments.map(s => <SelectItem key={s.id} value={s.id}>{s.reference}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select name="status" defaultValue={selectedContainer.status} required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(CONTAINER_STATUS_COLORS).map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editError && <div className="text-sm text-red-600">{editError}</div>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancelar</Button>
                 <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={editing}>{editing ? 'Guardando...' : 'Guardar Cambios'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
