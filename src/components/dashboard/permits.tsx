'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { ChartContainer } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import {
  Search, Plus, FileCheck, AlertTriangle, Clock,
  Download, Upload, Heart, Leaf, Anchor, Factory, Ship, ClipboardList,
  Printer, FileSpreadsheet, CalendarDays, Info, ExternalLink,
  CheckCircle2, XCircle, Hourglass
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pie, Cell, ResponsiveContainer, PieChart } from 'recharts'
import { exportToCSV, printTable } from '@/lib/export-utils'

const PERMIT_STATUS_COLORS: Record<string, string> = {
  'Vigente': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Pendiente': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Vencido': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'En trámite': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'Pendiente de renovación': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const PERMIT_STATUS_BORDER: Record<string, string> = {
  'Vigente': 'border-l-emerald-500',
  'Pendiente': 'border-l-amber-500',
  'Vencido': 'border-l-red-500',
  'En trámite': 'border-l-cyan-500',
  'Pendiente de renovación': 'border-l-amber-500',
}

// Lucide icons for permit types (replacing emojis)
const PERMIT_TYPE_ICONS_LUCIDE: Record<string, React.ElementType> = {
  'Importación': Download,
  'Exportación': Upload,
  'Sanitario': Heart,
  'Fitosanitario': Leaf,
  'Arma Naval': Anchor,
  'Zona Franca': Factory,
  'Tránsito Aduanero': Ship,
  'Aduanal': ClipboardList,
}

const PERMIT_TYPE_COLORS: Record<string, string> = {
  'Importación': 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30',
  'Exportación': 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
  'Sanitario': 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30',
  'Fitosanitario': 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
  'Arma Naval': 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30',
  'Zona Franca': 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  'Tránsito Aduanero': 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'Aduanal': 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
}

const PERMIT_TYPES = ['Importación', 'Exportación', 'Sanitario', 'Fitosanitario', 'Aduanal', 'Arma Naval', 'Zona Franca', 'Tránsito Aduanero']
const PERMIT_STATUSES = ['Vigente', 'Pendiente', 'Vencido', 'En trámite', 'Pendiente de renovación']
const AUTHORITIES = ['SAT', 'SENASICA', 'COFEPRIS', 'Secretaría de Economía', 'Aduana Marítima']

interface ShipmentInfo {
  id: string
  reference: string
  origin: string
  destination: string
  status: string
}

interface Permit {
  id: string
  type: string
  number: string
  shipmentId: string
  issueDate: string | null
  expiryDate: string | null
  status: string
  authority: string
  notes: string | null
  shipment: { reference: string; origin?: string; destination?: string; status?: string }
}

function getDaysRemaining(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getDaysBadgeColor(days: number | null): string {
  if (days === null) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  if (days < 0) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  if (days <= 15) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (days <= 30) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
  if (days <= 60) return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400'
  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
}

function getExpiryProgress(issueDate: string | null, expiryDate: string | null): number {
  if (!issueDate || !expiryDate) return 0
  const start = new Date(issueDate).getTime()
  const end = new Date(expiryDate).getTime()
  const now = Date.now()
  if (end <= start) return 100
  const progress = ((now - start) / (end - start)) * 100
  return Math.max(0, Math.min(100, progress))
}

function getExpiryProgressColor(progress: number): string {
  if (progress >= 90) return 'bg-red-500'
  if (progress >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateLong(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Mini Donut Chart colors
const DONUT_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#f97316']

export function Permits() {
  const [permits, setPermits] = useState<Permit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [authorityFilter, setAuthorityFilter] = useState('all')
  const [expiryFrom, setExpiryFrom] = useState('')
  const [expiryTo, setExpiryTo] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null)
  const [permitShipments, setPermitShipments] = useState<ShipmentInfo[]>([])
  const [shipments, setShipments] = useState<{ id: string; reference: string }[]>([])
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const attachmentsRef = useRef<HTMLInputElement | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const fetchPermits = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, status: statusFilter, type: typeFilter, authority: authorityFilter, expiryFrom, expiryTo })
      const res = await fetch(`/api/permits?${params}`)
      const data = await res.json()
      setPermits(data)
    } catch {
      console.error('Error fetching permits')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, typeFilter, authorityFilter, expiryFrom, expiryTo])

  useEffect(() => {
    fetchPermits()
  }, [fetchPermits])

  useEffect(() => {
    fetch('/api/shipments?pageSize=100')
      .then((r) => r.json())
      .then((d) => {
        setShipments((d.shipments || []).map((s: { id: string; reference: string }) => ({ id: s.id, reference: s.reference })))
        setPermitShipments((d.shipments || []).map((s: { id: string; reference: string; origin: string; destination: string; status: string }) => ({
          id: s.id, reference: s.reference, origin: s.origin, destination: s.destination, status: s.status
        })))
      })
      .catch(() => {})
  }, [])

  // Stats
  const totalPermits = permits.length
  const vigentes = permits.filter(p => p.status === 'Vigente').length
  const pendientes = permits.filter(p => ['Pendiente', 'Pendiente de renovación', 'En trámite'].includes(p.status)).length
  const vencidos = permits.filter(p => p.status === 'Vencido').length
  const expiringSoon = permits.filter(p => {
    const days = getDaysRemaining(p.expiryDate)
    return days !== null && days >= 0 && days <= 30
  }).length
  const vigentePercent = totalPermits > 0 ? Math.round((vigentes / totalPermits) * 100) : 0

  // Donut chart data
  const donutData = [
    { name: 'Vigente', value: vigentes, color: DONUT_COLORS[0] },
    { name: 'Pendiente', value: pendientes, color: DONUT_COLORS[1] },
    { name: 'Vencido', value: vencidos, color: DONUT_COLORS[2] },
  ].filter(d => d.value > 0)

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAdding(true)
    setAddError(null)
    const form = new FormData(e.currentTarget)
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
      type: form.get('type') as string,
      number: form.get('number') as string,
      shipmentId: form.get('shipmentId') as string,
      authority: form.get('authority') as string,
      issueDate: form.get('issueDate') as string || null,
      expiryDate: form.get('expiryDate') as string || null,
      status: 'Pendiente',
    }
    // Collect attachments from file input (if any)
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
      const res = await fetch('/api/permits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) {
        setAddError(data?.error || 'Error al crear permiso')
        return
      }
      setShowAdd(false)
      fetchPermits()
    } catch (err) {
      console.error('Create permit failed', err)
      setAddError('Error de red al crear permiso')
    } finally {
      setAdding(false)
    }
  }

  const handleRowClick = (permit: Permit) => {
    setSelectedPermit(permit)
  }

  // Get Lucide icon component for permit type
  const getPermitTypeIcon = (type: string): React.ElementType => {
    return PERMIT_TYPE_ICONS_LUCIDE[type] || ClipboardList
  }

  // Export handlers
  const handleExportCSV = () => {
    const data = permits.map(p => ({
      number: p.number,
      type: p.type,
      authority: p.authority,
      shipmentReference: p.shipment?.reference || '',
      issueDate: p.issueDate ? formatDate(p.issueDate) : '',
      expiryDate: p.expiryDate ? formatDate(p.expiryDate) : '',
      daysRemaining: getDaysRemaining(p.expiryDate)?.toString() || '',
      status: p.status,
    }))
    exportToCSV('permisos-navtrack', data, {
      number: 'Número',
      type: 'Tipo',
      authority: 'Autoridad',
      shipmentReference: 'Ref. Envío',
      issueDate: 'Emisión',
      expiryDate: 'Vencimiento',
      daysRemaining: 'Días Restantes',
      status: 'Estado',
    })
  }

  const handlePrint = () => {
    printTable('Permisos', [
      { key: 'number', label: 'Número' },
      { key: 'type', label: 'Tipo' },
      { key: 'authority', label: 'Autoridad' },
      { key: 'shipmentReference', label: 'Ref. Envío' },
      { key: 'issueDate', label: 'Emisión' },
      { key: 'expiryDate', label: 'Vencimiento' },
      { key: 'status', label: 'Estado' },
    ], permits.map(p => ({
      number: p.number,
      type: p.type,
      authority: p.authority,
      shipmentReference: p.shipment?.reference || '',
      issueDate: p.issueDate ? formatDate(p.issueDate) : '',
      expiryDate: p.expiryDate ? formatDate(p.expiryDate) : '',
      status: p.status,
    })))
  }

  // Get linked shipment for selected permit
  const getLinkedShipment = (permit: Permit): ShipmentInfo | null => {
    const found = permitShipments.find(s => s.id === permit.shipmentId)
    return found || null
  }

  const chartConfig = {
    vigente: { label: 'Vigente', color: '#10b981' },
    pendiente: { label: 'Pendiente', color: '#f59e0b' },
    vencido: { label: 'Vencido', color: '#ef4444' },
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Enhanced Statistics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Permisos</p>
                  <p className="text-2xl font-bold mt-1">{totalPermits}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Vigentes</p>
                  <p className="text-2xl font-bold mt-1">{vigentes}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{vigentePercent}% del total</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Por Vencer</p>
                  <p className="text-2xl font-bold mt-1">{expiringSoon}</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">≤ 30 días</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Vencidos</p>
                  <p className="text-2xl font-bold mt-1">{vencidos}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <ChartContainer config={chartConfig} className="w-16 h-16 flex-shrink-0" id="permit-donut">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={16}
                      outerRadius={28}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-1">
                  {donutData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] text-muted-foreground">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por número de permiso..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {PERMIT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {PERMIT_TYPES.map((t) => {
                  const Icon = getPermitTypeIcon(t)
                  return <SelectItem key={t} value={t}><span className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {t}</span></SelectItem>
                })}
              </SelectContent>
            </Select>
            <Select value={authorityFilter} onValueChange={setAuthorityFilter}>
              <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Autoridad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las autoridades</SelectItem>
                {AUTHORITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <Input type="date" value={expiryFrom} onChange={(e) => setExpiryFrom(e.target.value)} className="h-9 w-[140px]" placeholder="Desde" />
              <span className="text-xs text-muted-foreground">a</span>
              <Input type="date" value={expiryTo} onChange={(e) => setExpiryTo(e.target.value)} className="h-9 w-[140px]" placeholder="Hasta" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">{permits.length} permiso{permits.length !== 1 ? 's' : ''} encontrado{permits.length !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCSV}>
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Imprimir
              </Button>
              <Button onClick={() => setShowAdd(true)} className="h-8 text-xs bg-teal-600 hover:bg-teal-700">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Permiso
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Permisos ({permits.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-420px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ref. Envío</TableHead>
                    <TableHead>Autoridad</TableHead>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Countdown</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {permits.map((p) => {
                      const daysRemaining = getDaysRemaining(p.expiryDate)
                      const isExpired = daysRemaining !== null && daysRemaining < 0
                      const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 30
                      const progress = getExpiryProgress(p.issueDate, p.expiryDate)
                      const TypeIcon = getPermitTypeIcon(p.type)
                      const typeColor = PERMIT_TYPE_COLORS[p.type] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'

                      return (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-muted/50 ${PERMIT_STATUS_BORDER[p.status] || ''} ${
                            isExpired ? 'bg-red-50 dark:bg-red-950/20' : isExpiringSoon ? 'bg-amber-50 dark:bg-amber-950/20' : ''
                          }`}
                          onClick={() => handleRowClick(p)}
                        >
                          <TableCell className={`font-medium text-sm font-mono ${isExpired ? 'line-through text-muted-foreground' : ''}`}>
                            {p.number}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                                <TypeIcon className="w-3.5 h-3.5" />
                              </div>
                              <span>{p.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {p.shipment?.reference ? (
                              <span className="text-teal-600 dark:text-teal-400 font-medium hover:underline inline-flex items-center gap-1">
                                {p.shipment.reference}
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-sm">{p.authority}</TableCell>
                          <TableCell className="text-sm">{formatDate(p.issueDate)}</TableCell>
                          <TableCell className="text-sm">{formatDate(p.expiryDate)}</TableCell>
                          <TableCell className="text-sm">
                            {daysRemaining !== null ? (
                              <Badge variant="secondary" className={`text-xs font-semibold ${getDaysBadgeColor(daysRemaining)}`}>
                                {isExpired ? 'Vencido' : daysRemaining === 0 ? 'Hoy' : `${daysRemaining}d`}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-24 h-2.5 bg-muted rounded-full overflow-hidden cursor-pointer">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${getExpiryProgressColor(progress)}`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <div className="space-y-0.5">
                                  <p>Emisión: {formatDate(p.issueDate)}</p>
                                  <p>Vencimiento: {formatDate(p.expiryDate)}</p>
                                  <p>Progreso: {Math.round(progress)}%</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${PERMIT_STATUS_COLORS[p.status] || ''}`}>{p.status}</Badge>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Permit Detail Dialog */}
      <Dialog open={!!selectedPermit} onOpenChange={(open) => { if (!open) setSelectedPermit(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPermit && (() => {
            const daysRemaining = getDaysRemaining(selectedPermit.expiryDate)
            const progress = getExpiryProgress(selectedPermit.issueDate, selectedPermit.expiryDate)
            const TypeIcon = getPermitTypeIcon(selectedPermit.type)
            const linkedShipment = getLinkedShipment(selectedPermit)
            const typeColor = PERMIT_TYPE_COLORS[selectedPermit.type] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            const isExpired = daysRemaining !== null && daysRemaining < 0

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColor}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-mono">{selectedPermit.number}</p>
                      <p className="text-sm font-normal text-muted-foreground">{selectedPermit.type}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Status & Authority badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={PERMIT_STATUS_COLORS[selectedPermit.status] || ''}>{selectedPermit.status}</Badge>
                    <Badge variant="outline">{selectedPermit.authority}</Badge>
                    {daysRemaining !== null && (
                      <Badge variant="outline" className={isExpired ? 'text-red-500 border-red-300' : daysRemaining <= 30 ? 'text-amber-500 border-amber-300' : 'text-emerald-500 border-emerald-300'}>
                        {isExpired ? 'Vencido' : daysRemaining === 0 ? 'Vence hoy' : `${daysRemaining} días restantes`}
                      </Badge>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground mb-1">Tipo de Permiso</p>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-semibold">{selectedPermit.type}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground mb-1">Número</p>
                      <p className="text-sm font-semibold font-mono">{selectedPermit.number}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground mb-1">Autoridad</p>
                      <p className="text-sm font-semibold">{selectedPermit.authority}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground mb-1">Fecha de Emisión</p>
                      <p className="text-sm font-semibold">{formatDateLong(selectedPermit.issueDate)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground mb-1">Fecha de Vencimiento</p>
                      <p className="text-sm font-semibold">{formatDateLong(selectedPermit.expiryDate)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground mb-1">Días Restantes</p>
                      <p className={`text-sm font-semibold ${isExpired ? 'text-red-600 dark:text-red-400' : daysRemaining !== null && daysRemaining <= 30 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        {daysRemaining !== null ? (isExpired ? 'Vencido' : `${daysRemaining} días`) : '—'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Visual Timeline */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-500" /> Línea de Tiempo de Vigencia
                    </h4>
                    <div className="space-y-3">
                      {/* Timeline bar */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                          <span>Emisión: {formatDate(selectedPermit.issueDate)}</span>
                          <span>Vencimiento: {formatDate(selectedPermit.expiryDate)}</span>
                        </div>
                        <div className="w-full h-4 bg-muted rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getExpiryProgressColor(progress)}`}
                            style={{ width: `${progress}%` }}
                          />
                          {progress < 100 && progress > 0 && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
                              style={{ left: `${progress}%` }}
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-muted-foreground">0%</span>
                          <span className={`text-[10px] font-semibold ${progress >= 90 ? 'text-red-500' : progress >= 70 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {Math.round(progress)}% transcurrido
                          </span>
                          <span className="text-[10px] text-muted-foreground">100%</span>
                        </div>
                      </div>

                      {/* Timeline dots */}
                      <div className="flex items-center gap-0 w-full">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-3 h-3 rounded-full ${selectedPermit.issueDate ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                          <span className="text-[9px] text-muted-foreground mt-1">Emitido</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500" />
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-3 h-3 rounded-full ${isExpired ? 'bg-red-500' : daysRemaining !== null && daysRemaining <= 30 ? 'bg-amber-500 animate-pulse' : 'bg-amber-500'}`} />
                          <span className="text-[9px] text-muted-foreground mt-1">Actual</span>
                        </div>
                        <div className={`flex-1 h-0.5 ${isExpired ? 'bg-red-300' : 'bg-gradient-to-r from-amber-500 to-red-500'}`} />
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-3 h-3 rounded-full ${isExpired ? 'bg-red-500' : 'bg-red-400'}`} />
                          <span className="text-[9px] text-muted-foreground mt-1">Vencimiento</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Linked Shipment */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Ship className="w-4 h-4 text-teal-500" /> Envío Vinculado
                    </h4>
                    {linkedShipment ? (
                      <Card className="bg-muted/30 border-dashed">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-mono font-semibold text-teal-600 dark:text-teal-400">
                              {linkedShipment.reference}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">{linkedShipment.status}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{linkedShipment.origin}</span>
                            <span>→</span>
                            <span>{linkedShipment.destination}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay envío vinculado</p>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedPermit.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4 text-teal-500" /> Notas
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">{selectedPermit.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Add Permit Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-500" /> Nuevo Permiso
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Número de Permiso</Label>
              <Input name="number" placeholder="PER-XXXX-XXXXX" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select name="type" defaultValue="Importación">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERMIT_TYPES.map((t) => {
                      const Icon = getPermitTypeIcon(t)
                      return <SelectItem key={t} value={t}><span className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {t}</span></SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Autoridad</Label>
                <Select name="authority" defaultValue="SAT">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUTHORITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Envío Relacionado</Label>
              <Select name="shipmentId" required>
                <SelectTrigger><SelectValue placeholder="Seleccionar envío" /></SelectTrigger>
                <SelectContent>
                  {shipments.map((s) => <SelectItem key={s.id} value={s.id}>{s.reference}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Emisión</Label>
                <Input name="issueDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Input name="expiryDate" type="date" />
              </div>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">Crear Permiso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
