'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import {
  AlertTriangle, XCircle, Search, Plus, ChevronRight, Eye, FileWarning,
  ShieldAlert, CheckCircle2, X as XIcon, Clock, DollarSign, Gavel,
  BookOpen, AlertOctagon, Flag, RefreshCw, TrendingUp, Ban, Download, Printer
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { exportToCSV, printTable } from '@/lib/export-utils'

// ─── Type definitions ───────────────────────────────────────────────

interface ShipmentInfo {
  reference: string
  status: string
  origin: string
  destination: string
  cargoType: string
  value: number | null
}

interface Claim {
  id: string
  shipmentId: string
  shipment: ShipmentInfo
  type: string
  reason: string
  customsRejection: boolean
  incidentCost: number | null
  lessonsLearned: string | null
  status: string
  reportedDate: string
  resolvedDate: string | null
  resolution: string | null
  reportedBy: string | null
  destinationCountry: string | null
  regulatoryChange: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

// ─── Constants ──────────────────────────────────────────────────────

const CLAIM_TYPES = [
  'Rechazo en aduana',
  'Daño de mercancía',
  'Documentación incompleta',
  'Retraso',
  'Contaminación',
] as const

const CLAIM_TYPE_ICONS: Record<string, string> = {
  'Rechazo en aduana': '🚫',
  'Daño de mercancía': '💥',
  'Documentación incompleta': '📋',
  'Retraso': '⏰',
  'Contaminación': '☣️',
}

const CLAIM_TYPE_COLORS: Record<string, string> = {
  'Rechazo en aduana': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Daño de mercancía': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Documentación incompleta': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Retraso': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'Contaminación': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

const STATUS_COLORS: Record<string, string> = {
  'Abierto': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'En investigación': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Resuelto': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Cerrado': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  'Abierto': AlertOctagon,
  'En investigación': ShieldAlert,
  'Resuelto': CheckCircle2,
  'Cerrado': XIcon,
}

const ALL_STATUSES = ['Abierto', 'En investigación', 'Resuelto', 'Cerrado']

function formatCurrency(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str
}

// Mock timeline for detail dialog
function generateTimeline(claim: Claim) {
  const timeline = [
    { date: claim.reportedDate, status: 'Abierto', label: 'Reclamación reportada', icon: AlertOctagon },
  ]
  if (claim.status === 'En investigación' || claim.status === 'Resuelto' || claim.status === 'Cerrado') {
    const baseDate = new Date(claim.reportedDate)
    const invDate = new Date(baseDate.getTime() + 2 * 86400000)
    timeline.push({ date: invDate.toISOString(), status: 'En investigación', label: 'Investigación iniciada', icon: ShieldAlert })
  }
  if (claim.status === 'Resuelto' || claim.status === 'Cerrado') {
    const baseDate = new Date(claim.reportedDate)
    const resDate = new Date(baseDate.getTime() + 7 * 86400000)
    timeline.push({ date: resDate.toISOString(), status: 'Resuelto', label: 'Reclamación resuelta', icon: CheckCircle2 })
  }
  if (claim.status === 'Cerrado') {
    timeline.push({ date: claim.resolvedDate || new Date().toISOString(), status: 'Cerrado', label: 'Caso cerrado', icon: XIcon })
  }
  return timeline
}

// ─── Component ──────────────────────────────────────────────────────

export function Claims() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [customsFilter, setCustomsFilter] = useState('all')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addingClaim, setAddingClaim] = useState(false)
  const [showLessons, setShowLessons] = useState(false)

