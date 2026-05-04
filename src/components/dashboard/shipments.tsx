'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Search, Plus, ChevronLeft, ChevronRight, Ship, ArrowRight, CheckCircle2,
  FileCheck, Box, FileText, Anchor, Calendar, Weight, DollarSign, Navigation,
  RefreshCw, MapPin, ChevronDown, Download, ClipboardList, PackageCheck,
  ShieldCheck, AlertTriangle, ChevronUp, Eye, Clock, FileWarning, FilePlus2,
  ArrowLeftRight, Sparkles, Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ── Workflow Stages ──────────────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  { name: 'Registrado', icon: ClipboardList, color: 'slate' },
  { name: 'En documentación', icon: FileText, color: 'amber' },
  { name: 'Listo para embarque', icon: PackageCheck, color: 'violet' },
  { name: 'En tránsito', icon: Ship, color: 'teal' },
  { name: 'En puerto de destino', icon: Anchor, color: 'sky' },
  { name: 'En aduana', icon: ShieldCheck, color: 'orange' },
  { name: 'Entregado', icon: CheckCircle2, color: 'emerald' },
] as const

const STATUS_STEPS = WORKFLOW_STEPS.map(s => s.name)

const STATUS_COLORS: Record<string, string> = {
  'Registrado': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'En documentación': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Listo para embarque': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  'En tránsito': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'En puerto de destino': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'En aduana': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Entregado': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Con retraso': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Pendiente de despacho': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const STATUS_PROGRESS: Record<string, number> = {
  'Registrado': 0,
  'En documentación': 17,
  'Listo para embarque': 33,
  'En tránsito': 50,
  'En puerto de destino': 67,
  'En aduana': 83,
  'Entregado': 100,
  'Con retraso': 50,
  'Pendiente de despacho': 8,
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

const CARGO_TYPES = ['Contenedorizado', 'Granel', 'Granel Sólido', 'Granel Líquido', 'Carga General', 'Perecederos', 'Peligrosa', 'Proyecto', 'Maquinaria']
const ALL_STATUSES = ['Registrado', 'En documentación', 'Listo para embarque', 'En tránsito', 'En puerto de destino', 'En aduana', 'Entregado', 'Con retraso', 'Pendiente de despacho']

// ── Document Requirements Engine ─────────────────────────────────────────────
interface DocRequirement {
  name: string
  keywords: string[]
  always?: boolean
  condition?: string
}

const DOCUMENT_RULES: DocRequirement[] = [
  // Always required
  { name: 'BL', keywords: ['BL', 'B/L', 'Bill of Lading', 'Conocimiento de Embarque'], always: true },
  { name: 'Factura Comercial', keywords: ['Factura Comercial', 'Commercial Invoice', 'Factura'], always: true },
  { name: 'Seguro', keywords: ['Seguro', 'Insurance', 'Póliza de Seguro', 'Certificate of Insurance'], always: true },
  { name: 'Lista de Empaque', keywords: ['Lista de Empaque', 'Packing List', 'Empaque'], always: true },
  { name: 'Certificado de Origen', keywords: ['Certificado de Origen', 'Certificate of Origin', 'Origen', 'EUR.1'], always: true },
  // USA specific
  { name: 'FDA Registration', keywords: ['FDA', 'Prior Notice', 'FDA Registration'], condition: 'usa' },
  { name: 'Prior Notice', keywords: ['Prior Notice', 'FDA Prior Notice'], condition: 'usa' },
  { name: 'Lacey Act', keywords: ['Lacey Act', 'Lacey'], condition: 'usa_forest' },
  // EU specific
  { name: 'EUDR', keywords: ['EUDR', 'Deforestation'], condition: 'eu' },
  { name: 'REACH', keywords: ['REACH', 'Chemical Registration'], condition: 'eu_chemical' },
  { name: 'CBAM', keywords: ['CBAM', 'Carbon Border', 'Carbon Adjustment'], condition: 'eu_mineral' },
  { name: 'EUR.1', keywords: ['EUR.1', 'EUR1', 'Euro.1'], condition: 'eu' },
  // Perishable / Food
  { name: 'Fitosanitario', keywords: ['Fitosanitario', 'Phytosanitary', 'Sanitario', 'Fitosanitario'], condition: 'perishable' },
  { name: 'Zoosanitario', keywords: ['Zoosanitario', 'Zoosanitary', 'Animal Health'], condition: 'perishable' },
  { name: 'Certificado de Libre Venta', keywords: ['Libre Venta', 'Free Sale', 'Certificate of Free Sale'], condition: 'perishable' },
  // Bulk
  { name: 'Manifiesto de Carga', keywords: ['Manifiesto', 'Manifest', 'Cargo Manifest', 'Manifiesto de Carga'], condition: 'bulk' },
]

function getRequiredDocuments(shipment: Shipment): DocRequirement[] {
  const dest = (shipment.destinationCountry || shipment.destination || '').toLowerCase()
  const cargo = (shipment.cargoType || '').toLowerCase()
  const regulatory = (shipment.regulatoryCategory || '').toLowerCase()

  const isUSA = dest.includes('ee.uu') || dest.includes('estados unidos') || dest.includes('usa') || dest.includes('united states')
  const isEU = dest.includes('alemania') || dest.includes('países bajos') || dest.includes('union europea') || dest.includes('unión europea') || dest.includes('españa') || dest.includes('francia') || dest.includes('italia') || dest.includes('alemania') || dest.includes('holanda')
  const isPerishable = cargo.includes('perecedero') || regulatory.includes('alimento') || regulatory.includes('food') || cargo.includes('agrícola') || cargo.includes('agricola')
  const isBulk = cargo.includes('granel')
  const isForest = regulatory.includes('forestal') || regulatory.includes('madera') || regulatory.includes('wood') || regulatory.includes('forest')
  const isChemical = regulatory.includes('químic') || regulatory.includes('quimic') || regulatory.includes('chemical')
  const isMineral = regulatory.includes('mineral') || regulatory.includes('miner') || cargo.includes('granel sólido')

  return DOCUMENT_RULES.filter(rule => {
    if (rule.always) return true
    if (rule.condition === 'usa' && isUSA) return true
    if (rule.condition === 'usa_forest' && isUSA && isForest) return true
    if (rule.condition === 'eu' && isEU) return true
    if (rule.condition === 'eu_chemical' && isEU && isChemical) return true
    if (rule.condition === 'eu_mineral' && isEU && isMineral) return true
    if (rule.condition === 'perishable' && isPerishable) return true
    if (rule.condition === 'bulk' && isBulk) return true
    return false
  })
}

function isDocumentUploaded(docName: string, keywords: string[], documents: Shipment['documents']): { found: boolean; matchedDoc?: Shipment['documents'][number] } {
  for (const doc of documents) {
    const docNameLower = (doc.name || '').toLowerCase()
    const docTypeLower = (doc.type || '').toLowerCase()
    const docSubtypeLower = ((doc as Record<string, unknown>).documentSubtype || '').toString().toLowerCase()
    for (const kw of keywords) {
      if (docNameLower.includes(kw.toLowerCase()) || docTypeLower.includes(kw.toLowerCase()) || docSubtypeLower.includes(kw.toLowerCase())) {
        return { found: true, matchedDoc: doc }
      }
    }
  }
  return { found: false }
}

// ── Smart Defaults for Create Dialog ─────────────────────────────────────────
const CARGO_SMART_DEFAULTS: Record<string, { weight: number; containerCount: number; packagingType: string; incoterm: string }> = {
  'Contenedorizado': { weight: 25, containerCount: 2, packagingType: 'Contenedor estándar', incoterm: 'FOB' },
  'Granel': { weight: 5000, containerCount: 0, packagingType: 'Granel suelto', incoterm: 'CIF' },
  'Granel Sólido': { weight: 5000, containerCount: 0, packagingType: 'Granel suelto', incoterm: 'CIF' },
  'Granel Líquido': { weight: 3000, containerCount: 0, packagingType: 'Tanque ISO', incoterm: 'CIF' },
  'Carga General': { weight: 10, containerCount: 0, packagingType: 'Paleta', incoterm: 'FOB' },
  'Perecederos': { weight: 15, containerCount: 1, packagingType: 'Contenedor refrigerado', incoterm: 'CIF' },
  'Peligrosa': { weight: 20, containerCount: 1, packagingType: 'Contenedor IMO', incoterm: 'CIF' },
  'Proyecto': { weight: 50, containerCount: 3, packagingType: 'Carga proyecto', incoterm: 'DDP' },
  'Maquinaria': { weight: 30, containerCount: 1, packagingType: 'Flat Rack', incoterm: 'CIF' },
}

// ── Interface ────────────────────────────────────────────────────────────────
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
  destinationCountry?: string | null
  regulatoryCategory?: string | null
  hsCode?: string | null
  productDescription?: string | null
  incoterm?: string | null
  packagingType?: string | null
  vessel: { id: string; name: string; imo: string } | null
  permits: { id: string; type: string; number: string; status: string }[]
  containers: { id: string; number: string; type: string; status: string; weight: number }[]
  documents: { id: string; name: string; type: string; status: string; documentSubtype?: string; category?: string }[]
  createdAt?: string | null
  updatedAt?: string | null
}

// ── Stage date estimation ────────────────────────────────────────────────────
function getStageDates(shipment: Shipment): Record<string, string | null> {
  const dates: Record<string, string | null> = {}
  const created = shipment.createdAt || null
  const updated = shipment.updatedAt || null
  const departure = shipment.departureDate || null
  const arrival = shipment.arrivalDate || null
  const eta = shipment.eta || null
  const currentIdx = STATUS_STEPS.indexOf(shipment.status)

  if (currentIdx >= 0) dates['Registrado'] = created
  if (currentIdx >= 1) dates['En documentación'] = created
  if (currentIdx >= 2) dates['Listo para embarque'] = updated
  if (currentIdx >= 3) dates['En tránsito'] = departure
  if (currentIdx >= 4) dates['En puerto de destino'] = arrival || eta
  if (currentIdx >= 5) dates['En aduana'] = arrival || eta
  if (currentIdx >= 6) dates['Entregado'] = updated

  return dates
}

// ── Stage Notes ──────────────────────────────────────────────────────────────
function getStageNotes(shipment: Shipment): Record<string, string> {
  const notes: Record<string, string> = {}
  const currentIdx = STATUS_STEPS.indexOf(shipment.status)

  if (currentIdx === 0) notes['Registrado'] = 'Envío creado en el sistema'
  if (currentIdx >= 1) notes['En documentación'] = 'Preparando documentación requerida'
  if (currentIdx >= 2) notes['Listo para embarque'] = 'Documentación completa, listo para cargar'
  if (currentIdx >= 3) notes['En tránsito'] = shipment.vessel ? `En navegación - ${shipment.vessel.name}` : 'En navegación'
  if (currentIdx >= 4) notes['En puerto de destino'] = 'Arribó al puerto de destino'
  if (currentIdx >= 5) notes['En aduana'] = 'En proceso de despacho aduanero'
  if (currentIdx >= 6) notes['Entregado'] = 'Entrega completada exitosamente'

  if (shipment.status === 'Con retraso') notes['En tránsito'] = '⚠ Envío con retraso - requiere atención'

  return notes
}

// ── Component ────────────────────────────────────────────────────────────────
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
  const [showFullWorkflow, setShowFullWorkflow] = useState(false)
  const [addCargoType, setAddCargoType] = useState('Contenedorizado')
  const [expandedDocChecklist, setExpandedDocChecklist] = useState<string | null>(null)

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
      destinationCountry: form.get('destinationCountry') as string || null,
      regulatoryCategory: form.get('regulatoryCategory') as string || null,
      incoterm: form.get('incoterm') as string || null,
      packagingType: form.get('packagingType') as string || null,
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

  const handleAdvanceStatus = async () => {
    if (!selectedShipment) return
    const currentIdx = STATUS_STEPS.indexOf(selectedShipment.status)
    if (currentIdx < 0 || currentIdx >= STATUS_STEPS.length - 1) {
      toast.error('No se puede avanzar más el estado')
      return
    }
    const nextStatus = STATUS_STEPS[currentIdx + 1]
    await handleStatusUpdate(nextStatus)
  }

  const handleRetreatStatus = async () => {
    if (!selectedShipment) return
    const currentIdx = STATUS_STEPS.indexOf(selectedShipment.status)
    if (currentIdx <= 0) {
      toast.error('No se puede retroceder más el estado')
      return
    }
    const prevStatus = STATUS_STEPS[currentIdx - 1]
    await handleStatusUpdate(prevStatus)
  }

  const getStatusStepIndex = (status: string) => {
    const idx = STATUS_STEPS.indexOf(status)
    if (idx >= 0) return idx
    if (status === 'Con retraso') return 3 // treated as at "En tránsito" stage
    if (status === 'Pendiente de despacho') return 0
    return -1
  }

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(1)} ton`
  }

  const exportCSV = () => {
    if (shipments.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }
    const headers = ['Referencia', 'BL', 'Cliente', 'Origen', 'Destino', 'Tipo Carga', 'Peso', 'Contenedores', 'Estado', 'ETA', 'Embarcación']
    const rows = shipments.map((s) => [
      s.reference,
      s.blNumber,
      s.clientName || '',
      s.originPort,
      s.destinationPort,
      s.cargoType,
      s.weight.toString(),
      s.containerCount.toString(),
      s.status,
      s.eta ? new Date(s.eta).toLocaleDateString('es-MX') : '',
      s.vessel?.name || '',
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `envios_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Datos exportados exitosamente')
  }

  // Smart defaults for add dialog
  const smartDefaults = useMemo(() => CARGO_SMART_DEFAULTS[addCargoType] || CARGO_SMART_DEFAULTS['Contenedorizado'], [addCargoType])

  // Required documents for selected shipment
  const requiredDocs = useMemo(() => {
    if (!selectedShipment) return []
    return getRequiredDocuments(selectedShipment)
  }, [selectedShipment])

  const uploadedCount = useMemo(() => {
    if (!selectedShipment) return 0
    return requiredDocs.filter(r => isDocumentUploaded(r.name, r.keywords, selectedShipment.documents).found).length
  }, [requiredDocs, selectedShipment])

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
              <div className="ml-auto flex items-center gap-2">
                <Button
                  onClick={exportCSV}
                  variant="outline"
                  className="h-9 gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/30"
                  disabled={loading}
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </Button>
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
                    {shipments.map((s, rowIndex) => {
                      const stepIdx = getStatusStepIndex(s.status)
                      return (
                        <motion.tr
                          key={s.id}
                          data-slot="table-row"
                          initial={false}
                          whileHover={{ scale: 1.003, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                          transition={{ duration: 0.15 }}
                          className={`cursor-pointer border-b border-l-4 border-l-transparent hover:border-l-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-colors ${rowIndex % 2 === 1 ? 'bg-muted/20 hover:bg-teal-50/50 dark:hover:bg-teal-950/20' : ''}`}
                          onClick={() => { setSelectedShipment(s); setShowDetail(true); setShowFullWorkflow(false) }}
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
                            <div className="mt-1 w-full max-w-[120px]">
                              <Progress
                                value={STATUS_PROGRESS[s.status] ?? 0}
                                className={`h-1 ${s.status === 'Con retraso' ? '[&>div]:bg-red-500' : '[&>div]:bg-teal-500'}`}
                              />
                            </div>
                            {/* Mini workflow dots */}
                            <div className="flex items-center gap-[3px] mt-1">
                              {STATUS_STEPS.map((step, idx) => (
                                <div
                                  key={step}
                                  className={`h-1 rounded-full flex-1 transition-colors ${
                                    idx <= stepIdx && stepIdx >= 0
                                      ? s.status === 'Con retraso' ? 'bg-red-400' : 'bg-teal-400'
                                      : 'bg-muted-foreground/15'
                                  } ${idx === stepIdx ? 'ring-1 ring-teal-400/50' : ''}`}
                                />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {s.eta ? new Date(s.eta).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—'}
                          </TableCell>
                          <TableCell className="text-sm">{s.vessel?.name || '—'}</TableCell>
                        </motion.tr>
                      )
                    })}
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
                {/* ── Workflow Status Tracker (Compact Horizontal) ── */}
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="py-2"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-teal-500" />
                        Seguimiento de Estado
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 gap-1 h-6 px-2"
                        onClick={() => setShowFullWorkflow(!showFullWorkflow)}
                      >
                        <Eye className="w-3 h-3" />
                        {showFullWorkflow ? 'Vista compacta' : 'Ver flujo completo'}
                      </Button>
                    </div>

                    {!showFullWorkflow ? (
                      /* Compact horizontal tracker */
                      <div className="relative">
                        <div className="flex items-center justify-between">
                          {WORKFLOW_STEPS.map((step, idx) => {
                            const currentIdx = getStatusStepIndex(selectedShipment.status)
                            const isCompleted = currentIdx >= idx
                            const isCurrent = selectedShipment.status === step.name
                            const StepIcon = step.icon
                            return (
                              <div key={step.name} className="flex flex-col items-center flex-1 relative">
                                {idx > 0 && (
                                  <div className="absolute top-[13px] -left-1/2 w-full h-[2px] z-0">
                                    <div className={`h-full w-full transition-colors ${currentIdx >= idx ? 'bg-teal-500' : 'bg-muted-foreground/20'}`} />
                                  </div>
                                )}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 relative z-10 ${
                                  isCompleted
                                    ? 'bg-teal-500 border-teal-500 text-white'
                                    : 'bg-background border-muted-foreground/30 text-muted-foreground'
                                } ${isCurrent ? 'ring-2 ring-teal-500/30 ring-offset-2' : ''}`}>
                                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
                                </div>
                                <span className={`text-[10px] mt-1.5 text-center leading-tight max-w-[70px] ${
                                  isCompleted ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-muted-foreground'
                                }`}>
                                  {step.name}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                        {selectedShipment.status === 'Con retraso' && (
                          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-md text-center">
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Envío con retraso
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Full vertical workflow tracker */
                      <div className="space-y-0">
                        {WORKFLOW_STEPS.map((step, idx) => {
                          const currentIdx = getStatusStepIndex(selectedShipment.status)
                          const isCompleted = currentIdx >= idx
                          const isCurrent = selectedShipment.status === step.name
                          const StepIcon = step.icon
                          const stageDates = getStageDates(selectedShipment)
                          const stageNotes = getStageNotes(selectedShipment)
                          const stageDate = stageDates[step.name]
                          const stageNote = stageNotes[step.name]
                          const isLast = idx === WORKFLOW_STEPS.length - 1

                          return (
                            <div key={step.name} className="flex gap-3">
                              {/* Left: icon + connecting line */}
                              <div className="flex flex-col items-center">
                                <motion.div
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 relative z-10 ${
                                    isCompleted
                                      ? 'bg-teal-500 border-teal-500 text-white'
                                      : 'bg-background border-muted-foreground/25 text-muted-foreground'
                                  } ${isCurrent ? 'ring-4 ring-teal-500/20 ring-offset-1' : ''}`}
                                >
                                  {isCompleted && !isCurrent ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : isCurrent ? (
                                    <motion.div
                                      animate={{ scale: [1, 1.15, 1] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                      <StepIcon className="w-4 h-4" />
                                    </motion.div>
                                  ) : (
                                    <StepIcon className="w-4 h-4" />
                                  )}
                                </motion.div>
                                {!isLast && (
                                  <div className={`w-0.5 flex-1 min-h-[32px] transition-colors ${
                                    currentIdx > idx ? 'bg-teal-500' : 'bg-muted-foreground/15'
                                  }`} />
                                )}
                              </div>
                              {/* Right: content */}
                              <div className={`pb-4 flex-1 ${!isLast ? '' : 'pb-0'}`}>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-semibold ${
                                    isCompleted ? 'text-teal-600 dark:text-teal-400' : isCurrent ? 'text-foreground' : 'text-muted-foreground'
                                  }`}>
                                    {step.name}
                                  </span>
                                  {isCurrent && (
                                    <Badge className="text-[9px] h-4 px-1.5 bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                                      Actual
                                    </Badge>
                                  )}
                                  {isCompleted && !isCurrent && (
                                    <Badge className="text-[9px] h-4 px-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                                      Completado
                                    </Badge>
                                  )}
                                </div>
                                {stageDate && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[11px] text-muted-foreground">
                                      {new Date(stageDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                )}
                                {stageNote && (
                                  <p className={`text-[11px] mt-0.5 ${
                                    isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/60'
                                  }`}>
                                    {stageNote}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        {selectedShipment.status === 'Con retraso' && (
                          <div className="mt-2 p-2.5 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" /> Envío con retraso - requiere atención inmediata
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <Separator />

                {/* ── Workflow Action Buttons ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <Button
                    onClick={handleAdvanceStatus}
                    className="gap-1.5 text-sm bg-teal-600 hover:bg-teal-700"
                    disabled={updatingStatus || getStatusStepIndex(selectedShipment.status) < 0 || getStatusStepIndex(selectedShipment.status) >= STATUS_STEPS.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                    Avanzar Estado
                  </Button>
                  <Button
                    onClick={handleRetreatStatus}
                    variant="outline"
                    className="gap-1.5 text-sm border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
                    disabled={updatingStatus || getStatusStepIndex(selectedShipment.status) <= 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retroceder Estado
                  </Button>
                  <Button
                    onClick={() => setShowStatusUpdate(!showStatusUpdate)}
                    variant="outline"
                    className="gap-2 text-sm border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/30"
                    disabled={updatingStatus}
                  >
                    <RefreshCw className={`w-4 h-4 ${updatingStatus ? 'animate-spin' : ''}`} />
                    Cambiar a...
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

                {/* ── Smart Document Checklist ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-teal-500" />
                      Documentos Requeridos
                      <Badge variant="secondary" className="text-[10px] h-5 ml-1 bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                        {uploadedCount}/{requiredDocs.length}
                      </Badge>
                    </p>
                    <div className="flex items-center gap-1.5">
                      {uploadedCount === requiredDocs.length && requiredDocs.length > 0 && (
                        <Badge className="text-[10px] h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                          ✅ Completo
                        </Badge>
                      )}
                      {uploadedCount < requiredDocs.length && requiredDocs.length > 0 && (
                        <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                          ⚠ {requiredDocs.length - uploadedCount} pendiente{requiredDocs.length - uploadedCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for document checklist */}
                  <div className="mb-3">
                    <Progress
                      value={requiredDocs.length > 0 ? (uploadedCount / requiredDocs.length) * 100 : 0}
                      className={`h-2 ${uploadedCount === requiredDocs.length && requiredDocs.length > 0 ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500'}`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    {requiredDocs.map((req) => {
                      const { found, matchedDoc } = isDocumentUploaded(req.name, req.keywords, selectedShipment.documents)
                      const isExpanded = expandedDocChecklist === req.name

                      return (
                        <div key={req.name}>
                          <div
                            className={`flex items-center justify-between text-xs p-2.5 rounded-md transition-colors cursor-pointer ${
                              found
                                ? 'bg-emerald-50/80 dark:bg-emerald-900/15 hover:bg-emerald-50 dark:hover:bg-emerald-900/25'
                                : 'bg-amber-50/80 dark:bg-amber-900/15 hover:bg-amber-50 dark:hover:bg-amber-900/25'
                            }`}
                            onClick={() => setExpandedDocChecklist(isExpanded ? null : req.name)}
                          >
                            <span className="flex items-center gap-2">
                              {found ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <FileWarning className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              <span className={`font-medium ${found ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                {req.name}
                              </span>
                              {req.condition && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-3 h-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-[11px]">
                                        {req.condition === 'usa' && 'Requerido para destino EE.UU.'}
                                        {req.condition === 'usa_forest' && 'Requerido para productos forestales a EE.UU.'}
                                        {req.condition === 'eu' && 'Requerido para destino Unión Europea'}
                                        {req.condition === 'eu_chemical' && 'Requerido para productos químicos a la UE'}
                                        {req.condition === 'eu_mineral' && 'Requerido para minerales a la UE (CBAM)'}
                                        {req.condition === 'perishable' && 'Requerido para carga perecedera/alimentos'}
                                        {req.condition === 'bulk' && 'Requerido para carga a granel'}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {req.always && (
                                <span className="text-[9px] text-muted-foreground bg-muted/50 px-1 rounded">Obligatorio</span>
                              )}
                            </span>
                            <span className={`flex items-center gap-1 ${found ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {found ? '✅ Cargado' : '⚠ Pendiente'}
                              <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </span>
                          </div>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 pr-2 py-2 border-l-2 border-muted-foreground/10 ml-4">
                                  {found && matchedDoc ? (
                                    <div className="space-y-1">
                                      <p className="text-[11px] text-muted-foreground">
                                        <span className="font-medium text-foreground">Documento vinculado:</span>
                                      </p>
                                      <div className="flex items-center justify-between text-xs bg-muted/20 p-2 rounded">
                                        <span className="flex items-center gap-1.5">
                                          <FileText className="w-3 h-3 text-teal-500" />
                                          <span className="font-medium">{matchedDoc.name}</span>
                                        </span>
                                        <Badge variant="secondary" className="text-[9px] h-4">{matchedDoc.status}</Badge>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                        Este documento aún no ha sido cargado.
                                      </p>
                                      <p className="text-[11px] text-muted-foreground">
                                        Palabras clave de búsqueda: {req.keywords.slice(0, 3).join(', ')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>

                <Separator />

                {/* Ruta Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
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
                      {selectedShipment.destinationCountry && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{selectedShipment.destinationCountry}</p>
                      )}
                    </div>
                  </div>
                </motion.div>

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
                    {selectedShipment.hsCode && (
                      <div className="bg-muted/20 rounded-md p-2.5">
                        <span className="text-muted-foreground text-xs">Código HS</span>
                        <p className="font-mono font-medium">{selectedShipment.hsCode}</p>
                      </div>
                    )}
                    {selectedShipment.incoterm && (
                      <div className="bg-muted/20 rounded-md p-2.5">
                        <span className="text-muted-foreground text-xs">Incoterm</span>
                        <p className="font-medium">{selectedShipment.incoterm}</p>
                      </div>
                    )}
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
                    {selectedShipment.regulatoryCategory && (
                      <div className="bg-muted/20 rounded-md p-2.5">
                        <span className="text-muted-foreground text-xs">Categoría Regulatoria</span>
                        <p className="font-medium">{selectedShipment.regulatoryCategory}</p>
                      </div>
                    )}
                    {selectedShipment.packagingType && (
                      <div className="bg-muted/20 rounded-md p-2.5">
                        <span className="text-muted-foreground text-xs">Tipo de Empaque</span>
                        <p className="font-medium">{selectedShipment.packagingType}</p>
                      </div>
                    )}
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
                        Documentos Cargados
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
                                {d.documentSubtype && (
                                  <span className="text-[9px] text-muted-foreground bg-muted/50 px-1 rounded">{d.documentSubtype}</span>
                                )}
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
            {/* Smart defaults indicator */}
            <AnimatePresence>
              {addCargoType && CARGO_SMART_DEFAULTS[addCargoType] && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 px-3 py-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-[11px] text-teal-700 dark:text-teal-300">
                    Valores sugeridos para <strong>{addCargoType}</strong>: {smartDefaults.weight} ton, {smartDefaults.containerCount || 'sin'} contenedor{(smartDefaults.containerCount || 0) !== 1 ? 'es' : ''}, empaque {smartDefaults.packagingType}, incoterm {smartDefaults.incoterm}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

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
                <div className="space-y-1.5">
                  <Label className="text-xs">País de Destino</Label>
                  <Input name="destinationCountry" placeholder="Ej: Estados Unidos, Alemania" className="h-8 text-sm" />
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
                  <Select name="cargoType" defaultValue="Contenedorizado" onValueChange={(v) => setAddCargoType(v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CARGO_TYPES.map((t) => <SelectItem key={t} value={t}>{CARGO_ICONS[t] || '📦'} {t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Peso (toneladas)</Label>
                  <Input name="weight" type="number" step="0.01" placeholder={`Sugerido: ${smartDefaults.weight}`} required className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Contenedores</Label>
                  <Input name="containerCount" type="number" placeholder={`Sugerido: ${smartDefaults.containerCount}`} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor (USD)</Label>
                  <Input name="value" type="number" step="0.01" placeholder="Ej: 50000" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoría Regulatoria</Label>
                  <Select name="regulatoryCategory" defaultValue="">
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ninguna</SelectItem>
                      <SelectItem value="Alimento">Alimento</SelectItem>
                      <SelectItem value="Forestal">Forestal</SelectItem>
                      <SelectItem value="Químico">Químico</SelectItem>
                      <SelectItem value="Mineral">Mineral</SelectItem>
                      <SelectItem value="Textil">Textil</SelectItem>
                      <SelectItem value="Farmacéutico">Farmacéutico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Incoterm</Label>
                  <Select name="incoterm" defaultValue={smartDefaults.incoterm}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB</SelectItem>
                      <SelectItem value="CIF">CIF</SelectItem>
                      <SelectItem value="EXW">EXW</SelectItem>
                      <SelectItem value="DDP">DDP</SelectItem>
                      <SelectItem value="FCA">FCA</SelectItem>
                      <SelectItem value="CFR">CFR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Empaque</Label>
                  <Input name="packagingType" placeholder={`Sugerido: ${smartDefaults.packagingType}`} className="h-8 text-sm" />
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
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 h-9 gap-1.5">
                <Plus className="w-4 h-4" />
                Crear Envío
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