  useEffect(() => {
    fetch('/api/claims')
      .then((r) => r.json())
      .then((d) => { setClaims(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // ─── Computed values ────────────────────────────────────────────
  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const matchesSearch = !search ||
        c.shipment?.reference?.toLowerCase().includes(search.toLowerCase()) ||
        c.reason.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || c.type === typeFilter
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      const matchesCustoms = customsFilter === 'all' ||
        (customsFilter === 'yes' && c.customsRejection) ||
        (customsFilter === 'no' && !c.customsRejection)
      return matchesSearch && matchesType && matchesStatus && matchesCustoms
    })
  }, [claims, search, typeFilter, statusFilter, customsFilter])

  const totalClaims = claims.length
  const openClaims = claims.filter(c => c.status === 'Abierto').length
  const investigationClaims = claims.filter(c => c.status === 'En investigación').length
  const resolvedClaims = claims.filter(c => c.status === 'Resuelto').length
  const closedClaims = claims.filter(c => c.status === 'Cerrado').length
  const totalCost = claims.reduce((sum, c) => sum + (c.incidentCost || 0), 0)

  const lessonsLearned = useMemo(() => {
    return claims
      .filter(c => (c.status === 'Resuelto' || c.status === 'Cerrado') && c.lessonsLearned)
      .map(c => ({ id: c.id, type: c.type, lesson: c.lessonsLearned!, shipmentRef: c.shipment?.reference || '—' }))
  }, [claims])

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddClaim = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAddingClaim(true)
    const form = new FormData(e.currentTarget)
    const body = {
      shipmentId: form.get('shipmentId') as string,
      type: form.get('type') as string,
      reason: form.get('reason') as string,
      customsRejection: form.get('customsRejection') === 'true',
      incidentCost: form.get('incidentCost') ? parseFloat(form.get('incidentCost') as string) : null,
      reportedBy: form.get('reportedBy') as string || null,
      destinationCountry: form.get('destinationCountry') as string || null,
      notes: form.get('notes') as string || null,
      status: 'Abierto',
    }
    try {
      await fetch('/api/claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      toast.success('Reclamación registrada exitosamente')
      setShowAdd(false)
      const res = await fetch('/api/claims')
      setClaims(await res.json())
    } catch {
      toast.error('Error al registrar reclamación')
    } finally {
      setAddingClaim(false)
    }
  }

  const activeFilterCount = [typeFilter !== 'all', statusFilter !== 'all', customsFilter !== 'all', search !== ''].filter(Boolean).length

  // ─── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-32 rounded-full" />)}
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
        {/* ─── Summary Stats Bar ────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
            <FileWarning className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{totalClaims} Reclamaciones</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertOctagon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">{openClaims} Abiertas</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{investigationClaims} En investigación</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{resolvedClaims} Resueltas</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20">
            <XIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{closedClaims} Cerradas</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
            <DollarSign className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Costo: {formatCurrency(totalCost)}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={() => {
                if (filteredClaims.length === 0) { toast.error('No hay datos para exportar'); return }
                exportToCSV(`reclamaciones_${new Date().toISOString().slice(0, 10)}`, filteredClaims.map((c) => ({
                  'Ref. Envío': c.shipment?.reference || '', Tipo: c.type,
                  Motivo: c.reason, 'Rechazo aduana': c.customsRejection ? 'Sí' : 'No',
                  Costo: c.incidentCost ? formatCurrency(c.incidentCost) : '',
                  Estado: c.status, 'Fecha Reporte': formatDate(c.reportedDate),
                })))
                toast.success('Datos exportados exitosamente')
              }}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/30"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
            <Button
              onClick={() => {
                if (filteredClaims.length === 0) { toast.error('No hay datos para imprimir'); return }
                printTable('Reclamaciones y Devoluciones', [
                  { key: 'Ref. Envío', label: 'Ref. Envío' },
                  { key: 'Tipo', label: 'Tipo' },
                  { key: 'Motivo', label: 'Motivo' },
                  { key: 'Rechazo aduana', label: 'Rechazo aduana' },
                  { key: 'Costo', label: 'Costo' },
                  { key: 'Estado', label: 'Estado' },
                  { key: 'Fecha Reporte', label: 'Fecha Reporte' },
                ], filteredClaims.map((c) => ({
                  'Ref. Envío': c.shipment?.reference || '', Tipo: c.type,
                  Motivo: c.reason, 'Rechazo aduana': c.customsRejection ? 'Sí' : 'No',
                  Costo: c.incidentCost ? formatCurrency(c.incidentCost) : '',
                  Estado: c.status, 'Fecha Reporte': formatDate(c.reportedDate),
                })))
              }}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/30"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
            {lessonsLearned.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                onClick={() => setShowLessons(true)}
              >
                <BookOpen className="w-4 h-4" />
                Lecciones ({lessonsLearned.length})
              </Button>
            )}
            <Button onClick={() => setShowAdd(true)} className="h-9 bg-teal-600 hover:bg-teal-700 gap-1.5 group">
              <Plus className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              Nueva Reclamación
            </Button>
          </div>
        </div>

        {/* ─── Filter Bar ───────────────────────────────────────────── */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-teal-50/80 via-white to-cyan-50/80 dark:from-teal-950/30 dark:via-background dark:to-cyan-950/30 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ref. envío o motivo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[200px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {CLAIM_TYPES.map(t => <SelectItem key={t} value={t}>{CLAIM_TYPE_ICONS[t]} {t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={customsFilter} onValueChange={setCustomsFilter}>
                  <SelectTrigger className="w-[180px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                    <SelectValue placeholder="Rechazo aduana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">🚫 Con rechazo</SelectItem>
                    <SelectItem value="no">✓ Sin rechazo</SelectItem>
                  </SelectContent>
                </Select>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-6 px-2 text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                    {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Main Table ───────────────────────────────────────────── */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Reclamaciones y Devoluciones ({filteredClaims.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[calc(100vh-360px)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-8" />
                    <TableHead className="text-xs font-semibold">Ref. Envío</TableHead>
                    <TableHead className="text-xs font-semibold">Tipo</TableHead>
                    <TableHead className="text-xs font-semibold">Motivo</TableHead>
                    <TableHead className="text-xs font-semibold">Rechazo aduana</TableHead>
                    <TableHead className="text-xs font-semibold">Costo</TableHead>
                    <TableHead className="text-xs font-semibold">Estado</TableHead>
                    <TableHead className="text-xs font-semibold">Fecha reporte</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredClaims.map((c, rowIndex) => {
                      const isExpanded = expandedRows.has(c.id)
                      const StatusIcon = STATUS_ICONS[c.status] || AlertTriangle

                      let rowBg = rowIndex % 2 === 1 ? 'bg-muted/20' : ''
                      if (c.status === 'Abierto') rowBg = 'bg-red-50/40 dark:bg-red-950/10'
                      else if (c.status === 'En investigación') rowBg = 'bg-amber-50/40 dark:bg-amber-950/10'

                      const borderAccent = c.status === 'Abierto'
                        ? 'border-l-red-500'
                        : c.status === 'En investigación'
                          ? 'border-l-amber-500'
                          : c.status === 'Resuelto'
                            ? 'border-l-emerald-500'
                            : 'border-l-transparent hover:border-l-teal-500'

                      return (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: rowIndex * 0.02 }}
                          className={`${rowBg} hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all cursor-pointer border-l-4 ${borderAccent}`}
                          onClick={() => toggleRow(c.id)}
                        >
                          <TableCell className="w-8 py-2">
                            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </motion.div>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-xs font-mono font-medium text-teal-600 dark:text-teal-400">
                              {c.shipment?.reference || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="secondary" className={`text-[10px] ${CLAIM_TYPE_COLORS[c.type] || ''}`}>
                              {CLAIM_TYPE_ICONS[c.type] || '⚠️'} {c.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 max-w-[200px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs cursor-default">{truncate(c.reason, 40)}</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px] shadow-xl">
                                <p className="text-xs">{c.reason}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="py-2">
                            {c.customsRejection ? (
                              <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
                                🚫 Sí
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                                ✓ No
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <span className={`text-xs font-semibold ${c.incidentCost ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'}`}>
                              {formatCurrency(c.incidentCost)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className="w-3 h-3" />
                              <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[c.status] || ''}`}>
                                {c.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-xs text-muted-foreground">{formatDate(c.reportedDate)}</span>
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30"
                              onClick={(e) => { e.stopPropagation(); setSelectedClaim(c); setShowDetail(true) }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </ScrollArea>

            {/* ─── Expanded Row Content ──────────────────────────────── */}
            <AnimatePresence>
              {expandedRows.size > 0 && (
                <div className="border-t">
                  {filteredClaims.filter(c => expandedRows.has(c.id)).map((c) => (
                    <motion.div
                      key={`expanded-${c.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-muted/20 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Full reason */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                              <FileWarning className="w-3.5 h-3.5 text-teal-500" />
                              Motivo completo
                            </p>
                            <div className="p-2 bg-background/60 rounded-md">
                              <p className="text-xs leading-relaxed">{c.reason}</p>
                            </div>
                          </div>

                          {/* Lessons learned */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                              Lecciones aprendidas
                            </p>
                            <div className="p-2 bg-background/60 rounded-md">
                              {c.lessonsLearned ? (
                                <p className="text-xs leading-relaxed">{c.lessonsLearned}</p>
                              ) : (
                                <p className="text-[11px] text-muted-foreground italic">Sin lecciones registradas</p>
                              )}
                            </div>
                          </div>

                          {/* Resolution */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Resolución
                            </p>
                            <div className="p-2 bg-background/60 rounded-md">
                              {c.resolution ? (
                                <p className="text-xs leading-relaxed">{c.resolution}</p>
                              ) : (
                                <p className="text-[11px] text-muted-foreground italic">Pendiente de resolución</p>
                              )}
                            </div>
                          </div>

                          {/* Reported by */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                              <Gavel className="w-3.5 h-3.5 text-teal-500" />
                              Reportado por
                            </p>
                            <div className="p-2 bg-background/60 rounded-md">
                              <p className="text-xs">{c.reportedBy || '—'}</p>
                            </div>
                          </div>

                          {/* Destination country */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                              <Flag className="w-3.5 h-3.5 text-teal-500" />
                              País destino
                            </p>
                            <div className="p-2 bg-background/60 rounded-md">
                              <p className="text-xs">{c.destinationCountry || '—'}</p>
                            </div>
                          </div>

                          {/* Regulatory change indicator */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                              Cambio regulatorio
                            </p>
                            <div className="p-2 bg-background/60 rounded-md">
                              {c.regulatoryChange ? (
                                <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                                  ⚠️ Sí — Cambio detectado
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  Sin cambios
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Cost alert for high-cost claims */}
                        {c.incidentCost && c.incidentCost >= 5000 && (
                          <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-rose-500 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                                Incidencia de alto costo: {formatCurrency(c.incidentCost)}
                              </p>
                              <p className="text-[10px] text-rose-600 dark:text-rose-300">
                                Requiere revisión por gerencia
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* ─── Claim Detail Dialog ──────────────────────────────────── */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
            {selectedClaim && (() => {
              const timeline = generateTimeline(selectedClaim)
              const StatusIcon = STATUS_ICONS[selectedClaim.status] || AlertTriangle

              return (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 rounded-t-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl">
                        {CLAIM_TYPE_ICONS[selectedClaim.type] || '⚠️'}
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="text-white text-lg font-bold">
                          Reclamación — {selectedClaim.shipment?.reference || '—'}
                        </DialogTitle>
                        <p className="text-teal-100 text-xs mt-0.5">
                          {selectedClaim.type} • Reportada el {formatDate(selectedClaim.reportedDate)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge className={`text-[10px] ${STATUS_COLORS[selectedClaim.status]} border-0`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {selectedClaim.status}
                          </Badge>
                          {selectedClaim.customsRejection && (
                            <Badge variant="secondary" className="text-[10px] bg-red-500/20 text-red-100 border-red-400/30 border-0">
                              🚫 Rechazo aduana
                            </Badge>
                          )}
                          {selectedClaim.regulatoryChange && (
                            <Badge variant="secondary" className="text-[10px] bg-orange-500/20 text-orange-100 border-0">
                              ⚠️ Cambio regulatorio
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Flag className="w-3 h-3" /> País destino</p>
                        <p className="text-sm font-semibold">{selectedClaim.destinationCountry || '—'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Costo incidencia</p>
                        <p className={`text-sm font-semibold ${selectedClaim.incidentCost ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                          {formatCurrency(selectedClaim.incidentCost)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Gavel className="w-3 h-3" /> Reportado por</p>
                        <p className="text-sm font-semibold">{selectedClaim.reportedBy || '—'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Fecha resolución</p>
                        <p className="text-sm font-semibold">{formatDate(selectedClaim.resolvedDate)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><FileWarning className="w-3 h-3" /> Envío</p>
                        <p className="text-sm font-semibold">
                          {selectedClaim.shipment?.reference || '—'} — {selectedClaim.shipment?.origin || ''} → {selectedClaim.shipment?.destination || ''}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Reason & Resolution */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                          <FileWarning className="w-3.5 h-3.5 text-teal-500" />
                          Motivo
                        </p>
                        <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedClaim.reason}</p>
                      </div>
                      {selectedClaim.resolution && (
                        <div>
                          <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Resolución
                          </p>
                          <p className="text-sm bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg">{selectedClaim.resolution}</p>
                        </div>
                      )}
                      {selectedClaim.lessonsLearned && (
                        <div>
                          <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                            Lecciones aprendidas
                          </p>
                          <p className="text-sm bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg">{selectedClaim.lessonsLearned}</p>
                        </div>
                      )}
                      {selectedClaim.notes && (
                        <div>
                          <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                            Notas adicionales
                          </p>
                          <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedClaim.notes}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Status Timeline */}
                    <div>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-500" />
                        Línea de tiempo
                      </p>
                      <div className="relative pl-6 space-y-4">
                        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                        {timeline.map((step, idx) => {
                          const StepIcon = step.icon
                          const isLast = idx === timeline.length - 1
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="relative flex items-start gap-3"
                            >
                              <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center ${
                                isLast ? 'bg-teal-500' : 'bg-muted'
                              }`}>
                                <StepIcon className="w-3 h-3 text-white" />
                              </div>
                              <div className="flex-1 pb-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold">{step.label}</p>
                                  <Badge variant="secondary" className={`text-[9px] ${STATUS_COLORS[step.status] || ''}`}>
                                    {step.status}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground">{formatDate(step.date)}</p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* ─── Add Claim Dialog ─────────────────────────────────────── */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 rounded-t-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg font-bold">Nueva Reclamación</DialogTitle>
                  <p className="text-teal-100 text-xs">Registrar una nueva reclamación o devolución</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddClaim}>
              <div className="p-6 space-y-4">
                {/* Shipment and Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">ID de Envío</Label>
                    <Input name="shipmentId" placeholder="clxxxx..." required className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Tipo de reclamación</Label>
                    <Select name="type" defaultValue="Rechazo en aduana">
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLAIM_TYPES.map(t => <SelectItem key={t} value={t}>{CLAIM_TYPE_ICONS[t]} {t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Motivo</Label>
                  <Textarea name="reason" placeholder="Describa el motivo de la reclamación..." required className="text-xs min-h-[80px]" />
                </div>

                {/* Cost and Customs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Costo estimado (USD)</Label>
                    <Input name="incidentCost" type="number" step="0.01" placeholder="0.00" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Rechazo en aduana</Label>
                    <Select name="customsRejection" defaultValue="false">
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">✓ No</SelectItem>
                        <SelectItem value="true">🚫 Sí</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Reported by and Destination */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Reportado por</Label>
                    <Input name="reportedBy" placeholder="Nombre del reportante" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">País destino</Label>
                    <Input name="destinationCountry" placeholder="Ej: México" className="h-9 text-xs" />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Notas adicionales</Label>
                  <Textarea name="notes" placeholder="Observaciones..." className="text-xs min-h-[60px]" />
                </div>
              </div>

              <DialogFooter className="p-4 border-t bg-muted/30">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)} className="h-9">Cancelar</Button>
                <Button type="submit" disabled={addingClaim} className="h-9 bg-teal-600 hover:bg-teal-700 gap-1.5">
                  {addingClaim ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Registrar Reclamación
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ─── Lecciones Aprendidas Dialog ──────────────────────────── */}
        <Dialog open={showLessons} onOpenChange={setShowLessons}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-6 rounded-t-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg font-bold">Lecciones Aprendidas</DialogTitle>
                  <p className="text-amber-100 text-xs">{lessonsLearned.length} lecciones de reclamaciones resueltas</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {lessonsLearned.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay lecciones aprendidas registradas</p>
              ) : (
                lessonsLearned.map((l, idx) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="secondary" className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                        {CLAIM_TYPE_ICONS[l.type]} {l.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{l.shipmentRef}</span>
                    </div>
                    <p className="text-xs leading-relaxed">{l.lesson}</p>
                  </motion.div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  )
}
